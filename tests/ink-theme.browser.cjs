// Run with PLAYWRIGHT_MODULE pointing to an installed Playwright package.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const sharp = require('sharp');
const base = process.env.INK_BASE_URL || 'http://127.0.0.1:4190';
const output = process.env.INK_OUTPUT_DIR || 'docs/media/ink-v2';
const results = [];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function setup(browser, mode, viewport = {width:1280,height:800}, route='/') {
 const context=await browser.newContext({viewport,serviceWorkers:'block'});
 await context.addInitScript(mode=>{
  if(mode==='layers')Object.defineProperty(document,'startViewTransition',{value:undefined,configurable:true});
  const NativeWorker=window.Worker;
  window.inkWorkers=new Set();window.inkWorkerCount=0;window.inkWorkerResults=0;
  window.Worker=class extends NativeWorker {
   constructor(...args){super(...args);window.inkWorkers.add(this);window.inkWorkerCount++;this.addEventListener('message',event=>{if(event.data?.result)window.inkWorkerResults++;});}
   terminate(){window.inkWorkers.delete(this);return super.terminate();}
  };
  const animate=Element.prototype.animate;
  window.inkAssets=new Set();const create=URL.createObjectURL,revoke=URL.revokeObjectURL;
  URL.createObjectURL=function(blob){const url=create.call(this,blob);window.inkAssets.add(url);return url;};
  URL.revokeObjectURL=function(url){window.inkAssets.delete(url);return revoke.call(this,url);};
  Element.prototype.animate=function(frames,options){const a=animate.call(this,frames,options);if(Array.isArray(frames)&&frames[0]?.maskPosition){window.inkAnimation=a;window.inkStarted=performance.now();}return a;};
 },mode);
 const page=await context.newPage();
 await page.goto(base+route,{waitUntil:'domcontentloaded'});await page.waitForTimeout(1500);
 await page.addStyleTag({content:'[class*="z-[89]"],[class*="z-[90]"]{visibility:hidden!important}'});
 return {context,page};
}
async function start(page,mode){await page.evaluate(()=>{window.inkAnimation=null;window.inkClicked=performance.now();});await page.locator('#root .public-theme-switch').click();await page.waitForFunction(()=>window.inkAnimation,{timeout:20000});assert.equal(await page.evaluate(()=>document.documentElement.dataset.inkTransition),mode);}
async function clean(page){await page.waitForFunction(()=>!document.documentElement.dataset.inkTransition&&!document.documentElement.dataset.inkBusy,{timeout:15000});assert.equal(await page.locator('.ink-overlay,[data-ink-style]').count(),0);assert.equal(await page.evaluate(()=>window.inkAssets.size),0);assert.equal(await page.evaluate(()=>window.inkWorkers.size),0);}
async function difference(a,b){const aa=await sharp(a).raw().toBuffer(),bb=await sharp(b).raw().toBuffer();assert.equal(aa.length,bb.length);let different=0;for(let i=0;i<aa.length;i+=3)if(Math.abs(aa[i]-bb[i])+Math.abs(aa[i+1]-bb[i+1])+Math.abs(aa[i+2]-bb[i+2])>24)different++;return different/(aa.length/3);}
(async()=>{fs.mkdirSync(output,{recursive:true});const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 for(const mode of ['view','layers']){
  const {context,page}=await setup(browser,mode);
  let workerCount;
  for(const direction of ['light','dark']){
   await page.locator('#root .public-theme-switch').focus();
   const scroll=await page.evaluate(()=>scrollY);const height=await page.evaluate(()=>document.body.scrollHeight);
   await start(page,mode);
   assert.equal(await page.evaluate(()=>window.inkAnimation.effect.getKeyframes().length),64);
   const count=await page.evaluate(()=>window.inkWorkerCount);
   if(workerCount!==undefined)assert.equal(count,workerCount,'reuse the atlas across directions');
   else{assert.ok(count>0,'worker prepared the atlas');assert.ok(await page.evaluate(()=>window.inkWorkerResults)>0,'worker returned a raster');workerCount=count;}
   await page.evaluate(()=>{window.inkAnimation.pause();window.inkAnimation.currentTime=320;});
   await page.screenshot({path:`${output}/${mode}-${direction}-320ms.png`});
   if(mode==='layers'){
    await sleep(500);
    const colors=await page.locator('[data-ink-scope] .public-design').evaluateAll(nodes=>nodes.map(e=>getComputedStyle(e).getPropertyValue('--site-bg').trim()));
    assert.deepEqual(colors,direction==='light'?['#0b181c','#f1ece1']:['#f1ece1','#0b181c']);
    assert.equal(await page.locator('.ink-overlay').getAttribute('aria-hidden'),'true');
    assert.equal(await page.locator('.ink-overlay').evaluate(e=>e.inert),true);
   }
   await page.evaluate(()=>{window.inkAnimation.currentTime=878;});
   const complete=await page.screenshot();
   await page.evaluate(()=>window.inkAnimation.play());await clean(page);await page.waitForTimeout(100);
   const final=await page.screenshot();const mismatch=await difference(complete,final);
   assert.ok(mismatch<.015,`${mode}/${direction} full-coverage mismatch ${mismatch}`);
   assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('dark')),direction==='dark');
   assert.equal(await page.evaluate(()=>scrollY),scroll);assert.equal(await page.evaluate(()=>document.body.scrollHeight),height);
   assert.equal(await page.locator('#root .public-theme-switch').evaluate(e=>e===document.activeElement),true);
   results.push({mode,direction,fullCoverageMismatch:mismatch,preparationMs:await page.evaluate(()=>window.inkStarted-window.inkClicked)});
   console.log(results.at(-1));
  }
  // Latest intent wins, with no accumulating overlays or mask URLs.
  const original=await page.evaluate(()=>document.documentElement.classList.contains('dark'));
  await start(page,mode);await page.locator('#root .public-theme-switch').click();await clean(page);
  assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('dark')),original);
  await start(page,mode);await page.setViewportSize({width:1170,height:730});await clean(page);
  await page.emulateMedia({reducedMotion:'reduce'});const before=await page.evaluate(()=>document.documentElement.classList.contains('dark'));
  await page.locator('#root .public-theme-switch').click();await page.waitForTimeout(30);await clean(page);
  assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('dark')),!before);
  results.push({mode,rapidClicks:'passed',resize:'passed',reducedMotion:'passed'});await context.close();
 }
 // Unusual ratios and scroll alignment; form state survives both rendering paths.
 for(const [mode,viewport] of [['layers',{width:390,height:844}],['view',{width:1600,height:420}],['layers',{width:420,height:1200}]]){
  const {context,page}=await setup(browser,mode,viewport,'/contact');
  const input=page.getByRole('textbox',{name:'Nama',exact:true});await input.fill('Ink theme state');await page.evaluate(()=>scrollTo(0,180));await page.waitForTimeout(500);
  const initial=await page.evaluate(()=>scrollY);await start(page,mode);await clean(page);
  assert.equal(await input.inputValue(),'Ink theme state');assert.equal(await page.evaluate(()=>scrollY),initial);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  results.push({mode,viewport,stateAndAlignment:'passed'});await context.close();
 }
 // Rejected captures, failed assets and owner removal settle without residue.
 for(const fault of ['mask','transition','unmount','scroll']){
  const {context,page}=await setup(browser,'view');
  if(fault==='mask')await page.evaluate(()=>{window.Worker=undefined;HTMLCanvasElement.prototype.toBlob=function(callback){callback(null);};});
  if(fault==='transition')await page.evaluate(()=>{document.startViewTransition=()=>{throw Error('forced capture failure');};});
  const before=await page.evaluate(()=>document.documentElement.classList.contains('dark'));
  if(fault==='mask'||fault==='transition'){await page.locator('#root .public-theme-switch').click();await page.waitForTimeout(1800);}
  else {await start(page,'view');if(fault==='unmount')await page.locator('#root .public-theme-switch').evaluate(e=>e.remove());else await page.evaluate(()=>scrollTo(0,200));}
  await clean(page);assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('dark')),!before);
  results.push({fault,settled:'passed'});await context.close();
 }
 // Compatibility: worker construction failure uses the same rasterizer on the page.
 for(const mode of ['view','layers']){
  const {context,page}=await setup(browser,mode);
  await page.evaluate(()=>{window.Worker=class {constructor(){throw Error('forced worker failure');}};});
  await start(page,mode);await clean(page);
  results.push({mode,workerUnavailable:'raster fallback passed'});await context.close();
 }
 // Cancellation during preparation actually terminates the active worker.
 {
  const {context,page}=await setup(browser,'view');
  const before=await page.evaluate(()=>document.documentElement.classList.contains('dark'));
  await page.locator('#root .public-theme-switch').click();
  await page.waitForFunction(()=>window.inkWorkers.size>0);
  await page.setViewportSize({width:1210,height:790});await clean(page);
  assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('dark')),!before);
  results.push({preparationCancellation:'worker terminated, destination settled'});await context.close();
 }
 console.log(JSON.stringify(results,null,2));fs.writeFileSync(`${output}/checks.json`,JSON.stringify(results,null,2));
}finally{await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
