/* Flow integration: combat completion is arranged deliberately, not a human win. */
const {chromium,captureFailure}=require('./harness.cjs');
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
 const runs=[];
 try{for(const [width,height]of [[1600,900],[390,700],[568,320]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.clock.install({time:new Date('2026-10-15T12:00:00Z')});await page.clock.pauseAt(new Date('2026-10-15T12:00:00Z'));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../../index.html')).href);
  await page.evaluate(()=>{accessPreferences.keys={left:'KeyJ',right:'KeyL',regen:'KeyK'};accessPreferences.reading=true;accessPreferences.effects='reduced';applyAccessPreferences();startIntro();tutorial.stop();startDefense();startGame();cancelAnimationFrame(rafId);});
  await page.keyboard.press('j');await page.locator('[data-action="left"]').tap();
  await page.evaluate(()=>{clearMovementInput();shipPilot.reset(4);currentLane=4;qber=8;});
  await page.keyboard.press('k');assert.equal(await page.evaluate(()=>isRegen),true);
  for(let phase=1;phase<=8;phase++){
   if(phase>1){assert.equal(await page.evaluate(()=>gameMode()),'briefing');await page.locator('#btnContinue').click();await page.evaluate(()=>cancelAnimationFrame(rafId));}
   assert.equal(await page.evaluate(()=>level),phase);
   const inherited=await page.evaluate(()=>({regenEnd,keyReadyAt,qber}));
   await page.evaluate(()=>{score=phaseConfig().target;asteroids=[];clouds=[];spies=[];drones=[];scout=null;interferenceFront=null;beginBoss();});
   assert.equal(await page.evaluate(()=>gameMode()),'briefing');await page.clock.runFor(500);assert.deepEqual(await page.evaluate(()=>({regenEnd,keyReadyAt,qber})),inherited);
   await page.locator('#btnContinue').click();await page.evaluate(()=>cancelAnimationFrame(rafId));assert.equal(await page.evaluate(()=>gameMode()),'boss');
   await page.keyboard.press('Escape');const paused=await page.evaluate(()=>JSON.stringify({time:gameTime,r:campaignRandom.snapshot(),channel:channelCheckpoint()}));
   await page.evaluate(()=>openSettings());assert.equal(await page.evaluate(()=>gameMode()),'settings');await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>gameMode()),'paused');
   await page.clock.runFor(300);assert.equal(await page.evaluate(()=>JSON.stringify({time:gameTime,r:campaignRandom.snapshot(),channel:channelCheckpoint()})),paused);
   await page.locator('#pauseResume').click();await page.evaluate(()=>cancelAnimationFrame(rafId));
   if(phase===4){
    await page.evaluate(()=>{boss.model.hp=boss.model.hp.map(h=>Math.max(1,h-1));gameOver('integração',{kind:'bossSalvo',attack:'B'});});
    assert.equal(await page.evaluate(()=>gameMode()),'defeat');const hp=await page.evaluate(()=>developerReviveState.boss.model.health);
    await page.clock.runFor(850);await page.locator('#btnDevRevive').click();await page.evaluate(()=>cancelAnimationFrame(rafId));
    assert.equal(await page.evaluate(()=>boss.model.health),hp);assert.equal(await page.evaluate(()=>campaignJourney.developerAssisted),true);
   }
   if(phase===8){
    await page.evaluate(()=>{isRegen=false;isCompromised=false;qber=0;for(const hp of[25,13]){const m=boss.model;m.hp=[hp];m.coherence=90;m.time=m.roundStart+m.openingStart+600;m.lastHits={};m.slotHits={};const target=m.targets(qber).find(n=>n.open&&n.id>=0);const y=bossArenaY();lasers=[{x:(target.lane+.5)*laneWidth,y,previousY:y+1,radius:4}];updateBossBattle(0,shipCenterX());}updateBossHUD();});
    assert.equal(await page.evaluate(()=>boss.model.stage),2);assert.equal(await page.evaluate(()=>gameAudio.bossStage),2);
   }
   const random=await page.evaluate(()=>JSON.stringify(campaignRandom.snapshot()));await page.setViewportSize({width:height,height:width});await page.evaluate(()=>refreshArenaBounds());
   assert.equal(await page.evaluate(()=>JSON.stringify(campaignRandom.snapshot())),random);await page.setViewportSize({width,height});
   await page.evaluate(()=>{boss.model.hp=boss.model.hp.map(()=>0);updateBossBattle(0,shipCenterX());gameTime+=1500;updateBossBattle(0,shipCenterX());cancelAnimationFrame(rafId);});
  }
  assert.equal(await page.evaluate(()=>gameMode()),'ending');await page.evaluate(()=>showVictory());assert.equal(await page.evaluate(()=>gameMode()),'victory');
  const doc=await page.evaluate(()=>quantumDiagnostics.snapshot());assert.equal(doc.build.version,'0.8.0');assert.equal(doc.campaign.developerAssisted,true);assert.equal(doc.campaign.developerRevives,1);
  assert.deepEqual(doc.inputMethods,['keyboard','touch']);assert.equal(doc.state.preferences.keys.regen,'KeyK');assert.equal(doc.configuration.rules.regenMs,2000);assert.equal(doc.state.guardians,8);
  assert.equal(await page.evaluate(()=>localStorage.getItem(CampaignSaveStore.key)),null);assert.match(await page.locator('#campaignResult').textContent(),/ASSISTIDA/);assert.deepEqual(errors,[]);
  runs.push({width,height,build:doc.build,campaign:doc.campaign,inputs:doc.inputMethods,guardians:doc.state.guardians});await context.close();console.log(`${width}x${height}: eight phase transitions, controls, pause, revival, final stages, reports OK`);
 }
 }catch(error){await captureFailure(browser,'integration');throw error;}finally{await browser.close();}
 fs.mkdirSync('tmp/browser-tests',{recursive:true});fs.writeFileSync('tmp/browser-tests/integration.json',JSON.stringify(runs,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
