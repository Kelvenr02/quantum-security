const assert=require('node:assert/strict');
const {QuantumBoss}=require('../bosses.js');
const {makeGame}=require('./gameplay.cjs');
const results=[];
function test(name,fn){fn();results.push(name);}
function advance(m,ms,lane=0){const events=[];for(let t=0;t<ms;t+=20)events.push(...m.advance(Math.min(20,ms-t),{lane}));return events;}
function open(m,lane=0){advance(m,m.warning+600,lane);}

test('Oito guardiões anunciam salvas por 2 s e mantêm rotas de fuga',()=>{
  for(let phase=1;phase<=8;phase++){
    const m=new QuantumBoss(phase);
    for(let round=0;round<20;round++){
      assert.ok(m.warning>=2000);
      const blocked=new Set(m.pulses.flatMap(p=>p.lanes));assert.ok(blocked.size<=5,'Ao menos duas trilhas devem ficar fora das salvas');
      const events=advance(m,1900);assert.equal(events.some(e=>e.type==='pulse'),false);
      advance(m,m.period-1900);
    }
  }
});
test('Sentinela exige canal abaixo de 8% e relés em sequência',()=>{
  const m=new QuantumBoss(1);open(m);assert.equal(m.hit(0,9),false);assert.equal(m.hit(1,0),false);
  assert.equal(m.hit(0,0),true);assert.equal(m.health,11);
  assert.equal(m.hit(0,0),false,'Uma colisão não pode aplicar dano várias vezes no mesmo instante');
});
test('Observador só revela e aceita dano na sonda verdadeira após a varredura',()=>{
  const m=new QuantumBoss(2);assert.equal(m.hit(0,0),false);open(m);
  const decoy=m.targets().find(n=>n.id===-1),real=m.targets().find(n=>n.open);
  assert.equal(m.hit(decoy.id,0,decoy.lane),false);assert.equal(m.hit(real.id,0,real.lane),true);
});
test('Tríade permite que H atinja três núcleos diferentes na mesma abertura',()=>{
  const m=new QuantumBoss(3);open(m);for(const n of m.targets())assert.equal(m.hit(n.id,0,n.lane),true);
  assert.deepEqual(m.hp,[7,7,7]);
});
test('Bell compartilha dano, mas o lado protegido não recebe acertos',()=>{
  const m=new QuantumBoss(4);open(m);assert.equal(m.hit(1,0,5),false);assert.equal(m.hit(0,0,1),true);assert.deepEqual(m.hp,[15,15]);
  advance(m,m.period);assert.equal(m.targets().find(n=>n.open).lane,5);
  const final=new QuantumBoss(8);open(final);assert.equal(final.hit(0,0,5),false);assert.equal(final.hit(0,0,1),true);assert.equal(final.health,34);
});
test('Faixa verde restaura coerência e reabre o escudo',()=>{
  const m=new QuantumBoss(5);open(m,6);advance(m,1600,6);
  assert.ok(m.coherence<35);assert.equal(m.targets().some(n=>n.open),false);
  advance(m,1200,m.zone[0]);assert.ok(m.coherence>=35);assert.equal(m.targets().some(n=>n.open),true);
});
test('Síndrome identifica módulo danificado sem permitir dano nos outros',()=>{
  const m=new QuantumBoss(6);open(m);assert.match(m.hint(0),/TRILHA 6/);assert.equal(m.hit(0,0,1),false);
  for(let i=0;i<5;i++){m.hit(2,0,5);advance(m,150);}
  assert.equal(m.hp[2],0);assert.match(m.hint(0),/TRILHA 2/);
});
test('Interferômetro tem duas salvas e só abre após ambas',()=>{
  const m=new QuantumBoss(7);const events=advance(m,3400);
  assert.equal(events.filter(e=>e.type==='pulse').length,2);assert.equal(m.targets().some(n=>n.open),false);
  advance(m,100);assert.equal(m.targets().some(n=>n.open),true);
});
test('Nave-mãe passa por três estágios com um novo aviso antes de cada um',()=>{
  const m=new QuantumBoss(8);open(m);
  for(let i=0;i<6;i++){m.hit(0,0,1);advance(m,150);}
  assert.equal(m.stage,1);assert.ok(m.elapsed<2000);assert.equal(m.stabilizing,true);
  m.hp=[12];m.roundStart=m.time;m.prepareRound(3);assert.equal(m.stage,2);assert.equal(m.pulses.length,2);
});
test('Escudo absorve um golpe, protege por 1,4 s e depois a nave fica vulnerável',()=>{
  const g=makeGame();g.run('takeHullHit("teste",100)');assert.equal(g.run('isPlaying'),true);assert.equal(g.run('hullShield'),0);
  g.run('takeHullHit("teste",100)');assert.equal(g.run('isPlaying'),true);
  g.run('gameTime=1500;takeHullHit("teste",100)');assert.equal(g.run('isPlaying'),false);
  assert.equal(g.elements.get('btnRetry').hidden,false);
});
test('Pausa congela guardião, salvas e cápsulas e retomada mantém um único loop',()=>{
  const g=makeGame();g.run('score=100;update(100);continuePhase();update(100);update(120);');
  const time=g.run('boss.model.time');g.press('Escape');g.run('update(99999)');assert.equal(g.run('boss.model.time'),time);
  g.press('Escape');assert.equal(g.run('isPaused'),false);
});
test('Repetir fase restaura seu início e preserva apenas os guardiões anteriores',()=>{
  const g=makeGame();g.run('score=340;bossesDefeated=3;missed=4;enterPhase(4);continuePhase();score=400;missed=9;gameOver("teste");retryPhase()');
  assert.equal(g.run('level'),4);assert.equal(g.run('score'),340);assert.equal(g.run('missed'),4);assert.equal(g.run('bossesDefeated'),3);
  assert.equal(g.run('bossCleared.filter(Boolean).length'),3);assert.equal(g.run('boss'),null);assert.equal(g.run('hullShield'),1);
});
test('ENTER em um botão de retomada preserva a ação nativa em vez de reiniciar a campanha',()=>{
  const g=makeGame();g.run('level=5;score=460;enterPhase(5);continuePhase();gameOver("teste")');
  g.press('Enter',{closest:()=>true});assert.equal(g.run('isPlaying'),false);
  g.run('retryPhase()');assert.equal(g.run('level'),5);assert.equal(g.run('score'),460);
});
test('Guardião impede ondas comuns e a vitória repara dois impactos uma única vez',()=>{
  const g=makeGame();g.run('score=100;missed=5;beginBoss();continuePhase();gameTime=99999;nextAsteroidAt=0;update(100)');
  assert.equal(g.run('asteroids.length+clouds.length+spies.length'),0);
  g.run('finishBoss()');assert.equal(g.run('level'),1,'Não deve avançar antes de vencer');
  g.run('boss.status="won";finishBoss();finishBoss()');assert.equal(g.run('level'),2);assert.equal(g.run('missed'),3);assert.equal(g.run('bossesDefeated'),1);
});
test('Ficar parado não vence o guardião: duas salvas sem desvio encerram o combate',()=>{
  const g=makeGame();g.run('level=2;score=220;beginBoss();continuePhase();let idleTime=100;for(let i=0;i<700&&isPlaying;i++){cancelAnimationFrame(rafId);idleTime+=FRAME_MS;update(idleTime);}');
  assert.equal(g.run('isPlaying'),false);assert.equal(g.run('bossesDefeated'),0);
});
test('Ondas triplas e rochas rápidas mantêm limites de trilha e velocidade',()=>{
  const g=makeGame();g.sandbox.Math.random=()=>0;
  g.run('level=6;phaseWaveCount=3;nextAsteroidAt=0;spawnAsteroids()');
  assert.equal(g.run('asteroids.length'),3);assert.ok(g.run('asteroids.every(a=>a.x>0&&a.x<width)'));
  g.run('level=2;asteroids=[];nextAsteroidAt=0;spawnAsteroids()');assert.equal(g.run('asteroids.some(a=>a.rush)'),true);
});

console.log(JSON.stringify({passed:results.length,tests:results},null,2));
