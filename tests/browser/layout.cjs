/* Regressão real de CSS/canvas. Playwright é dependência só desta verificação. */
const {chromium,captureFailure}=require('./harness.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..'),output=path.join(root,process.env.LARGE_READING?'tmp/layout-check-large':'tmp/layout-check');
const views=[[1600,900],[1100,800],[390,844],[390,700],[320,568],[320,480],[844,390],[760,360],[568,320],[479,360],[480,360],[599,360],[600,360],[900,620]];
(async()=>{
  fs.mkdirSync(output,{recursive:true});
  const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
  const results=[];
  try{for(const [width,height]of views){
    const page=await browser.newPage({viewport:{width,height},hasTouch:width<=900});const errors=[];
    page.on('pageerror',e=>errors.push(e.message));await page.clock.install({time:new Date('2026-10-15T12:00:00Z')});await page.clock.pauseAt(new Date('2026-10-15T12:00:00Z'));await page.goto(pathToFileURL(path.join(root,'index.html')).href);
    if(process.env.LARGE_READING)await page.evaluate(()=>{accessPreferences.reading=true;accessPreferences.effects='reduced';applyAccessPreferences();});
    await page.evaluate(()=>{startIntro();tutorial.stop();startDefense();});
    for(const phase of [0,1,2,3,4,5,6,7,8,9,10])for(const status of ['safe','alert','compromised','regen']){
      await page.evaluate(({phase,status})=>{
        isPlaying=false;startGame();cancelAnimationFrame(rafId);level=phase?Math.min(8,phase):8;
        bannerUntil=0;superpositionUntil=5000;gameTime=1000;
        if(phase){beginBoss();continuePhase();cancelAnimationFrame(rafId);const m=boss.model;
          if(phase>8)m.hp=[phase===9?24:12];else m.hp=m.hp.map(h=>Math.ceil(h/2));
          m.prepareRound(4);m.time=3500;m.pulses.forEach(p=>p.fired=p.at<=m.time);m.coherence=82;
          boss.channelPulse={releaseAt:m.time+800,lanes:[3,4,5],fired:false};
        }else {resetEncounters();encounterDirector.pending={releaseAt:1900,packet:{actors:[{kind:'split',lane:0},{kind:'rush',lane:8}]}};}
        qber=status==='safe'?0:status==='alert'?9:13;
        isCompromised=status==='compromised';compEnd=5000;isRegen=status==='regen';regenEnd=3000;keyReadyAt=7000;
        updateHUD();updatePhaseHUD();updateQuantumStatus();refreshCombatHUD();if(boss)updateBossHUD();refreshArenaBounds();
        drawBackground(0);if(boss)drawBoss();else {drawFormationWarning();drawInterferenceFront({releaseAt:2800,y:95,lanes:[0,1],passed:false},0,'A',0);drawInterferenceFront({releaseAt:4000,y:95,lanes:[7,8],passed:false},0,'B',1);}
        drawShip(shipCenterX(),false);
      },{phase,status});
      const layout=await page.evaluate(()=>{
        const rect=el=>{const r=el.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
        const panels=['channelHud','hudDisplay',boss?'bossHud':'phaseHud'].map(id=>({id,...rect($(id))}));
        return {panels,shipTop:shipY-shipSize,shipBottom:shipY+shipSize,shipX:shipCenterX(),
          coreTop:boss?bossArenaY()-bossNodeRadius():null,coreBottom:boss?bossArenaY()+bossNodeRadius():null,
          labelTop:boss?bossArenaY()-bossNodeRadius()-(height<620?9:15)-8:null,
          warningTop:height<=620?shipY+32-12:arenaBounds.warningY-12,
          warningBottom:height<=620?shipY+47:arenaBounds.warningY+15,
          frontTop:arenaBounds.warningY-10,frontBottom:arenaBounds.warningY+(height<=620?18:28)+9,
          overflow:document.documentElement.scrollWidth>innerWidth,
          hint:rect($(boss?'bossHint':'quantumStatus')),touch:rect(document.querySelector('.touch-controls'))};
      });
      try{
        assert.equal(layout.overflow,false,'Sem estouro horizontal');
        for(const p of layout.panels){assert.ok(p.bottom<layout.shipTop,JSON.stringify({message:'Painel sobre a nave',p,layout}));if(phase)assert.ok(p.bottom+1<=layout.labelTop,JSON.stringify({message:'Painel sobre o alvo/legenda',p,layout}));}
        if(phase){assert.ok(layout.coreBottom<=layout.shipTop,JSON.stringify({message:'Núcleo sobre a nave',layout}));}
        else {const bottom=Math.max(...layout.panels.map(p=>p.bottom));assert.ok(layout.warningTop>bottom);assert.ok(layout.frontTop>bottom);assert.ok(layout.frontBottom<layout.shipTop);}
        if(layout.touch.height){assert.ok(layout.hint.bottom<layout.touch.top||layout.hint.top>layout.touch.bottom,'Dica separada dos controles');}
      }catch(e){await page.screenshot({path:path.join(output,`failure-${width}x${height}-${phase}-${status}.png`)});throw new Error(`${width}x${height} chefe=${phase} estado=${status}: ${e.message}`);}
      results.push({width,height,phase,status,...layout});
      if([568,760,390].includes(width)&&[0,3,5,9].includes(phase)&&status==='compromised')await page.screenshot({path:path.join(output,`${width}x${height}-${phase}.png`)});
    }
    const before=await page.evaluate(()=>JSON.stringify(campaignRandom.snapshot()));
    await page.evaluate(()=>{isPlaying=true;isStageBriefing=false;isPaused=false;togglePause();});
    await page.setViewportSize({width:height,height:width});await page.evaluate(()=>refreshArenaBounds());
    assert.equal(await page.evaluate(()=>JSON.stringify(campaignRandom.snapshot())),before,'Rotação não consome sorteios do ambiente');
    assert.deepEqual(errors,[]);await page.close();console.log(`${width}x${height}: 44 estados OK`);
  }
  fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(results,null,2));console.log(`TOTAL: ${results.length} estados visuais OK`);
  }catch(error){await captureFailure(browser,'layout');throw error;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
