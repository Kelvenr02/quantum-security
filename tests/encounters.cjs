const assert=require('node:assert/strict');
const {EncounterDirector,buildEncounters}=require('../encounters.js');
const {makeGame}=require('./gameplay.cjs');
const results=[];
function test(name,fn){fn();results.push(name);}
function near(a,b){assert.ok(Math.abs(a-b)<1e-7,a+' ≠ '+b);}
function setup(g,phase=5){g.run(`level=${phase};resetEncounters();nextCloudAt=nextSpyAt=nextPickupAt=nextInterferenceAt=1e9;encounterDirector.nextAt=1e9;lastTs=100;`);}
function actor(g,kind){g.run(`let packet=encounterDirector.plan.flat().find(p=>p.actors.some(a=>a.kind==='${kind}'));let chosen=packet.actors.find(a=>a.kind==='${kind}');encounterDirector.outstanding.add(chosen.energyId);spawnFormation({actors:[chosen]});`);}

test('Roteiros reproduzíveis e variantes independem dos sorteios visuais',()=>{
  assert.deepEqual(buildEncounters(8,519),buildEncounters(8,519));
  const variants=new Set(Array.from({length:100},(_,i)=>JSON.stringify(buildEncounters(8,i*9271))));assert.ok(variants.size>=4);
  for(let phase=1;phase<=8;phase++)for(let seed=0;seed<20;seed++){
    const plan=buildEncounters(phase,seed),actors=plan.flat().flatMap(p=>p.actors);
    assert.equal(plan.length,3);assert.equal(new Set(actors.map(a=>a.energyId)).size,actors.length);
    assert.ok(actors.every(a=>a.lane>=0&&a.lane<9));
    assert.equal(actors.filter(a=>a.kind==='scout').length,phase>=2?2:0);
    assert.equal(actors.filter(a=>a.kind==='drone').length,phase>=3?2:0);
    assert.equal(actors.filter(a=>a.kind==='split').length,phase>=5?2:0);
  }
});
test('Diretor exige aviso, resolução de cada ameaça e limpeza dos três encontros',()=>{
  for(let phase=1;phase<=8;phase++){
    const d=new EncounterDirector(phase,{interval:800},519);let now=0,starts=0,clears=0,warnings=0;
    while(!d.complete&&now<180000){
      const before=d.pending;
      const events=d.step(now,()=>true,true);
      if(!before&&d.pending)warnings++;
      for(const e of events){
        if(e.type==='encounter')starts++;
        if(e.type==='cleared')clears++;
        if(e.type==='spawn'){
          assert.ok(before&&now>=before.releaseAt);
          for(const a of e.packet.actors){d.resolve(a.energyId);d.resolve(a.energyId);}
        }
      }
      now+=50;
    }
    assert.equal(d.complete,true);assert.equal(d.progress,1);assert.equal(starts,3);assert.equal(clears,3);
    assert.equal(warnings,d.plan.flat().length);assert.equal(d.resolved,d.totalUnits);
  }
});
test('Orçamento adia formações sem descartá-las nem avançar a carga',()=>{
  const d=new EncounterDirector(8,{interval:800},519);
  d.step(800,()=>false,true);assert.equal(d.packetIndex,0);assert.equal(d.progress,0);
  d.step(920,()=>true,true);assert.equal(d.packetIndex,1);assert.equal(d.pending.releaseAt,1820);
  const g=makeGame();setup(g,8);actor(g,'split');
  assert.equal(g.run('formationFits(encounterDirector.plan[0][0])'),false);
  g.run('asteroids=[];drones=[{hp:6}]');assert.equal(g.run('formationFits(encounterDirector.plan[0][0])'),false);
});
test('Pontos ou carga na meta não apagam perigos nem iniciam o guardião',()=>{
  const g=makeGame();g.run('score=100;combatScore=99999;asteroids=[{x:50,y:200,radius:20,speed:0,hp:1,group:null}];clouds=[makeCloud(7,200)];update(100)');
  assert.equal(g.run('boss'),null);assert.equal(g.run('asteroids.length'),1);assert.equal(g.run('clouds.length'),1);
  g.run('encounterDirector.state="complete";encounterDirector.resolved=encounterDirector.totalUnits;update(110)');assert.equal(g.run('boss'),null);
  g.run('asteroids=[];clouds=[];update(120)');assert.equal(g.run('boss.status'),'briefing');
});
test('O último impacto continua fatal mesmo com a carga completa',()=>{
  const g=makeGame();g.run('encounterDirector.state="complete";encounterDirector.resolved=encounterDirector.totalUnits;score=100;missed=11;asteroids=[{x:50,y:earthTop+30,radius:20,speed:0,hp:1,group:null}];update(100)');
  assert.equal(g.run('isPlaying'),false);assert.equal(g.run('missed'),12);assert.equal(g.run('boss'),null);
});
test('Carga mede resoluções; pontos recompensam somente destruições',()=>{
  const g=makeGame();g.run('let a=encounterDirector.plan[0][0].actors[0];encounterDirector.outstanding.add(a.energyId);spawnFormation({actors:[a]});destroyQuantumAsteroid(asteroids[0])');
  assert.equal(g.run('combatScore'),10);assert.equal(g.run('encounterDirector.resolved'),1);assert.ok(g.run('score>0&&score<100'));
  g.run('resolveThreat(a)');assert.equal(g.run('encounterDirector.resolved'),1);
});
test('Drone aquece, emite ruído e exige seus acertos antes de parar a emissão',()=>{
  const g=makeGame();setup(g,3);actor(g,'drone');
  g.run('gameTime=700;updateEncounterActors(42)');assert.equal(g.run('qber'),0);
  g.run('gameTime=1800;updateEncounterActors(60)');near(g.run('qber'),.65);
  g.run('lasers=[{x:drones[0].x,y:drones[0].y,radius:4}];updateEncounterActors(0)');assert.equal(g.run('drones[0].hp'),1);
  g.run('lasers=[{x:drones[0].x,y:drones[0].y,radius:4}];updateEncounterActors(0)');assert.equal(g.run('drones.length'),0);assert.equal(g.run('combatScore'),25);
  g.run('gameTime=2800;updateEncounterActors(60)');near(g.run('qber'),.65);assert.equal(g.run('encounterDirector.resolved'),1);
});
test('Drone não sobrepõe outra sonda; fuga resolve sem pontos e encerra o ruído',()=>{
  const g=makeGame();setup(g,6);actor(g,'drone');assert.equal(g.run('drones[0].hp'),3);
  assert.equal(g.run("formationFits({actors:[{kind:'scout',hp:0}]})"),false);
  g.run('gameTime=6500;updateEncounterActors(0)');assert.equal(g.run('drones.length'),0);assert.equal(g.run('combatScore'),0);assert.equal(g.run('encounterDirector.resolved'),1);
});
test('Sonda acompanha a posição física, fixa a mira e permite desviar depois',()=>{
  const g=makeGame();setup(g,2);actor(g,'scout');
  g.run('currentLane=1;shipPilot.reset(1);gameTime=500;updateEncounterActors(0)');near(g.run('scout.x'),g.run('shipCenterX()'));
  g.run('gameTime=1100;updateEncounterActors(0);currentLane=3;shipPilot.reset(3);gameTime=1500;updateEncounterActors(0)');assert.equal(g.run('scout.lane'),1);
  g.run('gameTime=2000;updateEncounterActors(0)');assert.equal(g.run('qber'),0);assert.equal(g.run('hullShield'),1);
  g.run('gameTime=2350;updateEncounterActors(0)');assert.equal(g.run('scout'),null);assert.equal(g.run('encounterDirector.resolved'),1);
});
test('Pulso da sonda soma 5 pp uma só vez, sem dano físico; R descarta o contato',()=>{
  for(const regen of [false,true]){
    const g=makeGame();setup(g,2);actor(g,'scout');g.run('gameTime=1100;updateEncounterActors(0)');
    if(regen)g.run('tryRegen()');
    g.run('gameTime=2000;updateEncounterActors(0);updateEncounterActors(0)');assert.equal(g.run('qber'),regen?0:5);assert.equal(g.run('hullShield'),1);
  }
});
test('Interceptar o meteoro rachado cedo evita a divisão e rende 15 pontos',()=>{
  const g=makeGame();setup(g);actor(g,'split');g.run('destroyQuantumAsteroid(asteroids[0])');assert.equal(g.run('combatScore'),15);assert.equal(g.run('asteroids.length'),0);assert.equal(g.run('encounterDirector.resolved'),1);
});
test('Fragmentos compartilham uma unidade de carga até resolver ambos',()=>{
  const g=makeGame();setup(g);actor(g,'split');g.run('asteroids[0].y=asteroids[0].splitY;splitAsteroid(asteroids[0])');
  assert.equal(g.run('asteroids.length'),2);assert.equal(g.run('asteroids[0].energyId===asteroids[1].energyId'),true);
  g.run('destroyQuantumAsteroid(asteroids[0])');assert.equal(g.run('encounterDirector.resolved'),0);assert.equal(g.run('combatScore'),5);
  g.run('destroyQuantumAsteroid(asteroids[0])');assert.equal(g.run('encounterDirector.resolved'),1);assert.equal(g.run('combatScore'),10);
});
test('Fragmentação é contínua, escalonada e deixa pelo menos 1,6 s até o contato',()=>{
  for(const [w,h]of [[1600,900],[1100,800],[390,844],[844,390]])for(const lane of [0,4,8]){
    const g=makeGame(w,h);setup(g);g.run(`let parent={x:(${lane}+.5)*laneWidth,y:Math.min(shipY-90,Math.max(210,height*.45)),radius:Math.min(32,laneWidth*.3),speed:flightSpeed(5),energyId:'test'};asteroids=[parent];splitAsteroid(parent)`);
    assert.equal(g.run('asteroids.every(a=>a.x===parent.x && a.toX>=a.radius && a.toX<=width-a.radius && !a.splittable)'),true);
    assert.ok(g.run('(shipY-asteroids[0].y-asteroids[0].radius-shipSize*.7)/asteroids[0].speed*FRAME_MS>=1600'));
    assert.equal(g.run('asteroids[0].y-asteroids[1].y'),75);
  }
});
test('Colisão varrida detecta laser rápido e alvo que cruza sua trajetória',()=>{
  const g=makeGame();assert.equal(g.run('laserTouchesEntity({x:200,y:100,previousY:300,radius:4},{x:200,y:200,radius:10},190)'),true);
  assert.equal(g.run('laserTouchesEntity({x:400,y:100,previousY:300,radius:4},{x:200,y:200,radius:10},190)'),false);
});
test('Frentes deixam corredor contíguo e alternam fuga alcançável em 1,2 s',()=>{
  const g=makeGame();setup(g,7);g.run('encounterDirector.index=2;encounterDirector.packetIndex=1;gameTime=6000;nextInterferenceAt=0;updateInterference(0)');
  assert.equal(g.run('interferenceFront.lanes.length'),6);assert.equal(g.run('interferenceFront.followUp.lanes.length'),6);
  assert.equal(g.run('interferenceFront.followUp.releaseAt-interferenceFront.releaseAt'),1200);
  g.run('let free=f=>Array.from({length:numLanes},(_,i)=>i).filter(i=>!f.lanes.includes(i));let first=free(interferenceFront),second=free(interferenceFront.followUp)');
  assert.equal(g.run('first[2]-first[0]'),2);assert.equal(g.run('second[2]-second[0]'),2);assert.ok(g.run('Math.min(...first.flatMap(a=>second.map(b=>Math.abs(a-b))))*OrbitalArena.stepMs<1200'));
  g.run('interferenceFront.y=earthTop+50;updateInterference(0)');assert.notEqual(g.run('interferenceFront'),null);
  g.run('interferenceFront.followUp.y=earthTop+50;updateInterference(0)');assert.equal(g.run('interferenceFront'),null);
});
test('Nuvens têm limite simultâneo e permanência breve sem travar o encontro',()=>{
  const g=makeGame();setup(g);g.run('clouds=Array.from({length:4},(_,i)=>makeCloud(i,200));nextCloudAt=0;spawnClouds()');assert.equal(g.run('clouds.length'),4);
  g.run('clouds=[makeCloud(0,shipY-17)];gameTime=1000;update(120)');near(g.run('clouds[0].y'),g.run('shipY-16'));
  g.run('update(140)');near(g.run('clouds[0].y'),g.run('shipY-16'));
  g.run('gameTime+=1200;update(160)');assert.ok(g.run('clouds[0].y>shipY-16'));
});
test('Respiro permite R e pausa congela mira, divisão e relógio dos encontros',()=>{
  const g=makeGame();setup(g,2);actor(g,'scout');g.run('encounterDirector.state="breather";encounterDirector.breatherUntil=1800;qber=8;updateQuantumStatus()');assert.equal(g.run('waveRecoveryAvailable()'),true);
  assert.match(g.elements.get('quantumStatus').textContent,/RESPIRO/);g.press('Escape');g.run('update(9000)');assert.equal(g.run('gameTime'),0);assert.equal(g.run('scout.state'),'tracking');g.press('Escape');
  g.run('gameTime=750');assert.equal(g.run('waveRecoveryAvailable()'),false);
});
test('Retomada preserva roteiro e pontos iniciais, sem acumular recompensas',()=>{
  const g=makeGame();g.run('combatScore=123;campaignSeed=519;enterPhase(5);let savedPlan=JSON.stringify(encounterDirector.plan);continuePhase();combatScore=999;gameOver("teste");retryPhase()');
  assert.equal(g.run('combatScore'),123);assert.equal(g.run('campaignSeed'),519);assert.equal(g.run('JSON.stringify(encounterDirector.plan)===savedPlan'),true);assert.equal(g.run('drones.length'),0);assert.equal(g.run('scout'),null);
});
test('Redimensionamento conserva rota dos fragmentos, drone e sonda',()=>{
  const g=makeGame();setup(g);actor(g,'split');g.run('asteroids[0].y=300;splitAsteroid(asteroids[0]);drones=[{x:550,y:300,radius:23}];scout={x:550,y:300};let from=asteroids[0].fromX,target=asteroids[0].toX;window.innerWidth=390;window.innerHeight=700;resizeCanvas()');
  near(g.run('asteroids[0].fromX'),g.run('from*390/1100'));near(g.run('asteroids[0].toX'),g.run('target*390/1100'));near(g.run('drones[0].x'),195);near(g.run('scout.y'),262.5);
});
console.log(JSON.stringify({passed:results.length,tests:results},null,2));
