const {chromium,captureFailure}=require('./harness.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
 try{for(const [width,height]of [[1600,900],[390,700],[568,320]]){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',hasTouch:width!==1600}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.clock.install({time:new Date('2026-10-15T12:00:00Z')});await page.clock.pauseAt(new Date('2026-10-15T12:00:00Z'));await page.goto(pathToFileURL(path.resolve(__dirname,'../../index.html')).href);
  assert.equal(await page.evaluate(()=>reducedEffects()),true);
  await page.locator('[onclick="openSettings()"]').first().click();
  await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'accessReading');
  await page.keyboard.press('Shift+Tab');await page.keyboard.press('Shift+Tab');assert.equal(await page.evaluate(()=>document.activeElement.textContent),'APLICAR');
  await page.locator('#accessReading').check();await page.locator('#accessEffects').selectOption('reduced');
  await page.locator('#accessKey-left').selectOption('KeyJ');await page.locator('#accessKey-right').selectOption('KeyJ');
  await page.locator('[onclick="saveAccessPreferences()"]').click();assert.match(await page.locator('#accessStatus').textContent(),/diferentes/);
  await page.locator('#accessKey-right').selectOption('KeyL');await page.locator('#accessKey-regen').selectOption('KeyK');await page.locator('[onclick="saveAccessPreferences()"]').click();
  assert.equal(await page.evaluate(()=>accessPreferences.keys.regen),'KeyK');assert.match(await page.locator('#accessStatus').textContent(),/salvas/);
  await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>introActive),false);
  await page.reload();assert.equal(await page.evaluate(()=>accessPreferences.keys.left),'KeyJ');assert.equal(await page.locator('html').getAttribute('data-reading'),'large');
  // Help focus wraps and Enter on controls cannot start the story behind the dialog.
  await page.locator('[onclick="openDefenseBriefing()"]').click();await page.locator('#helpClose').focus();await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'helpClose');await page.keyboard.press('Escape');
  await page.evaluate(()=>{startIntro();tutorial.stop();startDefense();startGame();cancelAnimationFrame(rafId);});
  assert.equal(await page.evaluate(()=>document.activeElement.id),'game');
  await page.keyboard.press('j');assert.equal(await page.evaluate(()=>currentLane),3);
  await page.evaluate(()=>{shipPilot.reset(4);currentLane=4;});await page.keyboard.press('a');assert.equal(await page.evaluate(()=>currentLane),4);
  await page.keyboard.press('ArrowRight');assert.equal(await page.evaluate(()=>currentLane),5);
  await page.keyboard.press('k');assert.equal(await page.evaluate(()=>isRegen),true);
  const snapshot=()=>page.evaluate(()=>JSON.stringify({time:gameTime,rng:campaignRandom.snapshot(),regenEnd,keyReadyAt,qber}));
  const before=await snapshot();await page.evaluate(()=>openSettings());await page.clock.runFor(3000);assert.equal(await snapshot(),before);
  await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>isPaused),true);assert.equal(await page.evaluate(()=>document.activeElement.id),'pauseResume');
  await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>isPaused),false);await page.evaluate(()=>cancelAnimationFrame(rafId));
  await page.evaluate(()=>{isRegen=false;isCompromised=true;compEnd=gameTime+4000;updateQberUI();renderChannelWarning();});
  assert.match(await page.locator('#warning').textContent(),/J = direita/);assert.match(await page.locator('#warning').textContent(),/L = esquerda/);
  await page.evaluate(()=>{particles=[];emitDebris(50,50,20);});assert.equal(await page.evaluate(()=>particles.length),0);
  // Reduced effects keep the ship visible throughout both formerly blinking states.
  assert.equal(await page.evaluate(()=>{let calls=0;const original=drawInterceptor;drawInterceptor=()=>calls++;hullInvulUntil=gameTime+3000;for(const t of[100,200,300,400,500]){gameTime=t;drawShip(100,'#fff',true);}drawInterceptor=original;return calls;}),5);
  await page.evaluate(()=>{isCompromised=false;isRegen=false;enterPhase(3);});await page.locator('#btnContinue').focus();await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.closest('[role="dialog"]').id),'phaseOverlay');
  await page.keyboard.press('Shift+Tab');await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>isStageBriefing),false);await page.evaluate(()=>cancelAnimationFrame(rafId));
  await page.keyboard.press('Escape');await page.locator('#pauseResume').focus();await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.closest('[role="dialog"]').id),'pauseOverlay');
  fs.mkdirSync(path.resolve('tmp/accessibility-check'),{recursive:true});await page.screenshot({path:path.resolve(`tmp/accessibility-check/pause-${width}x${height}.png`)});
  // Training uses the same mapping, suspends for settings and respects an existing pause.
  await page.evaluate(()=>{isPlaying=false;isPaused=false;$('pauseOverlay').hidden=true;$('arcade').style.display='none';startIntro();tutorial.beginPreparation();});
  await page.locator('#trainingNext').click();await page.locator('[data-training-action="measure"]').click();await page.locator('#trainingNext').click();await page.locator('[data-training-action="activate"]').click();await page.locator('#trainingNext').click();
  assert.match(await page.locator('#trainingQuickSteps').textContent(),/J \/ L/);assert.match(await page.locator('#trainingQuickSteps').textContent(),/K: renovar/);
  await page.evaluate(()=>openSettings());await page.clock.runFor(2200);assert.equal(await page.locator('#trainingPauseNotice').isVisible(),true);
  await page.keyboard.press('Escape');assert.equal(await page.locator('#trainingPauseNotice').isVisible(),false);
  await page.keyboard.press('Escape');await page.evaluate(()=>openSettings());await page.keyboard.press('Escape');assert.equal(await page.locator('#trainingPauseNotice').isVisible(),true);
  assert.deepEqual(errors,[]);await context.close();console.log(`${width}x${height}: preferences, focus, controls, training and reduced effects OK`);
 }
 }catch(error){await captureFailure(browser,'accessibility');throw error;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
