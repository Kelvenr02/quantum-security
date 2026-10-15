const assert=require('node:assert/strict');
const {QuantumBoss}=require('../boss-model.js');
const {makeGame}=require('./gameplay.cjs');
const results=[];
function test(name,fn){fn();results.push(name);}
function advance(m,ms,lane=0){const events=[];for(let t=0;t<ms;t+=20)events.push(...m.advance(Math.min(20,ms-t),{lane,position:lane}));return events;}
function at(m,elapsed,lane=0){return advance(m,Math.max(0,elapsed-m.elapsed),lane);}

test('Cada salva tem aviso e corredor alcançável; rotas não exigem posição segura permanente',()=>{
  for(const lanes of [7,9])for(let phase=1;phase<=8;phase++)for(let r=0;r<12;r++){
    const m=new QuantumBoss(phase,0,lanes);m.round=r;
    if(r%2)m.hp=m.hp.map(h=>Math.ceil(h/2));
    if(phase===8)m.hp=[[36],[24],[12]][r%3];m.prepareRound(0);
    let from=m.lanes,last=0;
    for(const p of m.pulses){
      const safe=m.lanes.filter(l=>!p.lanes.includes(l));assert.ok(safe.length>=2);
      const available=p.at-Math.max(last,p.lockAt??p.announceAt);
      assert.ok(p.at-(p.lockAt??p.announceAt)>=2000);
      for(const lane of from)assert.ok(safe.some(s=>Math.abs(s-lane)*150+400<=available));
      from=safe;last=p.at;
    }
    assert.ok(m.period-m.recoveryStart>=2400);
    assert.ok(m.targets().every(n=>n.lane>=0&&n.lane<lanes));
  }
  const m=new QuantumBoss(7);assert.equal(m.lanes.some(l=>m.pulses.every(p=>!p.lanes.includes(l))),false);
});
test('Sentinela valida um relé por ciclo e fecha com QBER ≥ 8%',()=>{
  const m=new QuantumBoss(1);at(m,2800);assert.equal(m.hit(0,8,m.lane(1)),false);assert.equal(m.hit(1,0,m.lane(5)),false);
  assert.match(m.hint(8),/R no RESPIRO/,'Bloqueio informa como voltar a atacar');
  for(let i=0;i<4;i++){assert.equal(m.hit(0,0,m.lane(1)),true);advance(m,300);}
  assert.equal(m.health,8);assert.equal(m.hit(1,0,m.lane(5)),false);assert.match(m.hint(0),/RELÉ VALIDADO/);
  advance(m,m.period-m.elapsed);assert.equal(m.relay,1);assert.equal(m.pressure,true);assert.equal(m.pulses.length,2);
});
test('Observador rastreia por 650 ms e fixa a mira por pelo menos 2 s',()=>{
  const m=new QuantumBoss(2);advance(m,500,7);assert.equal(m.pulses[0].tracking,true);assert.ok(m.pulses[0].lanes.includes(7));
  advance(m,160,2);const locked=[...m.pulses[0].lanes];assert.equal(m.pulses[0].tracking,false);
  advance(m,500,6);assert.deepEqual(m.pulses[0].lanes,locked);assert.ok(m.pulses[0].at-m.pulses[0].lockAt>=2000);
});
test('Varredura revela uma entre três sondas; mudança da segunda metade é anunciada',()=>{
  const m=new QuantumBoss(2);assert.equal(m.targets().length,3);assert.ok(m.targets().every(n=>n.label==='?'));
  assert.doesNotMatch(m.hint(0),/TRILHA/,'Instrução não revela a sonda antes da varredura');
  at(m,3100);const real=m.targets().find(n=>n.open),fake=m.targets().find(n=>n.decoy);
  assert.equal(m.hit(fake.id,0,fake.lane),false);assert.equal(m.hit(real.id,0,real.lane),true);
  m.hp=[8];m.roundStart=m.time;m.prepareRound(real.lane);at(m,3400);assert.match(m.hint(0),/nova varredura/);
  const first=m.targets().find(n=>n.label==='✓').lane;at(m,4900);assert.notEqual(m.targets().find(n=>n.open).lane,first);
});
test('Erros de leitura causam ruído limitado; trânsito e disparos laterais não são punidos',()=>{
  const m=new QuantumBoss(2);at(m,3100);const fake=m.targets().find(n=>n.decoy);
  m.hit(fake.id,0,fake.lane);assert.equal(m.drainEvents().filter(e=>e.type==='noise').length,0);
  advance(m,700,fake.lane);m.hit(fake.id,0,fake.lane);m.hit(fake.id,0,fake.lane);
  const errors=m.drainEvents().filter(e=>e.type==='noise');assert.equal(errors.length,1);assert.equal(errors[0].amount,.8);
  advance(m,300,fake.lane);m.hit(fake.id,0,fake.lane);assert.equal(m.drainEvents().filter(e=>e.type==='noise').length,0);
});
test('Hadamard abre laterais e centro em momentos diferentes com sobreposição breve',()=>{
  const m=new QuantumBoss(3);at(m,3000);assert.deepEqual(m.targets().map(n=>n.open),[true,false,true]);
  at(m,4200);for(const n of m.targets())assert.equal(m.hit(n.id,0,n.lane),true);assert.deepEqual(m.hp,[7,7,7]);
  at(m,4700);assert.deepEqual(m.targets().map(n=>n.open),[false,true,false]);
});
test('Hadamard muda a formação após metade da vida com aviso de 2 s',()=>{
  const m=new QuantumBoss(3);m.hp=[4,4,4];m.prepareRound(4);at(m,2500);const next=m.nextTriadCenter;assert.notEqual(next,null);
  const old=m.triadCenter;at(m,4400);assert.equal(m.triadCenter,next);assert.notEqual(m.triadCenter,old);
});
test('Bell alterna lados no mesmo ciclo, compartilha dano e limita rajadas',()=>{
  const m=new QuantumBoss(4);at(m,2800);const first=m.targets().find(n=>n.open);
  assert.equal(m.hit(1-first.id,0),false);
  for(let i=0;i<3;i++){assert.equal(m.hit(first.id,0,first.lane),true);advance(m,300);}
  assert.equal(m.hit(first.id,0,first.lane),false);assert.deepEqual(m.hp,[13,13]);
  at(m,4800);assert.notEqual(m.targets().find(n=>n.open).lane,first.lane);
  m.hp=[8,8];m.roundStart=m.time;m.prepareRound(4);at(m,2800);const n=m.targets().find(n=>n.open);
  m.hit(n.id,0,n.lane);advance(m,300);m.hit(n.id,0,n.lane);advance(m,300);assert.equal(m.hit(n.id,0,n.lane),false);
});
test('Devorador anuncia mudanças de zona, mede posição física e exige 50% de coerência',()=>{
  const m=new QuantumBoss(5);at(m,m.period-1900,m.zone[0]);assert.ok(m.nextZone);const next=[...m.nextZone.lanes];
  advance(m,m.period-m.elapsed,m.zone[0]);assert.deepEqual(m.zone,next);
  at(m,3100,m.zone[0]);
  m.coherence=49;assert.equal(m.targets().some(n=>n.open),false);
  advance(m,200,m.zone[0]);assert.ok(m.coherence>=50);assert.equal(m.targets().some(n=>n.open),true);
  m.hp=[10];m.prepareRound(4);assert.equal(m.zone.length,1);assert.equal(m.pulses.length,3);
  const before=m.coherence;m.advance(50,{lane:m.zone[0],position:m.zone[0]+.49});assert.ok(m.coherence<before);
});
test('Síndrome muda entre ciclos e antecipa a segunda leitura durante a pressão',()=>{
  const m=new QuantumBoss(6);at(m,2800);assert.match(m.hint(0),/TRILHA 8/);assert.equal(m.hit(0,0,m.lane(1)),false);
  assert.equal(m.hit(2,0,m.lane(5)),true);
  advance(m,m.period-m.elapsed);assert.equal(m.selection,0);
  m.hp=[2,2,2];m.roundStart=m.time;m.prepareRound(4);at(m,3400);assert.notEqual(m.nextSelection,null);
  const next=m.nextSelection;at(m,4900);assert.equal(m.selection,next);assert.equal(m.targets().find(n=>n.open).lane,m.lane([1,3,5][next]));
});
test('Interferômetro abre antes de B e muda núcleo; pressão acrescenta C',()=>{
  const m=new QuantumBoss(7);at(m,3000);assert.equal(m.pulses[1].fired,false);assert.equal(m.targets().some(n=>n.open),true);
  const lane=m.targets().find(n=>n.open).lane;at(m,4500);assert.notEqual(m.targets().find(n=>n.open).lane,lane);
  m.hp=[10];m.prepareRound(4);assert.equal(m.pulses.length,3);assert.equal(m.pulses[2].at-m.pulses[1].at,2000);
  assert.deepEqual(m.pulses.map(p=>p.at-m.roundStart),[2200,4000,6000],'Avisar antes não antecipa nem atrasa os impactos');
  assert.ok(m.pulses.slice(1).every(p=>p.at-p.announceAt===2400),'B/C deixam mais tempo para ler a próxima rota');
  assert.ok(m.period-m.recoveryStart>=2400,'O respiro para R permanece disponível');
});
test('Nave-mãe combina Bell/QKD, H/coerência e síndrome/três rotas sem aumentar a vida',()=>{
  const m=new QuantumBoss(8);assert.equal(m.maxHp,36);at(m,2800);assert.equal(m.targets(9).some(n=>n.open),false);
  m.hp=[25];assert.equal(m.hit(0,0,m.targets(0).find(n=>n.open).lane),true);assert.equal(m.stage,1);assert.equal(m.elapsed,0);
  assert.equal(m.stabilizing,true);assert.equal(m.targets().length,3);assert.ok(m.pulses[0].at-m.time>=2200);
  m.hp=[13];at(m,4200,m.zone[0]);m.coherence=80;assert.equal(m.hit(0,0,m.targets().find(n=>n.open).lane),true);
  assert.equal(m.stage,2);assert.equal(m.pulses.length,3);assert.ok(m.pulses[0].at-m.time>=2200);
});
test('Disparos H podem atingir três núcleos finais distintos, sem dano repetido no mesmo alvo',()=>{
  const m=new QuantumBoss(8);m.hp=[24];m.prepareRound(4);at(m,4200,m.zone[0]);m.coherence=80;
  const nodes=m.targets();for(const n of nodes)assert.equal(m.hit(n.id,0,n.lane),true);assert.equal(m.health,21);
  assert.equal(m.hit(nodes[0].id,0,nodes[0].lane),false);
});
test('Mudança de comportamento não altera uma salva já anunciada',()=>{
  for(const phase of [1,2,3,4,5,6,7]){
    const m=new QuantumBoss(phase),before=JSON.stringify(m.pulses);m.hp=m.hp.map(h=>Math.floor(h/2));
    advance(m,50,4);assert.equal(JSON.stringify(m.pulses),before);assert.equal(m.pressure,false);
    advance(m,m.period-m.elapsed,4);assert.equal(m.pressure,true);
  }
});
test('Proteção física dos chefes é curta e não absorve uma segunda salva distinta',()=>{
  const g=makeGame();g.run('beginBoss();continuePhase();takeHullHit("A",100)');assert.equal(g.run('hullInvulUntil-gameTime'),450);
  g.run('gameTime=400;takeHullHit("A",100)');assert.equal(g.run('isPlaying'),true);
  g.run('gameTime=500;takeHullHit("B",100)');assert.equal(g.run('isPlaying'),false);
});
test('Ruído de leitura usa o canal real e é descartado durante R',()=>{
  for(const regen of [false,true]){
    const g=makeGame();g.run('level=2;beginBoss();continuePhase();boss.model.time=3300;boss.model.pulses.forEach(p=>p.fired=true);boss.model.playerLane=boss.model.lane(3);boss.model.stationaryMs=1000;currentLane=boss.model.lane(3);shipPilot.reset(currentLane);');
    if(regen)g.run('tryRegen()');
    g.run('lasers=[{x:shipCenterX(),y:bossArenaY(),previousY:bossArenaY()+1,radius:4}];updateBossBattle(0,shipCenterX())');
    assert.equal(g.run('qber'),regen?0:.8);assert.equal(g.run('hullShield'),1);
  }
});
test('Previsões mostram somente a mecânica do guardião correspondente',()=>{
  for(let phase=1;phase<=8;phase++){
    const m=new QuantumBoss(phase);m.hp=m.hp.map(h=>Math.ceil(h/2));m.prepareRound(4);at(m,3500);
    if(!m.stabilizing)assert.equal(m.nextZone,undefined);
    if(!m.syndrome)assert.equal(m.nextSelection,null);
    if(phase!==3)assert.equal(m.nextTriadCenter,null);
  }
});
test('Suprimentos exigem desvio e chegam por um corredor anunciado e alcançável',()=>{
  for(const phase of [3,6,8])for(let initial=0;initial<9;initial++){
    const g=makeGame();g.run('level='+phase+';beginBoss();continuePhase();');
    g.run('shipPilot.reset('+initial+');currentLane='+initial);
    if(phase===8)g.run('boss.model.hp=[24];boss.model.prepareRound('+initial+')');
    g.run('pickups=[];bossSupply()');
    assert.equal(g.run('pickups[0].type'),phase===6?'correction':'hadamard');
    assert.equal(g.run('laneOf(pickups[0])===occupiedShipLane()'),false);
    assert.equal(g.run('boss.model.pulses[0].lanes.includes(laneOf(pickups[0]))'),false);
    assert.ok(g.run('Math.abs(laneOf(pickups[0])-occupiedShipLane())*150+400<900+(shipY-pickups[0].y)/pickups[0].speed*FRAME_MS'));
  }
});

test('Coerência separa recuperação e ataque, inclusive com H, e permite investir e voltar',()=>{
  for(const lanes of [7,9])for(const phase of [5,8])for(let round=0;round<5;round++){
    const m=new QuantumBoss(phase,0,lanes);if(phase===8)m.hp=[24];m.round=round;m.prepareRound(0);
    const zone=m.zone[0],target=m.attackLane;
    assert.ok(m.targets().every(n=>m.zone.every(l=>Math.abs(n.lane-l)>1)),'H não ataca permanecendo na zona');
    at(m,2600,zone);assert.equal(m.coherence,100);
    advance(m,Math.abs(target-zone)*150,target);const reserve=m.coherence;
    assert.ok(reserve>=80,'Há reserva para travessia e investida');
    for(let i=0;i<3;i++){assert.equal(m.hit(m.targets().find(n=>n.open).id,0,m.targets().find(n=>n.open).lane),true);advance(m,300,target);}
    assert.ok(m.coherence>=50);advance(m,Math.abs(target-zone)*150,zone);const before=m.coherence;
    advance(m,900,zone);assert.ok(m.coherence>before,'Retorno permite recuperar sem redefinir o canal');
  }
});

test('Métricas guardam aberturas sem dano e atribuem dano ao estágio anterior à mudança',()=>{
  const g=makeGame();g.run('level=8;beginBoss();continuePhase();boss.model.time=2800;boss.model.pulses.forEach(p=>p.fired=true);updateBossBattle(0,shipCenterX())');
  assert.equal(g.run('campaignMetrics.segment.openings[0].damage'),0);
  g.run('boss.model.hp=[25];qber=0;let node=boss.model.targets().find(n=>n.open);lasers=[{x:(node.lane+.5)*laneWidth,y:bossArenaY(),previousY:bossArenaY()+1}];updateBossBattle(0,shipCenterX())');
  assert.equal(g.run('boss.model.stage'),1);
  assert.equal(g.run('campaignMetrics.segment.openings[0].stage'),1);
  assert.equal(g.run('campaignMetrics.segment.openings[0].damage'),1);
  assert.equal(g.run('campaignMetrics.segment.openings[0].hits'),1);
  g.run('gameOver("teste");retryCheckpoint();continuePhase();boss.model.time=2800;boss.model.pulses.forEach(p=>p.fired=true);updateBossBattle(0,shipCenterX())');
  assert.equal(g.run('window.quantumDiagnostics.previous().at(-1).phases[8].boss.openings[0].damage'),1);
  assert.equal(g.run('campaignMetrics.segment.openings.length'),1);
  assert.equal(g.run('campaignMetrics.segment.openings[0].damage'),0);
  assert.equal(g.run('campaignMetrics.segment.openings[0].attempt'),1);
  assert.equal(g.run('window.quantumDiagnostics.snapshot().schemaVersion'),3);
});

test('Entrada do chefe tem som próprio e não emite comprometimento do canal',()=>{
  const g=makeGame();g.run('let cues=[];gameAudio.sfx=name=>cues.push(name);beginBoss();continuePhase()');
  assert.equal(g.run('cues.includes("bossEntry")'),true);assert.equal(g.run('cues.includes("compromised")'),false);
});
test('R carregado para a entrada preserva 400 ms de reação antes da primeira salva',()=>{
  for(let phase=1;phase<=8;phase++){
    const g=makeGame();g.run('level='+phase+';tryRegen();beginBoss();continuePhase()');
    assert.ok(g.run('boss.model.pulses[0].at-boss.model.time>=regenEnd-gameTime+400'));
  }
});
test('Vitória cancela ataques pendentes e não deixa uma salva C atingir depois',()=>{
  const g=makeGame();g.run('level=7;beginBoss();continuePhase();boss.model.hp=[1];boss.model.time=3000;boss.model.pulses.forEach(p=>p.fired=true);lasers=[{x:(boss.model.targets().find(n=>n.open).lane+.5)*laneWidth,y:bossArenaY(),previousY:bossArenaY()+1,radius:4}];updateBossBattle(0,shipCenterX())');
  assert.equal(g.run('boss.status'),'won');assert.equal(g.run('boss.channelPulse'),null);
  g.run('boss.model.pulses.forEach(p=>p.fired=false);boss.model.time=6500;updateBossBattle(1,shipCenterX())');assert.equal(g.run('hullShield'),1);
});
test('Escudo absorve um golpe, protege por 1,4 s e depois a nave fica vulnerável',()=>{
  const g=makeGame();g.run('takeHullHit("teste",100)');assert.equal(g.run('isPlaying'),true);assert.equal(g.run('hullShield'),0);
  g.run('takeHullHit("teste",100)');assert.equal(g.run('isPlaying'),true);
  g.run('gameTime=1500;takeHullHit("teste",100)');assert.equal(g.run('isPlaying'),false);
  assert.equal(g.elements.get('btnRetry').hidden,false);
});
test('Pausa congela guardião, salvas e cápsulas e retomada mantém um único loop',()=>{
  const g=makeGame();g.run('score=100;beginBoss();continuePhase();update(100);update(120);');
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
  const g=makeGame();g.run('score=100;missed=5;beginBoss();continuePhase();gameTime=99999;update(100)');
  assert.equal(g.elements.get('bossInstructions').hidden,false);assert.equal(g.elements.get('phaseScienceDetails').open,false);
  assert.equal((g.elements.get('bossInstructions').innerHTML.match(/<li>/g)||[]).length,3);
  assert.equal(g.run('asteroids.length+clouds.length+spies.length'),0);
  g.run('finishBoss()');assert.equal(g.run('level'),1,'Não deve avançar antes de vencer');
  g.run('boss.status="won";finishBoss();finishBoss()');assert.equal(g.run('level'),2);assert.equal(g.run('missed'),3);assert.equal(g.run('bossesDefeated'),1);
  assert.equal(g.elements.get('bossInstructions').hidden,true);assert.equal(g.elements.get('phaseScienceDetails').open,true);
});
test('Ficar parado não vence o guardião: duas salvas sem desvio encerram o combate',()=>{
  const g=makeGame();g.run('level=2;score=220;beginBoss();continuePhase();let idleTime=100;for(let i=0;i<1000&&isPlaying;i++){cancelAnimationFrame(rafId);idleTime+=FRAME_MS;update(idleTime);}');
  assert.equal(g.run('isPlaying'),false);assert.equal(g.run('bossesDefeated'),0);
});
test('Ondas triplas e rochas rápidas mantêm limites de trilha e velocidade',()=>{
  const g=makeGame();g.sandbox.Math.random=()=>0;
  g.run('level=6;resetEncounters();spawnFormation(encounterDirector.plan[2][4])');
  assert.equal(g.run('asteroids.length'),3);assert.ok(g.run('asteroids.every(a=>a.x>0&&a.x<width)'));
  g.run('level=2;resetEncounters();asteroids=[];spawnFormation(encounterDirector.plan[0][1])');assert.equal(g.run('asteroids.some(a=>a.rush)'),true);
});

console.log(JSON.stringify({passed:results.length,tests:results},null,2));
