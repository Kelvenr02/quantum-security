const assert=require('node:assert/strict');
const {LanePilot,OrbitalArena}=require('../arena.js');
const {QuantumBoss}=require('../bosses.js');
const {makeGame}=require('./gameplay.cjs');
const results=[];
function test(name,fn){fn();results.push(name);}
function step(g,ms){for(let elapsed=0;elapsed<ms;elapsed+=10)g.run('cancelAnimationFrame(rafId);update((lastTs||100)+10)');}
function quiet(g){g.run('encounterDirector.nextAt=1e9;nextCloudAt=nextSpyAt=nextPickupAt=nextInterferenceAt=1e9;lastTs=100');}

test('Arena usa nove trilhas e aproveita até 1.600 px sem ultrapassar a janela',()=>{
  for(const [viewport,expected] of [[1920,1600],[1440,1440],[1100,1100],[390,390],[320,320]]){
    const g=makeGame(viewport,800);assert.equal(g.run('width'),expected);assert.equal(g.run('numLanes'),9);
    assert.ok(g.run('shipSize*2<laneWidth'));assert.equal(g.run('currentLane'),4);
  }
});
test('Travessia tem posição física intermediária e dura 150 ms',()=>{
  const pilot=new LanePilot();pilot.move(1);assert.equal(pilot.position,4);pilot.advance(75);
  assert.equal(pilot.position,4.5);pilot.advance(75);assert.equal(pilot.position,5);assert.equal(pilot.moving,false);
});
test('Teclado e toque mantidos produzem a mesma travessia entre os extremos',()=>{
  for(const token of ['key:ArrowLeft','pointer:1']){
    const pilot=new LanePilot();pilot.reset(8);pilot.press(token,-1);pilot.advance(1200);
    assert.equal(pilot.position,0);assert.equal(pilot.lane,0);assert.equal(pilot.moving,false);
  }
});
test('Repetição do sistema operacional não acelera a nave; soltar encerra a repetição',()=>{
  const g=makeGame();quiet(g);g.press('ArrowRight');for(let i=0;i<20;i++)g.press('ArrowRight');
  step(g,70);assert.ok(g.run('shipPosition()>4&&shipPosition()<5'));g.release('ArrowRight');
  step(g,300);assert.equal(g.run('shipPosition()'),5);assert.equal(g.run('currentLane'),5);
});
test('Buffer guarda um toque curto durante a travessia, sem saltar trilhas',()=>{
  const p=new LanePilot();p.press('a',1);p.release('a');p.advance(50);p.press('b',1);p.release('b');
  p.advance(250);assert.equal(p.position,6);assert.equal(p.moving,false);
});
test('Pausa congela movimento e limpa comandos mantidos antes de retomar',()=>{
  const g=makeGame();quiet(g);g.press('ArrowRight');step(g,50);const x=g.run('shipPosition()');
  g.press('Escape');step(g,200);assert.equal(g.run('shipPosition()'),x);g.press('Escape');step(g,400);
  assert.equal(g.run('shipPosition()'),5);assert.equal(g.run('shipPilot.inputs.size'),0);
});
test('Regeneração congela a posição física mesmo no meio da travessia',()=>{
  const g=makeGame();quiet(g);g.press('ArrowRight');g.release('ArrowRight');step(g,50);g.press('KeyR');
  const position=g.run('shipPosition()');step(g,1900);assert.equal(g.run('shipPosition()'),position);assert.equal(g.run('isRegen'),true);
  step(g,300);assert.equal(g.run('shipPosition()'),5);assert.equal(g.run('isRegen'),false);
});
test('Colisão acontece no caminho da nave e não no centro da trilha de destino',()=>{
  const g=makeGame(1600,900);quiet(g);g.press('ArrowRight');g.release('ArrowRight');
  g.run('asteroids=[{id:1,x:5*laneWidth,y:shipY,radius:10,speed:0,hp:1,group:null}]');
  step(g,40);assert.equal(g.run('hullShield'),1);step(g,30);assert.equal(g.run('hullShield'),0);
});
test('Salvas e disparos usam a posição física durante a travessia',()=>{
  const g=makeGame();quiet(g);g.press('ArrowRight');g.release('ArrowRight');step(g,20);
  assert.equal(g.run('shipOverlapsLanes([5])'),false);assert.equal(g.run('shipOverlapsLanes([4])'),true);
  g.run('lasers=[];lastShotTime=-1000;fireLaser(shipCenterX())');
  assert.equal(g.run('lasers[0].x'),g.run('shipCenterX()'));
});
test('Redimensionar conserva o progresso da travessia e os corpos cabem nas trilhas',()=>{
  const g=makeGame(1600,900);quiet(g);g.press('ArrowRight');g.release('ArrowRight');step(g,70);
  const position=g.run('shipPosition()');g.run('window.innerWidth=390;window.innerHeight=700;resizeCanvas()');
  assert.equal(g.run('shipPosition()'),position);assert.ok(g.run('shipCenterX()<width&&shipSize*2<laneWidth'));
});
test('Todos os guardiões escalam alvos e preservam fuga alcançável em 7 e 9 trilhas',()=>{
  for(const lanes of [7,9])for(let phase=1;phase<=8;phase++){
    const m=new QuantumBoss(phase,Math.floor(lanes/2),lanes);
    for(let r=0;r<15;r++){
      m.round=r;if(phase===8)m.hp=[r%3===0?36:r%3===1?24:12];m.prepareRound(Math.floor(lanes/2));
      assert.ok(m.targets().every(n=>n.lane>=0&&n.lane<lanes));
      let previous=m.lanes,lastAt=0;
      for(const pulse of m.pulses){
        const safe=m.lanes.filter(l=>!pulse.lanes.includes(l));assert.ok(safe.length>=2);
        const available=pulse.at-Math.max(lastAt,pulse.lockAt??pulse.announceAt);
        for(const start of previous)assert.ok(safe.some(l=>Math.abs(l-start)*OrbitalArena.stepMs+400<=available),'Cada troca de corredor precisa admitir deslocamento e reação');
        previous=safe;lastAt=pulse.at;
      }
    }
  }
});
test('Métricas distinguem impactos brutos, reparos, fontes de QBER e segmentos',()=>{
  const g=makeGame();quiet(g);step(g,100);
  g.run('asteroids=[{id:1,x:20,y:earthTop+30,radius:10,speed:0,hp:1,group:null}];update(lastTs+10);addQber(7,"spy");score=100;beginBoss();continuePhase();');
  step(g,100);g.run('boss.status="won";finishBoss()');
  const d=g.run('window.quantumDiagnostics.snapshot()');assert.equal(d.counts.earthImpacts,1);assert.equal(d.counts.earthRepairs,1);
  assert.equal(d.state.missed,0);assert.equal(d.qber.gained.spy,7);assert.equal(d.qber.removed.bossEntry,undefined);assert.equal(d.qber.removed.bossVictory,1.5);
  assert.ok(d.phases[1].wave.activeMs>0);assert.ok(d.phases[1].boss.activeMs>0);
  d.counts.earthImpacts=999;assert.equal(g.run('window.quantumDiagnostics.snapshot().counts.earthImpacts'),1);
});
test('Diagnóstico exclui pausa e briefing, registra R e mantém a partida anterior',()=>{
  const g=makeGame();quiet(g);step(g,100);g.press('KeyR');g.press('KeyR');step(g,100);
  const before=g.run('window.quantumDiagnostics.snapshot().activeMs');g.press('Escape');step(g,1000);
  assert.equal(g.run('window.quantumDiagnostics.snapshot().activeMs'),before);g.press('Escape');
  g.run('gameOver("teste");startGame()');const old=g.run('window.quantumDiagnostics.previous().at(-1)');
  assert.equal(old.outcome,'defeat');assert.equal(old.counts.regenerationsStarted,1);assert.equal(old.counts.regenRejected,1);
  assert.equal(g.run('window.quantumDiagnostics.snapshot().activeMs'),0);
});
console.log(JSON.stringify({passed:results.length,tests:results},null,2));
