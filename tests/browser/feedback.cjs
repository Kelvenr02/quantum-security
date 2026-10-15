/* Fluxos reais de treino, consulta e retomada; não substitui partidas humanas. */
const {chromium,captureFailure}=require('./harness.cjs');
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const output=path.resolve(__dirname,'../../tmp/feedback-check');
(async()=>{
  fs.mkdirSync(output,{recursive:true});
  const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
  let checked=0;
  try{for(const [width,height]of [[1600,900],[390,700],[568,320]]){
    const page=await browser.newPage({viewport:{width,height},hasTouch:width!==1600}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));await page.clock.install({time:new Date('2026-10-15T12:00:00Z')});await page.clock.pauseAt(new Date('2026-10-15T12:00:00Z'));
    await page.goto(pathToFileURL(path.resolve(__dirname,'../../index.html')).href);
    await page.evaluate(()=>startIntro());
    await page.locator('#trainingNext').click();await page.locator('[data-training-action="measure"]').click();
    await page.locator('#trainingNext').click();await page.locator('[data-training-action="activate"]').click();await page.locator('#trainingNext').click();
    await page.keyboard.press('ArrowLeft');await page.clock.runFor(1200);
    assert.equal(await page.locator('#trainingScore').textContent(),'10 pts');
    assert.match(await page.locator('#trainingObjective').textContent(),/Saia das faixas A/);
    await page.screenshot({path:path.join(output,`${width}-training-warning.png`)});
    await page.keyboard.press('r');await page.clock.runFor(2000);
    assert.equal(await page.locator('#trainingNext').isDisabled(),true);
    assert.match(await page.locator('#trainingFeedback').textContent(),/salva atingiu/);
    if(width===1600){await page.keyboard.down('ArrowRight');await page.clock.runFor(320);await page.keyboard.up('ArrowRight');}
    else{await page.locator('#trainingRight').dispatchEvent('pointerdown',{pointerId:1});await page.clock.runFor(320);await page.locator('#trainingRight').dispatchEvent('pointerup',{pointerId:1});}
    assert.match(await page.locator('#trainingObjective').textContent(),/Fora de A|RESPIRO/);
    await page.locator('#trainingRegen').click();await page.locator('#trainingPause').click();await page.clock.runFor(3000);
    assert.equal(await page.locator('#trainingNext').isDisabled(),true);
    await page.locator('#trainingPause').click();await page.clock.runFor(2100);
    assert.equal(await page.locator('#trainingNext').isDisabled(),false);
    await page.locator('#trainingNext').click();await page.evaluate(()=>cancelAnimationFrame(rafId));
    for(const phase of [1,2,3,4,5,6,7,8,9,10]){
      await page.evaluate(phase=>{
        boss=null;isPaused=false;isStageBriefing=false;level=Math.min(phase,8);beginBoss();continuePhase();cancelAnimationFrame(rafId);
        const m=boss.model;if(phase>8){m.hp=[phase===9?24:12];m.prepareRound(4);}
        m.time=m.roundStart+3000;m.coherence=45;
        if(phase===3){m.time=5000;m.hp=[8,0,8];}
        m.pulses.forEach(p=>p.fired=p.at<=m.time);
        updateBossHUD();refreshArenaBounds();drawBackground(0);drawBoss();drawShip(shipCenterX(),false);
      },phase);
      if(phase===3)assert.match(await page.locator('#bossHint').textContent(),/VIVOS FECHADOS/);
      if([5,9].includes(phase))assert.equal(await page.locator('#bossCoherence').isVisible(),true);
      if(phase>=8)assert.match(await page.locator('#bossHealth').textContent(),new RegExp((phase===8?1:phase===9?2:3)+'/3'));
      assert.equal(await page.evaluate(()=>['channelHud','hudDisplay','bossHud'].every(id=>$(id).getBoundingClientRect().bottom<=bossArenaY()-bossNodeRadius()-(height<620?9:15)-8)),true,'Cabeçalho separado dos alvos');
      if(phase===3)await page.screenshot({path:path.join(output,`${width}-triad-wait.png`)});
      const snapshot=()=>page.evaluate(()=>JSON.stringify({m:boss.model,gameTime,qber,keyReadyAt,r:campaignRandom.snapshot()}));
      const before=await snapshot();await page.keyboard.press('Escape');
      assert.equal(await page.locator('#pauseOverlay').isVisible(),true);
      assert.equal(await page.locator('#pauseGuideSteps li').count(),3);
      assert.equal(await page.locator('#pauseGuideTitle').textContent(),await page.evaluate(()=>boss.model.definition.name));
      const heading=await page.locator('#pauseTitle').boundingBox();assert.ok(heading.y>=0,'Título da pausa acessível no início da rolagem');
      await page.clock.runFor(3000);assert.equal(await snapshot(),before);
      await page.locator('#pauseResume').scrollIntoViewIfNeeded();
      if(phase===5)await page.screenshot({path:path.join(output,`${width}-pause-guide.png`)});
      await page.keyboard.press('Enter');assert.equal(await page.locator('#pauseOverlay').isVisible(),false);
      assert.equal(await page.evaluate(()=>document.activeElement===canvas),true);
      assert.equal(await snapshot(),before);checked++;
    }
    assert.deepEqual(errors,[]);await page.close();console.log(`${width}x${height}: treino e 10 consultas de chefe OK`);
  }
  console.log(`TOTAL: ${checked} consultas e 3 treinos completos OK`);
  }catch(error){await captureFailure(browser,'feedback');throw error;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
