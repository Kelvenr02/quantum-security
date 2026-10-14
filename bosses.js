/* Confrontos didáticos: padrões determinísticos; as relações físicas são analogias. */
const quantumBosses = [
  { name:'Sentinela da Chave', concept:'QKD · verificação do canal', hp:[4,4,4],
    objective:'Desative os três relés iluminados. A partir de 8% de QBER, o escudo fecha: renove a chave com R. Saia das trilhas marcadas antes da salva.',
    science:'QKD usa verificações para decidir se é possível obter uma chave segura. O escudo ligado ao QBER é uma analogia: erros exigem avaliação e podem levar ao descarte dos dados.' },
  { name:'Observador Fantasma', concept:'Medição e perturbação', hp:[16],
    objective:'Duas sondas aparecem. Após a varredura, a marca ✓ revela qual pode ser atingida. A outra absorve disparos. A salva mira a posição em que você estava no início do ciclo.',
    science:'Uma medição tem efeitos sobre um sistema quântico. Revelar uma sonda após a varredura representa essa ideia; não é um teste real de espionagem. QBER sozinho não identifica um espião.' },
  { name:'Tríade Hadamard', concept:'Superposição · porta H', hp:[8,8,8],
    objective:'Derrube os três núcleos. Cápsulas H chegam a cada ciclo: alinhe-se ao centro para atingir os três com disparos vizinhos. Desvie primeiro, aproveite a abertura depois.',
    science:'H pode preparar uma superposição de estados. Três alvos e disparos simultâneos são uma metáfora de jogo, não a leitura simultânea de resultados de um qubit.' },
  { name:'Gêmeos de Bell', concept:'Entrelaçamento · H + CNOT', hp:[16,16],
    objective:'Os núcleos dividem a energia: acertar o núcleo aberto danifica ambos. A abertura alterna entre os lados a cada ciclo. Use o aviso para preparar sua mudança de trilha.',
    science:'Um estado de Bell é um estado conjunto entrelaçado. Energia compartilhada e dano simultâneo são regras fictícias: entrelaçamento não permite transmitir ações instantâneas.' },
  { name:'Devorador de Coerência', concept:'Interação com o ambiente', hp:[20],
    objective:'Fique na faixa verde para restaurar coerência. Fora dela, o medidor cai; abaixo de 35% o núcleo fica protegido. A zona muda a cada ciclo. Encontre a nova posição e ataque.',
    science:'Interações com o ambiente podem degradar coerência. A zona de estabilização representa controle do ruído; não é uma região física que restaura automaticamente estados quânticos.' },
  { name:'Guardião da Síndrome', concept:'Correção de erros · auxiliares', hp:[5,5,5],
    objective:'A síndrome indica qual módulo precisa de correção: procure o símbolo + e a trilha informada. Acerte esse módulo até repará-lo; os demais ficam protegidos. Resolva os três.',
    science:'Medições de síndromes fornecem informação sobre certos erros sem medir diretamente o estado lógico. Atirar no módulo indicado é uma analogia de diagnóstico e correção, não cópia de qubits.' },
  { name:'Interferômetro', concept:'Interferência de amplitudes', hp:[20],
    objective:'Duas salvas são anunciadas por ciclo. Procure as trilhas sem marca A ou B. O núcleo abre na janela − depois dos pulsos; aproveite a pausa para atacar ou renovar a chave.',
    science:'Amplitudes podem reforçar-se ou cancelar-se. As janelas + e − e as trilhas de fuga são uma metáfora visual de interferência; os pulsos são ataques fictícios.' },
  { name:'Núcleo da Nave-Mãe', concept:'Operação quântica sob ruído', hp:[36],
    objective:'Três estágios: ataque o par aberto, preserve coerência na faixa verde e mire o módulo indicado entre duas salvas. H e + chegam como apoio. Neutralize o núcleo para liberar o canhão.',
    science:'Sistemas quânticos combinam preparação, operações, medições e controle de erros. O combate reúne analogias desses recursos; não executa um algoritmo ou protocolo quântico real.' }
];

class QuantumBoss {
  constructor(phase,initialLane=3) {
    this.phase=phase; this.definition=quantumBosses[phase-1]; this.hp=[...this.definition.hp];
    this.maxHp=this.hp.reduce((a,b)=>a+b,0); this.time=0; this.round=0; this.roundStart=0;
    this.coherence=75; this.events=[]; this.lastHits={}; this.hitAt=-1000;this.prepareRound(initialLane);
  }
  get health() { return this.hp.reduce((a,b)=>a+b,0); }
  get complete() { return this.health<=0; }
  get stage() { return this.phase===8 ? this.health>24?0:this.health>12?1:2 : 0; }
  get period() { return this.phase>=7?7200:7600; }
  get warning() { return this.phase===1?2200:2000; }
  get elapsed() { return this.time-this.roundStart; }
  get stabilizing() { return this.phase===5 || (this.phase===8 && this.stage===1); }
  get zone() { const center=[1,4,2,5,3][this.round%5]; return [center,center+(center<4?1:-1)]; }
  prepareRound(playerLane) {
    const safeCenter=this.stabilizing?this.zone[0]:[3,1,4,2,5][this.round%5];
    let lanes=[0,1,2,3,4,5,6].filter(l=>Math.abs(l-safeCenter)>1);
    if(this.phase===1) lanes=[[2,4],[1,3],[3,5]][this.round%3];
    if(this.phase===2) lanes=[playerLane,(playerLane+3)%7];
    this.pulses=[{lanes,at:this.roundStart+this.warning,fired:false,label:'A'}];
    if(this.phase===7 || (this.phase===8 && this.stage===2)) {
      const other=safeCenter+(safeCenter>=4?-1:1);
      this.pulses.push({lanes:[0,1,2,3,4,5,6].filter(l=>Math.abs(l-other)>1),at:this.roundStart+this.warning+900,fired:false,label:'B'});
    }
    this.events.push({type:'round'});
  }
  advance(ms,player) {
    if(this.complete)return [];
    const elapsed=Math.max(0,Math.min(50,ms));this.time+=elapsed;
    if(this.elapsed>=this.period) {this.roundStart+=this.period;this.round++;this.prepareRound(player.lane);}
    if(this.stabilizing) this.coherence=Math.max(0,Math.min(100,this.coherence+(this.zone.includes(player.lane)?24:-12)*elapsed/1000));
    for(const pulse of this.pulses) if(!pulse.fired && this.time>=pulse.at) {pulse.fired=true;this.events.push({type:'pulse',lanes:pulse.lanes});}
    return this.events.splice(0);
  }
  targets(qber=0) {
    const opening=this.elapsed>=this.warning+(this.pulses.length===2?1450:550) && this.elapsed<this.period-700;
    const coherenceOk=!this.stabilizing || this.coherence>=35;
    let nodes;
    if(this.phase===1) {const active=this.hp.findIndex(h=>h>0);nodes=this.hp.map((hp,id)=>({id,lane:[1,5,3][id],hp,open:opening&&id===active&&qber<8,label:hp<=0?'✓':'CHAVE'}));}
    else if(this.phase===2) nodes=[1,5].map((lane,i)=>({id:i===this.round%2?0:-1,lane,hp:this.health,open:opening&&i===this.round%2,label:opening&&i===this.round%2?'✓':'?'}));
    else if(this.phase===3) nodes=this.hp.map((hp,id)=>({id,lane:2+id,hp,open:opening,label:hp<=0?'✓':'H'}));
    else if(this.phase===4 || (this.phase===8&&this.stage===0)) nodes=[1,5].map((lane,id)=>({id:this.phase===4?id:0,lane,hp:this.phase===4?this.hp[id]:this.health,open:opening&&id===this.round%2,label:id===this.round%2?'BELL':'◈'}));
    else if(this.phase===6) {const active=[2,0,1].find(id=>this.hp[id]>0);nodes=this.hp.map((hp,id)=>({id,lane:[1,3,5][id],hp,open:opening&&id===active,label:hp<=0?'✓':id===active?'+':'○'}));}
    else if(this.phase===8&&this.stage===2) nodes=[1,3,5].map((lane,i)=>({id:i===this.round%3?0:-1,lane,hp:this.health,open:opening&&i===this.round%3,label:i===this.round%3?'+':'○'}));
    else nodes=[{id:0,lane:this.stabilizing?this.zone[0]:[3,1,5,2,4][this.round%5],hp:this.health,open:opening&&coherenceOk,label:this.phase===7?'−':'C'}];
    return nodes.map(n=>({...n,open:n.open&&n.hp>0}));
  }
  hit(id,qber,lane) {
    if(this.complete || id<0 || !this.targets(qber).some(n=>n.id===id&&n.open&&(lane===undefined||n.lane===lane)) || this.time-(this.lastHits[id]??-1000)<120)return false;
    this.lastHits[id]=this.time;this.hitAt=this.time;
    const previousStage=this.stage;
    if(this.phase===4) this.hp=this.hp.map(h=>Math.max(0,h-1));
    else this.hp[id]=Math.max(0,this.hp[id]-(this.phase===8&&this.stage===0?2:1));
    if(this.stage!==previousStage && !this.complete) {this.round++;this.roundStart=this.time;this.coherence=75;this.prepareRound(3);}
    return true;
  }
  hint(qber) {
    if(this.complete)return 'DESAFIO SUPERADO · Escudo restaurado e até 2 impactos reparados na próxima etapa';
    if(this.phase===1&&qber>=8)return 'ESCUDO FECHADO · QBER alto: renove com R';
    if(this.stabilizing)return (this.phase===8?'2/3 · ':'')+'COERÊNCIA '+Math.round(this.coherence)+'% · Faixa verde restaura · mínimo 35%';
    if(this.phase===6) {const node=this.targets(qber).find(n=>n.hp>0&&n.label==='+');return 'SÍNDROME → MÓDULO + · TRILHA '+(node.lane+1);}
    if(this.phase===8)return ['1/3 · PAR ENTRELAÇADO · Acerte o lado aberto','2/3 · ESTABILIZE A COERÊNCIA','3/3 · SÍNDROME + · Dupla salva'][this.stage];
    if(this.elapsed<this.warning+(this.pulses.length===2?1450:550))return this.pulses.length===2?'DUPLA SALVA · Evite as marcas A e B':'SALVA ANUNCIADA · Saia das trilhas marcadas';
    return this.phase===3?'JANELA ABERTA · H alcança os três núcleos':this.phase===7?'JANELA − · Intercepte o núcleo iluminado':'JANELA ABERTA · Acerte o núcleo iluminado';
  }
}

let boss=null, bossesDefeated=0, bossCleared=Array(8).fill(false);
let hullShield=1, hullInvulUntil=0, phaseCheckpointData=null;
const bossArenaY=()=>Math.max(120,Math.min(shipY-(height<620?55:95),height<620?Math.max(260,height*.54):Math.max(365,height*.48)));

function resetBossCampaign() {
  boss=null;bossesDefeated=0;bossCleared=Array(8).fill(false);hullShield=1;hullInvulUntil=0;
  phaseCheckpointData={level:1,score:0,missed:0,quantumCollected:0};
  $('bossHud').hidden=true;$('phaseHud').hidden=false;$('btnRetry').hidden=true;updateShieldHUD();
}
function updateShieldHUD() { $('shieldStatus').textContent=hullShield?'◈ ESCUDO PRONTO':'◇ ESCUDO ESGOTADO'; }
function takeHullHit(reason,x) {
  if(gameTime<hullInvulUntil)return false;
  if(hullShield>0) {
    hullShield--;hullInvulUntil=gameTime+1400;gameAudio.sfx('earth',{pan:audioPan(x)});
    updateShieldHUD();return true;
  }
  gameOver(reason);return true;
}
function beginBoss() {
  if(boss || bossCleared[level-1])return;
  boss={model:new QuantumBoss(level,currentLane),status:'briefing',wonAt:0};
  isStageBriefing=true;cancelAnimationFrame(rafId);
  lasers=[];asteroids=[];clouds=[];spies=[];pickups=[];particles=[];interferenceFront=null;superpositionUntil=0;
  isRegen=false;isCompromised=false;qber=Math.min(qber,5);keyReadyAt=gameTime;hullShield=1;updateShieldHUD();
  gameAudio.stopEffects();gameAudio.setScene('briefing',level);gameAudio.sfx('phase');
  const d=boss.model.definition;
  $('phaseEyebrow').textContent='DR. ÍRIS / DESAFIO FINAL DA FASE '+String(level).padStart(2,'0');
  $('phaseTitle').textContent=d.name;$('phaseObjective').textContent=d.objective;
  $('phaseConcept').textContent=d.concept;$('phaseScience').textContent=d.science;
  $('phaseCheckpoint').textContent='1 ESCUDO DE EMERGÊNCIA · SALVAS ANUNCIADAS · ESC PAUSA · R RENOVA';
  $('phaseRoute').innerHTML=quantumBosses.map((d,i)=>'<span class="'+(i<level-1?'complete':i===level-1?'current':'')+'">'+String(i+1).padStart(2,'0')+'</span>').join('');
  $('btnContinue').textContent='ENFRENTAR DESAFIO →';$('pauseBtn').disabled=true;$('warning').style.display='none';
  updateHUD();updateQberUI();$('phaseOverlay').hidden=false;$('btnContinue').focus();
}
function bossSupply() {
  const phase=boss.model.phase;
  if(phase!==3 && phase!==6 && phase!==8)return;
  if(pickups.length)return;
  const type=phase===6 || (phase===8&&boss.model.round%2)?'correction':'hadamard';
  pickups.push({type,x:(currentLane+.5)*laneWidth,y:Math.max(bossArenaY()+50,shipY-150),radius:17,speed:flightSpeed(2.8)});
}
function beginBossBattle() {
  boss.status='fighting';gameAudio.setScene('boss',level);gameAudio.sfx('compromised');
  $('bossHud').hidden=false;$('phaseHud').hidden=true;updateBossHUD();
}
function updateBossHUD() {
  if(!boss)return;
  const m=boss.model;$('bossName').textContent=m.definition.name;
  $('bossHealth').textContent=m.health+' / '+m.maxHp;
  $('bossFill').style.width=(m.health/m.maxHp*100)+'%';
  const hint=m.hint(qber);if($('bossHint').textContent!==hint)$('bossHint').textContent=hint;
}
function updateBossBattle(dt,shipX) {
  const m=boss.model;
  if(boss.status==='won') {
    drawBoss();
    if(gameTime-boss.wonAt>=1400)finishBoss();
    return;
  }
  for(const event of m.advance(dt*FRAME_MS,{lane:currentLane})) {
    if(event.type==='round') {gameAudio.sfx('interference');bossSupply();}
    else if(event.type==='pulse') {
      gameAudio.sfx('spy');
      if(event.lanes.includes(currentLane)) {takeHullHit('A salva do guardião atingiu a nave sem escudo. Observe as trilhas marcadas antes do próximo ataque.',shipX);if(!isPlaying)return;addQber(3.5);}
    }
  }
  for(const node of m.targets(qber)) {
    const x=(node.lane+.5)*laneWidth,y=bossArenaY(),radius=Math.min(34,laneWidth*.38);
    for(let i=lasers.length-1;i>=0;i--) {
      const l=lasers[i];
      if(Math.abs(l.x-x)<radius+4 && (l.previousY??l.y)>=y-radius && l.y<=y+radius) {
        lasers.splice(i,1);
        if(m.hit(node.id,qber,node.lane))gameAudio.sfx('impact',{pan:audioPan(x)});
      }
    }
  }
  if(m.complete) {
    boss.status='won';boss.wonAt=gameTime;lasers=[];pickups=[];
    gameAudio.sfx('mothership');gameAudio.sfx('phase');
  }
  updateBossHUD();drawBoss();
}
function finishBoss() {
  if(!boss || boss.status!=='won' || bossCleared[level-1])return;
  bossCleared[level-1]=true;bossesDefeated++;boss=null;
  missed=Math.max(0,missed-2);qber=0;hullShield=1;hullInvulUntil=gameTime+1200;updateShieldHUD();
  $('bossHud').hidden=true;$('phaseHud').hidden=false;
  updateHUD();updateQberUI();
  if(level===maxLevel)gameWin();else enterPhase(level+1);
}
function retryPhase() {
  if(isPlaying || finale || !phaseCheckpointData)return;
  const saved={...phaseCheckpointData};startGame(saved);enterPhase(saved.level);
}
function drawBoss() {
  if(!boss)return;
  const m=boss.model,y=bossArenaY(),radius=Math.min(34,laneWidth*.38);
  ctx.save();
  if(m.stabilizing && !m.complete) {
    for(const lane of m.zone) {ctx.fillStyle='#6ce8cd0d';ctx.fillRect(lane*laneWidth,y+40,laneWidth,earthTop-y-40);ctx.strokeStyle='#6ce8cd60';ctx.strokeRect(lane*laneWidth+3,shipY-45,laneWidth-6,90);}
  }
  for(const p of m.pulses) {
    const until=p.at-m.time;if(m.complete || until < -480)continue;
    const fired=until<=0;ctx.fillStyle=fired?'#ef797670':p.label==='A'?'#ef797615':'#c3a0f21a';
    ctx.strokeStyle=p.label==='A'?'#ef797699':'#c3a0f299';ctx.lineWidth=1;ctx.setLineDash(fired?[]:[5,9]);
    for(const lane of p.lanes) {
      const x=lane*laneWidth;ctx.fillRect(x+3,y+55,laneWidth-6,earthTop-y-55);ctx.strokeRect(x+3,y+55,laneWidth-6,earthTop-y-55);
      ctx.fillStyle=p.label==='A'?'#f2a39d':'#d6bcf2';ctx.font='10px Consolas,monospace';ctx.textAlign='center';ctx.fillText(p.label+(fired?'':(' '+Math.max(0,until/1000).toFixed(1))),x+laneWidth/2,Math.max(y+70,shipY-80)+(p.label==='B'?18:0));
      ctx.fillStyle=fired?'#ef797670':p.label==='A'?'#ef797615':'#c3a0f21a';
    }
  }
  ctx.setLineDash([]);
  const nodes=m.targets(qber);
  const victory=m.complete?Math.min(1,(gameTime-boss.wonAt)/1400):0;
  if(m.complete)ctx.globalAlpha=1-victory;
  drawGuardianHull(m,nodes,y);
  if(m.phase===4 || (m.phase===8&&m.stage===0)) {
    ctx.strokeStyle='#91c7ff70';ctx.setLineDash([5,5]);ctx.beginPath();ctx.moveTo((nodes[0].lane+.5)*laneWidth,y);ctx.lineTo((nodes[1].lane+.5)*laneWidth,y);ctx.stroke();ctx.setLineDash([]);
  }
  for(const n of nodes) {
    const x=(n.lane+.5)*laneWidth,color=n.hp<=0?'#668b85':n.open?'#6ce8cd':'#bb9bf4';
    if(n.open)drawGlow(ctx,x,y,radius*2.5,color+'30');
    ctx.fillStyle='#142535';ctx.strokeStyle=color;ctx.lineWidth=n.open?2:1;
    ctx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4+Math.sin(m.time/1400)*.08;const px=x+Math.cos(a)*radius,py=y+Math.sin(a)*radius;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle=color+'50';ctx.beginPath();ctx.arc(x,y,radius+7,-m.time/800,Math.PI*1.5-m.time/800);ctx.stroke();
    ctx.fillStyle=color;ctx.font='600 '+Math.min(17,laneWidth*.3)+'px Consolas,monospace';ctx.textAlign='center';ctx.fillText(n.label,x,y+5);
    ctx.font='8px Consolas,monospace';ctx.fillStyle=n.open?'#c7eee4':'#b0a8cb';ctx.fillText(n.hp<=0?'CONCLUÍDO':n.open?'VULNERÁVEL':'PROTEGIDO',x,height<620?y+radius+17:y-radius-15);
  }
  if(m.complete) {
    ctx.globalAlpha=1-victory;ctx.strokeStyle='#bce9e3';ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(width/2,y,40+victory*Math.min(width*.35,220),0,Math.PI*2);ctx.stroke();
    ctx.globalAlpha=1;ctx.fillStyle='#bce9e3';ctx.font='500 '+Math.min(18,width/24)+'px Segoe UI,sans-serif';ctx.textAlign='center';ctx.fillText('GUARDIÃO NEUTRALIZADO',width/2,y+90);
  }
  ctx.restore();
}
function drawGuardianHull(m,nodes,y) {
  const center=nodes.reduce((sum,n)=>sum+(n.lane+.5)*laneWidth,0)/nodes.length;
  const left=Math.min(...nodes.map(n=>(n.lane+.5)*laneWidth)),right=Math.max(...nodes.map(n=>(n.lane+.5)*laneWidth));
  const half=Math.min(width*.46,Math.max(laneWidth*.9,(right-left)/2+laneWidth*.48));
  const tint=m.phase===8?'#d9979f':m.stabilizing?'#8dccc2':'#b7a3d6';
  const flash=m.time-m.hitAt<130;
  const hull=ctx.createLinearGradient(0,y-55,0,y+35);hull.addColorStop(0,flash?'#a5d4d0':'#4a526c');hull.addColorStop(.45,'#20364a');hull.addColorStop(1,'#0b1928');
  ctx.save();ctx.fillStyle=hull;ctx.strokeStyle=tint+'99';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(center-half,y-12);ctx.lineTo(center-half*.76,y-40);ctx.lineTo(center-half*.3,y-43);ctx.lineTo(center,y-58);ctx.lineTo(center+half*.3,y-43);ctx.lineTo(center+half*.76,y-40);ctx.lineTo(center+half,y-12);ctx.lineTo(center+half*.83,y+26);ctx.lineTo(center+half*.35,y+19);ctx.lineTo(center,y+35);ctx.lineTo(center-half*.35,y+19);ctx.lineTo(center-half*.83,y+26);ctx.closePath();ctx.fill();ctx.stroke();
  for(const side of [-1,1]) {
    const x=center+side*half*.82;ctx.strokeStyle=tint+'66';ctx.beginPath();ctx.moveTo(x,y-20);ctx.lineTo(x+side*half*.12,y-53);ctx.lineTo(x+side*half*.17,y-28);ctx.stroke();
    drawGlow(ctx,x,y+17,18,tint+'22');ctx.fillStyle=tint;ctx.fillRect(x-8,y+13,16,3);
  }
  ctx.strokeStyle=tint+'33';ctx.setLineDash([3,6]);ctx.beginPath();ctx.moveTo(center-half*.72,y-29);ctx.lineTo(center+half*.72,y-29);ctx.stroke();ctx.setLineDash([]);
  if(m.phase===7) {
    ctx.strokeStyle='#bca2e470';ctx.beginPath();for(let i=0;i<=60;i++){const x=center-half+i/60*half*2,py=y-14+Math.sin(i*.45+m.time/260)*15;i?ctx.lineTo(x,py):ctx.moveTo(x,py);}ctx.stroke();
  }
  if(m.phase===8)for(let i=0;i<3;i++){ctx.fillStyle=i===m.stage?'#efb0b7':'#725467';ctx.fillRect(center-23+i*17,y-43,12,3);}
  ctx.restore();
}
if(typeof module!=='undefined'&&module.exports)module.exports={QuantumBoss,quantumBosses};
