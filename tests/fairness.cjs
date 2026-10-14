const assert=require('node:assert/strict');
const {OrbitalArena,LanePilot}=require('../arena.js');
const {QuantumBoss}=require('../boss-model.js');
const {makeGame}=require('./gameplay.cjs');
const {flyCampaign}=require('./balance.cjs');
const results=[];
function test(name,fn){fn();results.push(name);}
function near(a,b){assert.ok(Math.abs(a-b)<1e-7,a+' ≠ '+b);}

test('Escala de queda é contínua em 620 px e mantém as velocidades das telas altas',()=>{
  near(OrbitalArena.flightScale(800),1);near(OrbitalArena.flightScale(700),.875);
  near(OrbitalArena.flightScale(620),.775);
  assert.ok(Math.abs(OrbitalArena.flightScale(619.999)-.775)<.00001);
  for(const h of [360,390,480])assert.ok(OrbitalArena.flightScale(h)<h/800);
  assert.ok(OrbitalArena.flightScale(1)>0);assert.equal(OrbitalArena.flightScale(4000),1.3);
});

test('Rocha mais rápida oferece ao menos 1,4 s até contato, além do aviso da formação',()=>{
  for(const [w,h]of [[1600,900],[1100,800],[390,700],[844,390],[760,360]]) {
    const g=makeGame(w,h);
    assert.ok(g.run('(shipY+30-Math.min(32,laneWidth*.3)-shipSize*.7)/flightSpeed(missionPhases[7].speed*1.22)*FRAME_MS')>=1400);
    assert.equal(g.run('encounterDirector.warningMs'),900);
  }
});

test('Rotação para paisagem conserva o tempo até a nave, sem aproximar perigos por surpresa',()=>{
  const g=makeGame(390,844);
  g.run('asteroids=[{x:100,y:shipY-180,speed:flightSpeed(5),radius:13,hp:1,group:null}];let before=(shipY-asteroids[0].y)/asteroids[0].speed;window.innerWidth=844;window.innerHeight=390;resizeCanvas()');
  near(g.run('(shipY-asteroids[0].y)/asteroids[0].speed'),g.run('before'));
  g.run('window.innerWidth=390;window.innerHeight=844;resizeCanvas()');
  near(g.run('(shipY-asteroids[0].y)/asteroids[0].speed'),g.run('before'));
});

test('Rotação mantém frente já passada abaixo da nave e reposiciona emissores estáticos',()=>{
  const g=makeGame(390,844);
  g.run('interferenceFront={y:shipY+20,passed:true,lanes:[1],followUp:{y:shipY-140,passed:false,lanes:[2]}};clouds=[{...makeCloud(0,shipY-16),heldAt:100}];drones=[{x:100,y:300,radius:13}];scout={x:200,y:300};window.innerWidth=844;window.innerHeight=390;resizeCanvas()');
  assert.ok(g.run('interferenceFront.y>shipY&&interferenceFront.followUp.y<shipY'));
  assert.equal(g.run('drones[0].y'),190);assert.equal(g.run('scout.y'),185);
  assert.equal(g.run('clouds[0].y'),g.run('shipY-16'));
});

test('Limpeza de encontro espera a borda inteira de nuvens e pulsos passar pela nave',()=>{
  const g=makeGame();
  g.run('clouds=[makeCloud(0,shipY+20)];spies=[]');assert.equal(g.run('encounterFieldClear()'),false);
  g.run('clouds[0].y=shipY+clouds[0].radius+shipSize*.7+1');assert.equal(g.run('encounterFieldClear()'),true);
  g.run('spies=[{x:50,y:shipY+20,radius:30}]');assert.equal(g.run('encounterFieldClear()'),false);
  g.run('spies[0].y=shipY+30*1.6+shipSize*.7+1');assert.equal(g.run('encounterFieldClear()'),true);
});

test('Frente B pendente e último meteoro ainda bloqueiam o chefe após passar a frente A',()=>{
  const g=makeGame();
  g.run('interferenceFront={y:shipY+1,passed:true,followUp:{y:95,passed:false}}');assert.equal(g.run('encounterFieldClear()'),false);
  g.run('interferenceFront.followUp.y=shipY+1;interferenceFront.followUp.passed=true');assert.equal(g.run('encounterFieldClear()'),true);
  g.run('asteroids=[{x:50,y:earthTop+20,hp:1,radius:20,speed:0,group:null}];missed=11;encounterDirector.state="complete";update(100)');
  assert.equal(g.run('isPlaying'),false);assert.equal(g.run('lastFailure.cause.kind'),'earth');
});

test('Limpeza não apaga caudas cosméticas nem libera ameaças ainda em contato',()=>{
  const g=makeGame();g.run('clouds=[makeCloud(0,shipY+100)];let saved=clouds[0]');
  assert.equal(g.run('encounterFieldClear()'),true);assert.equal(g.run('clouds[0]===saved'),true);
  g.run('clouds[0].y=shipY-16;clouds[0].heldAt=gameTime');assert.equal(g.run('encounterFieldClear()'),false);
  g.run('clouds=[];drones=[{hp:1}]');assert.equal(g.run('encounterFieldClear()'),false);
});

test('Rotas reais de salvas toleram leitura em 400/600 ms, a 30/60 fps e de qualquer trilha',()=>{
  let routes=0;
  for(const lanes of [7,9])for(let phase=1;phase<=8;phase++)for(let round=0;round<6;round++)
    for(let initial=0;initial<lanes;initial++)for(const reaction of [400,600])for(const fps of [30,60]) {
      const m=new QuantumBoss(phase,initial,lanes),pilot=new LanePilot(lanes);pilot.reset(initial);m.round=round;
      if(round%2)m.hp=m.hp.map(h=>Math.ceil(h/2));
      if(phase===8)m.hp=[[36],[24],[12]][round%3];m.prepareRound(initial);
      let lastAt=0,planned=null,destination=initial;
      const end=m.period-1,dt=1000/fps;
      while(m.time+dt<end) {
        const next=m.pulses.find(p=>!p.fired);
        if(next&&!next.tracking&&m.time>=Math.max(lastAt,next.lockAt??next.announceAt)+reaction&&planned!==next.id) {
          destination=m.lanes.filter(l=>!next.lanes.includes(l)).sort((a,b)=>Math.abs(a-pilot.position)-Math.abs(b-pilot.position))[0];
          planned=next.id;
        }
        if(!pilot.moving&&pilot.lane!==destination)pilot.move(Math.sign(destination-pilot.lane));
        pilot.advance(dt);
        for(const event of m.advance(dt,{lane:Math.round(pilot.position),position:pilot.position}))if(event.type==='pulse') {
          assert.equal(event.lanes.includes(Math.round(pilot.position)),false,JSON.stringify({phase,round,initial,reaction,fps,event}));
          near(pilot.position,Math.round(pilot.position));lastAt=m.time;
        }
      }
      routes++;
    }
  assert.equal(routes,3072);
});

test('Piloto não conhece a sonda verdadeira enquanto o jogo mostra interrogação',()=>{
  const g=makeGame();g.run('level=2;beginBoss();continuePhase()');
  g.run('('+flyCampaign.toString()+')(519,1,false)');
  assert.equal(g.run('currentLane'),4);
});

test('Imobilidade não completa a campanha, mesmo com disparos automáticos e R permitido',()=>{
  for(const [w,h]of [[1600,900],[390,700]]) {
    const g=makeGame(w,h),r=g.run('('+flyCampaign.toString()+')(519,6000,true,{idle:true})');
    assert.equal(r.won,false);assert.equal(r.outcome,'defeat');assert.equal(r.guardians,0);
  }
});

test('Ignorar o canal não evita ruído nem compensa inversões; renovar no alerta é imediato',()=>{
  for(const qber of [0,10]){
    const g=makeGame();g.run('qber='+qber+';clouds=[makeCloud(4,shipY-30)]');
    g.run('('+flyCampaign.toString()+')(519,1,true,{channel:"ignore"})');
    assert.equal(g.run('currentLane'),4);assert.equal(g.run('isRegen'),false);
  }
  for(const channel of ['ignore','alert']){
    const g=makeGame();g.run('qber=8;isCompromised=true;compEnd=10000;clouds=[];asteroids=[{x:6.5*laneWidth,y:0,radius:10,hp:1,speed:1,group:null}]');
    g.run('('+flyCampaign.toString()+')(519,1,true,{channel:'+JSON.stringify(channel)+'})');
    if(channel==='ignore')assert.equal(g.run('currentLane'),3,'Comando invertido não é compensado');
    else assert.equal(g.run('isRegen'),true,'R começa sem aguardar respiro');
  }
});

test('Ignorar emissores remove drones das prioridades mesmo sem meteoros no campo',()=>{
  for(const strategy of ['balanced','ignoreEmitters']){
    const g=makeGame();g.run('const originalReset=resetEncounters;resetEncounters=(...args)=>{originalReset(...args);drones=[{x:6.5*laneWidth,y:200,radius:13,hp:2,expiresAt:6500,noisePerSecond:.7}];}');
    g.run('('+flyCampaign.toString()+')(519,1,true,{strategy:'+JSON.stringify(strategy)+'})');
    assert.equal(g.run('currentLane'),strategy==='balanced'?5:4);
  }
});

console.log(JSON.stringify({passed:results.length,tests:results},null,2));
