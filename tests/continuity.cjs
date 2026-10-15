const assert=require('node:assert/strict');
const {CampaignSaveStore}=require('../continuity.js');
const {makeGame}=require('./gameplay.cjs');
const results=[];function test(name,fn){fn();results.push(name);}
function storage(){const rows=new Map();return {getItem:k=>rows.get(k)||null,setItem:(k,v)=>rows.set(k,v),removeItem:k=>rows.delete(k)};}
function game(store=storage(),autoStart=true){return makeGame(1100,800,{storage:store,autoStart});}
function saved(g){return JSON.parse(g.run('JSON.stringify(readSavedCampaign())'));}
function clone(v){return JSON.parse(JSON.stringify(v));}

test('Nova campanha grava somente checkpoint e identidade, não métricas nem entidades em voo',()=>{
  const g=game(),entry=saved(g);assert.equal(entry.checkpoint.kind,'wave');assert.equal(entry.checkpoint.level,1);
  assert.equal(entry.journey.attempt,1);assert.equal(entry.journey.developerAssisted,false);
  assert.equal(g.run('campaignSaveStore.status'),'ready');
  assert.deepEqual(Object.keys(entry).sort(),['checkpoint','journey','savedAt','version','wave']);
  assert.ok(JSON.stringify(entry).length<3000);
});
test('Reabrir restaura fase, recursos, semente e sorteio sem iniciar automaticamente',()=>{
  const store=storage(),g=game(store);g.run('score=340;combatScore=321;missed=4;qber=8;keyReadyAt=4500;hullShield=0;superpositionUntil=3000;enterPhase(4)');
  const expected=saved(g),reopened=game(store,false);
  assert.equal(reopened.run('isPlaying'),false);assert.equal(reopened.elements.get('titleContinue').hidden,false);
  reopened.run('continueSavedCampaign()');assert.equal(reopened.run('isStageBriefing'),true);
  for(const key of ['level','score','combatScore','missed','hullShield'])assert.equal(reopened.run(key),expected.checkpoint[key]);
  assert.equal(reopened.run('qber'),8);assert.equal(reopened.run('keyReadyAt'),4500);assert.equal(reopened.run('superpositionUntil'),3000);
  assert.equal(reopened.run('JSON.stringify(campaignRandom.snapshot())'),JSON.stringify(expected.checkpoint.random));
  assert.equal(reopened.run('campaignJourney.id'),expected.journey.id);assert.equal(reopened.run('campaignJourney.attempt'),2);
});
test('Reabrir no chefe reinicia vida inteira e preserva a opção de refazer suas ondas',()=>{
  const store=storage(),g=game(store);g.run('score=340;missed=3;enterPhase(4);continuePhase();combatScore=700;missed=5;hullShield=0;beginBoss();continuePhase();boss.model.hp=[1,1]');
  const before=saved(g),reopened=game(store,false);assert.equal(before.checkpoint.kind,'boss');reopened.run('continueSavedCampaign()');
  assert.equal(reopened.run('boss.model.health'),32);assert.equal(reopened.run('hullShield'),0);assert.equal(reopened.run('missed'),5);
  reopened.run('continuePhase();gameOver("teste");retryPhase()');assert.equal(reopened.run('boss'),null);
  assert.equal(reopened.run('missed'),3);assert.equal(reopened.run('score'),340);
});
test('Renascimento continua identificado após avançar, repetir fase e repetir chefe',()=>{
  const g=game();g.run('gameOver("teste");developerRevive();let idBefore=campaignJourney.id;score=100;beginBoss();boss.status="won";finishBoss();continuePhase();gameOver("teste");retryPhase()');
  assert.equal(g.run('campaignJourney.id===idBefore'),true);assert.equal(g.run('campaignMetrics.data.developerAssisted'),true);
  assert.equal(g.run('campaignJourney.developerRevives'),1);assert.equal(g.elements.get('campaignBadge').hidden,false);
  g.run('continuePhase();beginBoss();continuePhase();gameOver("teste");retryCheckpoint()');
  assert.equal(g.run('campaignMetrics.data.campaign.developerRevives'),1);assert.equal(g.run('campaignJourney.attempt'),3);
});
test('Renascimentos se acumulam na campanha e sobrevivem à reabertura sem alterar os recursos salvos',()=>{
  const store=storage(),g=game(store);g.run('qber=7;missed=5;hullShield=0;score=100;beginBoss();continuePhase()');
  const original=saved(g).checkpoint;
  for(let i=0;i<2;i++)g.run('gameOver("teste");developerRevive()');
  assert.deepEqual(saved(g).checkpoint,original);assert.equal(saved(g).journey.developerRevives,2);
  const reopened=game(store,false);reopened.run('continueSavedCampaign()');
  assert.equal(reopened.run('campaignJourney.developerRevives'),2);assert.equal(reopened.run('campaignMetrics.data.developerAssisted'),true);
  assert.equal(reopened.run('missed'),5);assert.equal(reopened.run('hullShield'),0);assert.equal(reopened.run('qber'),7);
  reopened.run('continuePhase();gameOver("teste");developerRevive()');assert.equal(reopened.run('campaignJourney.developerRevives'),3);
});
test('Somente recomeçar a campanha troca identidade e remove a marca assistida',()=>{
  const g=game();g.run('gameOver("teste");developerRevive();let oldId=campaignJourney.id;gameOver("teste");startGame()');
  assert.equal(g.run('campaignJourney.id===oldId'),false);assert.equal(g.run('campaignJourney.attempt'),1);
  assert.equal(g.run('campaignJourney.developerAssisted'),false);assert.equal(g.run('campaignMetrics.data.developerAssisted'),undefined);
});
test('Resultado e diagnóstico distinguem campanha assistida de campanha sem auxílio',()=>{
  const g=game();g.run('gameOver("teste")');assert.match(g.elements.get('campaignResult').textContent,/SEM AUXÍLIO/);
  g.run('developerRevive();gameOver("teste")');assert.match(g.elements.get('campaignResult').textContent,/ASSISTIDA.*1 RENASCIMENTO/);
  assert.equal(g.run('campaignMetrics.data.campaign.developerRevives'),1);
  g.run('developerRevive();showVictory()');assert.match(g.elements.get('campaignResult').textContent,/ASSISTIDA.*2 RENASCIMENTO/);
});
test('Vencer remove o salvamento; novas vitórias não reaplicam recursos',()=>{
  const store=storage(),g=game(store);g.run('startFinale()');
  assert.equal(store.getItem(CampaignSaveStore.key),null);assert.equal(saved(g),null);
  assert.equal(game(store,false).elements.get('titleContinue').hidden,true);
});
test('Voltar ao menu preserva ponto de entrada e identidade; continuar não retoma inimigos em voo',()=>{
  const g=game();const entry=saved(g);g.run('combatScore=900;missed=9;togglePause();returnToCampaignMenu()');
  assert.equal(g.run('arcadeActive'),false);assert.equal(g.run('isPlaying'),false);assert.equal(g.frames.size,0);
  g.run('continueSavedCampaign()');assert.equal(g.run('isStageBriefing'),true);assert.equal(g.run('combatScore'),entry.checkpoint.combatScore);
  assert.equal(g.run('missed'),entry.checkpoint.missed);assert.equal(g.run('asteroids.length'),0);assert.equal(g.frames.size,0);
});
test('Como jogar abre consulta sem história, nova campanha ou mudança no ponto salvo',()=>{
  const g=game(storage(),false);g.run('openDefenseBriefing()');assert.equal(g.run('quickGuideOpen'),true);
  assert.equal(g.run('introActive'),false);assert.equal(g.run('isPlaying'),false);assert.equal(saved(g),null);
  g.press('Escape');assert.equal(g.run('quickGuideOpen'),false);
});
test('Dados inválidos, versões futuras, NaN e posições incoerentes não são executados',()=>{
  const entry=saved(game());
  const mutations=[e=>e.version=99,e=>e.checkpoint.level=9,e=>e.checkpoint.channel.qber=-1,e=>e.checkpoint.seed=Infinity,
    e=>e.checkpoint.random.version=99,e=>e.checkpoint.pilot.position=99,e=>{e.checkpoint.pilot.from=3;e.checkpoint.pilot.elapsed=0;},
    e=>e.journey.id='<script>',e=>e.journey.developerRevives=1,e=>e.wave.level=2,e=>e.checkpoint.hadamardRemaining=90000];
  for(const mutate of mutations){const bad=clone(entry);mutate(bad);assert.equal(CampaignSaveStore.normalize(bad),null);}
  const store=storage(),s=new CampaignSaveStore(()=>store);store.setItem(CampaignSaveStore.key,'{');assert.equal(s.load(),null);assert.equal(s.status,'invalid');
  store.setItem(CampaignSaveStore.key,'x'.repeat(24001));assert.equal(s.load(),null);assert.equal(s.status,'invalid');
});
test('Armazenamento bloqueado ou cheio mantém retomadas da sessão e permite continuar jogando',()=>{
  const blocked={getItem(){throw Error('blocked')},setItem(){throw Error('quota')},removeItem(){throw Error('blocked')}};
  const g=game(blocked);assert.equal(g.run('campaignSaveStore.status'),'unavailable');assert.notEqual(saved(g),null);
  g.run('togglePause();returnToCampaignMenu();continueSavedCampaign()');assert.equal(g.run('isPlaying'),true);
  assert.equal(g.run('isStageBriefing'),true);assert.match(g.elements.get('saveNotice').textContent,/somente nesta aba/);
});
test('Carga e repetição dos checkpoints mantêm a semente e não acumulam escudo ou reparos',()=>{
  const store=storage(),g=game(store);g.run('missed=8;hullShield=0;qber=7;beginBoss()');const entry=saved(g);
  for(let i=0;i<3;i++){
    const reopened=game(store,false);reopened.run('continueSavedCampaign()');assert.equal(reopened.run('missed'),8);
    assert.equal(reopened.run('hullShield'),0);assert.equal(reopened.run('qber'),7);assert.equal(reopened.run('campaignSeed'),entry.checkpoint.seed);
    assert.equal(saved(reopened).journey.attempt,i+2);
  }
});
test('Reabertura durante R conserva posição intermediária e durações; o chefe mantém fuga possível',()=>{
  const store=storage(),g=game(store);g.run('moveShip(1);shipPilot.advance(50);currentLane=shipPilot.lane;tryRegen();gameTime=500;beginBoss()');
  const entry=saved(g),reopened=game(store,false);reopened.run('continueSavedCampaign()');
  assert.equal(reopened.run('shipPosition()'),entry.checkpoint.pilot.position);
  assert.equal(reopened.run('regenEnd'),1500);assert.equal(reopened.run('keyReadyAt'),9500);
  reopened.run('continuePhase()');assert.ok(reopened.run('boss.model.pulses[0].at')>=1900);
});
test('Consultar ajuda com progresso existente não troca identidade nem ponto salvo',()=>{
  const g=game();g.run('togglePause();returnToCampaignMenu()');const before=saved(g);
  g.run('openDefenseBriefing();closeDefenseBriefing()');assert.deepEqual(saved(g),before);
  assert.equal(g.run('campaignJourney.id'),before.journey.id);
});
test('Campanha real produz pontos válidos em todas as oito fases e chefes',()=>{
  const {flyCampaign}=require('./balance.cjs'),store=storage(),entries=[],g=game(store);
  const write=store.setItem;store.setItem=(key,value)=>{if(key===CampaignSaveStore.key)entries.push(JSON.parse(value));write(key,value);};
  const result=g.run('('+flyCampaign.toString()+')(519)');assert.equal(result.won,true);
  for(let level=1;level<=8;level++)assert.ok(entries.some(e=>e.checkpoint.level===level&&e.checkpoint.kind==='boss'),'Chefe '+level+' salvo');
  for(let level=2;level<=8;level++)assert.ok(entries.some(e=>e.checkpoint.level===level&&e.checkpoint.kind==='wave'),'Fase '+level+' salva');
  assert.equal(store.getItem(CampaignSaveStore.key),null);
});
console.log(JSON.stringify({passed:results.length,tests:results},null,2));
