const {chromium,captureFailure}=require('./harness.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
 try{for(const [width,height]of [[1600,900],[390,700],[568,320]])for(const reading of [false,true]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.clock.install({time:new Date('2026-10-15T12:00:00Z')});await page.clock.pauseAt(new Date('2026-10-15T12:00:00Z'));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../../index.html')).href);
  await page.evaluate(reading=>{accessPreferences.reading=reading;accessPreferences.effects='reduced';applyAccessPreferences();startIntro();},reading);
  const reference=require('../fixtures/opening-dialogue.json');
  assert.equal(await page.locator('#storyPrelude').isVisible(),true);assert.equal(await page.locator('#trainingPreparation').isVisible(),false);
  assert.equal(await page.locator('#openingBack').isDisabled(),true);
  await page.keyboard.press('r');await page.keyboard.press('ArrowRight');await page.clock.runFor(5000);
  await page.locator('#openingNext').focus();
  await page.locator('#openingNext').dispatchEvent('keydown',{code:'Enter',key:'Enter',repeat:true});
  assert.equal(await page.locator('#openingCount').textContent(),'1 / 14');
  for(let i=0;i<reference.length;i++){
   assert.equal(await page.locator('#openingSpeaker').textContent(),reference[i][0]);assert.equal(await page.locator('#openingLine').textContent(),reference[i][1]);
   assert.equal(await page.locator('#openingCount').textContent(),(i+1)+' / 14');
   assert.equal(await page.evaluate(()=>document.querySelector('#storyPrelude').scrollWidth>innerWidth),false);
   if(i===1){await page.locator('#openingBack').click();assert.equal(await page.locator('#openingLine').textContent(),reference[0][1]);await page.locator('#openingNext').click();}
   if(i===8){fs.mkdirSync('tmp/story-check',{recursive:true});await page.locator('#openingLine').scrollIntoViewIfNeeded();await page.screenshot({path:`tmp/story-check/${width}-${height}-${reading}-dialogue.png`});}
   if(i%2){await page.locator('#openingNext').focus();await page.keyboard.press('Enter');}
   else {await page.locator('#openingLine').focus();await page.keyboard.press('Enter');}
  }
  assert.equal(await page.locator('#storyPrelude').isVisible(),false);assert.equal(await page.locator('#trainingPreparation').isVisible(),true);
  assert.equal(await page.locator('#trainingQuickGuide').isVisible(),false);
  fs.mkdirSync('tmp/story-check',{recursive:true});await page.screenshot({path:`tmp/story-check/${width}-${height}-${reading}-story.png`});
  await page.locator('#trainingNext').click();const science=page.locator('#trainingScienceDetails');
  assert.equal(await science.getAttribute('open'),null);assert.equal(await page.locator('#trainingScience').isVisible(),false);
  await science.locator('summary').focus();await page.keyboard.press('Enter');assert.notEqual(await science.getAttribute('open'),null);
  assert.match(await page.locator('#trainingStep').textContent(),/02/);assert.equal(await page.locator('#trainingNext').isDisabled(),true);
  await page.locator('[data-training-action="measure"]').click();assert.notEqual(await science.getAttribute('open'),null);
  await page.locator('#trainingNext').click();assert.equal(await science.getAttribute('open'),null);
  await page.locator('[data-training-action="activate"]').click();await page.locator('#trainingNext').click();
  assert.equal(await page.locator('#trainingQuickGuide').isVisible(),true);assert.equal(await page.locator('#trainingQuickSteps li').count(),4);
  assert.equal(await page.locator('#trainingFlight').isVisible(),true);assert.equal(await page.locator('#trainingNext').isDisabled(),true);
  assert.match(await page.locator('#trainingQuickSteps').textContent(),/2 s parado e sem disparar/);
  assert.equal(await page.evaluate(()=>document.querySelector('.training-shell').scrollWidth>innerWidth),false);
  await page.locator('#trainingQuickGuide').scrollIntoViewIfNeeded();await page.screenshot({path:`tmp/story-check/${width}-${height}-${reading}-guide.png`});
  await page.locator('#trainingHome').click();assert.equal(await page.evaluate(()=>introActive),false);assert.equal(await page.locator('#titleBtn').isVisible(),true);
  await page.locator('#titleBtn').click();assert.equal(await page.locator('#openingLine').textContent(),reference[0][1]);
  await page.locator('#openingHome').click();assert.equal(await page.locator('#titleBtn').isVisible(),true);assert.equal(await page.evaluate(()=>introActive),false);
  assert.deepEqual(errors,[]);await context.close();console.log(`${width}x${height}, large=${reading}: story, optional science, keyboard and quick guide OK`);
 }
 }catch(error){await captureFailure(browser,'story');throw error;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
