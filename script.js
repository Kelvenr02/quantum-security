let arcadeActive = false;   // só aceita teclas quando o jogo da defesa está na tela
const $ = id => document.getElementById(id);
const canvas = $('game'), ctx = canvas.getContext('2d');

// ---------- Configuração ----------
const FRAME_MS = GameRules.frameMs;
const numLanes = OrbitalArena.lanes, winScore = GameRules.charge, maxMisses = GameRules.maxImpacts, maxLevel = missionPhases.length;
const shotCooldown = GameRules.shotCooldownMs;
let shipSize = 25;
const cloudSpeed = 3.5, spySpeed = 3.5;
const cloudGapMin = 60, cloudGapMax = 200;

// Os parâmetros e conceitos de cada fase estão em phases.js.
const qberLimit = channelRules.limit, qberMaxView = channelRules.max;
const cloudQber = 3.5, spyQber = 7;
const regenDuration = GameRules.regenMs, regenCooldown = GameRules.regenCooldownMs;
const compromisedDuration = GameRules.compromisedMs;

// Cenário
const earthVisible = 80;             // altura da Terra visível na base da tela (px)
const earthGlow = 34;                // folga acima da Terra para o brilho da atmosfera
const hatchFlashMs = 450;            // tempo que a escotilha da nave-mãe brilha ao lançar algo

// Final com o canhão de energia (tempos em milissegundos)
const T_MOVE = 1200;                 // nave desliza até o canto esquerdo
const T_BEAM = 3800;                 // o canhão dispara
const T_BOOM = 4600;                 // o feixe atinge e a nave-mãe explode
const T_END  = 7600;                 // aparece a tela de vitória

// ---------- Estado ----------
let width, height, laneWidth, shipY, earthTop, earthSprite = null;
let isPlaying = false, rafId = null, lastTs = 0, gameTime = 0;
let score, missed, level, currentLane, qber;
let isRegen, regenEnd, keyReadyAt, isCompromised, compEnd, invulUntil, criticalGraceUntil;
let nextCloudAt, nextSpyAt, lastShotTime, bannerUntil;
let lasers = [], asteroids = [], clouds = [], spies = [], stars = [];
let hatchFlash = [], impacts = [];
let finale = null;                   // diferente de null enquanto o final está rodando
let campaignMetrics=null;
const previousCampaigns=[];
let campaignRandom=new CampaignRandom();
let arenaBounds={top:0,warningY:180};
function refreshArenaBounds() {
  const canvasTop=canvas.getBoundingClientRect?.().top||0;
  const fallback=height<=620?(width>=height?90:210):width<=900?250:170;
  const bottoms=[$('channelHud'),$('hudDisplay'),$('phaseHud'),$('bossHud')].filter(Boolean)
    .filter(el=>!el.hidden).map(el=>el.getBoundingClientRect?.()).filter(r=>r?.height>0).map(r=>r.bottom-canvasTop);
  const top=(bottoms.length?Math.max(...bottoms):fallback)+6;
  arenaBounds={top,warningY:Math.min(shipY-60,top+16)};
}
const shipPilot=new LanePilot(numLanes,lane=>{
  campaignMetrics?.count('laneChanges');
  gameAudio.sfx('move',{pan:audioPan((lane+.5)*laneWidth)});
});

function syncShipPilot() { if(shipPilot.lane!==currentLane)shipPilot.reset(currentLane); }
function shipPosition() { syncShipPilot();return shipPilot.position; }
function shipCenterX() { return (shipPosition()+.5)*laneWidth; }
function occupiedShipLane() { return Math.max(0,Math.min(numLanes-1,Math.round(shipPosition()))); }
function shipOverlapsLanes(lanes) {
  const x=shipCenterX(),radius=shipSize*.6;
  return lanes.some(lane=>x+radius>lane*laneWidth+3&&x-radius<(lane+1)*laneWidth-3);
}
function shipTouches(entity,previousY,previousShipX,shipX,radius,previousEntityX=entity.x) {
  const x=previousEntityX-previousShipX,y=previousY-shipY;
  const dx=(entity.x-shipX)-x,dy=(entity.y-shipY)-y;
  const t=Math.max(0,Math.min(1,-(x*dx+y*dy)/(dx*dx+dy*dy||1)));
  return Math.hypot(x+dx*t,y+dy*t)<radius;
}
function gameMode(){return resolveGameMode({arcade:arcadeActive,playing:isPlaying,paused:isPaused,briefing:isStageBriefing,finale:!!finale,boss:!!boss,failure:!!lastFailure,victory:campaignMetrics?.data.outcome==='victory',training:introActive,settings:settingsOpen});}
function combatRunning(){return ['wave','boss'].includes(gameMode());}
function runtimePreferences(){return {keys:{...accessPreferences.keys},reading:accessPreferences.reading,effects:accessPreferences.effects,reducedEffects:reducedEffects()};}
function clearMovementInput() { shipPilot.clear(); }
function pressMovement(token,direction,source=null) {
  if(!combatRunning()||isRegen)return;
  campaignMetrics?.input(source||(token.startsWith('key:')?'keyboard':token.startsWith('pointer:')?'touch':token.startsWith('button:')?'button':'simulation'));
  syncShipPilot();shipPilot.press(token,direction,isCompromised);currentLane=shipPilot.lane;
}
function setQber(value,source) {const next=Math.max(0,Math.min(qberMaxView,value));campaignMetrics?.qberChange(source,qber,next);qber=next;}
window.quantumDiagnostics=Object.freeze({
  snapshot:()=>campaignMetrics?.snapshot({score,combatScore,level,missed,qber,channel:channelStateName(),guardians:bossesDefeated,mode:gameMode(),viewport:{width,height},preferences:runtimePreferences(),goals:phaseGoals?.snapshot(),variant:encounterDirector?.variant})??null,
  previous:()=>JSON.parse(JSON.stringify(previousCampaigns)),
  export:()=>JSON.stringify(window.quantumDiagnostics.snapshot(),null,2),
  playtest:()=>JSON.stringify({version:1,attempts:[...previousCampaigns,window.quantumDiagnostics.snapshot()].filter(Boolean)},null,2)
});

function resizeCanvas() {
  // Some browser viewport transitions briefly report a 1×1 or zero-sized surface.
  if (window.innerWidth <= 1 || window.innerHeight <= 1) return;
  const previousWidth = width, previousHeight = height;
  width = Math.min(window.innerWidth, OrbitalArena.maxWidth); height = window.innerHeight;
  if(campaignMetrics&&previousWidth&&(previousWidth!==width||previousHeight!==height))campaignMetrics.event('viewportChanged',{width,height});
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
  canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  laneWidth = width / numLanes;
  shipSize=Math.min(25,laneWidth*.38);
  if (previousWidth && previousHeight) {
    const xScale = width/previousWidth, yScale = height/previousHeight;
    const speedScale = OrbitalArena.flightScale(height)/OrbitalArena.flightScale(previousHeight);
    const shortTransition=height<620||previousHeight<620;
    // Mantém o tempo de aproximação ao girar: altura reservada à base é fixa.
    const scaleY=y=>shortTransition?(height-140)-(previousHeight-140-y)*speedScale:y*yScale;
    for (const entity of [...lasers,...asteroids,...clouds,...spies,...pickups,...drones,...(scout?[scout]:[])]) {
      entity.x *= xScale; entity.y = scaleY(entity.y);
      for(const key of ['fromX','toX'])if(entity[key]!==undefined)entity[key]*=xScale;
      if(entity.splitY!==undefined)entity.splitY=scaleY(entity.splitY);
      if (entity.baseX !== undefined) entity.baseX *= xScale;
      if (entity.speed !== undefined) entity.speed *= speedScale;
    }
    asteroids.forEach(a => {a.radius=Math.min(32,laneWidth*.3)*(a.fragment?.58:1)});
    drones.forEach(d=>{d.radius=Math.min(23,laneWidth*.32)});
    if(shortTransition){
      drones.forEach(d=>{d.y=Math.min(height-200,Math.max(270,height*.36));});
      if(scout)scout.y=Math.min(height-205,Math.max(260,height*.33));
    }
    clouds.forEach(c => {c.radius=Math.min(38,laneWidth*.35);if(shortTransition&&c.heldAt)c.y=height-156;});
    spies.forEach(p => {p.radius=laneWidth*.22});
    impacts.forEach(i => {i.x*=xScale});
    if (interferenceFront) {interferenceFront.y=scaleY(interferenceFront.y);if(interferenceFront.followUp)interferenceFront.followUp.y=scaleY(interferenceFront.followUp.y);}
    if (finale) {finale.fromX*=xScale;finale.parts.forEach(p=>{p.x*=xScale;p.y*=yScale})}
  }
  earthTop = height - earthVisible; shipY = height - 140;
  stars = Array.from({length:65}, () => ({ x:Math.random()*width, y:Math.random()*height, size:.3+Math.random()*.9, speed:.08+Math.random()*.25 }));
  spaceBackdrop = makeSpaceBackdrop(width,height);
  $('qberMark').style.left = (qberLimit/qberMaxView*100) + '%';
  buildEarth();
  refreshArenaBounds();
  if (arcadeActive && !isPlaying && !finale) drawBackground(0);
}
window.addEventListener('resize', resizeCanvas);

// ---------- Terra (desenhada uma vez numa imagem e reaproveitada a cada quadro) ----------
function buildEarth() {
  const R = width * 2.5, cx = width / 2, top = earthGlow, cy = top + R;
  const c = document.createElement('canvas'); c.width = width; c.height = earthVisible + earthGlow;
  const g = c.getContext('2d'), rnd = seededRandom(11);
  const halo = g.createRadialGradient(cx,cy,R-4,cx,cy,R+earthGlow);
  halo.addColorStop(0,'rgba(120,235,218,.42)'); halo.addColorStop(.25,'rgba(64,155,180,.12)'); halo.addColorStop(1,'rgba(30,100,160,0)');
  g.fillStyle=halo; g.beginPath();g.arc(cx,cy,R+earthGlow,0,Math.PI*2);g.fill();
  g.save();g.beginPath();g.arc(cx,cy,R,0,Math.PI*2);g.clip();
  const ocean=g.createLinearGradient(0,top,0,c.height);ocean.addColorStop(0,'#215068');ocean.addColorStop(.3,'#112e43');ocean.addColorStop(1,'#071423');g.fillStyle=ocean;g.fillRect(0,0,c.width,c.height);
  for(let i=0;i<17;i++){const x=rnd()*width,y=top+15+rnd()*earthVisible,rx=25+rnd()*95,ry=6+rnd()*12;g.fillStyle='#477b762a';g.beginPath();for(let j=0;j<12;j++){const a=j/12*Math.PI*2,r=.55+rnd()*.45;const px=x+Math.cos(a)*rx*r,py=y+Math.sin(a)*ry*r;j?g.lineTo(px,py):g.moveTo(px,py)}g.closePath();g.fill();for(let j=0;j<8;j++){g.fillStyle='rgba(221,195,144,'+(.1+rnd()*.45)+')';g.fillRect(x+(rnd()-.5)*rx,y+(rnd()-.5)*ry,.7+rnd(),.6+rnd())}}
  g.strokeStyle='#bbdce619';g.lineWidth=2;for(let i=0;i<10;i++){const x=rnd()*width,y=top+rnd()*earthVisible;g.beginPath();g.ellipse(x,y,30+rnd()*130,2+rnd()*6,-.08,0,Math.PI);g.stroke()}
  g.restore();g.strokeStyle='#88d8d285';g.lineWidth=1.2;g.beginPath();g.arc(cx,cy,R,0,Math.PI*2);g.stroke();earthSprite=c;
}

resizeCanvas();
if(typeof ResizeObserver!=='undefined') {
  const hudObserver=new ResizeObserver(refreshArenaBounds);
  for(const id of ['channelHud','hudDisplay','phaseHud','bossHud'])hudObserver.observe($(id));
}

// ---------- Entrada ----------
window.addEventListener('keydown', e => {
  if (typeof settingsOpen!=='undefined'&&settingsOpen) return;
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  if (!arcadeActive) return;
  if(e.code==='Enter' && e.target?.closest?.('summary'))return;
  if(e.code==='Enter'&&e.repeat){e.preventDefault();return;}
  if(e.target?.closest?.('input,textarea,select,[contenteditable="true"]'))return;
  if(e.code==='Enter' && e.target?.closest?.('button,a,input'))return;
  if (['ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
  // ENTER inicia / reinicia o jogo quando o menu está aberto (e não durante o final)
  if (e.code === 'Enter' && !isPlaying && !finale) {
    e.preventDefault();
    if(lastFailure&&!$('btnRetry').disabled)retryCheckpoint();
    else if (!$('btnStart').disabled) startGame();
    return;
  }
  if (isStageBriefing) { if (e.code === 'Enter') { e.preventDefault(); continuePhase(); } return; }
  if (!isPlaying || isPaused) return;
  if (regenerationKey(e.code)) {e.preventDefault();tryRegen('keyboard');}
  if (movementDirection(e.code)) { e.preventDefault();pressMovement('key:'+e.code,movementDirection(e.code)); }
});
window.addEventListener('keyup',e=>shipPilot.release('key:'+e.code));

const audioPan = x => width > 0 ? x / width * 1.2 - .6 : 0;
function moveShip(direction,source='simulation') {
  if(!combatRunning()||isRegen)return false;
  syncShipPilot();const moved=shipPilot.move(direction);currentLane=shipPilot.lane;if(moved)campaignMetrics?.input(source);return moved;
}

function tryRegen(source='simulation') {
  if(!combatRunning())return;
  campaignMetrics?.count('regenAttempts');
  if (isRegen || gameTime < keyReadyAt) {campaignMetrics?.count('regenRejected');if(!isRegen)notifyCombat('R RECARREGANDO · '+((keyReadyAt-gameTime)/1000).toFixed(1)+' s');return;}
  campaignMetrics?.count('regenerationsStarted');campaignMetrics?.event('regen',{qber,emergency:isCompromised});
  campaignMetrics?.input(source,'regen');campaignMetrics?.milestone('regen',{input:source,qber,recovery:bossRecoveryAvailable()||waveRecoveryAvailable()});
  if(qber>0&&(bossRecoveryAvailable()||waveRecoveryAvailable()))recordPhaseGoal('regenInRecovery');
  if(isCompromised)campaignMetrics?.count('emergencyRegenerations');
  isCompromised=false;compEnd=0;
  isRegen = true; regenEnd = gameTime + regenDuration; keyReadyAt = gameTime + regenCooldown;
  queueScienceCue('renew');
  gameAudio.startLoop('regen');
}

// ---------- Fluxo ----------
function startGame(checkpoint = null) {
  if (isPlaying || !arcadeActive) return; // evita dois loops ao mesmo tempo
  gameAudio.stopEffects(); gameAudio.setPaused('game', false); gameAudio.setScene('phase', checkpoint?.level || 1); gameAudio.sfx('confirm');
  cancelAnimationFrame(rafId);
  finale = null;
  canvas.focus({preventScroll:true});
  $('ui').style.display = 'none'; $('warning').style.display = 'none';
  isPlaying = true; isPaused = false; $('pauseOverlay').hidden = true; particles = []; $('pauseBtn').disabled = false; $('pauseBtn').innerHTML = 'Ⅱ <span>PAUSAR</span>';
  score = 0; combatScore=0; campaignSeed=checkpoint?.seed??Math.floor(Math.random()*4294967296); missed = 0; level = 1; currentLane = Math.floor(numLanes/2); qber = 0;
  campaignRandom=new CampaignRandom(campaignSeed,checkpoint?.random);
  encounterOverride=checkpoint?{phase:checkpoint.level,variant:checkpoint.variant??0}:null;
  beginCampaignJourney(checkpoint);
  if(campaignMetrics) {previousCampaigns.push(campaignMetrics.snapshot());if(previousCampaigns.length>20)previousCampaigns.shift();}
  campaignMetrics=new CampaignMetrics({lanes:numLanes,stepMs:OrbitalArena.stepMs,width,height,seed:campaignSeed,randomVersion:CampaignRandom.version,encounterVersion:EncounterDirector.version},checkpoint?.level||1);
  campaignMetrics.data.configuration.preferences=runtimePreferences();
  syncCampaignIdentity();$('campaignResult').hidden=true;$('phaseFinalReport').hidden=true;
  campaignMetrics.data.entry={phase:checkpoint?.level||1,kind:checkpoint?.kind||'wave'};
  campaignMetrics.event('campaignStart',{checkpoint:!!checkpoint});
  shipPilot.reset(currentLane);
  isRegen = false; isCompromised = false; regenEnd = 0; compEnd = 0; keyReadyAt = 0; invulUntil = 0; criticalGraceUntil=0;
  gameTime = 0; lastTs = 0; lastShotTime = -1000;
  nextCloudAt = 3500; nextSpyAt = 12000; bannerUntil = 2000;
  lasers = []; asteroids = []; clouds = []; spies = [];
  hatchFlash = Array(numLanes).fill(null); impacts = [];
  resetQuantumMission();
  if (checkpoint) {
    level=checkpoint.level;score=checkpoint.score;missed=checkpoint.missed;
    bossesDefeated=level-1;bossCleared=bossCleared.map((_,i)=>i<level-1);
    quantumCollected=checkpoint.quantumCollected||0;combatScore=checkpoint.combatScore||0;
    restoreChannel(checkpoint.channel);
    phaseCheckpointData=checkpoint.kind==='boss'?null:checkpoint;restoreResources(checkpoint);
  }
  resetEncounters();
  phaseGoals=new PhaseGoals(level,checkpoint?.goals,!checkpoint||checkpoint.kind==='wave');lastPhaseReport=null;
  if(!checkpoint)phaseCheckpointData=captureCheckpoint('wave');
  resetResourceFeedback();$('btnRetryPhase').hidden=true;
  resetScienceCues();
  updateHUD(); refreshCombatHUD();refreshArenaBounds();
  if(!checkpoint)saveCampaignEntry(phaseCheckpointData);
  rafId = requestAnimationFrame(update);
}

function updateHUD() {
  $('scoreVal').innerText = score; $('missesVal').innerText = missed; $('levelVal').innerText = level;
  $('combatScoreVal').innerText = combatScore;
  $('missesVal').parentElement?.setAttribute?.('data-critical',String(missed>=maxMisses-3));
  $('winVal').innerText = winScore;
  $('cannonVal').innerText = Math.min(100, Math.round(score/winScore*100));
  $('chargeFill').style.width = Math.min(100, score/winScore*100) + '%';
  updatePhaseHUD();
}

function updateQberUI() {
  const r = Math.min(1, qber/qberMaxView);
  $('qberVal').innerText = qber.toFixed(1);
  $('qberFill').style.width = (r*100) + '%';
  $('qberFill').style.background = isCompromised ? '#ef7976' : (qber > qberLimit*0.7 ? '#e6c491' : '#6ce8cd');
  const ls = $('linkStatus');
  if (isRegen)  { ls.innerText = 'Canal: renovando chave...'; ls.style.color = '#88bbff'; }
  else if (isCompromised) { ls.innerText = 'Comandos INVERTIDOS'; ls.style.color = '#ff5555'; }
  else if (qber >= channelRules.alert) { ls.innerText = qber>qberLimit?'Canal: CRÍTICO':'Canal: INSTÁVEL'; ls.style.color = '#ffaa00'; }
  else { ls.innerText = 'Canal quântico: seguro'; ls.style.color = '#6ce8cd'; }
  const wait = Math.max(0, (keyReadyAt - gameTime)/1000);
  $('keyStatus').innerHTML = '<kbd>'+keyLabel('regen')+'</kbd> ' + (isRegen?'Renovando...':wait<=0?(isCompromised?'Renovação de emergência':'Renovar chave: pronta'):`Recarga: ${wait.toFixed(1)}s`);
}

function showWarning(html, bg, border, kind='state') {
  const w = $('warning'); w.innerHTML = html; w.style.background = bg; w.style.borderColor = border;
  w.dataset.kind=kind;w.hidden=false;
  w.style.boxShadow = `0 0 20px ${border}`; w.style.display = 'block';
}

// Tela final: sempre oferece "Jogar Novamente" (vitória ou derrota).
// O botão fica bloqueado por 0,8 s para ninguém reiniciar sem querer ao morrer atirando.
function endGame(title, color, html) {
  clearMovementInput();
  gameAudio.stopEffects(); gameAudio.setPaused('game', false);
  finale = null; isStageBriefing = false; $('phaseOverlay').hidden = true;
  boss=null;$('bossHud').hidden=true;$('btnRetry').hidden=true;$('btnRetryPhase').hidden=true;$('retrySummary').hidden=true;
  developerReviveState=null;$('btnDevRevive').hidden=true;
  isPlaying = false; isPaused = false; $('pauseOverlay').hidden = true; cancelAnimationFrame(rafId); $('warning').style.display = 'none';
  const t = $('uiTitle'); t.innerText = title; t.style.color = color; t.style.textShadow = `0 0 10px ${color}`;
  $('uiDesc').innerHTML = html;
  $('uiScience').innerHTML =
    `<b>O que você viu:</b> a Terra e a nave compartilham uma chave gerada com partículas <b>entrelaçadas</b>. ` +
    `A <b>espionagem</b> (pulsos amarelos) perturba as correlações e aumenta a taxa de erro (QBER); o <b>ruído</b> (nuvens) também causa erros, e por isso é difícil separar um do outro. ` +
    `Acima do limite, a chave é descartada e refeita. As fases também exploram <b>H, estados de Bell, decoerência, síndromes e interferência</b> por meio de mecânicas fictícias. O entrelaçamento real não transmite informação mais rápido que a luz.`;
  const b = $('btnStart');
  b.innerText = "Jogar Novamente"; b.disabled = true; b.blur();
  $('btnRetry').disabled=true;$('btnRetryPhase').disabled=true;$('btnDevRevive').disabled=true;
  setTimeout(() => { b.disabled = false;$('btnRetry').disabled=false;$('btnRetryPhase').disabled=false;$('btnDevRevive').disabled=false;if(!isPlaying&&!finale&&arcadeActive)($('btnRetry').hidden?b:$('btnRetry')).focus({preventScroll:true}); }, 800);
  $('missionInstructions').hidden = true; $('pauseBtn').disabled = true;
  $('ui').style.display = 'flex';
  $('campaignResult').textContent=campaignResultLabel();$('campaignResult').hidden=!campaignJourney;
}
function gameOver(reason,cause={}) {
  const reviveBoss=boss;
  const mode=boss?'boss':'wave';lastFailure={mode,cause,reason};
  campaignMetrics?.finish('defeat',{reason,cause,mode,score,combatScore,missed,qber,shield:hullShield});
  endGame('FALHA NA DEFESA','#ff5555',reason+'<br><small>'+defeatAdvice(cause)+'</small><br><br>'+
    'Pontos: <b>'+combatScore+'</b> · Carga: <b>'+score+' / '+winScore+'</b> · Fase <b>'+level+' / '+maxLevel+': '+phaseConfig().name+'</b><br>Impactos na Terra: <b>'+missed+' / '+maxMisses+'</b>');
  gameAudio.setScene('defeat');gameAudio.sfx('explosion',{pan:audioPan(shipCenterX())});gameAudio.sfx('defeat');
  showRetryOptions(mode);$('btnStart').innerText='RECOMEÇAR CAMPANHA';$('menuHint').textContent='ENTER retoma do ponto salvo · Recomeçar campanha volta ao início';
  developerReviveState={boss:reviveBoss};$('btnDevRevive').hidden=false;
}
// A carga e a vitória no oitavo desafio liberam o canhão.
function gameWin() { startFinale(); }

// Tela de vitória mostrada depois do final
function showVictory() {
  lastFailure=null;$('menuHint').textContent='ou aperte ENTER';
  endGame("A TERRA ESTÁ SALVA! 🎉", "#55ff55",
    `<b>O canhão disparou!</b><br><br>Você neutralizou os oito guardiões, protegeu a Terra e liberou o disparo contra a nave-mãe.<br><br>Desafios concluídos: <b>${bossesDefeated} / ${maxLevel}</b> · Cápsulas coletadas: <b>${quantumCollected}</b><br>Pontos: <b>${combatScore}</b> · Carga: <b>${score} / ${winScore}</b> · Impactos atuais: <b>${missed} de ${maxMisses} permitidos</b>`);
  gameAudio.setScene('victory'); gameAudio.sfx('victory');
  $('phaseFinalReport').hidden=!lastPhaseReport;
  if(lastPhaseReport)$('phaseFinalReport').textContent=lastPhaseReport.text+' Medalhas da campanha: '+(campaignJourney.awards||[]).filter(Boolean).length+'/8.';
}

// ---------- Final: canhão de energia da Terra ----------
function startFinale() {
  clearCompletedCampaign();
  campaignMetrics?.finish('victory',{score,combatScore,missed,guardians:bossesDefeated});clearMovementInput();
  gameAudio.stopLoop('regen'); gameAudio.setScene('finale');
  isPlaying = false; cancelAnimationFrame(rafId); $('pauseBtn').disabled = true;
  $('warning').style.display = 'none';
  lasers = []; asteroids = []; drones=[];scout=null; clouds = []; spies = []; pickups = []; interferenceFront = null; superpositionUntil = 0;
  $('quantumStatus').textContent = 'CANHÃO ORBITAL · CARGA COMPLETA';
  isRegen = false; isCompromised = false; qber = 0; updateQberUI();
  finale = { t: 0, fromX: shipCenterX(), boomed: false, chargeSound: false, beamSound: false, parts: [] };
  lastTs = 0;
  rafId = requestAnimationFrame(finaleLoop);
}

function finaleLoop(ts) {
  if (!finale) return;
  if (gameAudio.pauses?.has('hidden')) { lastTs = 0; rafId = requestAnimationFrame(finaleLoop); return; }
  if (!lastTs) lastTs = ts;
  const dt = Math.min((ts - lastTs)/FRAME_MS, 3); lastTs = ts;
  gameTime += dt*FRAME_MS; finale.t += dt*FRAME_MS;
  const t = finale.t, cx = width/2, tipY = baseTipY(), top = hullBottom(cx);

  // Som e imagem usam as mesmas marcações, uma vez por evento.
  if (t >= T_MOVE && t < T_BEAM) {
    if (!finale.chargeSound) { finale.chargeSound = true; gameAudio.startLoop('charge'); }
    gameAudio.setLoopPitch('charge', .7 + (t - T_MOVE) / (T_BEAM - T_MOVE) * 1.8);
  }
  if (t >= T_BEAM && !finale.beamSound) {
    finale.beamSound = true; gameAudio.stopLoop('charge'); gameAudio.sfx('cannon'); gameAudio.startLoop('beam');
  }

  // a nave desliza até o canto esquerdo e fica fixa lá
  const k = Math.min(1, t/T_MOVE), ease = k*k*(3-2*k);
  const shipX = finale.fromX + (shipSize*2.2 - finale.fromX)*ease;

  // explosão da nave-mãe
  if (t >= T_BOOM && !finale.boomed) {
    finale.boomed = true;
    gameAudio.stopLoop('beam'); gameAudio.sfx('mothership');
    for (let i = 0; i < (reducedEffects()?0:120); i++) {
      const a = Math.random()*Math.PI*2, v = 1 + Math.random()*6;
      finale.parts.push({ x: cx + (Math.random()-.5)*width*0.5, y: top - 10,
        vx: Math.cos(a)*v, vy: Math.abs(Math.sin(a))*v*0.6, life: 1, hue: Math.random()*50 });
    }
  }

  ctx.save();
  if (!reducedEffects() && t > T_BEAM && t < T_BOOM + 1500) ctx.translate((Math.random()-.5)*7, (Math.random()-.5)*7);  // tremor
  drawBackground(dt);
  drawLink(shipX);
  drawShip(shipX, "#00ffff", false);

  // carga do canhão
  if (t > T_MOVE && t < T_BEAM) {
    const c = (t - T_MOVE)/(T_BEAM - T_MOVE), r = 4 + 30*c;
    ctx.save(); ctx.shadowBlur = 20 + 40*c; ctx.shadowColor = "#0ff"; ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(cx, tipY, r*(reducedEffects()?1:(0.9 + 0.1*Math.random())), 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#7ff";
    for (let i = 0; i < (reducedEffects()?0:8); i++) {                       // faíscas sendo sugadas para o canhão
      const a = i*Math.PI/4 + t/200, d = 90*(1 - ((t/500 + i/8) % 1));
      ctx.beginPath(); ctx.arc(cx + Math.cos(a)*d, tipY + Math.sin(a)*d, 3, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }

  // feixe de energia
  if (t >= T_BEAM && t < T_BOOM + 1400) {
    const g = Math.min(1, (t - T_BEAM)/500);
    const fade = t > T_BOOM + 800 ? Math.max(0, 1 - (t - T_BOOM - 800)/600) : 1;
    const frontY = tipY - (tipY - top)*g, w = laneWidth*1.1*g*fade*(0.9 + 0.1*Math.random());
    ctx.save(); ctx.shadowBlur = 40; ctx.shadowColor = "#0ff";
    ctx.fillStyle = "rgba(0,255,255,.55)"; ctx.fillRect(cx - w/2, frontY, w, tipY - frontY);
    ctx.fillStyle = "#fff"; ctx.fillRect(cx - w*0.25, frontY, w*0.5, tipY - frontY);
    ctx.restore();
  }

  // nave-mãe (pisca ao ser atingida e some após a explosão)
  if (!finale.boomed && (reducedEffects() || t < T_BEAM + 500 || Math.random() < 0.7)) drawMothership();

  // fragmentos da explosão
  for (const p of finale.parts) {
    p.x += p.vx*dt; p.y += p.vy*dt; p.vy += 0.05*dt; p.life -= 0.012*dt;
    if (p.life > 0) {
      ctx.fillStyle = `hsla(${p.hue},100%,60%,${p.life})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, 2 + 4*p.life, 0, Math.PI*2); ctx.fill();
    }
  }
  ctx.restore();

  // clarão branco da explosão
  if (t >= T_BOOM && t < T_BOOM + 600) {
    if(!reducedEffects()){ctx.fillStyle = `rgba(255,255,255,${1 - (t - T_BOOM)/600})`; ctx.fillRect(0, 0, width, height);}
  }

  // textos
  ctx.save(); ctx.textAlign = "center"; ctx.font = "500 " + Math.min(28,width/22) + "px Segoe UI, sans-serif";
  if (t > T_MOVE && t < T_BEAM) {
    const pct = Math.round((t - T_MOVE)/(T_BEAM - T_MOVE)*100);
    ctx.fillStyle = "#0ff"; ctx.fillText(`⚡ CANHÃO CARREGANDO... ${pct}%`, width/2, height/3);
  } else if (t >= T_BEAM && t < T_BOOM + 800) {
    ctx.fillStyle = "#fff"; ctx.fillText("🔥 FOGO!", width/2, height/3);
  } else if (t >= T_BOOM + 800) {
    ctx.fillStyle = "#55ff55"; ctx.fillText("NAVE-MÃE DESTRUÍDA!", width/2, height/3);
  }
  ctx.restore();

  if (t >= T_END) { showVictory(); return; }
  rafId = requestAnimationFrame(finaleLoop);
}

// ---------- Ruído e espionagem ----------
function addQber(v,source='unspecified') {
  setQber(qber+v,source);
  checkChannelCritical();
}
const noImpact = () => isRegen || gameTime < invulUntil;

// ---------- Criação de entidades ----------
const laneOf = e => Math.floor(e.x / laneWidth);
const blockedByHazard = lane => [...clouds, ...spies].some(e => laneOf(e) === lane && e.y < 150);
const blockedByAsteroid = lane => asteroids.some(e => laneOf(e) === lane && e.y < 150);
const flashHatch = (lane, color) => { hatchFlash[lane] = { color, until: gameTime + hatchFlashMs }; };

function shuffled(arr) {
  for (let i = arr.length-1; i > 0; i--) { const j = Math.floor(campaignRandom.next('clouds')*(i+1)); [arr[i],arr[j]] = [arr[j],arr[i]]; }
  return arr;
}

function spawnClouds() {
  if (clouds.length > (level>=5?2:0) || noImpact() || gameTime < nextCloudAt) return;
  const free = shuffled([...Array(numLanes).keys()].filter(i => !blockedByAsteroid(i)));
  if (free.length < 2) return;
  const gap = cloudGapMin + campaignRandom.next('clouds')*(cloudGapMax - cloudGapMin);
  clouds.push(makeCloud(free[0], -50), makeCloud(free[1], -50-gap));
  campaignMetrics?.count('cloudsSpawned',2);
  flashHatch(free[0], "#b04dff"); flashHatch(free[1], "#b04dff");
  nextCloudAt = gameTime + phaseConfig().cloudInterval * (.9 + campaignRandom.next('clouds')*.2);
}

function spawnSpies() {            // pulsos espiões: a partir da fase 2
  if (level < 2 || spies.length > 0 || noImpact() || gameTime < nextSpyAt) return;
  const free = [...Array(numLanes).keys()].filter(i => !blockedByHazard(i) && !blockedByAsteroid(i));
  if (!free.length) return;
  const playerLane=occupiedShipLane();
  const l = free.includes(playerLane) && campaignRandom.next('spies')<.6 ? playerLane : free[Math.floor(campaignRandom.next('spies')*free.length)];
  spies.push({ x: l*laneWidth + laneWidth/2, y: -40, radius: laneWidth*0.22, speed: flightSpeed(spySpeed + (level-2)*.12) });
  campaignMetrics?.count('spiesSpawned');
  flashHatch(l, "#ffd21f");
  nextSpyAt = gameTime + phaseConfig().spyInterval * (.9 + campaignRandom.next('spies')*.2);
}

function fireLaser(x) {
  if (gameTime - lastShotTime < shotCooldown) return;
  gameAudio.sfx('shot', { pan: audioPan(x) });
  lasers.push({ x, y: shipY - shipSize, radius: 4 });
  let shots=1;
  if (gameTime < superpositionUntil) {
    for (const offset of [-1,1]) {const adjacent=x+offset*laneWidth;if(adjacent>=laneWidth/2&&adjacent<=width-laneWidth/2){lasers.push({ x:adjacent, y:shipY-shipSize, radius:4, quantum:true });shots++;}}
  }
  campaignMetrics?.count('volleys');campaignMetrics?.count('shots',shots);
  lastShotTime = gameTime;
}

// ---------- Desenho: cenário ----------
function drawBackground(dt) {
  if(spaceBackdrop)ctx.drawImage(spaceBackdrop,0,0);else{ctx.fillStyle='#070d17';ctx.fillRect(0,0,width,height)}
  stars.forEach(s=>{s.y+=s.speed*(reducedEffects()?0:dt);if(s.y>height)s.y=0;ctx.fillStyle='rgba(204,231,235,.45)';ctx.beginPath();ctx.arc(s.x,s.y,s.size,0,Math.PI*2);ctx.fill()});
  ctx.lineWidth=1;ctx.strokeStyle='rgba(145,202,210,.045)';ctx.setLineDash([3,12]);
  for(let i=1;i<numLanes;i++){ctx.beginPath();ctx.moveTo(i*laneWidth,210);ctx.lineTo(i*laneWidth,earthTop);ctx.stroke()}ctx.setLineDash([]);
  if(isPlaying&&!finale){const x=currentLane*laneWidth;const lane=ctx.createLinearGradient(0,shipY-180,0,earthTop);lane.addColorStop(0,'rgba(108,232,205,0)');lane.addColorStop(1,'rgba(108,232,205,.035)');ctx.fillStyle=lane;ctx.fillRect(x,shipY-180,laneWidth,earthTop-shipY+180)}
  ctx.drawImage(earthSprite,0,earthTop-earthGlow);drawImpacts();drawBase();drawDebris(dt);
}

// Clarão laranja na Terra quando um asteroide passa e atinge a superfície
function drawImpacts() {
  impacts = impacts.filter(i => gameTime - i.t < 600);
  for (const i of impacts) {
    const k = 1 - (gameTime - i.t)/600, r = 40 + 50*(1-k), y = earthTop + 8;
    const g = ctx.createRadialGradient(i.x, y, 2, i.x, y, r);
    g.addColorStop(0, `rgba(255,210,90,${0.9*k})`); g.addColorStop(1, "rgba(255,80,0,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(i.x, y, r, 0, Math.PI*2); ctx.fill();
  }
}

// Base de comando na Terra: de onde parte o canal quântico
const baseTipY = () => earthTop - 32;
function drawBase() {
  const cx=width/2,y=earthTop;ctx.save();drawGlow(ctx,cx,y-14,50,'rgba(108,232,205,.12)');
  const metal=ctx.createLinearGradient(0,y-6,0,y+13);metal.addColorStop(0,'#8ba5af');metal.addColorStop(1,'#1d3444');ctx.fillStyle=metal;ctx.strokeStyle='#8dc2c45a';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(cx-42,y+13);ctx.lineTo(cx-28,y-7);ctx.lineTo(cx+28,y-7);ctx.lineTo(cx+42,y+13);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#143542';ctx.beginPath();ctx.arc(cx,y-7,15,Math.PI,0);ctx.fill();ctx.stroke();ctx.strokeStyle='#83c9c4';ctx.beginPath();ctx.moveTo(cx,y-19);ctx.lineTo(cx,baseTipY());ctx.stroke();ctx.fillStyle='#bceee0';ctx.beginPath();ctx.arc(cx,baseTipY(),2.6,0,Math.PI*2);ctx.fill();ctx.fillStyle='#6ce8cd';for(let i=-2;i<=2;i++)ctx.fillRect(cx+i*12-2,y+3,4,2);ctx.restore();ctx.fillStyle='#799cab';ctx.font='7px Consolas,monospace';ctx.textAlign='center';ctx.fillText('COMANDO / E91',cx,y+29);
}

// Parte de baixo do casco da nave-mãe (y) em cada posição x. O resto da nave fica fora da tela.
const hullCy = -58, hullRy = 130;
const hullBottom = x => {
  const dx = (x - width/2) / (width*0.58);
  return hullCy + hullRy*Math.sqrt(Math.max(0, 1 - dx*dx));
};

// Nave-mãe alienígena no topo: as escotilhas (uma por trilha) brilham quando lançam algo
function drawMothership() {
  const cx = width/2, rx = width*0.58;
  ctx.save();

  // casco
  const hull = ctx.createLinearGradient(0, 0, 0, 74);
  hull.addColorStop(0, "#394958"); hull.addColorStop(.5, "#233244"); hull.addColorStop(1, "#0e1b2a");
  ctx.shadowBlur = 18; ctx.shadowColor = "rgba(236,115,128,.2)"; ctx.fillStyle = hull;
  ctx.beginPath(); ctx.ellipse(cx, hullCy, rx, hullRy, 0, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(226,143,149,.45)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(cx, hullCy, rx, hullRy, 0, 0, Math.PI*2); ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,.12)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(cx, hullCy, rx*0.96, hullRy*0.9, 0, 0, Math.PI*2); ctx.stroke();

  ctx.save();ctx.beginPath();ctx.ellipse(cx,hullCy,rx,hullRy,0,0,Math.PI*2);ctx.clip();
  for(let i=0;i<28;i++){const px=i*width/27,py=18+Math.sin(i*.7)*6;ctx.fillStyle=i%2?'#9db6c50b':'#020c162a';ctx.fillRect(px,0,width/29,py+19);ctx.strokeStyle='#829aac18';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(px,0);ctx.lineTo(px+8,py+25);ctx.lineTo(px+25,py+25);ctx.stroke();ctx.fillStyle='#c6878d66';ctx.fillRect(px+5,py+10,8,1)}ctx.restore();
  // divisões do casco entre as escotilhas
  for (let i = 1; i < numLanes; i++) {
    const x = i*laneWidth, y = hullBottom(x);
    ctx.strokeStyle = "rgba(255,255,255,.1)";
    ctx.beginPath(); ctx.moveTo(x, y-26); ctx.lineTo(x, y-2); ctx.stroke();
  }

  // escotilhas de lançamento (uma por trilha)
  const w = laneWidth*0.46;
  for (let i = 0; i < numLanes; i++) {
    const x = i*laneWidth + laneWidth/2, y = hullBottom(x);
    ctx.fillStyle = "#06070d"; ctx.fillRect(x - w/2, y - 14, w, 12);
    ctx.strokeStyle = "#587382"; ctx.strokeRect(x - w/2, y - 14, w, 12);
    const f = hatchFlash[i];
    if (f && gameTime < f.until) {
      const k = (f.until - gameTime)/hatchFlashMs;
      ctx.save(); ctx.shadowBlur = 24; ctx.shadowColor = f.color; ctx.fillStyle = f.color; ctx.globalAlpha = 0.35 + 0.65*k;
      ctx.fillRect(x - w/2 + 2, y - 12, w - 4, 8); ctx.restore();
    } else {
      ctx.fillStyle = "rgba(255,70,100,.35)"; ctx.fillRect(x - w/4, y - 9, w/2, 3);
    }
  }

  // luzes piscando na borda
  for (let i = 0; i <= numLanes; i++) {
    const x = i*laneWidth, y = hullBottom(x) - 9, on = reducedEffects()||Math.sin(gameTime/180 + i*1.7) > 0;
    ctx.save();
    if (on) { ctx.shadowBlur = 8; ctx.shadowColor = "#cf7c8a"; }
    ctx.fillStyle = on ? "#ff5b83" : "#552233";
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI*2); ctx.fill(); ctx.restore();
  }

  // núcleo (pulsa mais rápido quando o canal está comprometido)
  const pulse = reducedEffects()?0.6:0.5 + 0.5*Math.sin(gameTime/(isCompromised ? 120 : 400)), cy = hullBottom(cx) - 34;
  const core = ctx.createRadialGradient(cx, cy, 2, cx, cy, 16);
  core.addColorStop(0, "#ffd0dc"); core.addColorStop(.5, "#ff3b6b"); core.addColorStop(1, "#7a0f2e");
  ctx.shadowBlur = 10 + 14*pulse; ctx.shadowColor = "#ff3b6b"; ctx.fillStyle = core;
  ctx.beginPath(); ctx.arc(cx, cy, 15, 0, Math.PI*2); ctx.fill();

  ctx.restore();
}

// Canal quântico: liga a antena da base na Terra à nave
function drawLink(shipX) {
  const r = Math.min(1, qber/qberLimit);
  ctx.save(); ctx.lineWidth = 1;
  if (isCompromised) { ctx.strokeStyle = "rgba(255,60,60,.6)"; ctx.setLineDash([3,16]); ctx.lineDashOffset = Math.random()*20; }
  else if (isRegen)  { ctx.strokeStyle = `rgba(150,200,255,${0.6 + (reducedEffects()?0:0.4*Math.sin(gameTime/60))})`; }
  else {
    ctx.strokeStyle = `hsla(${165 - 165*r},65%,65%,${0.3 + (reducedEffects()?0:0.15*Math.sin(gameTime/200))})`;
    ctx.setLineDash([10,6]); ctx.lineDashOffset = (r > 0.6 ? Math.random()*6 : -gameTime/40);
  }
  ctx.beginPath(); ctx.moveTo(width/2, baseTipY());
  ctx.quadraticCurveTo(shipX, baseTipY() - 6, shipX, shipY + shipSize + 6);
  ctx.stroke(); ctx.restore();
}

// ---------- Desenho: nave do jogador (caça com asas, canhões e dois motores) ----------
function drawShip(x,color,flicker) {
  if(!reducedEffects() && gameTime<hullInvulUntil && Math.floor(gameTime/100)%2===0)return;
  if(!reducedEffects()&&flicker&&Math.floor(gameTime/150)%2===0)return;
  const shipColor=isRegen?'#99bbef':flicker?'#ef7976':'#6ce8cd';
  drawInterceptor(ctx,x,shipY,shipSize,shipColor,gameTime,flicker);
  if(isRegen){ctx.save();ctx.strokeStyle='#99bbef77';ctx.lineWidth=1;ctx.setLineDash([6,7]);ctx.beginPath();ctx.arc(x,shipY,shipSize*1.8,gameTime/350,gameTime/350+Math.PI*1.7);ctx.stroke();ctx.restore()}
  if(!reducedEffects()&&gameTime-lastShotTime<80)drawGlow(ctx,x,shipY-shipSize*1.3,14,'rgba(166,255,232,.5)');
}

// ---------- Desenho: ameaças ----------
// Pulso espião: estrela amarela giratória (parece uma mina, não uma nave)
function drawSpy(p) { drawSpyPulse(p); }

function drawCloud(c) { drawQuantumCloud(c); }

function drawBanner() {
  if(gameTime>bannerUntil)return;
  if(height<=420)return;
  const bannerY = Math.max(arenaBounds.top+20,Math.max(height*.42, Math.min(355, height*.6)));
  ctx.save();ctx.globalAlpha=Math.min(1,(bannerUntil-gameTime)/500);
  ctx.textAlign='center';ctx.fillStyle='#829eae';ctx.font='9px Consolas,monospace';ctx.fillText(phaseConfig().concept.toUpperCase(),width/2,bannerY);
  const title='FASE 0'+level+' · '+phaseConfig().name;
  let size=Math.min(32,width/15);ctx.font='300 '+size+'px Segoe UI,sans-serif';
  const measured=ctx.measureText?.(title)?.width||0;
  if(measured>width-32){size*=(width-32)/measured;ctx.font='300 '+size+'px Segoe UI,sans-serif';}
  ctx.fillStyle='#deeee9';ctx.fillText(title,width/2,bannerY+36);
  ctx.strokeStyle='#6ce8cd66';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(width/2-25,bannerY+52);ctx.lineTo(width/2+25,bannerY+52);ctx.stroke();ctx.restore();
}

// ---------- Loop ----------
function update(ts) {
  if (!combatRunning()) return;
  if (!boss && encountersReady() && !bossCleared[level-1]) { beginBoss(); return; }
  if (!lastTs) lastTs = ts;
  const dt = Math.max(0,Math.min((ts - lastTs)/FRAME_MS, 3));
  lastTs = ts; gameTime += dt*FRAME_MS;

  const movementMs=updateChannel(dt*FRAME_MS);

  if (!boss) updateEncounters();
  drawBackground(dt);

  const previousShipX=shipCenterX();
  shipPilot.advance(movementMs,isRegen,isCompromised);currentLane=shipPilot.lane;
  const shipX = shipCenterX();
  const bossFighting=boss?.status==='fighting'&&!boss.model.complete;
  const targetOpen=!!bossFighting&&boss.model.targets(qber).some(n=>n.open);
  const bossThreat=!!bossFighting&&(boss.model.pulses.some(p=>!p.fired&&boss.model.time>=p.announceAt)||!!boss.channelPulse&&!boss.channelPulse.fired);
  const waveThreat=!boss&&(asteroids.length||drones.length||scout||clouds.some(c=>c.y-c.radius<=shipY)||spies.some(p=>p.y-p.radius<=shipY)||interferenceFront&&!interferenceFront.passed||encounterDirector?.pending);
  campaignMetrics?.tick(dt*FRAME_MS,{position:shipPosition(),previousPosition:previousShipX/laneWidth-.5,qber,regenReady:gameTime>=keyReadyAt&&!isRegen,regenerating:isRegen,compromised:isCompromised,recoveryWindow:bossRecoveryAvailable()||waveRecoveryAvailable(),
    actionable:!!(targetOpen||bossThreat||waveThreat||isRegen||bossFighting&&boss.model.stabilizing&&boss.model.coherence<90||qber>=channelRules.alert&&gameTime>=keyReadyAt),waitingForOpening:!!bossFighting&&!targetOpen&&!bossThreat&&!isRegen});
  if(!boss)updateInterference(dt);
  drawEntangledLinks();
  const protectedNow = noImpact();
  if (!isRegen) fireLaser(shipX);

  updateQuantumPickups(dt,shipX,previousShipX);
  updateQuantumStatus();
  drawSuperposition(shipX);
  drawLink(shipX);
  ctx.globalAlpha = (protectedNow && !isCompromised) ? 0.65 : 1;
  drawShip(shipX, isRegen ? "#88bbff" : "#00ffff", isCompromised);
  ctx.globalAlpha = 1;

  // Lasers (somem ao bater no casco da nave-mãe)
  for (let i = lasers.length-1; i >= 0; i--) {
    const l = lasers[i]; l.previousY=l.y; l.y -= flightSpeed(10)*dt;
    drawEnergyBolt(l);
    if (l.y < hullBottom(l.x)) lasers.splice(i, 1);
  }

  if(boss) {
    updateBossBattle(dt,shipX);drawMothership();
    if(isPlaying&&!isStageBriefing){drawQuantumPickups();refreshCombatHUD();}
    if(isPlaying&&!isStageBriefing)rafId=requestAnimationFrame(update);
    return;
  }

  updateEncounterActors(dt);
  drawFormationWarning();

  // Nuvens (ruído)
  for (let i = clouds.length-1; i >= 0; i--) {
    const c = clouds[i],previousY=c.y,previousX=c.x;
    const holdY=shipY-16;
    if(c.sway&&!c.heldAt&&c.y+c.speed*dt>=holdY){c.y=holdY;c.heldAt=gameTime;}
    else if(!c.heldAt||gameTime-c.heldAt>=1200)c.y+=c.speed*dt;
    if (c.sway) c.x = cloudXAt(c,gameTime);
    drawCloud(c);drawCloudForecast(c);
    if (!noImpact() && shipTouches(c,previousY,previousShipX,shipX,c.radius+shipSize*.7,previousX)) {
      clouds.splice(i, 1); campaignMetrics?.count('cloudContacts');gameAudio.sfx('noise', { pan: audioPan(c.x) }); addQber(cloudQber,'cloud'); if (isCompromised) break; continue;
    }
    if (c.y > height + 50) clouds.splice(i, 1);
  }

  // Pulsos espiões (espionagem)
  for (let i = spies.length-1; i >= 0; i--) {
    const p = spies[i],previousY=p.y;p.y += p.speed*dt; drawSpy(p);
    if (!noImpact() && shipTouches(p,previousY,previousShipX,shipX,p.radius*1.6+shipSize*.7)) {
      spies.splice(i, 1); campaignMetrics?.count('spyContacts');gameAudio.sfx('spy', { pan: audioPan(p.x) }); addQber(spyQber,'spy'); if (isCompromised) break; continue;
    }
    if (p.y > height + 50) spies.splice(i, 1);
  }

  // Snapshot: destruir um par conectado não invalida a iteração das outras rochas.
  for (const a of [...asteroids].reverse()) {
    if (!asteroids.includes(a)) continue;
    const previousY=a.y,previousX=a.x;a.y += a.speed*dt;
    if(a.fragment)a.x=a.fromX+(a.toX-a.fromX)*Math.min(1,(gameTime-a.born)/500);
    // Um disparo que chega antes do limiar ainda pode impedir a fragmentação.
    drawAsteroid(a); drawAsteroidQuantum(a);
    if (gameTime>=hullInvulUntil && shipTouches(a,previousY,previousShipX,shipX,a.radius+shipSize*.7)) {
      takeHullHit('A nave foi atingida sem escudo de emergência!',shipX);
      if(!isPlaying)return;
      asteroids.splice(asteroids.indexOf(a),1);resolveThreat(a);continue;
    }
    let destroyed = false;
    for (let j = lasers.length-1; j >= 0; j--) {
      const l = lasers[j];
      if (laserTouchesEntity(l,a,previousY,previousX)) {
        lasers.splice(j,1); a.hp--;
        campaignMetrics?.count('asteroidHits');
        if(l.quantum)recordPhaseGoal('hadamardHits');
        if (a.hp <= 0) { destroyQuantumAsteroid(a); destroyed = true; }
        else { a.hitUntil = gameTime+160; gameAudio.sfx('impact', { pan: audioPan(a.x) }); }
        break;
      }
    }
    if (destroyed) continue;
    if(a.splittable&&a.y>=a.splitY){splitAsteroid(a);continue;}
    if (a.y-a.radius*.5 > earthTop) {
      asteroids.splice(asteroids.indexOf(a),1);resolveThreat(a); impacts.push({x:a.x,t:gameTime});
      gameAudio.sfx('earth', { pan: audioPan(a.x) });
      campaignMetrics?.count('earthImpacts');recordPhaseGoal('earthImpacts');campaignMetrics?.event('earthImpact',{kind:a.kind||'rock',lane:laneOf(a)});missed++; updateHUD();
      if (missed >= maxMisses) { gameOver('Defesa falhou! '+maxMisses+' asteroides atingiram a Terra.',{kind:'earth'}); return; }
    }
  }

  if(encountersReady()){beginBoss();return;}
  drawQuantumPickups();refreshCombatHUD();
  drawMothership();   // por último: asteroides, nuvens e pulsos saem de baixo do casco
  drawBanner();
  rafId = requestAnimationFrame(update);
}

// Chamado pelo botão "Iniciar Defesa Planetária" do briefing
function startDefense() {
  introActive = false;
  document.getElementById('intro').style.display = 'none';
  document.getElementById('arcade').style.display = 'flex';
  arcadeActive = true;
  resizeCanvas(); drawBackground(0); drawMothership();
  $('pauseBtn').disabled = true;
}
