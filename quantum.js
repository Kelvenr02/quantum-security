/* Recursos da campanha. Os tempos usam gameTime e congelam em pausas e briefings. */
let isStageBriefing = false, pickups = [], superpositionUntil = 0;
let nextPickupAt = 0, nextInterferenceAt = 0, interferenceFront = null;
let asteroidSerial = 0, quantumCollected = 0, pickupSerial = 0, phaseWaveCount = 0;
const flightSpeed = speed => speed * Math.max(.5, Math.min(1.3, height / 800));

function resetQuantumMission() {
  isStageBriefing = false; pickups = []; superpositionUntil = 0;
  nextPickupAt = gameTime+3000; nextInterferenceAt = gameTime+6000;
  interferenceFront = null; asteroidSerial = 0; quantumCollected = 0; pickupSerial = 0; phaseWaveCount = 0;
  $('phaseOverlay').hidden = true;
  $('quantumStatus').textContent = 'Intercepte asteroides. Monitore o QBER.';
}

function updatePhaseHUD() {
  const phase = phaseConfig(), start = level > 1 ? missionPhases[level-2].target : 0;
  $('phaseName').textContent = phase.name;
  $('phaseProgress').textContent = Math.max(0, score-start)+' / '+(phase.target-start);
  $('phaseFill').style.width = Math.max(0, Math.min(100,(score-start)/(phase.target-start)*100))+'%';
}

function enterPhase(nextLevel) {
  gameAudio.stopLoop('regen'); gameAudio.setScene('briefing', nextLevel); gameAudio.sfx('phase');
  level = nextLevel; phaseWaveCount = 0; pickupSerial = level % 2; isStageBriefing = true; cancelAnimationFrame(rafId);
  lasers = []; asteroids = []; clouds = []; spies = []; pickups = []; particles = [];
  interferenceFront = null; superpositionUntil = 0;
  nextAsteroidAt = gameTime+1800; nextCloudAt = gameTime+3500;
  nextSpyAt = gameTime+5000; nextPickupAt = gameTime+2500; nextInterferenceAt = gameTime+6000;
  $('warning').style.display = 'none'; $('pauseBtn').disabled = true;
  const phase = phaseConfig();
  $('phaseEyebrow').textContent = 'DR. ÍRIS / FASE '+String(level).padStart(2,'0')+' DE '+maxLevel;
  $('phaseTitle').textContent = phase.name;
  $('phaseObjective').textContent = phase.objective;
  $('phaseConcept').textContent = phase.concept;
  $('phaseScience').textContent = phase.science;
  $('phaseCheckpoint').textContent = 'CANHÃO '+Math.round(score/winScore*100)+'% · IMPACTOS '+missed+'/'+maxMisses+' · QBER '+qber.toFixed(1)+'%';
  $('phaseRoute').innerHTML = missionPhases.map((p,i)=>'<span class="'+(i+1<level?'complete':i+1===level?'current':'')+'" title="'+p.name+'" aria-label="Fase '+(i+1)+': '+p.name+'">'+String(i+1).padStart(2,'0')+'</span>').join('');
  updateHUD(); updateQuantumStatus(); drawBackground(0); drawMothership();
  $('phaseOverlay').hidden = false; $('btnContinue').focus();
}

function continuePhase() {
  if (!isStageBriefing || !isPlaying) return;
  gameAudio.setScene('phase', level); if (isRegen) gameAudio.startLoop('regen');
  isStageBriefing = false; $('phaseOverlay').hidden = true;
  $('pauseBtn').disabled = false; $('btnContinue').blur();
  canvas.focus({preventScroll:true}); bannerUntil = gameTime+2400; lastTs = 0;
  rafId = requestAnimationFrame(update);
}

function makeCloud(lane,y) {
  const x = (lane+.5)*laneWidth;
  return {x, baseX:x, y, radius:Math.min(38,laneWidth*.35), speed:flightSpeed(cloudSpeed+(level-1)*.08), born:gameTime, sway:!!phaseConfig().movingClouds};
}

function spawnQuantumPickup() {
  if (level < 3 || gameTime < nextPickupAt || pickups.length) return;
  const free = [...Array(numLanes).keys()].filter(lane => !blockedByHazard(lane) && !blockedByAsteroid(lane));
  if (!free.length) return;
  const lane = free[Math.floor(Math.random()*free.length)];
  const type = phaseConfig().correction && pickupSerial++ % 2 === 0 ? 'correction' : 'hadamard';
  pickups.push({type,x:(lane+.5)*laneWidth,y:-30,radius:17,speed:flightSpeed(2.8)});
  flashHatch(lane,type==='correction'?'#91c7ff':'#6ce8cd');
  nextPickupAt = gameTime + (level >= 6 ? 6500 : 8500);
}

function updateQuantumPickups(dt,shipX) {
  for (let i=pickups.length-1;i>=0;i--) {
    const p=pickups[i]; p.y+=p.speed*dt;
    const color=p.type==='correction'?'#91c7ff':'#6ce8cd';
    ctx.save(); ctx.translate(p.x,p.y); drawGlow(ctx,0,0,30,color+'22');
    ctx.strokeStyle=color; ctx.fillStyle='#102632'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(0,-19); ctx.lineTo(19,0); ctx.lineTo(0,19); ctx.lineTo(-19,0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle=color; ctx.font='600 15px Consolas,monospace'; ctx.textAlign='center'; ctx.fillText(p.type==='correction'?'+':'H',0,5); ctx.restore();
    if (Math.hypot(shipX-p.x,shipY-p.y)<p.radius+shipSize*.7) {
      quantumCollected++;
      gameAudio.sfx(p.type === 'correction' ? 'correction' : 'hadamard', { pan: audioPan(p.x) });
      if (p.type==='correction') { qber=Math.max(0,qber-5); keyReadyAt=Math.max(gameTime,keyReadyAt-3000); }
      else superpositionUntil=gameTime+6000;
      pickups.splice(i,1); updateQberUI();
    } else if (p.y > earthTop+40) pickups.splice(i,1);
  }
}

function updateQuantumStatus() {
  let status;
  if (gameTime < superpositionUntil) status='H ATIVO · 3 trilhas · '+((superpositionUntil-gameTime)/1000).toFixed(1)+' s';
  else if (phaseConfig().interference) status='Faixas violetas: prepare uma trilha de fuga. H / + disponíveis.';
  else if (phaseConfig().correction) status='Colete + para corrigir QBER; H amplia seus disparos.';
  else if (phaseConfig().movingClouds) status='Ruído ambiental: +'+phaseConfig().drift.toFixed(2).replace('.',',')+'% QBER/s. Nuvens móveis.';
  else if (phaseConfig().entangled) status='Fio azul: par conectado. Anel dourado: 2 disparos.';
  else if (level >= 3) status='Colete H: disparos automáticos em até 3 trilhas por 6 s.';
  else if (level === 2) status='Pulsos dourados: +7% QBER. Regenere a chave com R.';
  else status='Intercepte asteroides. Monitore o QBER.';
  if ($('quantumStatus').textContent !== status) $('quantumStatus').textContent=status;
}

function drawSuperposition(shipX) {
  if (gameTime >= superpositionUntil || isRegen) return;
  ctx.save(); ctx.globalAlpha=.22;
  for (const lane of [currentLane-1,currentLane+1]) if (lane >= 0 && lane < numLanes) drawInterceptor(ctx,(lane+.5)*laneWidth,shipY,shipSize,'#6ce8cd',gameTime);
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
  if (!a.armored && a.group === null) return;
  ctx.save(); ctx.strokeStyle=a.group !== null?'#91c7ff90':a.hp>1?'#e6c491cc':'#e6c49144'; ctx.lineWidth=a.hitUntil>gameTime?3:1.5;
  ctx.beginPath();ctx.arc(a.x,a.y,a.radius+5,0,Math.PI*2);ctx.stroke();
  if (a.armored) {ctx.fillStyle='#e6c491';ctx.font='9px Consolas,monospace';ctx.textAlign='center';ctx.fillText(a.hp+' / 2',a.x,a.y-a.radius-10);}
  ctx.restore();
}

function destroyQuantumAsteroid(target) {
  const victims = asteroids.filter(a => a===target || (target.group !== null && a.group===target.group));
  gameAudio.sfx('explosion', { pan: audioPan(target.x) });
  for (const a of victims) {emitDebris(a.x,a.y,a.radius);asteroids.splice(asteroids.indexOf(a),1);}
  score=Math.min(winScore,score+victims.length*10); updateHUD();
}

function updateInterference(dt) {
  if (!phaseConfig().interference) return;
  if (!interferenceFront && gameTime >= nextInterferenceAt) {
    const lanes=shuffled([...Array(numLanes).keys()]).slice(0,4);
    interferenceFront={lanes,releaseAt:gameTime+1800,y:95,passed:false};
    gameAudio.sfx('interference');
    nextInterferenceAt=gameTime+(level===8?9000:11000);
  }
  const front=interferenceFront; if (!front) return;
  ctx.save();
  if (gameTime < front.releaseAt) {
    ctx.fillStyle='rgba(173,132,235,.045)'; ctx.strokeStyle='#bb9bf455';ctx.setLineDash([4,10]);
    for (const lane of front.lanes) {const x=lane*laneWidth;ctx.fillRect(x,285,laneWidth,Math.max(0,earthTop-285));ctx.strokeRect(x+3,285,laneWidth-6,Math.max(0,earthTop-285));}
    ctx.textAlign='center';ctx.font='10px Consolas,monospace';ctx.fillStyle='#d5bdf4';ctx.fillText('FRENTE DE RUÍDO · '+((front.releaseAt-gameTime)/1000).toFixed(1)+' s',width/2,Math.max(305,height*.45));
  } else {
    const previousY=front.y; front.y+=flightSpeed(5.5)*dt;
    for (const lane of front.lanes) {const x=lane*laneWidth;const glow=ctx.createLinearGradient(0,front.y-15,0,front.y+15);glow.addColorStop(0,'#bb9bf400');glow.addColorStop(.5,'#bb9bf480');glow.addColorStop(1,'#bb9bf400');ctx.fillStyle=glow;ctx.fillRect(x+3,front.y-15,laneWidth-6,30);}
    if (!front.passed && previousY < shipY && front.y >= shipY) {
      front.passed=true;
      if (!noImpact() && front.lanes.includes(currentLane)) addQber(cloudQber);
    }
    if (front.y > earthTop+30) interferenceFront=null;
  }
  ctx.restore();
}

canvas.tabIndex=0;
$('campaignList').innerHTML=missionPhases.map((phase,i)=>'<li><span>'+String(i+1).padStart(2,'0')+'</span>'+phase.name+'</li>').join('');
