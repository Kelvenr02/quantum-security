const assert=require('node:assert/strict');
const {makeGame}=require('./gameplay.cjs');
const results=[];
function test(name,fn){fn();results.push(name);}
function near(actual,expected){assert.ok(Math.abs(actual-expected)<1e-8,actual+' ≠ '+expected);}
function quiet(g){g.run('encounterDirector.nextAt=1e9;nextCloudAt=nextSpyAt=nextPickupAt=nextInterferenceAt=1e9;lastTs=100');}
function step(g,ms){for(let elapsed=0;elapsed<ms;elapsed+=10)g.run('cancelAnimationFrame(rafId);update((lastTs||100)+10)');}
function guardian(g,phase=1){g.run('level='+phase+';score=phaseConfig().target;beginBoss();continuePhase()');}

test('Recuperação passiva é de 0,18 pp/s nas primeiras fases e 0,08 nas últimas',()=>{
  const g=makeGame();g.run('qber=10;updateChannel(1000)');near(g.run('qber'),9.82);
  g.run('level=5;missionPhases[4].drift=0;qber=10;updateChannel(1000)');near(g.run('qber'),9.92);
});
test('Estados distinguem canal seguro, instável, comprometido e renovando',()=>{
  const g=makeGame();assert.equal(g.run('channelStateName()'),'safe');
  g.run('qber=8');assert.equal(g.run('channelStateName()'),'unstable');
  g.run('addQber(4)');assert.equal(g.run('channelStateName()'),'compromised');
  g.press('KeyR');assert.equal(g.run('channelStateName()'),'regenerating');
});
test('11% exatos não comprometem; ultrapassar o limite inicia uma única inversão',()=>{
  const g=makeGame();g.run('addQber(11)');assert.equal(g.run('isCompromised'),false);
  g.run('addQber(.01)');assert.equal(g.run('isCompromised'),true);assert.equal(g.run('compEnd'),4000);
  g.run('gameTime=500;addQber(7)');assert.equal(g.run('compEnd'),4000);assert.equal(g.run('qber'),16);
  assert.equal(g.run('campaignMetrics.data.counts.compromises'),1);
});
test('Comprometimento não apaga ameaças nem protege o canal de novos contatos',()=>{
  const g=makeGame();g.run('clouds=[makeCloud(1,200)];spies=[{x:100,y:200}];addQber(12)');
  assert.equal(g.run('clouds.length+spies.length'),2);assert.equal(g.run('noImpact()'),false);
});
test('Recuperar os comandos deixa 9% de QBER e uma margem de 2,5 s',()=>{
  const g=makeGame();g.run('addQber(14);gameTime=4000;updateChannel(0)');
  assert.equal(g.run('qber'),9);assert.equal(g.run('isCompromised'),false);assert.equal(g.run('criticalGraceUntil'),6500);
  g.run('addQber(7);gameTime=6499;updateChannel(0)');assert.equal(g.run('isCompromised'),false);
  assert.equal(g.run('channelStateName()'),'critical');
  g.run('gameTime=6500;updateChannel(0)');assert.equal(g.run('isCompromised'),true);assert.equal(g.run('compEnd'),10500);
});
test('Recuperação automática não desfaz correção de QBER obtida pelo jogador',()=>{
  const g=makeGame();g.run('addQber(12);setQber(6,"correction");gameTime=4000;updateChannel(0)');
  assert.equal(g.run('qber'),6);assert.equal(g.run('isCompromised'),false);
});
test('R interrompe comprometimento, mantém 2 s de parada e 10 s de recarga',()=>{
  const g=makeGame();quiet(g);g.run('addQber(12)');g.press('KeyR');
  assert.equal(g.run('isCompromised'),false);assert.equal(g.run('regenEnd'),2000);assert.equal(g.run('keyReadyAt'),10000);
  g.press('ArrowRight');step(g,1990);assert.equal(g.run('shipPosition()'),4);assert.equal(g.run('isRegen'),true);
  step(g,10);assert.equal(g.run('qber'),0);assert.equal(g.run('isRegen'),false);
  assert.equal(g.run('campaignMetrics.data.counts.emergencyRegenerations'),1);
});
test('Renovação de emergência não ignora uma recarga ainda em andamento',()=>{
  const g=makeGame();g.run('keyReadyAt=10000;addQber(12)');g.press('KeyR');
  assert.equal(g.run('isRegen'),false);assert.equal(g.run('isCompromised'),true);assert.equal(g.run('keyReadyAt'),10000);
});
test('Renovação não dá imunidade física e não cancela as ameaças',()=>{
  const g=makeGame();g.run('tryRegen();clouds=[makeCloud(1,200)];takeHullHit("teste",100)');
  assert.equal(g.run('hullShield'),0);assert.equal(g.run('clouds.length'),1);
  g.run('gameTime=1500;takeHullHit("teste",100)');assert.equal(g.run('isPlaying'),false);
});
test('Ao terminar R no meio de um quadro, movimento e ruído usam apenas o tempo restante',()=>{
  const g=makeGame();quiet(g);g.run('level=5;score=460;qber=8;pressMovement("test",1);shipPilot.advance(50);currentLane=shipPilot.lane;tryRegen();gameTime=1990;lastTs=100;update(120)');
  near(g.run('qber'),.0045);near(g.run('shipPilot.elapsed'),60);
});
test('Entrada no chefe conserva QBER, recarga e comprometimento durante o briefing',()=>{
  const g=makeGame();g.run('addQber(12);gameTime=500;keyReadyAt=8000;score=100;beginBoss()');
  assert.equal(g.run('qber'),12);assert.equal(g.run('compEnd'),4000);assert.equal(g.run('keyReadyAt'),8000);
  g.run('update(99999)');assert.equal(g.run('gameTime'),500);assert.equal(g.run('isCompromised'),true);
});
test('Vitória dá só 1,5 pp de recuperação e não prepara R automaticamente',()=>{
  const g=makeGame();guardian(g);g.run('qber=10;keyReadyAt=8000;boss.status="won";finishBoss()');
  assert.equal(g.run('qber'),8.5);assert.equal(g.run('keyReadyAt'),8000);assert.equal(g.run('level'),2);
  assert.equal(g.run('phaseCheckpointData.channel.qber'),8.5);
});
test('Renovação em andamento atravessa vitória e briefing sem ser cancelada',()=>{
  const g=makeGame();guardian(g);g.run('qber=10;tryRegen();boss.status="won";finishBoss()');
  assert.equal(g.run('isRegen'),true);assert.equal(g.run('regenEnd'),2000);assert.equal(g.run('keyReadyAt'),10000);
  g.run('continuePhase()');quiet(g);step(g,2000);assert.equal(g.run('qber'),0);
});
test('Transições durante R preservam a posição física, inclusive entre trilhas',()=>{
  const g=makeGame();g.run('moveShip(1);shipPilot.advance(50);currentLane=shipPilot.lane;tryRegen()');
  const position=g.run('shipPosition()');guardian(g);assert.equal(g.run('shipPosition()'),position);
  g.run('boss.status="won";finishBoss()');assert.equal(g.run('shipPosition()'),position);assert.equal(g.run('isRegen'),true);
});
test('Retomar a fase restaura os tempos restantes e o QBER salvos, sem chave grátis',()=>{
  const g=makeGame();g.run('gameTime=5000;qber=12;isCompromised=true;compEnd=7000;keyReadyAt=11000;enterPhase(3);continuePhase();qber=0;keyReadyAt=0;gameOver("teste");retryPhase()');
  assert.equal(g.run('qber'),12);assert.equal(g.run('compEnd'),2000);assert.equal(g.run('keyReadyAt'),6000);
  assert.equal(g.run('isCompromised'),true);assert.equal(g.run('gameTime'),0);
});
test('Os oito chefes mantêm pressão ambiental sem depender de acerto físico',()=>{
  for(let phase=1;phase<=8;phase++){
    const g=makeGame();guardian(g,phase);g.run('qber=4;updateChannel(1000)');
    assert.ok(g.run('qber')>4);assert.equal(g.run('hullShield'),1);
    assert.ok(g.run('campaignMetrics.data.qber.gained.bossEnvironment')>0);
  }
});
test('Perturbação tem 1,2 s de aviso e afeta somente o QBER, uma vez',()=>{
  const g=makeGame();guardian(g);g.run('qber=6;boss.model.time=boss.model.openingStart+400;updateBossChannel()');
  assert.equal(g.run('boss.channelPulse.releaseAt-boss.model.time'),1200);assert.equal(g.run('qber'),6);
  g.run('boss.model.time=boss.channelPulse.releaseAt-1;updateBossChannel()');assert.equal(g.run('qber'),6);
  g.run('boss.model.time++;updateBossChannel();updateBossChannel()');assert.equal(g.run('qber'),8.5);
  assert.equal(g.run('hullShield'),1);assert.equal(g.run('boss.model.targets(qber).some(n=>n.open)'),false);
});
test('Sair das faixas douradas evita a perturbação; R também permite descartá-la',()=>{
  for(const action of ['currentLane=0;shipPilot.reset(0)','tryRegen()']){
    const g=makeGame();guardian(g);g.run('boss.model.time=boss.model.openingStart+400;updateBossChannel();'+action+';boss.model.time=boss.channelPulse.releaseAt;updateBossChannel()');
    assert.equal(g.run('qber'),0);assert.equal(g.run('hullShield'),1);
  }
});
test('Respiros indicados comportam 2 s de R e margem de reação nos oito chefes',()=>{
  for(let phase=1;phase<=8;phase++){
    const g=makeGame();guardian(g,phase);g.run('boss.model.time=boss.model.recoveryStart');
    assert.equal(g.run('bossRecoveryAvailable()'),true);
    assert.ok(g.run('boss.model.pulses.every(p=>p.at<boss.model.time)'));
    g.run('boss.model.time=boss.model.period-2200');assert.equal(g.run('bossRecoveryAvailable()'),false);
  }
});
test('Disparo em voo mudando o estágio durante R preserva reação e cancela ruído anterior',()=>{
  const g=makeGame();guardian(g,8);
  g.run('boss.model.hp=[25];boss.model.time=boss.model.openingStart+600;updateBossChannel();tryRegen();lasers=[{x:(boss.model.lane(1)+.5)*laneWidth,y:bossArenaY(),previousY:bossArenaY()+1,radius:4}];updateBossBattle(0,shipCenterX())');
  assert.equal(g.run('boss.model.stage'),1);assert.equal(g.run('boss.channelPulse'),null);
  assert.ok(g.run('boss.model.pulses[0].at-boss.model.time>=regenEnd-gameTime+channelRules.reactionMarginMs'));
});
test('Pausa congela canal, recarga, comprometimento e contagem da perturbação',()=>{
  const g=makeGame();guardian(g);g.run('boss.model.time=boss.model.openingStart+400;updateBossChannel();addQber(12)');
  const before=g.run('JSON.stringify({qber,gameTime,compEnd,keyReadyAt,pulse:boss.channelPulse,time:boss.model.time})');
  g.press('Escape');g.run('update(99999)');assert.equal(g.run('JSON.stringify({qber,gameTime,compEnd,keyReadyAt,pulse:boss.channelPulse,time:boss.model.time})'),before);
});
test('Métricas registram respiros, renovação de emergência e o estado do canal',()=>{
  const g=makeGame();guardian(g);quiet(g);g.run('boss.model.time=boss.model.recoveryStart;qber=8');step(g,100);
  assert.ok(g.run('campaignMetrics.data.phases[1].boss.recoveryWindowMs')>0);
  g.run('addQber(4);tryRegen()');const d=g.run('window.quantumDiagnostics.snapshot()');
  assert.equal(d.state.channel,'regenerating');assert.equal(d.counts.emergencyRegenerations,1);
});
console.log(JSON.stringify({passed:results.length,tests:results},null,2));
