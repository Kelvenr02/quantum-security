/* Regras do canal fictício da missão; os percentuais não são critérios universais de QKD. */
const channelRules=Object.freeze({
  limit:11,alert:7.7,max:16,earlyDecay:.18,lateDecay:.08,
  recoveryQber:9,criticalGraceMs:2500,contactGraceMs:600,victoryRecovery:1.5,
  bossDrift:Object.freeze([.24,.30,.34,.40,.50,.60,.70,.80]),
  jamWarningMs:1200,jamEarlyQber:2.5,jamLateQber:3,reactionMarginMs:400
});

function channelStateName() {
  if(isRegen)return 'regenerating';
  if(isCompromised)return 'compromised';
  return qber>qberLimit?'critical':qber>=channelRules.alert?'unstable':'safe';
}
function checkChannelCritical() {
  if(qber<=qberLimit||isRegen||isCompromised||gameTime<criticalGraceUntil)return;
  isCompromised=true;compEnd=gameTime+compromisedDuration;
  campaignMetrics?.count('compromises');campaignMetrics?.event('compromised',{qber});
  gameAudio.sfx('compromised');
}
function channelCheckpoint() {
  return {qber,regenRemaining:isRegen?Math.max(0,regenEnd-gameTime):0,
    cooldownRemaining:Math.max(0,keyReadyAt-gameTime),
    compromiseRemaining:isCompromised?Math.max(0,compEnd-gameTime):0,
    criticalGraceRemaining:Math.max(0,criticalGraceUntil-gameTime),
    contactGraceRemaining:Math.max(0,invulUntil-gameTime)};
}
function restoreChannel(saved) {
  if(!saved)return;
  qber=Math.max(0,Math.min(channelRules.max,saved.qber));
  isRegen=saved.regenRemaining>0;regenEnd=gameTime+saved.regenRemaining;
  keyReadyAt=gameTime+saved.cooldownRemaining;
  isCompromised=saved.compromiseRemaining>0;compEnd=gameTime+saved.compromiseRemaining;
  criticalGraceUntil=gameTime+saved.criticalGraceRemaining;
  invulUntil=gameTime+saved.contactGraceRemaining;
}
function updateChannel(milliseconds) {
  const activeMs=isRegen?Math.max(0,Math.min(milliseconds,gameTime-regenEnd)):milliseconds;
  if(isRegen&&gameTime>=regenEnd) {
    isRegen=false;setQber(0,'regeneration');criticalGraceUntil=gameTime+channelRules.contactGraceMs;
    invulUntil=gameTime+channelRules.contactGraceMs;
    campaignMetrics?.count('regenerationsCompleted');gameAudio.stopLoop('regen');gameAudio.sfx('regenReady');
  }
  if(isCompromised&&gameTime>=compEnd) {
    isCompromised=false;setQber(Math.min(qber,channelRules.recoveryQber),'automaticRecovery');
    criticalGraceUntil=gameTime+channelRules.criticalGraceMs;
    invulUntil=gameTime+channelRules.contactGraceMs;gameAudio.sfx('confirm');
    campaignMetrics?.event('controlRecovered',{qber});
  }
  if(!isRegen) {
    const seconds=activeMs/1000;
    if(!isCompromised)setQber(qber-(level>=5?channelRules.lateDecay:channelRules.earlyDecay)*seconds,'passiveRecovery');
    const pressure=boss?(boss.status==='fighting'?channelRules.bossDrift[level-1]:0):(phaseConfig().drift||0);
    if(pressure)addQber(pressure*seconds,boss?'bossEnvironment':'environment');
  }
  checkChannelCritical();
  return activeMs;
}

function channelBriefingStatus() {
  const remaining=Math.max(0,keyReadyAt-gameTime)/1000;
  return 'QBER '+qber.toFixed(1)+'% · R '+(isRegen?'RENOVANDO':remaining>0?remaining.toFixed(1)+' s':'PRONTA');
}

function bossRecoveryAvailable() {
  if(!boss||boss.status!=='fighting'||isRegen||gameTime<keyReadyAt)return false;
  const m=boss.model;
  return m.elapsed>=m.recoveryStart && m.period-m.elapsed>=regenDuration+channelRules.reactionMarginMs;
}
function renderChannelWarning() {
  const visible=isRegen||isCompromised||qber>=channelRules.alert;
  $('keyStatus').hidden=visible;$('warning').hidden=!visible;
  if(isRegen)showWarning('RENOVANDO · '+Math.max(0,(regenEnd-gameTime)/1000).toFixed(1)+' s<br>Parado e sem disparar','transparent','#91c7ff','regen');
  else if(isCompromised)showWarning('INVERTIDOS · '+Math.max(0,(compEnd-gameTime)/1000).toFixed(1)+' s<br>'+(gameTime>=keyReadyAt?'R pronta para renovar':'R em '+((keyReadyAt-gameTime)/1000).toFixed(1)+' s'),'transparent','#ef7976','compromised');
  else if(visible)showWarning('QBER '+(qber>qberLimit?'CRÍTICO':'ALTO')+' · '+(gameTime>=keyReadyAt?'R pronta':'R '+((keyReadyAt-gameTime)/1000).toFixed(1)+' s'),'transparent','#e6c491','channel');
  else $('warning').style.display='none';
}

// Perturbação anunciada e independente das salvas físicas. A mira trava ao aparecer.
function updateBossChannel() {
  if(!boss||boss.status!=='fighting')return;
  const m=boss.model;
  if(boss.jamRound!==m.round && m.elapsed>=m.openingStart+400) {
    const lane=occupiedShipLane();
    boss.channelPulse={lanes:[lane-1,lane,lane+1].filter(l=>l>=0&&l<numLanes),releaseAt:m.time+channelRules.jamWarningMs,fired:false};
    boss.jamRound=m.round;campaignMetrics?.count('channelPulses');gameAudio.sfx('interference');
  }
  const pulse=boss.channelPulse;
  if(!pulse||pulse.fired||m.time<pulse.releaseAt)return;
  pulse.fired=true;
  if(!noImpact()&&shipOverlapsLanes(pulse.lanes)) {
    campaignMetrics?.count('channelPulseContacts');
    addQber(level>=5?channelRules.jamLateQber:channelRules.jamEarlyQber,'bossJammer');
    gameAudio.sfx('noise',{pan:audioPan(shipCenterX())});
  }
}
function drawBossChannel() {
  const pulse=boss?.channelPulse;if(!pulse||boss.status!=='fighting')return;
  const remaining=pulse.releaseAt-boss.model.time;if(remaining < -350)return;
  const fired=remaining<=0,top=shipY-90,bottom=earthTop;
  ctx.save();ctx.setLineDash(fired?[]:[3,8]);ctx.strokeStyle='#e6c49188';ctx.fillStyle=fired?'#e6c49126':'#e6c49108';
  for(const lane of pulse.lanes){const x=lane*laneWidth;ctx.fillRect(x+3,top,laneWidth-6,bottom-top);ctx.strokeRect(x+3,top,laneWidth-6,bottom-top);}
  ctx.fillStyle='#e6c491';ctx.textAlign='center';ctx.font='10px Consolas,monospace';
  ctx.fillText(fired?'PERTURBAÇÃO DO CANAL':'RUÍDO · '+(level>=5?'3':'2,5')+'% · '+(remaining/1000).toFixed(1)+' s',width/2,top-10);
  ctx.restore();
}
