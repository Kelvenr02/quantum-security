const {chromium,captureFailure}=require('./harness.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required'],...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
 const report=[];
 try{for(const [width,height]of [[1600,900],[390,700],[568,320]]){
  const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage(),errors=[],network=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
  await page.clock.install({time:new Date('2026-10-15T12:00:00Z')});await page.clock.pauseAt(new Date('2026-10-15T12:00:00Z'));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../../index.html')).href);await page.locator('#titleBtn').click();
  await page.waitForFunction(()=>gameAudio.context?.state==='running'&&!gameAudio.loading.size);
  await page.evaluate(()=>{tutorial.stop();startDefense();startGame();cancelAnimationFrame(rafId);level=2;beginBoss();continuePhase();cancelAnimationFrame(rafId);window.soundTrace=[];const sfx=gameAudio.sfx.bind(gameAudio);gameAudio.sfx=(name,options)=>{soundTrace.push({name,time:boss?.model.time,gameTime});return sfx(name,options);};hullInvulUntil=1e9;invulUntil=1e9;});
  await page.evaluate(()=>{for(let i=0;i<55;i++)updateBossBattle(50/FRAME_MS,shipCenterX());});
  const trace=await page.evaluate(()=>soundTrace);assert.equal(trace.filter(e=>e.name==='tracking').length,1);assert.equal(trace.filter(e=>e.name==='targetLock').length,1);assert.equal(trace.filter(e=>e.name==='salvo').length,1);
  assert.equal(trace.find(e=>e.name==='targetLock').time,650);assert.equal(trace.find(e=>e.name==='salvo').time,2650);
  await page.evaluate(()=>{togglePause();soundTrace=[];});await page.clock.runFor(3000);assert.deepEqual(await page.evaluate(()=>soundTrace),[]);
  await page.evaluate(()=>{gameAudio.setPaused('game',false);gameAudio.setScene('boss',8);gameAudio.setBossStage(1);});const music=await page.evaluate(()=>gameAudio.musicVoice?.key);
  await page.evaluate(()=>{gameAudio.setBossStage(2);gameAudio.setBossStage(2);});assert.equal((await page.evaluate(()=>soundTrace)).filter(e=>e.name==='bossStage').length,2);assert.equal(await page.evaluate(()=>gameAudio.musicVoice?.key),music);
  // Render actual Web Audio oscillators/compressor offline; no speakers or timing assumptions.
  const rendered=await page.evaluate(async()=>{
   const result=[];for(const name of ['tracking','targetLock','salvoWarning','salvo','noiseWarning','noisePulse','bossStage']){
    const native=new OfflineAudioContext(2,44100,44100),wrapped=new Proxy(native,{get(target,key){if(key==='state')return 'running';const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;}});
    const engine=new OrbitalAudioEngine({createContext:()=>wrapped});engine.unlock();engine.setPreferences({music:0,effects:.65});engine.sfx(name);
    const buffer=await native.startRendering(),data=buffer.getChannelData(0);let peak=0,energy=0;for(const v of data){peak=Math.max(peak,Math.abs(v));energy+=v*v;}result.push({name,peak,rms:Math.sqrt(energy/data.length)});
   }return result;
  });for(const sound of rendered){assert.ok(sound.rms>.0001);assert.ok(sound.peak<.95);}
  assert.deepEqual(errors,[]);assert.deepEqual(network,[]);report.push({width,height,trace,rendered});await context.close();console.log(`${width}x${height}: event synchronization, stage, pause, offline mix OK`);
 }
 }catch(error){await captureFailure(browser,'audio');throw error;}finally{await browser.close();}
 fs.mkdirSync('tmp',{recursive:true});fs.writeFileSync('tmp/phase7-audio.json',JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
