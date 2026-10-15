const assert=require('node:assert/strict'),{GameRules,GameBuild,resolveGameMode,describeRegeneration}=require('../config.js');
const {makeGame}=require('./gameplay.cjs'),{TrainingSimulation}=require('../training.js'),{summarizeAttempts}=require('../tools/summarize-playtest.cjs');
const results=[];function test(name,fn){fn();results.push(name);}
test('Estado explícito cobre todos os modos e impede combate durante configurações',()=>{
 const base={arcade:true,playing:true};for(const [change,expected]of [[{},'wave'],[{boss:true},'boss'],[{paused:true},'paused'],[{briefing:true},'briefing'],[{finale:true},'ending'],[{settings:true},'settings'],[{training:true},'training'],[{playing:false,failure:true},'defeat'],[{playing:false,victory:true},'victory'],[{playing:false},'standby'],[{arcade:false},'menu']])assert.equal(resolveGameMode({...base,...change}),expected);
 const g=makeGame();g.run('settingsOpen=true');g.press('KeyR');g.run('moveShip(-1);update(1000)');assert.equal(g.run('currentLane'),4);assert.equal(g.run('gameTime'),0);
});
test('Campanha, treino, descrição e diagnóstico usam os mesmos parâmetros',()=>{
 assert.equal(require('../package.json').version,GameBuild.version);
 const g=makeGame();assert.equal(g.run('missionPhases.length'),GameRules.phases);assert.equal(g.run('missionPhases.at(-1).target'),GameRules.charge);assert.equal(g.run('regenDuration'),GameRules.regenMs);assert.equal(g.run('shotCooldown'),GameRules.shotCooldownMs);
 const training=new TrainingSimulation();training.score=10;assert.equal(training.regenerate(),true);assert.equal(training.regenEnd,GameRules.regenMs);assert.equal(training.keyReadyAt,GameRules.regenCooldownMs);
 assert.match(describeRegeneration('K'),/K: renovar \(2 s parado e sem disparar; recarga 10 s\)/);
 const doc=JSON.parse(g.run('window.quantumDiagnostics.export()'));assert.equal(doc.build.version,GameBuild.version);assert.equal(doc.configuration.rules.regenMs,training.regenEnd);assert.equal(doc.configuration.preferences.keys.regen,'KeyR');assert.equal(doc.state.mode,'wave');
});
test('Relatório mantém versão, configuração, tentativa, auxílio e origens de entrada',()=>{
 const g=makeGame();g.press('ArrowLeft');g.run('gameOver("teste");developerRevive();campaignMetrics.input("touch")');
 const doc=JSON.parse(g.run('window.quantumDiagnostics.export()')),row=summarizeAttempts(doc)[0];
 assert.equal(row.build.version,GameBuild.version);assert.equal(row.configuration.rules.charge,1000);assert.equal(row.arena.lanes,9);
 assert.equal(row.campaign,doc.campaign.id);assert.equal(row.attempt,1);assert.equal(row.developerAssisted,true);assert.equal(row.developerRevives,1);assert.deepEqual(row.inputs,['keyboard','touch']);
});
test('Consolidação não une versões ou configurações diferentes com IDs iguais',()=>{
 const g=makeGame(),a=JSON.parse(g.run('window.quantumDiagnostics.export()')),b=JSON.parse(JSON.stringify(a)),c=JSON.parse(JSON.stringify(a));
 b.build.version='0.9.0';c.configuration.rules.charge=2000;
 assert.equal(summarizeAttempts({attempts:[a,b,c,a]}).length,3);
 const legacy=summarizeAttempts({campaign:{id:'legacy',attempt:1},outcome:'defeat'})[0];assert.equal(legacy.build,null);assert.equal(legacy.configuration,null);
});
test('Consulta, retomada, entrada de chefe e final têm estados coerentes',()=>{
 const g=makeGame();g.run('togglePause()');assert.equal(g.run('gameMode()'),'paused');g.run('togglePause();beginBoss()');assert.equal(g.run('gameMode()'),'briefing');
 g.run('continuePhase()');assert.equal(g.run('gameMode()'),'boss');g.run('gameOver("teste")');assert.equal(g.run('gameMode()'),'defeat');g.run('retryCheckpoint()');assert.equal(g.run('gameMode()'),'briefing');
 g.run('continuePhase();startFinale()');assert.equal(g.run('gameMode()'),'ending');g.run('showVictory()');assert.equal(g.run('gameMode()'),'victory');
});
console.log(JSON.stringify({passed:results.length,tests:results},null,2));
