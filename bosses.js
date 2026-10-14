/* Integração dos guardiões com pilotagem, canal, áudio e apresentação. */
let boss=null, bossesDefeated=0, bossCleared=Array(8).fill(false);
let hullShield=1, hullInvulUntil=0, phaseCheckpointData=null;
const bossArenaY=()=>Math.max(120,Math.min(shipY-(height<620?55:95),height<620?Math.max(260,height*.54):Math.max(365,height*.48)));

function resetBossCampaign() {
  boss=null;bossCheckpointData=null;bossesDefeated=0;bossCleared=Array(8).fill(false);hullShield=1;hullInvulUntil=0;
  phaseCheckpointData=null;
  $('bossHud').hidden=true;$('phaseHud').hidden=false;$('btnRetry').hidden=true;updateShieldHUD();
}
function updateShieldHUD() { $('shieldStatus').textContent=hullShield?'◈ ESCUDO 1':'◇ ESCUDO 0';$('shieldStatus').dataset.empty=String(!hullShield); }
function takeHullHit(reason,x,cause={kind:boss?'bossSalvo':'collision'}) {
  if(gameTime<hullInvulUntil)return false;
  campaignMetrics?.count('hullHits');if(boss)boss.hullContacts++;
  if(hullShield>0) {
    hullShield--;hullInvulUntil=gameTime+(boss?450:1400);gameAudio.sfx('shieldHit',{pan:audioPan(x)});notifyCombat('ESCUDO ESGOTADO · outro golpe físico encerra a missão',2);
    updateShieldHUD();return true;
  }
  gameOver(reason,cause);return true;
}
function beginBoss(retrying=false) {
  if(boss || bossCleared[level-1])return;
  clearMovementInput();
  if(!isRegen){shipPilot.reset(occupiedShipLane());currentLane=shipPilot.lane;}
  if(!retrying)campaignMetrics?.event('waveEnd',{score,qber});campaignMetrics?.setContext(level,'boss');
  boss={model:new QuantumBoss(level,occupiedShipLane(),numLanes),status:'briefing',wonAt:0,hullContacts:0};
  isStageBriefing=true;cancelAnimationFrame(rafId);
  lasers=[];asteroids=[];drones=[];scout=null;clouds=[];spies=[];pickups=[];particles=[];interferenceFront=null;
  updateShieldHUD();bossCheckpointData=captureCheckpoint('boss');
  gameAudio.stopEffects();gameAudio.setScene('briefing',level);gameAudio.sfx('phase');
  const d=boss.model.definition;
  $('phaseEyebrow').textContent='DR. ÍRIS / DESAFIO FINAL DA FASE '+String(level).padStart(2,'0');
  $('phaseTitle').textContent=d.name;$('phaseObjective').textContent=d.objective;
  $('bossInstructions').innerHTML=d.instructions.map(text=>'<li>'+text+'</li>').join('');
  $('bossInstructions').hidden=false;$('bossControls').hidden=false;
  $('phaseScienceDetails').open=false;$('phaseOverlay').dataset.mode='boss';
  $('phaseConcept').textContent=d.concept;$('phaseScience').textContent=d.science;
  $('phaseCheckpoint').textContent=channelBriefingStatus()+' · ESCUDO '+hullShield+' · RETOMADA SALVA NO CHEFE';
  $('phaseRoute').innerHTML=quantumBosses.map((d,i)=>'<span class="'+(i<level-1?'complete':i===level-1?'current':'')+'">'+String(i+1).padStart(2,'0')+'</span>').join('');
  $('btnContinue').textContent='ENFRENTAR DESAFIO →';$('pauseBtn').disabled=true;$('warning').style.display='none';
  updateHUD();updateQberUI();$('phaseOverlay').hidden=false;$('btnContinue').focus({preventScroll:true});$('phaseOverlay').scrollTop=0;
}
function bossSupply() {
  const m=boss.model,phase=m.phase;
  if(phase!==3&&phase!==6&&phase!==8)return;
  if(pickups.length||boss.supplyRound===m.round)return;
  boss.supplyRound=m.round;
  const type=phase===6||(phase===8&&m.stage!==1)?'correction':'hadamard';
  const lane=type==='hadamard'?m.triadCenter:m.syndrome?m.lane([1,3,5][m.selection]):m.centers[0];
  const radius=Math.min(17,laneWidth*.3);
  pickups.push({type,x:(lane+.5)*laneWidth,y:shipY-(height<620?65:140),radius,speed:flightSpeed(2.8),releaseAt:gameTime+resourceRules.bossBeaconMs});
  campaignMetrics?.count('pickupsSpawned');
  notifyCombat((type==='hadamard'?'H':'CORREÇÃO +')+' A CAMINHO · TRILHA '+(lane+1));
}
function beginBossBattle() {
  campaignMetrics?.event('bossStart',{qber});
  protectBossRegen(boss.model);
  boss.status='fighting';gameAudio.setScene('boss',level);gameAudio.sfx('compromised');
  $('bossHud').hidden=false;$('phaseHud').hidden=true;updateBossHUD();
}
function updateBossHUD() {
  if(!boss)return;
  const m=boss.model;$('bossName').textContent=m.definition.name;
  $('bossHealth').textContent=m.health+' / '+m.maxHp;
  $('bossFill').style.width=(m.health/m.maxHp*100)+'%';
  const pulse=boss.channelPulse,remaining=pulse?pulse.releaseAt-m.time:0;
  const jamHint=remaining>0?'RUÍDO EM '+(remaining/1000).toFixed(1)+' s · ':'';
  const visible=m.pulses.filter(p=>!p.fired&&m.time>=p.announceAt);
  const upcoming=visible.map(p=>p.label+' '+(p.tracking?'MIRA SEGUINDO':((p.at-m.time)/1000).toFixed(1)+' s')).join(' → ');
  const threat=(upcoming?(visible[0].tracking?'':'DESVIE DE ')+upcoming+' · ':'')+jamHint+(bossRecoveryAvailable()?'RESPIRO · use R se precisar':'');
  $('bossThreat').textContent=threat||'Atire no alvo ATIVO e prepare a próxima fuga.';
  $('bossThreat').dataset.urgent=String(m.pulses.some(p=>!p.fired&&!p.tracking&&p.at-m.time<900));
  const hint=m.hint(qber);
  if($('bossHint').textContent!==hint)$('bossHint').textContent=hint;
}
function updateBossBattle(dt,shipX) {
  const m=boss.model;
  if(boss.status==='won') {
    drawBoss();
    if(gameTime-boss.wonAt>=1400)finishBoss();
    return;
  }
  for(const event of m.advance(dt*FRAME_MS,{lane:occupiedShipLane(),position:shipPosition()})) {
    if(event.type==='round') {campaignMetrics?.count('bossRounds');gameAudio.sfx('interference');bossSupply();campaignMetrics?.event('bossPattern',{round:m.round,stage:m.stage+1,pressure:m.pressure});}
    else if(event.type==='lock')gameAudio.sfx('spy');
    else if(event.type==='pulse') {
      gameAudio.sfx('spy');
      campaignMetrics?.count('bossSalvos');
      if(shipOverlapsLanes(event.lanes)) {campaignMetrics?.count('bossSalvoContacts');takeHullHit('A salva do guardião atingiu a nave sem escudo. Observe as trilhas marcadas antes do próximo ataque.',shipX,{kind:'bossSalvo',attack:event.label});if(!isPlaying)return;if(!noImpact())addQber(3.5,'bossSalvo');}
    }
  }
  updateBossChannel();
  targetLoop: for(const node of m.targets(qber)) {
    const x=(node.lane+.5)*laneWidth,y=bossArenaY(),radius=Math.min(34,laneWidth*.38);
    for(let i=lasers.length-1;i>=0;i--) {
      const l=lasers[i];
      if(Math.abs(l.x-x)<radius+4 && (l.previousY??l.y)>=y-radius && l.y<=y+radius) {
        lasers.splice(i,1);
        const before=m.health,previousStage=m.stage;
        if(m.hit(node.id,qber,node.lane)){
          campaignMetrics?.count('bossHits');campaignMetrics?.count('bossDamage',before-m.health);gameAudio.sfx('impact',{pan:audioPan(x)});
          if(m.stage!==previousStage){
            boss.channelPulse=null;boss.jamRound=-1;gameAudio.sfx('phase');campaignMetrics?.event('bossStage',{stage:m.stage+1});
            // Um disparo em voo pode mudar o estágio enquanto R imobiliza a nave.
            protectBossRegen(m);
            break targetLoop;
          }
        }
      }
    }
  }
  for(const event of m.drainEvents()){
    if(event.type==='noise'){campaignMetrics?.count('bossReadErrors');if(!noImpact()){addQber(event.amount,event.source);gameAudio.sfx('noise');}}
    else if(event.type==='round'){campaignMetrics?.count('bossRounds');bossSupply();campaignMetrics?.event('bossPattern',{round:m.round,stage:m.stage+1,pressure:m.pressure});}
  }
  if(m.complete) {
    boss.status='won';boss.wonAt=gameTime;boss.channelPulse=null;lasers=[];pickups=[];
    gameAudio.sfx('mothership');gameAudio.sfx('phase');
  }
  updateBossHUD();drawBoss();
}
function finishBoss() {
  if(!boss || boss.status!=='won' || bossCleared[level-1])return;
  const clean=boss.hullContacts===0,repair=Math.min(missed,resourceRules.repair+(clean?resourceRules.cleanRepair:0));
  bossCleared[level-1]=true;bossesDefeated++;boss=null;bossCheckpointData=null;lastFailure=null;
  campaignMetrics?.count('earthRepairs',repair);campaignMetrics?.count('bossesDefeated');if(clean)campaignMetrics?.count('cleanBosses');campaignMetrics?.event('bossEnd',{qber,missed,clean,repair});
  missed-=repair;setQber(qber-channelRules.victoryRecovery,'bossVictory');hullShield=1;hullInvulUntil=gameTime+1200;updateShieldHUD();
  lastReward={clean,repair};notifyCombat('ESCUDO RESTAURADO · '+repair+' IMPACTO(S) REPARADO(S)'+(clean?' · BÔNUS SEM DANO':''),1);
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
  const upcoming=m.pulses.filter(p=>m.time>=p.announceAt&&p.at-m.time>=-450);
  const nearest=upcoming.find(p=>!p.fired);
  for(const p of upcoming) {
    if(m.complete)continue;
    const until=p.at-m.time,fired=until<=0;
    const color=({A:'#ef7976',B:'#c3a0f2',C:'#88bce9'})[p.label];
    const top=height<620?shipY-48:y+48,bottom=earthTop;
    ctx.strokeStyle=color+'99';ctx.lineWidth=1;ctx.setLineDash(fired?[]:[5,9]);
    for(const lane of p.lanes){
      const x=lane*laneWidth;ctx.fillStyle=color+(fired?'70':p===nearest?'18':'06');
      ctx.fillRect(x+3,top,laneWidth-6,Math.max(0,bottom-top));ctx.strokeRect(x+3,top,laneWidth-6,Math.max(0,bottom-top));
      ctx.font=(height<620?'8':'9')+'px Consolas,monospace';ctx.textAlign='center';ctx.fillStyle=color;
      const row=p.label.charCodeAt(0)-65;
      const labelY=height<620?shipY+32+row*10:shipY-100+row*14;
      ctx.fillText(p.label+(p.tracking?' MIRA':fired?'':(' '+(until/1000).toFixed(1))),x+laneWidth/2,labelY);
    }
    if(p===nearest&&!p.tracking)for(const lane of m.lanes.filter(l=>!p.lanes.includes(l))){
      ctx.fillStyle='#6ce8cd70';ctx.fillRect(lane*laneWidth+5,shipY+31,laneWidth-10,3);
    }
  }
  ctx.setLineDash([]);drawBossChannel();
  const nodes=m.targets(qber);
  const victory=m.complete?Math.min(1,(gameTime-boss.wonAt)/1400):0;
  if(m.complete)ctx.globalAlpha=1-victory;
  drawGuardianHull(m,nodes,y);
  if(m.phase===4 || (m.phase===8&&m.stage===0)) {
    ctx.strokeStyle='#91c7ff70';ctx.setLineDash([5,5]);ctx.beginPath();ctx.moveTo((nodes[0].lane+.5)*laneWidth,y);ctx.lineTo((nodes[1].lane+.5)*laneWidth,y);ctx.stroke();ctx.setLineDash([]);
  }
  if(m.nextZone){
    ctx.strokeStyle='#91c7ff';ctx.setLineDash([3,6]);
    for(const lane of m.nextZone.lanes)ctx.strokeRect(lane*laneWidth+5,shipY-42,laneWidth-10,84);
    ctx.setLineDash([]);
  }
  if(m.nextTriadCenter!==null){
    ctx.strokeStyle='#91c7ff77';ctx.setLineDash([3,5]);
    for(const offset of [-1,0,1]){const x=(m.nextTriadCenter+offset+.5)*laneWidth;ctx.beginPath();ctx.arc(x,y,radius+4,0,Math.PI*2);ctx.stroke();}
    ctx.setLineDash([]);
  }
  for(const n of nodes) {
    const x=(n.lane+.5)*laneWidth,color=n.hp<=0?'#668b85':n.open?'#6ce8cd':'#bb9bf4';
    if(n.open)drawGlow(ctx,x,y,radius*2.5,color+'30');
    ctx.fillStyle='#142535';ctx.strokeStyle=color;ctx.lineWidth=n.open?2:1;
    ctx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4+Math.sin(m.time/1400)*.08;const px=x+Math.cos(a)*radius,py=y+Math.sin(a)*radius;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle=color+'50';ctx.beginPath();ctx.arc(x,y,radius+7,-m.time/800,Math.PI*1.5-m.time/800);ctx.stroke();
    ctx.fillStyle=color;ctx.font='600 '+Math.min(17,laneWidth*.3)+'px Consolas,monospace';ctx.textAlign='center';ctx.fillText(n.label,x,y+5);
    const next=m.nextSelection!==null&&n.lane===m.lane([1,3,5][m.nextSelection]);
    ctx.font='8px Consolas,monospace';ctx.fillStyle=next?'#91c7ff':n.open?'#c7eee4':'#b0a8cb';
    ctx.fillText(next?'PRÓXIMO +':n.hp<=0?'OK':n.open?'ATIVO':'FECHADO',x,height<620?y-radius-9:y-radius-15);
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
if(typeof module!=='undefined'&&module.exports)module.exports=require('./boss-model.js');
