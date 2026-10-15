const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
const ids = [...fs.readFileSync(path.join(root, 'index.html'), 'utf8').matchAll(/id="([^"]+)"/g)].map(m => m[1]);

function opening({prelude=false}={}) {
  const noop = () => {}, frames = new Map(), listeners = {}, audio = []; let frameId = 0, time = 0;
  const ctx = new Proxy({}, { get: (o, k) => o[k] || (k.startsWith('create') ? () => ({addColorStop: noop}) : noop), set: (o,k,v) => (o[k]=v,true) });
  function element() {
    const handlers = {};
    return { style:{}, dataset:{}, hidden:false, disabled:false, textContent:'', innerHTML:'', children:[], parentElement:{},
      addEventListener:(name, fn) => handlers[name] = fn, focus:noop, scrollIntoView:noop, getContext:() => ctx,
      append(...items) { this.children.push(...items); }, replaceChildren() { this.children = []; },
      click(event = {}) { handlers.click?.({preventDefault:noop, ...event}); } };
  }
  const elements = new Map(ids.map(id => [id,element()]));
  const sandbox = { console, Event, Math:Object.assign(Object.create(Math), {random:() => 0}),
    window:{innerWidth:1440, devicePixelRatio:1, addEventListener:(name,fn) => (listeners['window:'+name] ||= []).push(fn), dispatchEvent:noop},
    document:{hidden:false, getElementById:id => {assert.ok(elements.has(id), id); return elements.get(id);}, createElement:element,
      addEventListener:(name,fn) => (listeners[name] ||= []).push(fn)},
    requestAnimationFrame:fn => {frames.set(++frameId,fn);return frameId;}, cancelAnimationFrame:id => frames.delete(id),
    gameAudio:{stopEffects:() => audio.push('stop'), setPaused:(reason,paused) => audio.push([reason,paused]), setScene:scene => audio.push(scene), sfx:noop, startLoop:noop, stopLoop:noop},
    makeSpaceBackdrop:() => ({}), drawInterceptor:noop, arcadeActive:false, isPlaying:false, finale:null,
    launches:0, defenses:0, startDefense:() => sandbox.defenses++, startGame:() => sandbox.launches++ };
  const context = vm.createContext(sandbox);
  for (const file of ['config.js','accessibility.js','arena.js','training.js','story.js']) vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'), context, {filename:file});
  const run = code => vm.runInContext(code, context);
  const click = id => elements.get(id).click();
  const action = name => elements.get('trainingExperiment').click({target:{closest:() => ({dataset:{trainingAction:name}})}});
  const press = (code,tag=null) => {listeners.keydown.forEach(fn => fn({code, repeat:false, target:{closest:selector => tag&&selector.split(',').map(s=>s.trim()).includes(tag)?{}:null}, preventDefault:noop}));(listeners.keyup||[]).forEach(fn=>fn({code}));};
  const advance = ms => { for (let t = 0; t < ms; t += 20) { time += 20; const queued = [...frames.values()]; frames.clear(); queued.forEach(fn => fn(time)); } };
  run('startIntro()');if(!prelude)run('tutorial.beginPreparation()');
  return {elements,sandbox,audio,frames,run,click,action,press,advance};
}
function reachFlight(g) { g.click('trainingNext'); g.action('measure'); g.click('trainingNext'); g.action('activate'); g.click('trainingNext'); }
const results = [];
function test(name, fn) { fn(); results.push(name); }

test('ENTER não pula a medição nem a ativação do canal', () => {
  const g = opening(); g.press('Enter'); g.press('Enter');
  assert.match(g.elements.get('trainingStep').textContent, /02 \/ 04/);
  assert.equal(g.elements.get('trainingNext').disabled, true);
  g.action('activate'); assert.equal(g.elements.get('trainingNext').disabled,true);
  g.action('measure'); assert.equal(g.elements.get('trainingNext').disabled,false);
  g.press('Enter'); g.press('Enter');
  assert.match(g.elements.get('trainingStep').textContent, /03 \/ 04/);
  assert.equal(g.sandbox.launches,0);
});
test('Resultado zero é válido e cliques repetidos não refazem a medição', () => {
  const g = opening(); g.click('trainingNext'); g.action('measure');
  const visual = g.elements.get('trainingExperiment').innerHTML;
  assert.match(visual, /<b>0<\/b>/); assert.doesNotMatch(visual, /<b>\?<\/b>/);
  g.action('measure'); assert.equal(g.elements.get('trainingExperiment').innerHTML,visual);
  assert.equal(g.elements.get('trainingNext').disabled,false);
});
test('Voltar permite reler e repetir a ação sem levar estados da outra cena', () => {
  const g = opening(); g.click('trainingNext'); g.action('measure'); g.click('trainingNext'); g.action('activate'); g.click('trainingBack');
  assert.match(g.elements.get('trainingStep').textContent, /02/);
  assert.equal(g.elements.get('trainingNext').disabled,true);
  g.action('measure'); g.click('trainingNext'); assert.equal(g.elements.get('trainingNext').disabled,true);
});
test('As 14 falas originais têm uma abertura própria antes da preparação', () => {
  const g=opening({prelude:true}),reference=require('./fixtures/opening-dialogue.json');
  assert.equal(g.elements.get('trainingPreparation').hidden,true);
  assert.equal(g.elements.get('openingBack').disabled,true);
  g.press('KeyR');g.press('ArrowRight');g.advance(5000);
  for(let i=0;i<reference.length;i++){
    assert.equal(g.elements.get('openingSpeaker').textContent,reference[i][0]);
    assert.equal(g.elements.get('openingLine').textContent,reference[i][1]);
    assert.equal(g.elements.get('openingCount').textContent,(i+1)+' / 14');
    if(i===1){g.click('openingBack');assert.equal(g.elements.get('openingLine').textContent,reference[0][1]);g.click('openingNext');}
    g.click('openingNext');
  }
  assert.equal(g.elements.get('storyPrelude').hidden,true);
  assert.equal(g.elements.get('trainingPreparation').hidden,false);
  assert.equal(g.elements.get('trainingDialogue').hidden,true);
  assert.equal(g.sandbox.launches,0);
});
test('O treino congela na pausa e só libera a campanha depois de renovar', () => {
  const g = opening(); reachFlight(g); g.press('Enter'); assert.equal(g.sandbox.launches,0);
  g.press('ArrowLeft'); g.advance(1200); assert.equal(g.elements.get('trainingScore').textContent,'10 pts');
  g.press('ArrowRight');g.advance(160);g.press('ArrowRight');g.advance(160);
  g.press('KeyR'); g.press('Escape'); g.advance(4000);
  assert.equal(g.elements.get('trainingNext').disabled,true);
  g.press('Escape'); g.advance(2200); assert.equal(g.elements.get('trainingNext').disabled,false);
  g.click('trainingNext'); g.click('trainingNext');
  assert.equal(g.sandbox.launches,1); assert.equal(g.sandbox.defenses,1); assert.equal(g.run('introActive'),false); assert.equal(g.frames.size,0);
});
test('Recomeçar remove treino, pausa e progresso anteriores', () => {
  const g = opening(); reachFlight(g); g.press('Escape'); g.click('trainingRestart');
  assert.match(g.elements.get('trainingStep').textContent,/01/); assert.equal(g.elements.get('trainingBack').disabled,true);
  assert.equal(g.elements.get('trainingFlight').hidden,true); assert.deepEqual(g.audio.at(-2),['training',false]);
  reachFlight(g); assert.equal(g.elements.get('trainingScore').textContent,'0 pts');
});
test('Voltar ao menu encerra a animação e permite iniciar de novo', () => {
  const g = opening(); reachFlight(g); g.click('trainingHome');
  assert.equal(g.run('introActive'),false); assert.equal(g.frames.size,0); assert.equal(g.elements.get('intro').hidden,true);
  g.press('Enter'); assert.equal(g.elements.get('storyPrelude').hidden,false); assert.equal(g.elements.get('trainingPreparation').hidden,true); assert.equal(g.frames.size,1);
});
test('Ciência recolhida e guia rápido separado preservam leitura por teclado e teclas escolhidas',()=>{
  const g=opening();assert.equal(g.elements.get('trainingQuickGuide').hidden,true);
  g.click('trainingNext');assert.equal(g.elements.get('trainingScienceDetails').open,false);
  assert.match(g.elements.get('trainingScience').textContent,/E91/);
  g.elements.get('trainingScienceDetails').open=true;g.press('Enter','summary');
  assert.match(g.elements.get('trainingStep').textContent,/02/);assert.equal(g.elements.get('trainingNext').disabled,true);
  g.action('measure');assert.equal(g.elements.get('trainingScienceDetails').open,true);
  g.click('trainingNext');assert.equal(g.elements.get('trainingScienceDetails').open,false);
  g.action('activate');g.click('trainingNext');g.run('accessPreferences.keys={left:"KeyJ",right:"KeyL",regen:"KeyK"};tutorial.refreshControls()');
  assert.equal(g.elements.get('trainingQuickGuide').hidden,false);assert.match(g.elements.get('trainingQuickSteps').innerHTML,/J \/ L/);assert.match(g.elements.get('trainingQuickSteps').innerHTML,/K: renovar/);
  assert.equal(g.sandbox.launches,0);
});
console.log(JSON.stringify({passed:results.length,tests:results},null,2));
