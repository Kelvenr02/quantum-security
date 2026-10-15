const assert=require('node:assert/strict');
const {CampaignRandom}=require('../random.js');
const {makeGame}=require('./gameplay.cjs');
const results=[];function test(name,fn){fn();results.push(name);}

test('Ambiente reproduzível, com sorteios separados por tipo de perigo',()=>{
  const a=new CampaignRandom(519),b=new CampaignRandom(519);
  for(let i=0;i<100;i++)assert.equal(a.next('clouds'),b.next('clouds'));
  for(let i=0;i<30;i++)a.next('spies');
  assert.equal(a.next('interference'),b.next('interference'));
  assert.notEqual(new CampaignRandom(1).next('clouds'),new CampaignRandom(2).next('clouds'));
});
test('Snapshot congelado restaura a continuação exata sem compartilhar estado mutável',()=>{
  const a=new CampaignRandom(42);a.next('clouds');a.next('spies');const saved=a.snapshot();
  const b=new CampaignRandom(42,JSON.parse(JSON.stringify(saved)));
  assert.equal(Object.isFrozen(saved),true);assert.equal(Object.isFrozen(saved.states),true);
  for(let i=0;i<40;i++)for(const stream of ['clouds','spies','interference'])assert.equal(a.next(stream),b.next(stream));
  assert.notEqual(saved.states.clouds,a.states.clouds);
});
test('Desenho a 30/60/120 fps, partículas e redimensionamentos não alteram perigos reais',()=>{
  const reports=[];
  for(const fps of [0,30,60,120]){
    const g=makeGame(1600,900);
    reports.push(g.run(`campaignRandom=new CampaignRandom(519);level=8;qber=10;let samples=[];
      for(let t=1000;t<=12000;t+=1000){
        gameTime=t;clouds=[];spies=[];asteroids=[];interferenceFront=null;nextCloudAt=0;nextSpyAt=0;nextInterferenceAt=0;
        encounterDirector.packetIndex=1;
        for(let frame=0;frame<${fps};frame++){drawLink(shipCenterX());Math.random();}
        ${fps?'resizeCanvas();':''}
        spawnClouds();spawnSpies();updateInterference(0);
        samples.push({clouds:clouds.map(c=>[laneOf(c),c.y]),spies:spies.map(s=>laneOf(s)),front:interferenceFront.lanes,cloudAt:nextCloudAt,spyAt:nextSpyAt});
      }JSON.stringify(samples)`));
  }
  reports.forEach(r=>assert.equal(r,reports[0]));
});
test('Retomadas da fase e do chefe restauram o sorteio salvo',()=>{
  for(const mode of ['wave','boss']){
    const g=makeGame();g.run('level=5;campaignSeed=42;campaignRandom=new CampaignRandom(42);enterPhase(5);continuePhase()');
    if(mode==='boss')g.run('beginBoss();continuePhase()');
    const before=g.run('JSON.stringify(campaignRandom.snapshot())');
    g.run('for(let i=0;i<100;i++)campaignRandom.next("clouds");gameOver("teste")');
    g.run(mode==='boss'?'retryCheckpoint()':'retryPhase()');
    assert.equal(g.run('JSON.stringify(campaignRandom.snapshot())'),before);
    assert.equal(g.run('campaignMetrics.data.arena.randomVersion'),1);
  }
});
test('Checkpoint antigo sem sorteio pode ser aberto de forma consistente',()=>{
  const a=new CampaignRandom(42),b=new CampaignRandom(42,{version:999,states:{}});
  assert.deepEqual(a.snapshot(),b.snapshot());
  assert.throws(()=>a.next('inexistente'),/desconhecido/);
});
console.log(JSON.stringify({passed:results.length,tests:results},null,2));
