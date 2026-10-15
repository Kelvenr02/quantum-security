/* Local Chromium measurement, not a benchmark of a physical phone. No fake clock. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required'],...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
 const report={schema:1,date:new Date().toISOString(),browser:browser.version(),cpuModel:require('node:os').cpus()[0].model,method:'file://, headless Chromium, real RAF, CDP CPU throttle; warm OS cache; PCM is buffer size, not process RAM; music is rapid paused stress, steadyMusic is normal fade retirement',runs:[]};
 try{for(const [width,height,cpu]of [[1600,900,1],[390,700,4],[568,320,4]]){
  const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage(),cdp=await context.newCDPSession(page),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await cdp.send('Emulation.setCPUThrottlingRate',{rate:cpu});
  await page.addInitScript(()=>{
   window.audioMeasurements=[];window.longTasks=[];
   try{new PerformanceObserver(list=>longTasks.push(...list.getEntries().map(e=>({start:e.startTime,ms:e.duration})))).observe({type:'longtask',buffered:true});}catch{}
   const proto=window.AudioContext?.prototype,decode=proto?.decodeAudioData;
   if(decode)proto.decodeAudioData=function(bytes,...args){const start=performance.now(),inputBytes=bytes.byteLength;return decode.call(this,bytes,...args).then(buffer=>{audioMeasurements.push({ms:performance.now()-start,inputBytes,seconds:buffer.duration,pcmBytes:buffer.length*buffer.numberOfChannels*4});return buffer;});};
  });
  await page.goto(pathToFileURL(path.resolve(__dirname,'../../index.html')).href);
  const startup=await page.evaluate(()=>{const n=performance.getEntriesByType('navigation')[0];return {domReadyMs:n.domContentLoadedEventEnd,loadMs:n.loadEventEnd,heapBytes:performance.memory?.usedJSHeapSize??null};});
  await page.locator('#titleBtn').click();await page.waitForFunction(()=>gameAudio.context?.state==='running'&&!gameAudio.loading.size);
  const initialAudio=await page.evaluate(()=>({status:gameAudio.status(),decodes:audioMeasurements.slice(),pcmBytes:[...gameAudio.buffers.values()].reduce((s,b)=>s+b.length*b.numberOfChannels*4,0)}));
  const frames=[];
  for(const phase of [2,8]){
   await page.evaluate(phase=>{tutorial.stop();startDefense();startGame();cancelAnimationFrame(rafId);level=phase;beginBoss();continuePhase();hullInvulUntil=gameTime+1e8;invulUntil=gameTime+1e8;},phase);
   const sample=await page.evaluate(()=>new Promise(resolve=>{const times=[],start=performance.now();let last=start;function frame(now){times.push(now-last);last=now;if(now-start<2400)requestAnimationFrame(frame);else{const sorted=times.slice(1).sort((a,b)=>a-b);resolve({samples:sorted.length,p50:sorted[Math.floor(sorted.length*.5)],p95:sorted[Math.floor(sorted.length*.95)],max:Math.max(...sorted),over33ms:sorted.filter(t=>t>33.4).length});}}requestAnimationFrame(frame);}));
   frames.push({phase,...sample});
  }
  const steadyMusic=[];await page.evaluate(()=>{togglePause();gameAudio.stopEffects();gameAudio.setPaused('game',false);});
  for(let phase=1;phase<=8;phase++){
   await page.evaluate(phase=>gameAudio.setScene('phase',phase),phase);
   await page.waitForFunction(()=>!gameAudio.loading.size&&gameAudio.musicVoices.size===1);
   const sample=await page.evaluate(()=>({phase:gameAudio.phase,pcmBytes:gameAudio.pcmBytes(),sources:gameAudio.musicVoices.size,tracks:[...gameAudio.buffers.keys()].filter(k=>gameAudio.assets[k].kind==='music')}));
   assert.ok(sample.tracks.length<=2);steadyMusic.push(sample);
  }
  await page.evaluate(()=>gameAudio.setPaused('game',true));
  // Rapid paused transitions expose buffers retained by fades that cannot advance.
  const music=[];for(let phase=1;phase<=8;phase++){
   await page.evaluate(async phase=>{gameAudio.setScene('phase',phase);await Promise.all([...gameAudio.loading.values()]);await gameAudio.ensureMusic();},phase);
   music.push(await page.evaluate(()=>({phase:gameAudio.phase,decoded:gameAudio.buffers.size,pcmBytes:[...gameAudio.buffers.values()].reduce((s,b)=>s+b.length*b.numberOfChannels*4,0),sources:gameAudio.musicVoices.size})));
  }
  const heap=await cdp.send('Runtime.getHeapUsage');const diagnostics=await page.evaluate(()=>({audio:gameAudio.status(),decodes:audioMeasurements,longTasks,heapBytes:performance.memory?.usedJSHeapSize??null}));
  assert.deepEqual(errors,[]);assert.deepEqual(diagnostics.audio.errors,[]);
  report.runs.push({width,height,cpu,startup,initialAudio,frames,music,steadyMusic,heap,diagnostics});await context.close();console.log(`${width}x${height} CPU ${cpu}x: measured`);
 }
 }finally{await browser.close();}
 const target=path.resolve(process.env.PERFORMANCE_OUTPUT||'tmp/performance.json');fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify(report,null,2));console.log(target);
})().catch(e=>{console.error(e);process.exitCode=1;});
