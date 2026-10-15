const {chromium,captureFailure}=require('./harness.cjs');
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const output=path.resolve(__dirname,'../../tmp/progression-check');
(async()=>{
  fs.mkdirSync(output,{recursive:true});const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
  try{for(const [width,height]of [[1600,900],[390,700],[568,320]]){
    const page=await browser.newPage({viewport:{width,height},hasTouch:width!==1600}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.clock.install({time:new Date('2026-10-15T12:00:00Z')});await page.clock.pauseAt(new Date('2026-10-15T12:00:00Z'));await page.goto(pathToFileURL(path.resolve(__dirname,'../../index.html')).href);
    await page.evaluate(()=>{startIntro();tutorial.stop();startDefense();startGame();});
    await page.keyboard.press('ArrowLeft');await page.clock.runFor(180);
    assert.equal(await page.evaluate(()=>campaignMetrics.data.firsts.movement.input),'keyboard');
    await page.keyboard.press('Escape');assert.match(await page.locator('#pauseOptional').textContent(),/OPCIONAL.*impactos/);
    await page.keyboard.press('Escape');await page.evaluate(()=>{cancelAnimationFrame(rafId);beginBoss();boss.status='won';finishBoss();});
    assert.equal(await page.locator('#phaseDebrief').isVisible(),true);assert.equal(await page.locator('#phaseDebrief').getAttribute('open'),null);
    await page.locator('#phaseDebriefTitle').click();assert.match(await page.locator('#phaseDebriefText').textContent(),/MEDALHA.*conceito/);
    await page.locator('#phaseDebriefTitle').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,`${width}-summary.png`)});
    await page.locator('#btnContinue').click();assert.equal(await page.evaluate(()=>isPlaying&&!isStageBriefing),true);
    await page.evaluate(()=>{cancelAnimationFrame(rafId);campaignSeed=42;enterPhase(5);recordPhaseGoal('splitsPrevented');beginBoss();});
    const plan=await page.evaluate(()=>JSON.stringify(encounterDirector.plan));
    await page.reload();await page.locator('#titleContinue').click();assert.equal(await page.evaluate(()=>JSON.stringify(encounterDirector.plan)),plan);
    assert.equal(await page.evaluate(()=>phaseGoals.counts.splitsPrevented),1);assert.equal(await page.evaluate(()=>campaignJourney.awards[0]),true);
    await page.locator('#btnContinue').click();await page.keyboard.press('Escape');
    assert.match(await page.locator('#pauseOptional').textContent(),/1 \/ 2/);
    const t=await page.evaluate(()=>campaignMetrics.data.activeMs);await page.clock.runFor(2000);assert.equal(await page.evaluate(()=>campaignMetrics.data.activeMs),t);
    const doc=await page.evaluate(()=>JSON.parse(quantumDiagnostics.playtest()));assert.ok(doc.attempts.length>=1);
    assert.equal(doc.attempts.at(-1).schemaVersion,3);
    if(width!==1600){await page.keyboard.press('Escape');await page.locator('.touch-controls [data-action="right"]').tap();await page.locator('.touch-controls [data-action="regen"]').tap();assert.equal(await page.evaluate(()=>campaignMetrics.data.firsts.regen.input),'touch');}
    assert.deepEqual(errors,[]);await page.close();console.log(`${width}x${height}: objetivo, resumo, medalha, variante e reabertura OK`);
  }}catch(error){await captureFailure(browser,'progression');throw error;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
