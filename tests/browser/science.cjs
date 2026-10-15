const {chromium,captureFailure}=require('./harness.cjs');
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const output=path.resolve(__dirname,'../../tmp/science-check');
(async()=>{
  fs.mkdirSync(output,{recursive:true});const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
  try{for(const [width,height]of [[1600,900],[390,700],[568,320]]){
    const context=await browser.newContext({viewport:{width,height},hasTouch:width!==1600}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));await page.clock.install({time:new Date('2026-10-15T12:00:00Z')});await page.clock.pauseAt(new Date('2026-10-15T12:00:00Z'));await page.goto(pathToFileURL(path.resolve(__dirname,'../../index.html')).href);
    await page.evaluate(()=>{startIntro();tutorial.stop();startDefense();startGame();cancelAnimationFrame(rafId);enterPhase(3);});
    assert.equal(await page.locator('#phaseLabDetails').getAttribute('open'),null);
    await page.locator('#phaseLabDetails>summary').click();
    const lab=page.locator('#phaseScienceLab');await lab.locator('[data-science-action="h"]').focus();await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(()=>isStageBriefing),true);assert.deepEqual(await lab.locator('.science-bars b').allTextContents(),['50%','50%']);
    await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>isStageBriefing),true);
    assert.deepEqual(await lab.locator('.science-bars b').allTextContents(),['100%','0%']);
    const state=()=>page.evaluate(()=>JSON.stringify({qber,gameTime,score,missed,keyReadyAt,r:campaignRandom.snapshot(),p:shipPilot.position}));const before=await state();
    for(const topic of ['key','hadamard','bell','coherence','syndrome','interference']){
      await lab.locator('select').selectOption(topic);
      if(topic==='key'){await lab.locator('[data-science-action="noise"]').click();await lab.locator('[data-science-action="compare"]').click();assert.match(await lab.locator('.science-result').textContent(),/25%/);await lab.locator('[data-science-action="request"]').click();assert.match(await lab.locator('.science-result').textContent(),/ruído permanece/);}
      if(topic==='bell'){await lab.locator('[data-science-action="h"]').click();await lab.locator('[data-science-action="cnot"]').click();assert.deepEqual(await lab.locator('.science-bars b').allTextContents(),['50%','0%','0%','50%']);}
      if(topic==='syndrome'){await lab.locator('[data-science-action="inject"][data-science-value="2"]').click();assert.match(await lab.locator('.science-result').textContent(),/11/);await lab.locator('[data-science-action="correct"][data-science-value="2"]').click();assert.match(await lab.locator('.science-result').textContent(),/síndrome 00/);}
      assert.equal(await state(),before);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      await lab.locator('select').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,`${width}-${topic}.png`)});
    }
    await lab.locator('[data-science-hints]').uncheck();assert.equal(await page.evaluate(()=>scienceHintsEnabled),false);
    await page.locator('#btnContinue').click();await page.evaluate(()=>cancelAnimationFrame(rafId));await page.keyboard.press('Escape');
    await page.locator('#pauseScienceDetails>summary').click();assert.equal(await page.locator('#pauseScienceLab [data-science-hints]').isChecked(),false);
    await page.locator('#pauseScienceLab select').selectOption('bell');await page.locator('#pauseScienceLab [data-science-action="h"]').click();
    const time=await page.evaluate(()=>gameTime);await page.clock.runFor(2000);assert.equal(await page.evaluate(()=>gameTime),time);
    await page.reload();assert.equal(await page.evaluate(()=>scienceHintsEnabled),false);
    await page.locator('#titleContinue').click();assert.equal(await page.evaluate(()=>isStageBriefing),true);
    await page.evaluate(()=>{continuePhase();cancelAnimationFrame(rafId);boss=null;level=6;beginBoss();continuePhase();cancelAnimationFrame(rafId);boss.model.time=2800;boss.model.pulses.forEach(p=>p.fired=p.at<=boss.model.time);updateBossHUD();refreshArenaBounds();drawBackground(0);drawBoss();});
    assert.match(await page.locator('#bossHint').textContent(),/LEITURA (10|11|01) → M[123]/);
    await page.screenshot({path:path.join(output,`${width}-syndrome-boss.png`)});
    await page.evaluate(()=>{boss.model.pulses.forEach(p=>p.fired=true);boss.channelPulse=null;scienceHintsEnabled=true;notifyCombat(scienceCueText.renew,-1);refreshCombatHUD();refreshArenaBounds();drawBackground(0);drawBoss();});
    assert.equal(await page.locator('#bossFeedback').isVisible(),true);
    assert.equal(await page.evaluate(()=>['channelHud','hudDisplay','bossHud'].every(id=>$(id).getBoundingClientRect().bottom<=bossArenaY()-bossNodeRadius()-(height<620?9:15)-8)&&bossArenaY()+bossNodeRadius()<=shipY-shipSize),true,'Pista científica não cobre alvos/nave');
    assert.deepEqual(errors,[]);await context.close();console.log(`${width}x${height}: seis experimentos, teclado, pausa, preferência e síndrome OK`);
  }}catch(error){await captureFailure(browser,'science');throw error;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
