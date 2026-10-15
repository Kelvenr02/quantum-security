const assert=require('node:assert/strict');
const {PhaseGoals,phaseChallenges}=require('../progression.js');
const {buildEncounters,EncounterDirector}=require('../encounters.js');
const {CampaignSaveStore}=require('../continuity.js');
const {CampaignMetrics}=require('../metrics.js');
const {summarizeAttempts}=require('../tools/summarize-playtest.cjs');
const {makeGame}=require('./gameplay.cjs');
const results=[];function test(name,fn){fn();results.push(name);}
test('Duas variantes preservam a apresentação e o orçamento de ameaças de cada fase',()=>{
  for(let phase=3;phase<=8;phase++)for(const seed of [1,42,519,2026]){
    const a=buildEncounters(phase,seed,9,0),b=buildEncounters(phase,seed,9,1);
    assert.deepEqual(a[0],b[0]);assert.notDeepEqual(a[1],b[1]);
    const actors=p=>p.flatMap(x=>x.actors).map(x=>JSON.stringify(x)).sort();
    for(let i=0;i<3;i++)assert.deepEqual(actors(a[i]),actors(b[i]));
  }
  for(const phase of [1,2])assert.deepEqual(buildEncounters(phase,42,9,0),buildEncounters(phase,42,9,1));
});
test('Retomar e reabrir preservam a variante e objetivos acumulados nas ondas',()=>{
  const g=makeGame();g.run('campaignSeed=42;enterPhase(5);recordPhaseGoal("splitsPrevented");beginBoss();let original=JSON.stringify(encounterDirector.plan);continuePhase();gameOver("teste");retryCheckpoint()');
  assert.equal(g.run('JSON.stringify(encounterDirector.plan)===original'),true);assert.equal(g.run('phaseGoals.counts.splitsPrevented'),1);
  const saved=JSON.parse(g.run('JSON.stringify(readSavedCampaign())'));
  assert.equal(CampaignSaveStore.normalize(saved).checkpoint.goals.counts.splitsPrevented,1);
  g.run('phaseGoals.count("splitsPrevented");continuePhase();gameOver("teste");retryCheckpoint()');assert.equal(g.run('phaseGoals.counts.splitsPrevented'),1);
});
test('Pontos antigos continuam no roteiro original e não recebem medalha sem evidência das ondas',()=>{
  const g=makeGame();const old=JSON.parse(g.run('JSON.stringify(readSavedCampaign())'));
  for(const c of [old.checkpoint,old.wave]){delete c.encounterVersion;delete c.variant;delete c.goals;}
  const normalized=CampaignSaveStore.normalize(old);assert.equal(normalized.checkpoint.variant,0);
  g.run('isPlaying=false;startGame('+JSON.stringify({...normalized.checkpoint,kind:'boss',level:3})+');');
  assert.equal(g.run('encounterDirector.variant'),0);assert.equal(g.run('phaseGoals.eligible'),false);
});
test('Cada objetivo opcional tem uma regra mensurável; falhar não encerra a missão',()=>{
  for(let phase=1;phase<=8;phase++){
    const goal=new PhaseGoals(phase),d=phaseChallenges[phase-1];assert.ok(d.task.length<100);
    if(d.avoid){assert.equal(goal.achieved,true);goal.count(d.key);assert.equal(goal.achieved,false);}
    else{assert.equal(goal.achieved,false);for(let i=0;i<d.minimum;i++)goal.count(d.key);assert.equal(goal.achieved,true);}
  }
  const g=makeGame();g.run('recordPhaseGoal("earthImpacts")');assert.equal(g.run('isPlaying'),true);
});
test('Medalha e resumo não mudam carga, pontos ou recursos; vitória só concede uma vez',()=>{
  const g=makeGame();g.run('combatScore=123;beginBoss();boss.status="won";finishBoss();let pointsAfter=combatScore;finishBoss()');
  assert.equal(g.run('combatScore'),123);assert.equal(g.run('campaignJourney.awards[0]'),true);
  assert.equal(g.run('lastPhaseReport.medal'),true);assert.equal(g.elements.get('phaseDebrief').hidden,false);
  assert.equal(g.run('campaignMetrics.data.events.filter(e=>e.type==="phaseSummary").length'),1);
  assert.match(g.elements.get('phaseDebriefText').textContent,/conceito/);
});
test('Repetir ondas recomeça objetivos; medalhas anteriores permanecem na campanha salva',()=>{
  const g=makeGame();g.run('beginBoss();boss.status="won";finishBoss();continuePhase();recordPhaseGoal("scoutsDodged");gameOver("teste");retryPhase()');
  assert.equal(g.run('phaseGoals.counts.scoutsDodged'),undefined);assert.equal(g.run('campaignJourney.awards[0]'),true);
  assert.equal(g.run('readSavedCampaign().journey.awards[0]'),true);
});
test('Primeiro movimento usa deslocamento real e primeiro R guarda oportunidade e entrada',()=>{
  const g=makeGame();g.press('ArrowLeft');assert.equal(g.run('campaignMetrics.data.firsts.movement'),undefined);
  g.run('update(100);update(120)');assert.equal(g.run('campaignMetrics.data.firsts.movement.input'),'keyboard');
  g.run('qber=8;encounterDirector.state="breather";encounterDirector.breatherUntil=gameTime+3000');g.press('KeyR');
  assert.equal(g.run('campaignMetrics.data.firsts.regen.input'),'keyboard');assert.equal(g.run('campaignMetrics.data.firsts.regen.recovery'),true);
  assert.equal(g.run('phaseGoals.counts.regenInRecovery'),1);g.run('gameOver("teste",{kind:"earth"})');
  assert.equal(g.run('campaignMetrics.data.firsts.defeat.cause.kind'),'earth');
});
test('Eventos limitados não apagam os primeiros marcos de aprendizagem',()=>{
  const m=new CampaignMetrics({});m.milestone('regen',{qber:8});for(let i=0;i<180;i++)m.event('test');m.milestone('regen',{qber:0});
  assert.equal(m.data.firsts.regen.qber,8);assert.equal(m.data.events.length,128);
});
test('Consultar a pausa é registrado uma vez por abertura manual; perda de foco não vira consulta',()=>{
  const g=makeGame();g.dispatch('blur');assert.equal(g.run('campaignMetrics.data.counts.guideConsultations||0'),0);
  g.press('Escape');g.press('Escape');assert.equal(g.run('campaignMetrics.data.counts.guideConsultations'),1);
  const time=g.run('campaignMetrics.data.activeMs');g.run('update(1000)');assert.equal(g.run('campaignMetrics.data.activeMs'),time);
});
test('Indicadores de espera distinguem deslocamento vazio, alvo fechado e respiro',()=>{
  const m=new CampaignMetrics({});m.input('touch');m.tick(100,{position:1,previousPosition:0,qber:0,actionable:false,waitingForOpening:true});
  assert.equal(m.segment.noDecisionMs,100);assert.equal(m.segment.emptyTravelMs,100);assert.equal(m.segment.waitingForOpeningMs,100);
  m.tick(100,{position:1,previousPosition:1,qber:0,actionable:true});assert.equal(m.segment.noDecisionMs,100);
});
test('Respiro oferece três segundos e R exige a duração real mais margem de reação',()=>{
  const d=new EncounterDirector(1,{interval:800},42);d.started=true;d.state='draining';d.step(1000,()=>true,true);
  assert.equal(d.breatherUntil,4000);
  const g=makeGame();g.run('qber=8;encounterDirector.state="breather";encounterDirector.breatherUntil=3000;gameTime=600');
  assert.equal(g.run('waveRecoveryAvailable()'),true);g.run('gameTime=601');assert.equal(g.run('waveRecoveryAvailable()'),false);
});
test('Export da rodada separa tentativas; consolidação usa o último export da mesma tentativa',()=>{
  const g=makeGame();g.run('gameOver("teste");retryPhase()');const doc=JSON.parse(g.run('window.quantumDiagnostics.playtest()'));
  assert.equal(doc.attempts.length,2);assert.equal(doc.attempts[0].campaign.id,doc.attempts[1].campaign.id);
  assert.notEqual(doc.attempts[0].campaign.attempt,doc.attempts[1].campaign.attempt);
  const last=JSON.parse(JSON.stringify(doc.attempts[1]));last.outcome='victory';last.campaign.developerAssisted=true;
  const rows=summarizeAttempts({attempts:[...doc.attempts,last]});assert.equal(rows.length,2);
  assert.equal(rows[1].outcome,'victory');assert.equal(rows[1].group,'developer-assisted');
  last.inputMethods=['simulation'];assert.equal(summarizeAttempts(last)[0].group,'simulation');
});
console.log(JSON.stringify({passed:results.length,tests:results},null,2));
