/* Recursos da campanha. Os tempos usam gameTime e congelam em pausas e briefings. */
let isStageBriefing = false, pickups = [], superpositionUntil = 0;
let nextPickupAt = 0, nextInterferenceAt = 0, interferenceFront = null;
let asteroidSerial = 0, quantumCollected = 0, pickupSerial = 0, phaseWaveCount = 0;
const flightSpeed = speed => speed * OrbitalArena.flightScale(height);

function resetQuantumMission() {
  resetBossCampaign();
  isStageBriefing = false; pickups = []; superpositionUntil = 0;
  nextPickupAt = gameTime+3000; nextInterferenceAt = gameTime+6000;
  interferenceFront = null; asteroidSerial = 0; quantumCollected = 0; pickupSerial = 0; phaseWaveCount = 0;
  $('phaseOverlay').hidden = true;
  $('quantumStatus').textContent = 'Intercepte asteroides. Monitore o QBER.';
}

function updatePhaseHUD() {
  const phase = phaseConfig(), start = level > 1 ? missionPhases[level-2].target : 0;
  $('phaseName').textContent = phase.name;
  $('phaseProgress').textContent = 'ENCONTRO '+Math.min(3,(encounterDirector?.index??0)+1)+'/3 · '+(encounterDirector?.state==='draining'?'LIMPE O SETOR':encounterDirector?.state==='breather'?'RESPIRO':Math.max(0,score-start)+' / '+(phase.target-start));
  $('phaseFill').style.width = Math.max(0, Math.min(100,(score-start)/(phase.target-start)*100))+'%';
}

function enterPhase(nextLevel) {
  gameAudio.stopLoop('regen'); gameAudio.setScene('briefing', nextLevel); gameAudio.sfx('phase');
  level = nextLevel; phaseWaveCount = 0; pickupSerial = level % 2; isStageBriefing = true; cancelAnimationFrame(rafId);
  clearMovementInput();
  if(!isRegen){shipPilot.reset(occupiedShipLane());currentLane=shipPilot.lane;}
  campaignMetrics?.setContext(level,'wave');campaignMetrics?.event('phaseStart',{score,qber});
  bossCheckpointData=null;
  $('bossInstructions').hidden=true;$('bossControls').hidden=true;
  $('phaseScienceDetails').open=true;$('phaseOverlay').dataset.mode='phase';
  $('btnContinue').textContent='CONTINUAR DEFESA →';
  $('bossHud').hidden=true;$('phaseHud').hidden=false;
  lasers = []; asteroids = []; clouds = []; spies = []; pickups = []; particles = [];
  interferenceFront = null;resetEncounters();
  nextCloudAt = gameTime+3500;
  nextSpyAt = gameTime+5000; nextPickupAt = gameTime+2500; nextInterferenceAt = gameTime+6000;
  phaseCheckpointData=captureCheckpoint('wave');
  $('warning').style.display = 'none'; $('pauseBtn').disabled = true;
  const phase = phaseConfig();
  $('phaseEyebrow').textContent = 'DR. ÍRIS / FASE '+String(level).padStart(2,'0')+' DE '+maxLevel;
  $('phaseTitle').textContent = phase.name;
  $('phaseObjective').textContent = phase.objective;
  $('phaseConcept').textContent = phase.concept;
  $('phaseScience').textContent = phase.science;
  $('phaseCheckpoint').textContent = channelBriefingStatus()+' · GUARDIÕES '+bossesDefeated+'/8 · IMPACTOS '+missed+'/'+maxMisses+' · ESCUDO '+hullShield+(lastReward?' · REPARO +'+lastReward.repair+(lastReward.clean?' (SEM DANO)':''):'')+' · AO FIM: '+quantumBosses[level-1].name.toUpperCase();
  $('phaseRoute').innerHTML = missionPhases.map((p,i)=>'<span class="'+(i+1<level?'complete':i+1===level?'current':'')+'" title="'+p.name+'" aria-label="Fase '+(i+1)+': '+p.name+'">'+String(i+1).padStart(2,'0')+'</span>').join('');
  updateHUD(); updateQuantumStatus(); drawBackground(0); drawMothership();
  $('phaseOverlay').hidden = false; $('btnContinue').focus({preventScroll:true});$('phaseOverlay').scrollTop=0;
}

function continuePhase() {
  if (!isStageBriefing || !isPlaying) return;
  if(boss?.status==='briefing')beginBossBattle();else gameAudio.setScene('phase',level);
  if (isRegen) gameAudio.startLoop('regen');
  isStageBriefing = false; $('phaseOverlay').hidden = true;
  $('pauseBtn').disabled = false; $('btnContinue').blur();
  canvas.focus({preventScroll:true}); bannerUntil = gameTime+2400; lastTs = 0;
  rafId = requestAnimationFrame(update);
}

function makeCloud(lane,y) {
  const x = (lane+.5)*laneWidth;
  return {x, baseX:x, y, radius:Math.min(38,laneWidth*.35), speed:flightSpeed(cloudSpeed+(level-1)*.08), born:gameTime, sway:!!phaseConfig().movingClouds};
}

// Seleciona uma trilha alcançável e evita riscos já visíveis no instante de coleta.
function pickupLanes() {
  const distance=(shipY+30)/flightSpeed(2.8),arrival=distance*FRAME_MS,origin=occupiedShipLane();
  return Array.from({length:numLanes},(_,lane)=>lane).filter(lane=>{
    if(Math.abs(lane-origin)<1||Math.abs(lane-origin)>3||Math.abs(lane-origin)*OrbitalArena.stepMs+400>arrival)return false;
    if(asteroids.some(a=>Math.abs((a.toX??a.x)-(lane+.5)*laneWidth)<laneWidth*.7&&Math.abs(a.y+a.speed*distance-shipY)<a.radius+shipSize+60))return false;
    if([...clouds,...spies].some(h=>Math.abs(h.x-(lane+.5)*laneWidth)<laneWidth&&Math.abs(h.y+h.speed*distance-shipY)<100))return false;
    return true;
  });
}
function spawnQuantumPickup() {
  if(level<3||gameTime<nextPickupAt||pickups.length)return;
  const needsCorrection=phaseConfig().correction&&(qber>=3||keyReadyAt-gameTime>=2500);
  const type=needsCorrection&&pickupSerial%2===0?'correction':'hadamard';
  if(type==='hadamard'&&superpositionUntil-gameTime>2000){nextPickupAt=gameTime+500;return;}
  const free=pickupLanes();
  if(!free.length){nextPickupAt=gameTime+500;return;}
  const lane=free[(campaignSeed+pickupSerial*7+level)%free.length];pickupSerial++;
  pickups.push({type,x:(lane+.5)*laneWidth,y:-30,radius:Math.min(17,laneWidth*.3),speed:flightSpeed(2.8)});
  campaignMetrics?.count('pickupsSpawned');flashHatch(lane,type==='correction'?'#91c7ff':'#6ce8cd');
  nextPickupAt=gameTime+(level>=6?resourceRules.waveLateMs:resourceRules.waveEarlyMs);
}
function updateQuantumPickups(dt,shipX,previousShipX=shipX) {
  for(let i=pickups.length-1;i>=0;i--){
    const p=pickups[i];if(gameTime<(p.releaseAt??0))continue;
    if(p.releaseAt!==undefined&&!p.released){p.released=true;gameAudio.sfx('supply');}
    const activeDt=Math.min(dt,Math.max(0,(gameTime-(p.releaseAt??0))/FRAME_MS));
    const previousY=p.y;p.y+=p.speed*activeDt;
    if(shipTouches(p,previousY,previousShipX,shipX,p.radius+shipSize*.7)){
      quantumCollected++;campaignMetrics?.count(p.type==='correction'?'correctionsCollected':'hadamardsCollected');
      gameAudio.sfx(p.type==='correction'?'correction':'hadamard',{pan:audioPan(p.x)});
      if(p.type==='correction'){
        const removed=Math.min(qber,resourceRules.correction),cooldown=Math.min(Math.max(0,keyReadyAt-gameTime),resourceRules.correctionCooldownMs);
        setQber(qber-removed,'correction');keyReadyAt=Math.max(gameTime,keyReadyAt-cooldown);
        notifyCombat('+ · QBER −'+removed.toFixed(1)+' pp · R −'+(cooldown/1000).toFixed(1)+' s',1);
      }else{
        superpositionUntil=gameTime+Math.min(resourceRules.hadamardMaxMs,Math.max(0,superpositionUntil-gameTime)+resourceRules.hadamardMs);
        notifyCombat('H ATIVO · 3 TRILHAS · '+((superpositionUntil-gameTime)/1000).toFixed(1)+' s',1);
      }
      pickups.splice(i,1);updateQberUI();
    }else if(p.y>earthTop+40){pickups.splice(i,1);campaignMetrics?.count('pickupsMissed');}
  }
}
function drawQuantumPickups(){
  for(const p of pickups){
    const pending=gameTime<(p.releaseAt??0),color=p.type==='correction'?'#91c7ff':'#6ce8cd',r=Math.min(17,laneWidth*.3);
    ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=pending?.6:1;drawGlow(ctx,0,0,r*1.8,color+'22');
    ctx.strokeStyle=color;ctx.fillStyle='#102632';ctx.lineWidth=1.5;ctx.setLineDash(pending?[3,4]:[]);
    ctx.beginPath();ctx.moveTo(0,-r);ctx.lineTo(r,0);ctx.lineTo(0,r);ctx.lineTo(-r,0);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.textAlign='center';ctx.fillStyle=color;ctx.font='600 '+Math.min(15,r)+'px Consolas,monospace';ctx.fillText(p.type==='correction'?'+':'H',0,4);
    if(pending){ctx.font='9px Consolas,monospace';ctx.fillText(((p.releaseAt-gameTime)/1000).toFixed(1)+' s',0,-r-8);}
    ctx.restore();
  }
}

function updateQuantumStatus() {
  if(boss)return;
  let status;
  if(waveRecoveryAvailable())status='RESPIRO · R renova a chave em 2 s. Prepare a próxima formação.';
  else if(interferenceFront&&[interferenceFront,interferenceFront.followUp].some(f=>f&&gameTime<f.releaseAt))status=[interferenceFront,interferenceFront.followUp].filter(f=>f&&gameTime<f.releaseAt).map((f,i)=>'FRENTE '+(f===interferenceFront?'A':'B')+' EM '+((f.releaseAt-gameTime)/1000).toFixed(1)+' s').join(' · ')+' · procure os corredores verdes';
  else if(scout)status=scout.state==='tracking'?'Sonda rastreando: espere a mira fixar e desvie.':'Sonda: saia da trilha dourada. Pulso aumenta o QBER.';
  else if(drones.length)status='Drone emissor: destrua-o para interromper o ruído no canal.';
  else if(asteroids.some(a=>a.splittable))status='Meteoro rachado: intercepte cedo para evitar dois fragmentos.';
  else if (gameTime < superpositionUntil) status='H ATIVO · 3 trilhas · '+((superpositionUntil-gameTime)/1000).toFixed(1)+' s';
  else if (phaseConfig().interference) status='Faixas violetas: prepare uma trilha de fuga. H / + disponíveis.';
  else if (phaseConfig().correction) status='Colete + para corrigir QBER; H amplia seus disparos.';
  else if (phaseConfig().movingClouds) status='Ruído ambiental: +'+phaseConfig().drift.toFixed(2).replace('.',',')+'% QBER/s. Nuvens móveis.';
  else if (phaseConfig().entangled) status='Fio azul: par conectado. Anel dourado: 2 disparos.';
  else if (level >= 3) status='Colete H: disparos automáticos em até 3 trilhas por 5 s.';
  else if (level === 2) status='Pulsos dourados: +7% QBER. Regenere a chave com R.';
  else status='Intercepte asteroides. Monitore o QBER.';
  if ($('quantumStatus').textContent !== status) $('quantumStatus').textContent=status;
}

function drawSuperposition(shipX) {
  if (gameTime >= superpositionUntil || isRegen) return;
  ctx.save(); ctx.globalAlpha=.22;
  for (const offset of [-1,1]) {const x=shipX+offset*laneWidth;if(x>=laneWidth/2&&x<=width-laneWidth/2)drawInterceptor(ctx,x,shipY,shipSize,'#6ce8cd',gameTime);}
  ctx.globalAlpha=.55; ctx.strokeStyle='#6ce8cd';ctx.setLineDash([3,6]);
  ctx.beginPath();ctx.moveTo(Math.max(laneWidth/2,shipX-laneWidth),shipY);ctx.lineTo(Math.min(width-laneWidth/2,shipX+laneWidth),shipY);ctx.stroke();ctx.restore();
}

function drawEntangledLinks() {
  const groups = new Map();
  for (const a of asteroids) if (a.group !== null) {
    if (!groups.has(a.group)) groups.set(a.group,[]);
    groups.get(a.group).push(a);
  }
  ctx.save(); ctx.strokeStyle='#91c7ff70'; ctx.lineWidth=1;ctx.setLineDash([4,5]);ctx.lineDashOffset=-gameTime/70;
  for (const pair of groups.values()) if (pair.length===2) {
    ctx.beginPath();ctx.moveTo(pair[0].x,pair[0].y);ctx.lineTo(pair[1].x,pair[1].y);ctx.stroke();
  }
  ctx.restore();
}

function drawAsteroidQuantum(a) {
  if(a.rush) {
    ctx.save();ctx.strokeStyle='#eeaa7277';ctx.lineWidth=2;
    for(const offset of [-5,5]){ctx.beginPath();ctx.moveTo(a.x+offset,a.y-a.radius);ctx.lineTo(a.x+offset,a.y-a.radius-25);ctx.stroke();}
    ctx.restore();
  }
  if(a.splittable){
    ctx.save();ctx.strokeStyle='#eeaa72';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(a.x-5,a.y-a.radius);ctx.lineTo(a.x+5,a.y);ctx.lineTo(a.x-5,a.y+a.radius);ctx.stroke();
    ctx.font='9px Consolas,monospace';ctx.textAlign='center';ctx.fillStyle='#eeaa72';ctx.fillText('FRAGMENTÁVEL',Math.max(38,Math.min(width-38,a.x)),a.y-a.radius-12);ctx.restore();
  }
  if (!a.armored && a.group === null) return;
  ctx.save(); ctx.strokeStyle=a.group !== null?'#91c7ff90':a.hp>1?'#e6c491cc':'#e6c49144'; ctx.lineWidth=a.hitUntil>gameTime?3:1.5;
  ctx.beginPath();ctx.arc(a.x,a.y,a.radius+5,0,Math.PI*2);ctx.stroke();
  if (a.armored) {ctx.fillStyle='#e6c491';ctx.font='9px Consolas,monospace';ctx.textAlign='center';ctx.fillText(a.hp+' / 2',a.x,a.y-a.radius-10);}
  ctx.restore();
}

function destroyQuantumAsteroid(target) {
  const victims = asteroids.filter(a => a===target || (target.group !== null && a.group===target.group));
  gameAudio.sfx('explosion', { pan: audioPan(target.x) });
  for (const a of victims) {emitDebris(a.x,a.y,a.radius);asteroids.splice(asteroids.indexOf(a),1);combatScore+=a.fragment?5:a.splittable?15:10;}
  victims.forEach(resolveThreat);
  campaignMetrics?.count('asteroidsDestroyed',victims.length);
  updateHUD();
}

function updateInterference(dt) {
  if (!phaseConfig().interference) return;
  if (!interferenceFront && encounterDirector?.ambientAllowed && gameTime >= nextInterferenceAt) {
    const gap=Math.floor(Math.random()*(numLanes-2));
    const lanes=Array.from({length:numLanes},(_,i)=>i).filter(i=>i<gap||i>gap+2);
    interferenceFront={lanes,releaseAt:gameTime+1800,y:95,passed:false};
    if(level>=7&&encounterDirector.index===2){
      const secondGap=gap<3?numLanes-3:0;
      interferenceFront.followUp={lanes:Array.from({length:numLanes},(_,i)=>i).filter(i=>i<secondGap||i>secondGap+2),releaseAt:gameTime+3000,y:95,passed:false};
      campaignMetrics?.count('interferenceSpawned');
    }
    campaignMetrics?.count('interferenceSpawned');
    gameAudio.sfx('interference');
    nextInterferenceAt=gameTime+(level===8?9000:11000);
  }
  const front=interferenceFront; if(!front)return;
  drawInterferenceFront(front,dt,'A',0);
  if(front.followUp)drawInterferenceFront(front.followUp,dt,'B',1);
  if(front.y>earthTop+30&&(!front.followUp||front.followUp.y>earthTop+30))interferenceFront=null;
}
function drawInterferenceFront(front,dt,label='A',row=0) {
  if(front.y>earthTop+30)return;
  ctx.save();
  if (gameTime < front.releaseAt) {
    const top=height<=620?182:width<=900?260:225,guide=top+row*(height<=620?28:34);
    ctx.textAlign='center';ctx.font='10px Consolas,monospace';
    ctx.fillStyle='#d5bdf4';ctx.fillText('FRENTE '+label+' · '+((front.releaseAt-gameTime)/1000).toFixed(1)+' s',width/2,guide);
    for(let lane=0;lane<numLanes;lane++){
      const x=lane*laneWidth,danger=front.lanes.includes(lane);
      ctx.fillStyle=danger?(row?'#a98be4':'#c7b0ee'):'#6ce8cd';ctx.fillRect(x+3,guide+6,laneWidth-6,3);
      if(row===0&&danger){ctx.fillStyle='rgba(173,132,235,.045)';ctx.fillRect(x+3,guide+12,laneWidth-6,Math.max(0,earthTop-guide-12));}
    }
  } else {
    const previousY=front.y; front.y+=flightSpeed(5.5)*dt;
    for (const lane of front.lanes) {const x=lane*laneWidth;const glow=ctx.createLinearGradient(0,front.y-15,0,front.y+15);glow.addColorStop(0,'#bb9bf400');glow.addColorStop(.5,'#bb9bf480');glow.addColorStop(1,'#bb9bf400');ctx.fillStyle=glow;ctx.fillRect(x+3,front.y-15,laneWidth-6,30);}
    if (!front.passed && previousY < shipY && front.y >= shipY) {
      front.passed=true;
      if (!noImpact() && shipOverlapsLanes(front.lanes)) {campaignMetrics?.count('interferenceContacts');addQber(cloudQber,'interference');}
    }
  }
  ctx.restore();
}

canvas.tabIndex=0;
$('campaignList').innerHTML=missionPhases.map((phase,i)=>'<li><span>'+String(i+1).padStart(2,'0')+'</span>'+phase.name+'</li>').join('');
