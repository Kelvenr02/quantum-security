const assert=require('node:assert/strict'),{makeGame}=require('./gameplay.cjs'),{QuantumBoss}=require('../boss-model.js');
const tests=[];function test(name,fn){fn();tests.push(name);}
test('Aviso, fixação e disparo seguem o relógio do chefe e acontecem uma vez',()=>{
 const model=new QuantumBoss(2),events=[];
 for(let t=0;t<2700;t+=50)events.push(...model.advance(50,{lane:4,position:4}).map(e=>({...e,time:model.time})));
 assert.equal(events.filter(e=>e.type==='telegraph'&&e.tracking).length,1);
 assert.equal(events.filter(e=>e.type==='lock').length,1);assert.equal(events.find(e=>e.type==='lock').time,650);
 assert.equal(events.filter(e=>e.type==='pulse').length,1);assert.equal(events.find(e=>e.type==='pulse').time,model.pulses[0].at);
 assert.ok(events.find(e=>e.type==='telegraph').time<events.find(e=>e.type==='lock').time);
});
test('Cada salva dos oito chefes anuncia uma vez e respeita adiamento por R',()=>{
 for(let phase=1;phase<=8;phase++){
  const model=new QuantumBoss(phase);model.delayRound(2000);const events=[];
  for(let t=0;t<8500;t+=50)events.push(...model.advance(50,{lane:4}).map(e=>({...e,time:model.time})));
  for(const p of model.pulses){const telegraphs=events.filter(e=>e.type==='telegraph'&&e.label===p.label);assert.equal(telegraphs.length,1);assert.ok(telegraphs[0].time>=p.announceAt);assert.ok(telegraphs[0].time<p.at);}
 }
});
test('Sonda emite rastreamento, fixação e ruído com panorâmica e sem repetição por quadro',()=>{
 const g=makeGame(),sounds=[];g.sandbox.gameAudio.sfx=(name,options)=>sounds.push({name,options});
 g.run('spawnFormation({actors:[{kind:"scout",lane:4,hp:0}],id:"audio"})');assert.equal(sounds.filter(s=>s.name==='tracking').length,1);
 g.run('gameTime=scout.lockAt;updateEncounterActors(0);updateEncounterActors(0)');assert.equal(sounds.filter(s=>s.name==='targetLock').length,1);
 g.run('gameTime=scout.fireAt;updateEncounterActors(0);updateEncounterActors(0)');assert.equal(sounds.filter(s=>s.name==='noisePulse').length,1);
 assert.equal(sounds.find(s=>s.name==='targetLock').options.pan,0);
});
test('Pulso do canal avisa e soa ao liberar mesmo quando não atinge o jogador',()=>{
 const g=makeGame(),sounds=[];g.sandbox.gameAudio.sfx=name=>sounds.push(name);
 g.run('beginBoss();continuePhase();boss.model.time=boss.model.openingStart+400;updateBossChannel();');assert.equal(sounds.filter(s=>s==='noiseWarning').length,1);
 g.run('boss.channelPulse.lanes=[0];boss.model.time=boss.channelPulse.releaseAt;updateBossChannel();updateBossChannel()');
 assert.equal(sounds.filter(s=>s==='noisePulse').length,1);assert.equal(g.run('qber'),0);
});
test('Pausa não avança os avisos nem repete sons atrasados',()=>{
 const g=makeGame(),sounds=[];g.sandbox.gameAudio.sfx=name=>sounds.push(name);g.run('beginBoss();continuePhase();togglePause();');sounds.length=0;
 g.run('update(5000);update(7000)');assert.deepEqual(sounds,[]);assert.equal(g.run('boss.model.time'),0);
});
test('Renascimento restaura a mixagem do estágio sem anunciar outra transição',()=>{
 const g=makeGame(),stages=[];g.sandbox.gameAudio.setBossStage=(stage,options)=>stages.push({stage,options});
 g.run('level=8;beginBoss();continuePhase();boss.model.hp=[10];gameOver("teste");developerRevive()');
 assert.equal(stages.length,1);assert.equal(stages[0].stage,2);assert.equal(stages[0].options.announce,false);
});
console.log(JSON.stringify({passed:tests.length,tests},null,2));
