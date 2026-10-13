const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const ids = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
assert.equal(new Set(ids).size, ids.length, 'IDs da interface devem ser únicos');
const scripts = ['phases.js','script.js','quantum.js','presentation.js'];

function makeGame(viewWidth = 1100, viewHeight = 800) {
  const listeners = {}, frames = new Map(); let frameId = 0;
  const noop = () => {};
  const ctx = new Proxy({}, {get: (o,k) => o[k] || (k.startsWith('create') ? () => ({addColorStop:noop}) : noop), set: (o,k,v) => (o[k]=v,true)});
  const element = id => ({id,style:{},hidden:false,disabled:false,dataset:{},textContent:'',innerText:'',innerHTML:'',focus:noop,blur:noop,appendChild:noop,setPointerCapture:noop,addEventListener:noop,getContext:()=>ctx,querySelectorAll:()=>[]});
  const elements = new Map(ids.map(id => [id,element(id)]));
  const sandbox = {
    console, Map, Math:Object.create(Math), setTimeout:callback=>callback(),
    requestAnimationFrame:callback=>{frames.set(++frameId,callback);return frameId},cancelAnimationFrame:id=>frames.delete(id),
    window:{innerWidth:viewWidth,innerHeight:viewHeight,devicePixelRatio:1,addEventListener:(type,fn)=>(listeners[type] ||= []).push(fn)},
    document:{hidden:false,getElementById:id=>{assert.ok(elements.has(id),'Elemento ausente: '+id);return elements.get(id)},createElement:()=>element(''),addEventListener:noop},
    seededRandom:()=>()=>.5,makeSpaceBackdrop:()=>({}),drawGlow:noop,drawDebris:noop,drawInterceptor:noop,drawAsteroid:noop,drawEnergyBolt:noop,drawQuantumCloud:noop,drawSpyPulse:noop,
    emitDebris:noop,spaceBackdrop:null,particles:[],introActive:false,renderScene:noop
  };
  const context = vm.createContext(sandbox);
  for (const file of scripts) vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
  const run = code => vm.runInContext(code,context);
  const press = code => listeners.keydown.forEach(fn=>fn({code,preventDefault:noop}));
  run('arcadeActive=true; startGame();');
  return {run,press,elements,frames,sandbox};
}
const results=[];
function test(name,fn){fn();results.push(name)}

test('Limiares exatos das oito fases e meta original de 1.000 pontos',()=>{
  const g=makeGame();
  const pairs=[[0,1],[99,1],[100,2],[219,2],[220,3],[339,3],[340,4],[459,4],[460,5],[579,5],[580,6],[719,6],[720,7],[859,7],[860,8],[1000,8]];
  for(const [score,level] of pairs) assert.equal(g.run('phaseForScore('+score+')'),level);
  assert.equal(g.run('winScore'),1000);
});
test('Todas as fases aumentam a velocidade e a frequência de ondas',()=>{
  const g=makeGame();assert.equal(g.run('missionPhases.every((p,i)=>!i || (p.speed>missionPhases[i-1].speed && p.interval<missionPhases[i-1].interval))'),true);
});
test('Briefing congela tempo, recarga e ameaças; ENTER continua uma única vez',()=>{
  const g=makeGame();g.run('qber=6; gameTime=3000; keyReadyAt=10000; score=100; update(100);');
  assert.equal(g.run('isStageBriefing'),true);assert.equal(g.run('level'),2);
  g.run('update(5000)');assert.equal(g.run('gameTime'),3000);assert.equal(g.run('qber'),6);assert.equal(g.run('keyReadyAt'),10000);
  assert.equal(g.run('asteroids.length+clouds.length+spies.length'),0);assert.equal(g.elements.get('phaseOverlay').hidden,false);
  g.press('Enter');assert.equal(g.run('isStageBriefing'),false);assert.equal(g.frames.size,1);g.run('continuePhase()');assert.equal(g.frames.size,1);
});
test('Pausa congela o tempo e ignora movimentos e R',()=>{
  const g=makeGame();g.press('Escape');assert.equal(g.run('isPaused'),true);g.press('ArrowLeft');g.press('KeyR');g.run('update(1000)');
  assert.equal(g.run('gameTime'),0);assert.equal(g.run('currentLane'),3);assert.equal(g.run('isRegen'),false);
  g.press('Escape');assert.equal(g.run('isPaused'),false);
});
test('Regeneração mantém imobilização, duração e recarga originais',()=>{
  const g=makeGame();g.run('qber=8; tryRegen();');g.press('ArrowLeft');assert.equal(g.run('currentLane'),3);
  assert.equal(g.run('regenEnd'),2000);assert.equal(g.run('keyReadyAt'),10000);
  g.run('gameTime=2000;update(100);');assert.equal(g.run('qber'),0);assert.equal(g.run('isRegen'),false);g.run('tryRegen()');assert.equal(g.run('isRegen'),false);
});
test('QBER crítico inverte controles por 4 s; correção não remove a penalidade',()=>{
  const g=makeGame();g.run('addQber(12)');g.press('ArrowLeft');assert.equal(g.run('currentLane'),4);
  g.run('pickups=[{type:"correction",x:(currentLane+.5)*laneWidth,y:shipY,radius:17,speed:0}];updateQuantumPickups(0,(currentLane+.5)*laneWidth);');
  assert.equal(g.run('isCompromised'),true);g.run('gameTime=4000;update(100)');assert.equal(g.run('isCompromised'),false);assert.equal(g.run('qber'),2);
});
test('Cápsula H cria três disparos, respeita bordas, cooldown e expiração',()=>{
  const g=makeGame();g.run('level=3;pickups=[{type:"hadamard",x:(currentLane+.5)*laneWidth,y:shipY,radius:17,speed:0}];updateQuantumPickups(0,(currentLane+.5)*laneWidth);fireLaser((currentLane+.5)*laneWidth);');
  assert.equal(g.run('lasers.length'),3);assert.equal(g.run('quantumCollected'),1);g.run('fireLaser(550)');assert.equal(g.run('lasers.length'),3);
  g.run('lasers=[];currentLane=0;gameTime=300;fireLaser(laneWidth/2)');assert.equal(g.run('lasers.length'),2);
  g.run('lasers=[];gameTime=6000;fireLaser(laneWidth/2)');assert.equal(g.run('lasers.length'),1);
});
test('Correção reduz QBER e recarga, com limites inferiores de zero',()=>{
  const g=makeGame();g.run('level=6;qber=8;gameTime=1000;keyReadyAt=8000;pickups=[{type:"correction",x:550,y:shipY,radius:17,speed:0}];updateQuantumPickups(0,550)');
  assert.equal(g.run('qber'),3);assert.equal(g.run('keyReadyAt'),5000);
  g.run('qber=1;keyReadyAt=1500;pickups=[{type:"correction",x:550,y:shipY,radius:17,speed:0}];updateQuantumPickups(0,550)');
  assert.equal(g.run('qber'),0);assert.equal(g.run('keyReadyAt'),1000);
});
test('Blindagem exige dois acertos e pontua apenas na destruição',()=>{
  const g=makeGame();g.run('asteroids=[{id:1,x:550,y:250,radius:25,speed:0,hp:2,armored:true,group:null}];lasers=[{x:550,y:250,radius:4}];update(100);');
  assert.equal(g.run('asteroids[0].hp'),1);assert.equal(g.run('score'),0);
  g.run('lasers=[{x:550,y:260,radius:4}];update(116.6666666667)');assert.equal(g.run('score'),10);assert.equal(g.run('asteroids.length'),0);
});
test('Destruição conectada remove só o par e conta ambos os asteroides',()=>{
  const g=makeGame();g.run('asteroids=[{id:1,x:50,y:100,radius:20,group:1},{id:2,x:150,y:100,radius:20,group:1},{id:3,x:250,y:100,radius:20,group:null}];destroyQuantumAsteroid(asteroids[0])');
  assert.equal(g.run('score'),20);assert.equal(g.run('asteroids.length'),1);assert.equal(g.run('asteroids[0].id'),3);
});
test('Ruído ambiental pode comprometer o canal; recuperação não o neutraliza',()=>{
  const g=makeGame();g.run('level=8;score=860;qber=10.99;nextAsteroidAt=1e9;nextCloudAt=1e9;nextSpyAt=1e9;nextPickupAt=1e9;nextInterferenceAt=1e9;update(100);update(150)');
  assert.equal(g.run('isCompromised'),true);
});
test('Frente avisa antes de chegar, deixa três trilhas livres e só atinge uma vez',()=>{
  const g=makeGame();g.run('level=7;gameTime=6000;updateInterference(0)');assert.equal(g.run('interferenceFront.lanes.length'),4);assert.equal(g.run('qber'),0);
  g.run('currentLane=interferenceFront.lanes[0];gameTime=7800;interferenceFront.y=shipY-1;updateInterference(1)');assert.equal(g.run('qber'),3.5);
  g.run('updateInterference(1)');assert.equal(g.run('qber'),3.5);
  g.run('qber=0;interferenceFront={lanes:[0,1,2,3],releaseAt:0,y:shipY-1,passed:false};currentLane=6;updateInterference(1)');assert.equal(g.run('qber'),0);
});
test('12 impactos e colisão direta ainda encerram a defesa',()=>{
  const g=makeGame();g.run('missed=11;asteroids=[{id:1,x:50,y:earthTop+30,radius:20,speed:0,hp:1,group:null}];update(100)');assert.equal(g.run('isPlaying'),false);assert.equal(g.run('missed'),12);
  g.run('startGame();asteroids=[{id:1,x:(currentLane+.5)*laneWidth,y:shipY,radius:20,speed:0,hp:1,group:null}];update(100)');assert.equal(g.run('isPlaying'),false);
});
test('Meta inicia a animação original do canhão e termina em vitória',()=>{
  const g=makeGame();g.run('level=8;score=990;asteroids=[{id:1,x:550,y:250,radius:25,speed:0,hp:1,armored:false,group:null}];lasers=[{x:550,y:250,radius:4}];update(100)');
  assert.equal(g.run('score'),1000);assert.equal(g.run('isPlaying'),false);assert.equal(g.run('finale!==null'),true);
  g.run('finale.t=T_END;finaleLoop(200)');assert.equal(g.run('finale'),null);assert.match(g.elements.get('uiTitle').innerText,/TERRA ESTÁ SALVA/);
});
test('Reiniciar limpa os recursos e a progressão da campanha',()=>{
  const g=makeGame();g.run('level=7;score=750;superpositionUntil=99999;quantumCollected=6;isPlaying=false;startGame()');
  assert.equal(g.run('level'),1);assert.equal(g.run('score'),0);assert.equal(g.run('superpositionUntil'),0);assert.equal(g.run('quantumCollected'),0);assert.equal(g.run('isStageBriefing'),false);
});
test('Celular mantém tempos de reação proporcionais e entidades dentro da tela',()=>{
  const g=makeGame(390,700);assert.equal(g.run('width'),390);assert.equal(g.run('flightSpeed(4)/height'),4/800);
  g.run('level=5;score=460;gameTime=1000;let mobileCloud=makeCloud(0,200);clouds=[mobileCloud];nextCloudAt=1e9;update(100)');
  assert.equal(g.run('clouds.length'),1);assert.equal(g.run('clouds.every(c=>c.x>=c.radius && c.x<=width-c.radius)'),true);
});
test('Primeiras ondas apresentam um par entrelaçado e depois a blindagem',()=>{
  const g=makeGame();g.run('score=340;enterPhase(4);continuePhase();gameTime=nextAsteroidAt;spawnAsteroids()');
  assert.equal(g.run('asteroids.length'),2);assert.equal(g.run('asteroids[0].group===asteroids[1].group && asteroids[0].group!==null'),true);
  // Select a single wave: a random entangled wave intentionally has no armor.
  g.sandbox.Math.random=()=>.99;
  g.run('asteroids=[];gameTime=nextAsteroidAt;spawnAsteroids()');assert.equal(g.run('asteroids.every(a=>a.armored && a.hp===2)'),true);
});
test('Redimensionar mantém trilhas, posição relativa e escala das ameaças',()=>{
  const g=makeGame();g.run('asteroids=[{id:1,x:550,y:400,radius:32,speed:4,hp:1,group:null}];clouds=[makeCloud(2,200)];pickups=[{x:550,y:300,radius:17,speed:2.8}];window.innerWidth=390;window.innerHeight=700;resizeCanvas()');
  assert.equal(g.run('asteroids[0].x'),195);assert.equal(g.run('asteroids[0].y'),350);assert.equal(g.run('asteroids[0].speed'),3.5);
  assert.equal(g.run('pickups[0].x'),195);assert.equal(g.run('Math.floor(clouds[0].baseX/laneWidth)'),2);
});
test('Redimensionamento transitório de 1×1 preserva a superfície e as entidades',()=>{
  const g=makeGame();g.run('asteroids=[{id:1,x:550,y:400,radius:32,speed:4,hp:1,group:null}];window.innerWidth=1;window.innerHeight=1;resizeCanvas()');
  assert.equal(g.run('width'),1100);assert.equal(g.run('height'),800);assert.equal(g.run('asteroids[0].x'),550);assert.equal(g.run('asteroids[0].y'),400);
});
test('Campanha completa por intercepções reais atravessa os oito checkpoints',()=>{
  const g=makeGame();const visited=new Set([1]);let iterations=0;
  while(g.run('isPlaying') && iterations++<250){
    if(g.run('isStageBriefing')){visited.add(g.run('level'));g.press('Enter');}
    g.run('nextCloudAt=1e9;nextSpyAt=1e9;nextPickupAt=1e9;nextInterferenceAt=1e9;nextAsteroidAt=0;if(!asteroids.length)spawnAsteroids();asteroids.forEach(a=>{a.y=250;a.speed=0});lasers=asteroids.flatMap(a=>Array.from({length:a.hp},()=>({x:a.x,y:a.y,radius:4})));lastTs=100;update(100)');
  }
  assert.deepEqual([...visited],[1,2,3,4,5,6,7,8]);assert.equal(g.run('score'),1000);assert.equal(g.run('finale!==null'),true);assert.equal(g.run('missed'),0);
});
console.log(JSON.stringify({passed:results.length,tests:results},null,2));
module.exports={makeGame,results};
