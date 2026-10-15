/* Capture only failing contexts; successful traces remain temporary and are discarded. */
const {chromium:engine}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path');
const chromium={async launch(options){
 const browser=await engine.launch(options),create=browser.newContext.bind(browser);
 browser.newContext=async options=>{const context=await create(options);await context.tracing.start({screenshots:true,snapshots:true,sources:true});return context;};
 browser.newPage=async options=>{const context=await browser.newContext(options);return context.newPage();};
 return browser;
}};
async function captureFailure(browser,name){
 const out=path.resolve('tmp/browser-tests/failures/'+(process.env.BROWSER_SUITE||name));fs.mkdirSync(out,{recursive:true});
 let index=0;for(const context of browser.contexts()){
  for(const page of context.pages()){try{await page.screenshot({path:path.join(out,`${index}-screen.png`),fullPage:true,timeout:5000});}catch{}index++;}
  try{await context.tracing.stop({path:path.join(out,`${index}-trace.zip`)});}catch{}
 }
}
module.exports={chromium,captureFailure};
