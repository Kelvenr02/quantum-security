/* Recursos e retomadas da sessão. Tempos salvos são durações, nunca relógios antigos. */
const resourceRules=Object.freeze({hadamardMs:5000,hadamardMaxMs:7000,correction:4,correctionCooldownMs:2000,
  waveEarlyMs:8500,waveLateMs:8000,bossBeaconMs:900,repair:1,cleanRepair:1});
let bossCheckpointData=null,lastFailure=null,lastReward=null,combatNotice=null;
let lastHUDChannel='safe',lastHUDReady=true;
let developerReviveState=null;

function captureCheckpoint(kind='wave') {
  return Object.freeze({kind,level,score,combatScore,missed,quantumCollected,seed:campaignSeed,
    random:campaignRandom.snapshot(),
    encounterVersion:EncounterDirector.version,variant:encounterDirector?.variant??0,goals:phaseGoals?.snapshot(),
    channel:Object.freeze(channelCheckpoint()),hullShield,
    hullGraceRemaining:Math.max(0,hullInvulUntil-gameTime),hadamardRemaining:Math.max(0,superpositionUntil-gameTime),
    pilot:Object.freeze({position:shipPosition(),lane:shipPilot.lane,from:shipPilot.from,elapsed:shipPilot.elapsed})});
}
function restoreResources(saved) {
  hullShield=saved.hullShield??1;hullInvulUntil=gameTime+(saved.hullGraceRemaining||0);
  superpositionUntil=gameTime+(saved.hadamardRemaining||0);
  if(saved.pilot){shipPilot.reset(saved.pilot.lane);Object.assign(shipPilot,saved.pilot);currentLane=shipPilot.lane;}
  updateShieldHUD();
}
function protectBossRegen(m) {
  if(!isRegen)return;
  const safe=m.lanes.filter(l=>!m.pulses[0].lanes.includes(l));
  const remainingMove=shipPilot.moving?OrbitalArena.stepMs-shipPilot.elapsed:0;
  const travel=remainingMove+Math.min(...safe.map(l=>Math.abs(l-shipPilot.lane)))*OrbitalArena.stepMs;
  m.delayRound(Math.max(0,regenEnd-gameTime+travel+channelRules.reactionMarginMs-(m.pulses[0].at-m.time)));
}
function resetResourceFeedback() {
  combatNotice=null;lastFailure=null;lastReward=null;
  developerReviveState=null;$('btnDevRevive').hidden=true;
  lastHUDChannel=channelStateName();lastHUDReady=!isRegen&&gameTime>=keyReadyAt;
  $('phaseFeedback').hidden=true;$('bossFeedback').hidden=true;$('retrySummary').hidden=true;
}
function notifyCombat(text,priority=0) {
  if(combatNotice&&combatNotice.until>gameTime&&combatNotice.priority>priority)return;
  combatNotice={text,priority,until:gameTime+1800};
}
function refreshCombatHUD() {
  updateQberUI();renderChannelWarning();
  const state=channelStateName(),ready=!isRegen&&gameTime>=keyReadyAt;
  if(lastHUDChannel==='safe'&&['unstable','critical'].includes(state))gameAudio.sfx('channelAlert');
  if(ready&&!lastHUDReady){gameAudio.sfx('keyReady');notifyCombat('R PRONTA · renove em um respiro');}
  lastHUDChannel=state;lastHUDReady=ready;
  $('powerStatus').textContent=gameTime<superpositionUntil?'H '+((superpositionUntil-gameTime)/1000).toFixed(1)+' s':'H —';
  $('powerStatus').dataset.active=String(gameTime<superpositionUntil);
  const urgent=boss?.status==='fighting'&&boss.model.pulses.some(p=>!p.fired&&!p.tracking&&p.at-boss.model.time<900);
  const channelUrgent=boss?.channelPulse&&!boss.channelPulse.fired&&boss.channelPulse.releaseAt-boss.model.time<900;
  flushScienceCue(urgent||channelUrgent);
  for(const [id,visible]of [['phaseFeedback',!boss],['bossFeedback',!!boss]]){
    const el=$(id),show=visible&&!urgent&&!(combatNotice?.priority===-1&&scienceCueUnsafe(urgent||channelUrgent))&&combatNotice&&combatNotice.until>gameTime;
    el.hidden=!show;if(show){el.textContent=controlText(combatNotice.text);el.dataset.priority=combatNotice.priority;}
  }
}
function retryCheckpoint() {
  if(isPlaying||finale)return;
  if(lastFailure?.mode!=='boss'||!bossCheckpointData||bossCheckpointData.level!==level){retryPhase();return;}
  const saved=bossCheckpointData,wave=phaseCheckpointData;
  startGame(saved);phaseCheckpointData=wave;
  beginBoss(true);
  campaignMetrics?.event('checkpointRetry',{kind:'boss'});
}
function developerRevive() {
  if(isPlaying||finale||!lastFailure||!developerReviveState||$('btnDevRevive').disabled)return;
  const saved=developerReviveState,cause=lastFailure.cause;
  developerReviveState=null;boss=saved.boss;lastFailure=null;
  missed=0;hullShield=1;isRegen=false;isCompromised=false;regenEnd=0;compEnd=0;keyReadyAt=gameTime;
  hullInvulUntil=gameTime+3000;invulUntil=gameTime+3000;criticalGraceUntil=gameTime+3000;
  if(campaignMetrics){
    campaignMetrics.data.outcome='playing';campaignMetrics.data.developerAssisted=true;
    campaignMetrics.count('developerRevives');campaignMetrics.event('developerRevive',{cause});
  }
  campaignJourney.developerAssisted=true;campaignJourney.developerRevives++;
  syncCampaignIdentity();saveCampaignIdentity();
  setQber(0,'developerRevive');clearMovementInput();
  isPlaying=true;isPaused=false;isStageBriefing=false;combatNotice=null;
  lastHUDChannel='safe';lastHUDReady=true;
  $('ui').style.display='none';$('btnDevRevive').hidden=true;
  $('btnRetry').hidden=true;$('btnRetryPhase').hidden=true;$('retrySummary').hidden=true;
  $('pauseOverlay').hidden=true;$('phaseOverlay').hidden=true;
  $('pauseBtn').disabled=false;$('pauseBtn').innerHTML='Ⅱ <span>PAUSAR</span>';
  $('bossHud').hidden=!boss;$('phaseHud').hidden=!!boss;
  gameAudio.stopEffects();gameAudio.setPaused('game',false);gameAudio.setScene(boss?'boss':'phase',level);gameAudio.sfx('confirm');
  if(boss)gameAudio.setBossStage(boss.model.stage,{announce:false});
  updateShieldHUD();updateHUD();refreshCombatHUD();if(boss)updateBossHUD();
  refreshArenaBounds();
  notifyCombat('DESENVOLVEDOR · renascido com proteção por 3 s',2);
  canvas.focus({preventScroll:true});lastTs=0;cancelAnimationFrame(rafId);rafId=requestAnimationFrame(update);
}
function defeatAdvice(cause) {
  if(cause.kind==='earth')return 'Priorize os meteoros mais próximos da Terra. Drones e ruído podem esperar se um impacto encerrar a missão.';
  if(cause.kind==='bossSalvo')return 'A salva '+(cause.attack||'do chefe')+' causou dano físico. Antecipe a troca de corredor; R não protege de salvas.';
  if(cause.kind==='collision')return 'A nave estava sem escudo. Desvie das rochas em rota de colisão; R imobiliza e não oferece proteção física.';
  return 'Observe o próximo ataque e preserve uma rota de fuga antes de continuar atirando.';
}
function showRetryOptions(mode) {
  const saved=mode==='boss'?bossCheckpointData:phaseCheckpointData;
  $('btnRetry').hidden=!saved;
  $('btnRetry').textContent=mode==='boss'?'RETOMAR NO CHEFE →':'REPETIR FASE '+level+' →';
  $('btnRetryPhase').hidden=mode!=='boss';
  $('retrySummary').hidden=!saved;
  if(saved){
    const wait=saved.channel.cooldownRemaining/1000;
    $('retrySummary').textContent=(mode==='boss'?'Chefe reinicia com vida completa. ':'A fase reinicia. ')+
      'Estado salvo: '+saved.missed+'/12 impactos · escudo '+saved.hullShield+' · QBER '+saved.channel.qber.toFixed(1)+'% · R '+(wait>0?wait.toFixed(1)+' s':'pronta')+'.';
  }
}
if(typeof module!=='undefined'&&module.exports)module.exports={resourceRules};
