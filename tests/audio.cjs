const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { OrbitalAudioEngine, ORBITAL_PHASE_TRACKS } = require('../audio.js');
const { TrainingSimulation } = require('../training.js');

class Param {
  constructor() { this.value = 1; this.events = []; }
  setValueAtTime(value, time) { this.value = value; this.events.push({type:'set',value,time}); }
  linearRampToValueAtTime(value,time) { this.events.push({type:'ramp',value,time}); }
  exponentialRampToValueAtTime(value,time) { this.events.push({type:'exp',value,time}); }
  setTargetAtTime(value,time) { this.value = value; this.events.push({type:'target',value,time}); }
  cancelScheduledValues(time) { this.events.push({type:'cancel',time}); }
}
class Node {
  constructor(context) { this.context=context;this.gain=new Param();this.frequency=new Param();this.pan=new Param(); }
  connect() {} disconnect() {}
  start(time) { this.started=time;this.context.started.push(this); }
  stop(time=this.context.currentTime) { this.stopped=time; }
}
class Context {
  constructor() { this.currentTime=0;this.state='suspended';this.destination={};this.started=[];this.decodes=0; }
  createGain() { return new Node(this); } createBufferSource() { return new Node(this); }
  createStereoPanner() { return new Node(this); } createOscillator() { return new Node(this); }
  createDynamicsCompressor() { const n=new Node(this); for(const key of ['threshold','knee','ratio','attack','release'])n[key]=new Param();return n; }
  async resume() { this.state='running'; } async suspend() { this.state='suspended'; }
  async decodeAudioData() { this.decodes++;return {duration:10}; }
  advance(seconds) { if(this.state!=='running')return; this.currentTime+=seconds; for(const node of this.started)if(node.stopped<=this.currentTime&&!node.ended){node.ended=true;node.onended?.();} }
}
const settle = async () => { for(let i=0;i<12;i++)await Promise.resolve(); };
function engine() {
  const c=new Context();const assets=Object.fromEntries(['menu','briefing','victory','boss',...ORBITAL_PHASE_TRACKS,'shot','shotAlt','explosion'].map(key=>[key,{kind:['shot','shotAlt','explosion'].includes(key)?'sfx':'music',data:'T2dnUw=='}]));
  const audio=new OrbitalAudioEngine({assets,createContext:()=>c});audio.unlock();return {audio,c};
}
const results=[];
const test=async(name,fn)=>{await fn();results.push(name);};
(async()=>{
  await test('Oito fases selecionam oito composições distintas e vitória/derrota têm destinos próprios',async()=>{
    const {audio}=engine();assert.equal(new Set(ORBITAL_PHASE_TRACKS).size,8);
    for(let phase=1;phase<=8;phase++)assert.equal(audio.trackFor('phase',phase),ORBITAL_PHASE_TRACKS[phase-1]);
    assert.equal(audio.trackFor('victory',8),'victory');assert.equal(audio.trackFor('defeat',8),null);
    assert.equal(audio.trackFor('boss',1),'adventureBoss');assert.equal(audio.trackFor('boss',8),'boss');
  });
  await test('Mudanças rápidas de cena descartam decodificações antigas e não duplicam a música',async()=>{
    const {audio,c}=engine();audio.setScene('phase',1);audio.setScene('phase',8);await settle();
    assert.equal(audio.musicVoice.key,'boss');assert.equal(audio.musicVoices.size,1);
    audio.unlock();audio.setScene('phase',8);await settle();assert.equal(audio.musicVoices.size,1);
    audio.setScene('phase',2);await settle();assert.equal(audio.musicVoices.size,2);
    assert.equal(audio.musicVoice.gain.gain.events.some(e=>e.type==='ramp'&&e.value===1&&e.time===.8),true);
    c.advance(1);assert.equal(audio.musicVoices.size,1);
    assert.ok([...audio.buffers.keys()].filter(k=>audio.assets[k].kind==='music').length<=2);
  });
  await test('Pausa congela o relógio de áudio; múltiplas razões precisam ser liberadas',async()=>{
    const {audio,c}=engine();await settle();audio.startLoop('regen');audio.setPaused('game',true);audio.setPaused('hidden',true);await settle();
    c.advance(4);assert.equal(c.currentTime,0);assert.equal(audio.sfx('shot'),false);
    audio.setPaused('hidden',false);await settle();assert.equal(c.state,'suspended');
    audio.setPaused('game',false);await settle();assert.equal(c.state,'running');assert.equal(audio.loops.has('regen'),true);
  });
  await test('Briefing prepara a faixa da fase seguinte antes de liberar o jogo',async()=>{
    const {audio}=engine();audio.setScene('briefing',4);await settle();
    assert.equal(audio.buffers.has(ORBITAL_PHASE_TRACKS[3]),true);
    audio.setScene('phase',4);await settle();assert.equal(audio.musicVoice.key,ORBITAL_PHASE_TRACKS[3]);
  });
  await test('Eventos são imediatos, panorâmica é limitada e efeitos frequentes respeitam intervalos',async()=>{
    const {audio,c}=engine();await settle();c.advance(.1);assert.equal(audio.sfx('shot',{pan:10}),true);assert.equal(audio.sfx('shot'),false);
    const shot=[...audio.voices].find(v=>v.name==='shot');assert.equal(shot.nodes[0].started,.1);assert.equal(shot.panner.pan.value,.65);
    audio.sfx('earth');assert.ok(audio.duckBus.gain.events.some(e=>e.type==='ramp'&&e.value===.32));
    c.advance(2);assert.equal(audio.voices.size,0);
  });
  await test('Mute preserva o fundo e loops; volumes persistem com limites válidos',async()=>{
    const store=new Map();const c=new Context();const audio=new OrbitalAudioEngine({createContext:()=>c,storage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)}});audio.unlock();await settle();
    audio.startLoop('regen');audio.setPreferences({muted:true,music:5,effects:-2});assert.equal(audio.master.gain.value,0);assert.equal(audio.loops.has('regen'),true);assert.equal(audio.sfx('shot'),false);
    audio.setPreferences({muted:false,effects:.6});assert.equal(audio.preferences.music,1);assert.equal(audio.preferences.effects,.6);
    assert.equal(JSON.parse(store.get('qubit-audio')).muted,false);audio.stopLoop('regen');assert.equal(audio.loops.size,0);
  });
  await test('Navegador sem Web Audio e armazenamento indisponível não interrompem o jogo',async()=>{
    const audio=new OrbitalAudioEngine({createContext:()=>null,storage:{getItem:()=>{throw Error()},setItem:()=>{throw Error()}}});audio.unlock();audio.setScene('phase',8);audio.setPreferences({music:.2});audio.setPaused('game',true);
    assert.equal(audio.sfx('shot'),false);audio.startLoop('regen');audio.stopEffects();assert.equal(audio.context,null);
    const {audio:broken,c}=engine();c.decodeAudioData=async()=>{throw Error()};broken.assets.bad={kind:'sfx',data:'!'};assert.equal(await broken.load('bad'),null);await settle();assert.equal(broken.loading.has('bad'),false);
  });
  await test('Treino emite sons no evento real e suspende disparos durante a regeneração',async()=>{
    const sounds=[];const sim=new TrainingSimulation(name=>sounds.push(name));sim.move(-1);
    for(let i=0;i<50;i++)sim.update(20);assert.equal(sounds.filter(n=>n==='explosion').length,1);assert.equal(sounds.includes('noise'),true);
    sim.regenerate();const shots=sounds.filter(n=>n==='shot').length;for(let i=0;i<99;i++)sim.update(20);
    assert.equal(sounds.filter(n=>n==='shot').length,shots);sim.update(20);assert.equal(sounds.filter(n=>n==='regenStart').length,1);assert.equal(sounds.filter(n=>n==='regenReady').length,1);
  });
  await test('Bundle offline corresponde aos 19 arquivos OGG com fonte e licença registradas',async()=>{
    const root=path.resolve(__dirname,'../assets/audio');const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));const context=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(root,'bundle.js'),'utf8'),context);
    assert.equal(Object.keys(manifest.files).length,19);
    for(const [key,item]of Object.entries(manifest.files)){const original=fs.readFileSync(path.join(root,item.file));assert.equal(original.subarray(0,4).toString(),'OggS');assert.deepEqual(Buffer.from(context.ORBITAL_AUDIO_ASSETS[key].data,'base64'),original);assert.equal(item.license,'CC0-1.0');assert.ok(item.url.startsWith('https://'));}
  });
  console.log(JSON.stringify({passed:results.length,tests:results},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
