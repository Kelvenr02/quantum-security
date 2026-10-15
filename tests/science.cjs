const assert=require('node:assert/strict');
const {ScienceExperiment,syndromeCode}=require('../science.js');
const {QuantumBoss}=require('../boss-model.js');
const {makeGame}=require('./gameplay.cjs');
const results=[];function test(name,fn){fn();results.push(name);}
function near(a,b){assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);}
test('H cria distribuição 50/50; duas aplicações desfazem a preparação',()=>{
  const e=new ScienceExperiment('hadamard');e.operate('h');e.probabilities.forEach(p=>near(p,.5));e.operate('h');near(e.probabilities[0],1);near(e.probabilities[1],0);
});
test('Medição produz só um resultado e repetições não sorteiam um novo estado',()=>{
  for(const [sample,result]of [[0,0],[.99,1]]){
    let calls=0;const e=new ScienceExperiment('hadamard',()=>{calls++;return sample;});e.operate('h');e.operate('measure');
    assert.equal(e.result,result);e.operate('measure');assert.equal(calls,1);assert.equal(e.result,result);near(e.probabilities[result],1);
  }
});
test('Bell exige H e CNOT na ordem indicada; pares medidos são 00 ou 11',()=>{
  for(const [sample,result]of [[.1,0],[.9,3]]){
    const e=new ScienceExperiment('bell',()=>sample);e.operate('h');e.operate('cnot');
    e.probabilities.forEach((p,i)=>near(p,i===0||i===3?.5:0));e.operate('measure');assert.equal(e.result,result);
  }
  const reversed=new ScienceExperiment('bell');reversed.operate('cnot');reversed.operate('h');
  reversed.probabilities.forEach((p,i)=>near(p,i===0||i===2?.5:0));
});
test('Amostra QBER é local; solicitar nova chave não remove o ruído do exemplo',()=>{
  const e=new ScienceExperiment('key');e.operate('noise');e.operate('compare');assert.match(e.message,/25%/);
  e.operate('request');assert.equal(e.noise,true);assert.match(e.message,/Quantum Security.*ruído permanece/);
  e.operate('compare');assert.match(e.message,/25%/);assert.match(e.message,/não valida/);
});
test('Desfasamento reduz contraste até 50/50; preparar novamente é outro estado',()=>{
  const e=new ScienceExperiment('coherence');near(e.probabilities[0],1);
  for(let i=0;i<4;i++)e.operate('noise');near(e.probabilities[0],.5);near(e.probabilities[1],.5);
  e.operate('reset');near(e.probabilities[0],1);
});
test('Trocar a fase altera a saída reforçada sem somar probabilidades no lugar de amplitudes',()=>{
  const e=new ScienceExperiment('interference');assert.deepEqual(e.probabilities,[1,0]);
  e.operate('phase');assert.deepEqual(e.probabilities,[0,1]);e.operate('measure');assert.equal(e.result,1);
  e.operate('phase');assert.equal(e.result,null);assert.deepEqual(e.probabilities,[1,0]);
});
test('Síndrome corresponde às paridades de um único X; escolher errado não aplica correção',()=>{
  for(let module=1;module<=3;module++){
    const e=new ScienceExperiment('syndrome');e.operate('inject',module);
    const bits=[0,0,0];bits[module-1]=1;assert.equal(syndromeCode(e.error),String(bits[0]^bits[1])+String(bits[1]^bits[2]));
    e.operate('correct',module%3+1);assert.equal(e.error,module);e.operate('correct',module);assert.equal(e.error,0);
  }
});
test('Leitura do chefe corresponde ao + inclusive na troca e no estágio final',()=>{
  for(const phase of [6,8]){
    const m=new QuantumBoss(phase);if(phase===8)m.hp=[12];m.hp=m.hp.map(h=>Math.min(h,phase===6?2:12));m.prepareRound(4);
    for(const time of [2800,3500,4900]){
      m.time=time;const r=m.syndromeReading,n=m.targets().find(n=>n.label==='+');
      assert.equal(r.code,syndromeCode(r.module));assert.equal(n.lane,m.lane([1,3,5][r.module-1]));assert.match(m.hint(0),new RegExp('LEITURA '+r.code+' → M'+r.module));
    }
  }
});
test('Laboratórios e medições não alteram campanha, sorteio, canal ou chefe',()=>{
  const g=makeGame();g.run('enterPhase(6);continuePhase();beginBoss();qber=8;keyReadyAt=5000;let before=JSON.stringify({m:boss.model,seed:campaignRandom.snapshot(),qber,gameTime,score,missed,keyReadyAt,goals:phaseGoals.snapshot()})');
  g.run('for(const kind of Object.keys(scienceTopics)){sciencePanels.phase=new ScienceExperiment(kind,()=>.5);for(const action of ["h","cnot","measure","noise","compare","request","phase","inject","correct","reset"]){sciencePanels.phase.operate(action,1);renderSciencePanel("phase");}}');
  assert.equal(g.run('JSON.stringify({m:boss.model,seed:campaignRandom.snapshot(),qber,gameTime,score,missed,keyReadyAt,goals:phaseGoals.snapshot()})===before'),true);
});
test('Enter em botão de experimento não pula o briefing',()=>{
  const g=makeGame();g.run('enterPhase(3)');g.press('Enter',{closest:selector=>selector==='button,a,input'?{}:null});
  assert.equal(g.run('isStageBriefing'),true);g.press('Enter');assert.equal(g.run('isStageBriefing'),false);
});
test('Pistas cedem a avisos de combate e a riscos iminentes; repetição é limitada',()=>{
  const g=makeGame();g.run('queueScienceCue("h");notifyCombat("SAIA DA FAIXA",2);refreshCombatHUD()');
  assert.equal(g.run('combatNotice.text'),'SAIA DA FAIXA');g.run('combatNotice=null;refreshCombatHUD()');assert.match(g.run('combatNotice.text'),/CIÊNCIA/);
  g.run('combatNotice=null;queueScienceCue("h");refreshCombatHUD()');assert.equal(g.run('combatNotice'),null);
  g.run('scienceLastAt=-Infinity;queueScienceCue("bell");qber=10;refreshCombatHUD()');assert.equal(g.run('combatNotice'),null);
});
test('Desativar pistas preserva a jogabilidade e não cria avisos novos',()=>{
  const g=makeGame();g.run('scienceHintsEnabled=false;queueScienceCue("h");refreshCombatHUD()');assert.equal(g.run('sciencePending'),null);
  g.run('qber=8;tryRegen()');assert.equal(g.run('isRegen'),true);
});
test('Pista já visível some imediatamente quando uma salva ou pulso de canal se aproxima',()=>{
  const g=makeGame();g.run('beginBoss();continuePhase();notifyCombat("CIÊNCIA · exemplo",-1);boss.model.time=1800;refreshCombatHUD()');
  assert.equal(g.elements.get('bossFeedback').hidden,true);
  g.run('boss.model.pulses.forEach(p=>p.fired=true);boss.channelPulse={releaseAt:boss.model.time+500,fired:false,lanes:[4]};refreshCombatHUD()');
  assert.equal(g.elements.get('bossFeedback').hidden,true);
});
console.log(JSON.stringify({passed:results.length,tests:results},null,2));
