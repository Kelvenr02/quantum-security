const assert=require('node:assert/strict');
const {makeGame}=require('./gameplay.cjs');
const results=[];
function test(name,fn){fn();results.push(name);}
function near(a,b){assert.ok(Math.abs(a-b)<1e-7,a+' ≠ '+b);}
function collect(g,type){g.run(`pickups=[{type:'${type}',x:shipCenterX(),y:shipY,radius:17,speed:0}];updateQuantumPickups(0,shipCenterX())`);}
function step(g,ms){for(let i=0;i<ms;i+=10)g.run('cancelAnimationFrame(rafId);update((lastTs||100)+10)');}

test('Entrar no chefe preserva escudo esgotado, H, canal, recarga e pontuação',()=>{
  const g=makeGame();g.run('hullShield=0;superpositionUntil=4500;qber=8;keyReadyAt=6000;combatScore=245;missed=5;score=100;beginBoss()');
  assert.equal(g.run('hullShield'),0);assert.equal(g.run('superpositionUntil'),4500);assert.equal(g.run('qber'),8);assert.equal(g.run('keyReadyAt'),6000);
  assert.equal(g.run('bossCheckpointData.combatScore'),245);assert.equal(g.run('bossCheckpointData.missed'),5);assert.equal(g.run('bossCheckpointData.score'),100);
});
test('Retomar chefe três vezes restaura estado de entrada e vida inteira, sem farmar recursos',()=>{
  const g=makeGame();g.run('gameTime=3000;qber=7;keyReadyAt=9000;hullShield=0;hullInvulUntil=3400;superpositionUntil=5000;missed=8;combatScore=600;quantumCollected=4;beginBoss();let saved=JSON.stringify(bossCheckpointData),wave=JSON.stringify(phaseCheckpointData)');
  for(let i=0;i<3;i++){
    g.run('continuePhase();boss.model.hp=[1,0,0];qber=0;keyReadyAt=0;hullShield=1;missed=1;combatScore=999;quantumCollected=20;superpositionUntil=99999;gameOver("teste",{kind:"bossSalvo",attack:"B"});retryCheckpoint()');
    assert.equal(g.run('boss.model.health'),12);assert.equal(g.run('boss.status'),'briefing');assert.equal(g.run('gameTime'),0);
    assert.equal(g.run('qber'),7);assert.equal(g.run('keyReadyAt'),6000);assert.equal(g.run('hullShield'),0);assert.equal(g.run('hullInvulUntil'),400);
    assert.equal(g.run('superpositionUntil'),2000);assert.equal(g.run('missed'),8);assert.equal(g.run('combatScore'),600);assert.equal(g.run('quantumCollected'),4);
    assert.equal(g.run('JSON.stringify(bossCheckpointData)===saved'),true);assert.equal(g.run('JSON.stringify(phaseCheckpointData)===wave'),true);
  }
});
test('Derrota no estágio final retoma o chefe inteiro e preserva só guardiões anteriores',()=>{
  const g=makeGame();g.run('level=8;score=1000;bossesDefeated=7;beginBoss();continuePhase();boss.model.hp=[2];gameOver("teste");retryCheckpoint()');
  assert.equal(g.run('boss.model.stage'),0);assert.equal(g.run('boss.model.health'),36);assert.equal(g.run('bossesDefeated'),7);
  assert.equal(g.run('bossCleared.filter(Boolean).length'),7);assert.equal(g.run('asteroids.length+drones.length+clouds.length+spies.length+pickups.length'),0);
});
test('Refazer a fase continua disponível e volta aos recursos anteriores às ondas',()=>{
  const g=makeGame();g.run('score=340;combatScore=333;missed=4;enterPhase(4);continuePhase();combatScore=500;missed=8;hullShield=0;beginBoss();continuePhase();gameOver("teste")');
  assert.equal(g.elements.get('btnRetryPhase').hidden,false);assert.match(g.elements.get('btnRetry').textContent,/RETOMAR NO CHEFE/);
  g.run('retryPhase()');assert.equal(g.run('boss'),null);assert.equal(g.run('score'),340);assert.equal(g.run('combatScore'),333);assert.equal(g.run('missed'),4);assert.equal(g.run('hullShield'),1);assert.equal(g.run('bossCheckpointData'),null);
});
test('ENTER retoma o ponto salvo; repetição da tecla não pula o briefing',()=>{
  const g=makeGame();g.run('beginBoss();continuePhase();gameOver("teste")');g.press('Enter');
  assert.equal(g.run('boss.status'),'briefing');assert.equal(g.run('isStageBriefing'),true);
  let prevented=false;g.dispatch('keydown',{code:'Enter',repeat:true,preventDefault:()=>prevented=true});
  assert.equal(g.run('isStageBriefing'),true);assert.equal(prevented,true,'Impede também a ativação nativa do botão focado');
});
test('Vitória dá um reparo e um extra sem dano; aplica recompensa uma única vez',()=>{
  for(const clean of [true,false]){
    const g=makeGame();g.run('missed=9;beginBoss();continuePhase();boss.hullContacts='+(clean?0:1)+';boss.status="won";finishBoss();finishBoss()');
    assert.equal(g.run('missed'),clean?7:8);assert.equal(g.run('hullShield'),1);assert.equal(g.run('bossesDefeated'),1);assert.equal(g.run('bossCheckpointData'),null);
    assert.equal(g.run('lastReward.clean'),clean);assert.equal(g.run('maxMisses'),12);
  }
});
test('Derrota na fase seguinte não oferece um chefe anterior nem reaplica reparos',()=>{
  const g=makeGame();g.run('missed=6;beginBoss();boss.status="won";finishBoss();continuePhase();gameOver("onda",{kind:"earth"})');
  assert.equal(g.elements.get('btnRetryPhase').hidden,true);assert.match(g.elements.get('btnRetry').textContent,/REPETIR FASE 2/);
  g.run('retryCheckpoint()');assert.equal(g.run('boss'),null);assert.equal(g.run('missed'),4);assert.equal(g.run('level'),2);
});
test('Recomeçar campanha apaga retomada do chefe, H e progresso anteriores',()=>{
  const g=makeGame();g.run('level=7;score=860;hullShield=0;superpositionUntil=9999;beginBoss();continuePhase();gameOver("teste");startGame()');
  assert.equal(g.run('level'),1);assert.equal(g.run('bossCheckpointData'),null);assert.equal(g.run('superpositionUntil'),0);assert.equal(g.run('hullShield'),1);assert.equal(g.run('lastFailure'),null);
});
test('Checkpoint não compartilha objetos mutáveis com canal ou piloto',()=>{
  const g=makeGame();g.run('beginBoss();let saved=bossCheckpointData;continuePhase();qber=8;shipPilot.position=2;shipPilot.from=1;');
  assert.equal(g.run('Object.isFrozen(saved)&&Object.isFrozen(saved.channel)&&Object.isFrozen(saved.pilot)'),true);
  assert.equal(g.run('saved.channel.qber'),0);assert.equal(g.run('saved.pilot.position'),4);
});
test('Retomada durante R restaura posição intermediária, tempos e comandos soltos',()=>{
  const g=makeGame();g.run('moveShip(1);shipPilot.advance(50);currentLane=shipPilot.lane;tryRegen();gameTime=500;superpositionUntil=3000;beginBoss();let position=shipPosition();continuePhase();gameOver("teste");retryCheckpoint()');
  near(g.run('shipPosition()'),g.run('position'));assert.equal(g.run('shipPilot.elapsed'),50);assert.equal(g.run('shipPilot.inputs.size'),0);
  assert.equal(g.run('isRegen'),true);assert.equal(g.run('regenEnd'),1500);assert.equal(g.run('keyReadyAt'),9500);assert.equal(g.run('superpositionUntil'),2500);
});
test('Aviso após R inclui a travessia até a fuga e 400 ms de reação',()=>{
  const g=makeGame();g.run('currentLane=8;shipPilot.reset(8);tryRegen();beginBoss();continuePhase()');
  assert.ok(g.run('boss.model.pulses[0].at-boss.model.time>=3300'));
  g.run('lastTs=100');step(g,2400);g.press('ArrowLeft');step(g,900);g.release('ArrowLeft');
  assert.equal(g.run('isPlaying'),true);assert.equal(g.run('hullShield'),1);assert.equal(g.run('occupiedShipLane()'),2);
});
test('Mudança de estágio durante R calcula também a travessia pendente',()=>{
  const g=makeGame();g.run('level=8;beginBoss();continuePhase();currentLane=0;shipPilot.reset(0);moveShip(1);shipPilot.advance(50);currentLane=shipPilot.lane;tryRegen();boss.model.hp=[25];boss.model.time=3200;lasers=[{x:(boss.model.targets().find(n=>n.open).lane+.5)*laneWidth,y:bossArenaY(),previousY:bossArenaY()+1,radius:4}];updateBossBattle(0,shipCenterX());let safe=boss.model.lanes.filter(l=>!boss.model.pulses[0].lanes.includes(l));let travel=100+Math.min(...safe.map(l=>Math.abs(l-shipPilot.lane)))*150;');
  assert.equal(g.run('boss.model.stage'),1);assert.ok(g.run('boss.model.pulses[0].at-boss.model.time>=regenEnd-gameTime+travel+400'));
});
test('H dura 5 s e nova coleta soma duração até o teto de 7 s',()=>{
  const g=makeGame();collect(g,'hadamard');assert.equal(g.run('superpositionUntil'),5000);
  g.run('gameTime=1000');collect(g,'hadamard');assert.equal(g.run('superpositionUntil-gameTime'),7000);
  g.run('lasers=[];gameTime=7999;lastShotTime=-1000;fireLaser(shipCenterX())');assert.equal(g.run('lasers.length'),3);
  g.run('lasers=[];gameTime=8000;lastShotTime=-1000;fireLaser(shipCenterX())');assert.equal(g.run('lasers.length'),1);
});
test('Correção remove 4 pp e 2 s; feedback informa benefício real e não cura inversão',()=>{
  const g=makeGame();g.run('qber=10;keyReadyAt=9000;isCompromised=true;compEnd=4000');collect(g,'correction');
  assert.equal(g.run('qber'),6);assert.equal(g.run('keyReadyAt'),7000);assert.equal(g.run('isCompromised'),true);
  g.run('qber=1;keyReadyAt=1500');collect(g,'correction');assert.equal(g.run('qber'),0);assert.equal(g.run('keyReadyAt'),0);assert.match(g.run('combatNotice.text'),/−1.0 pp.*−1.5 s/);
});
test('Suprimento do chefe avisa por 900 ms e só avança o trecho liberado do quadro',()=>{
  const g=makeGame();g.run('level=3;beginBoss();continuePhase();bossSupply();let y=pickups[0].y;gameTime=850;updateQuantumPickups(3,shipCenterX())');
  near(g.run('pickups[0].y'),g.run('y'));assert.equal(g.run('quantumCollected'),0);
  g.run('gameTime=910;updateQuantumPickups(3,shipCenterX())');near(g.run('pickups[0].y-y'),g.run('flightSpeed(2.8)*10/FRAME_MS'));
});
test('Coleta usa trajetória física entre quadros',()=>{
  const g=makeGame();g.run('pickups=[{type:"hadamard",x:300,y:shipY,radius:17,speed:0}];updateQuantumPickups(0,400,200)');assert.equal(g.run('quantumCollected'),1);assert.equal(g.run('pickups.length'),0);
});
test('Suprimentos das ondas incentivam deslocamento e evitam contato previsto',()=>{
  const g=makeGame();g.run('level=6;let options=pickupLanes();let distance=(shipY+30)/flightSpeed(2.8);asteroids=options.map(l=>({x:(l+.5)*laneWidth,y:shipY-distance,speed:1,radius:25}));nextPickupAt=0;spawnQuantumPickup()');
  assert.equal(g.run('pickups.length'),0);assert.equal(g.run('nextPickupAt'),500);
  g.run('asteroids=[];gameTime=500;spawnQuantumPickup()');assert.equal(g.run('pickups.length'),1);
  assert.equal(g.run('Math.abs(laneOf(pickups[0])-occupiedShipLane())>=1&&Math.abs(laneOf(pickups[0])-occupiedShipLane())<=3'),true);
});
test('H longo adia nova cápsula; coleta perdida não cria reposição infinita no chefe',()=>{
  const g=makeGame();g.run('level=3;nextPickupAt=0;superpositionUntil=5000;spawnQuantumPickup()');assert.equal(g.run('pickups.length'),0);
  g.run('beginBoss();continuePhase();bossSupply();pickups=[];bossSupply()');assert.equal(g.run('pickups.length'),0);
  g.run('boss.model.round++;bossSupply()');assert.equal(g.run('pickups.length'),1);
});
test('Sons de alerta, chave pronta e liberação de cápsula são emitidos uma vez por evento',()=>{
  const g=makeGame();g.run('let cues=[];gameAudio.sfx=name=>cues.push(name);qber=8;refreshCombatHUD();refreshCombatHUD();qber=0;keyReadyAt=1000;refreshCombatHUD();gameTime=1000;refreshCombatHUD();refreshCombatHUD()');
  assert.equal(g.run('cues.filter(x=>x==="channelAlert").length'),1);assert.equal(g.run('cues.filter(x=>x==="keyReady").length'),1);
  g.run('level=3;beginBoss();continuePhase();bossSupply();gameTime+=900;updateQuantumPickups(0,shipCenterX());updateQuantumPickups(0,shipCenterX())');assert.equal(g.run('cues.filter(x=>x==="supply").length'),1);
});
test('Alerta fica no painel; aviso de recompensa cede prioridade à salva iminente',()=>{
  const g=makeGame();g.run('beginBoss();continuePhase();notifyCombat("ESCUDO ESGOTADO",2);boss.model.time=1900;refreshCombatHUD()');assert.equal(g.elements.get('bossFeedback').hidden,true);
  g.run('boss.model.pulses[0].fired=true;boss.model.time=2800;qber=12;refreshCombatHUD()');assert.equal(g.elements.get('bossFeedback').hidden,false);assert.equal(g.elements.get('keyStatus').hidden,true);
  assert.equal(g.elements.get('warning').hidden,false);
});
test('Derrota explica risco físico e mostra exatamente os recursos da retomada',()=>{
  const g=makeGame();g.run('hullShield=0;missed=7;qber=8;keyReadyAt=4200;beginBoss();continuePhase();takeHullHit("Salva fatal",shipCenterX(),{kind:"bossSalvo",attack:"C"})');
  assert.match(g.elements.get('uiDesc').innerHTML,/salva C.*R não protege/);assert.match(g.elements.get('retrySummary').textContent,/7\/12 impactos.*escudo 0.*QBER 8.0%.*4.2 s/);
  assert.equal(g.run('lastFailure.mode'),'boss');assert.equal(g.run('campaignMetrics.data.outcome'),'defeat');
});
console.log(JSON.stringify({passed:results.length,tests:results},null,2));
