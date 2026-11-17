const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const base=process.env.RESEARCH_BASE_URL || 'http://127.0.0.1:8080';
if(!['localhost','127.0.0.1'].includes(new URL(base).hostname))throw Error('Research capture is restricted to a local fixture environment');
const {createServer}=require('vite');
const fs=require('node:fs');
const dir=path.join(root,'docs/research/media/auth-admin-current');
fs.mkdirSync(dir,{recursive:true});
(async()=>{
const vite=await createServer({root,server:{middlewareMode:true,hmr:false,ws:false},logLevel:'error'});
const {curatedProjects}=await vite.ssrLoadModule('/src/data/projects.ts');
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH || '/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const evidence=[];
async function setup(viewport,theme,admin){
 const context=await browser.newContext({viewport,reducedMotion:'reduce',colorScheme:theme});
 await context.addInitScript(theme=>localStorage.setItem('theme',theme),theme);
 await context.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.hostname!=='127.0.0.1'&&u.hostname!=='localhost'){await route.abort();return;}
  if(!u.pathname.startsWith('/api/')){await route.continue();return;}
  let value={data:[],error:null};
  if(u.pathname==='/api/auth/session')value={data:{session:admin?{user:{id:'local-research-fixture',email:'researcher@example.invalid',created_at:'2026-11-15T00:00:00Z'}}:null},error:null};
  else if(u.pathname==='/api/rpc/has_role')value={data:admin,error:null};
  else if(u.pathname==='/api/config')value={captchaEnabled:false,captchaSiteKey:null};
  else if(u.pathname==='/api/data/projects')value={data:curatedProjects,error:null};
  else if(u.pathname==='/api/analytics/summary')value={data:{totalViews:0,uniqueVisitors:0,avgViewsPerDay:0,viewsByPage:[],viewsByDate:[],topReferrers:[]},error:null};
  else if(u.pathname==='/api/events'){await route.fulfill({status:200,contentType:'text/event-stream',body:': local research fixture\n\n'});return;}
  else if(u.pathname==='/api/functions/check-rate-limit')value={data:{blocked:false,remainingSeconds:0},error:null};
  else if(u.pathname==='/api/auth/login')value={data:null,error:{message:'Email atau password salah.'}};
  await route.fulfill({status:u.pathname==='/api/auth/login'?401:200,contentType:'application/json',body:JSON.stringify(value)});
 });
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/'+(admin?'admin':'auth'),{waitUntil:'networkidle'});
 await page.waitForSelector(admin?'[role="tablist"]':'#email');
 await page.screenshot({path:`${dir}/${admin?'admin':'auth'}-${theme}-${viewport.width}.png`,fullPage:true});
 const metrics=await page.evaluate(()=>({language:document.documentElement.lang,title:document.title,viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,headings:[...document.querySelectorAll('h1')].map(e=>e.textContent),buttons:[...document.querySelectorAll('button')].filter(e=>e.getClientRects().length).map(e=>({text:e.textContent,aria:e.getAttribute('aria-label'),width:Math.round(e.getBoundingClientRect().width),height:Math.round(e.getBoundingClientRect().height)})),fields:[...document.querySelectorAll('input')].map(e=>({id:e.id,type:e.type,name:e.name,autocomplete:e.autocomplete,invalid:e.getAttribute('aria-invalid'),describedBy:e.getAttribute('aria-describedby')})),tabs:[...document.querySelectorAll('[role="tab"]')].map(e=>({label:e.textContent,rect:{x:e.getBoundingClientRect().x,right:e.getBoundingClientRect().right}})),bodyBackground:getComputedStyle(document.querySelector('[data-design="legacy"]')).backgroundColor,submit:[...document.querySelectorAll('button[type=submit]')].map(e=>({color:getComputedStyle(e).color,background:getComputedStyle(e).backgroundColor}))}));
 evidence.push({admin,theme,viewport,metrics,errors});
 return {context,page};
}
for(const [viewport,theme,admin]of [[{width:1440,height:1000},'dark',false],[{width:1440,height:1000},'light',false],[{width:390,height:844},'dark',false],[{width:320,height:740},'dark',false],[{width:1440,height:1000},'dark',true],[{width:1440,height:1000},'light',true],[{width:390,height:844},'dark',true],[{width:320,height:740},'dark',true]]){
 const {context,page}=await setup(viewport,theme,admin);
 if(admin&&viewport.width<=390){evidence.push({mobileWidth:viewport.width,mobileTabNames:await page.getByRole('tab').evaluateAll(elements=>elements.map(e=>({text:e.innerText,aria:e.getAttribute('aria-label')}))),accessibleProjectsTabs:await page.getByRole('tab',{name:/projects/i}).count()});}
 if(!admin&&viewport.width===1440&&theme==='dark'){
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(100);
  evidence.push({authInvalid:await page.evaluate(()=>({focused:document.activeElement?.id,errors:[...document.querySelectorAll('p.text-destructive')].filter(e=>e.textContent).map(e=>({text:e.textContent,color:getComputedStyle(e).color,id:e.id,role:e.getAttribute('role')})),email:{invalid:document.getElementById('email').getAttribute('aria-invalid'),describedBy:document.getElementById('email').getAttribute('aria-describedby')}}))});
  await page.screenshot({path:dir+'/auth-invalid-dark-1440.png',fullPage:true});
 }

 if(admin&&viewport.width===1440&&theme==='dark'){
  const add=page.getByRole('button',{name:/Tambah Project/});
  if(await add.count()){
   await add.click();await page.waitForSelector('[role="dialog"]');
   await page.screenshot({path:dir+'/admin-project-dialog-dark-1440.png',fullPage:true});
   evidence.push({dialog:await page.locator('[role="dialog"]').evaluate(e=>({background:getComputedStyle(e).backgroundColor,color:getComputedStyle(e).color,withinConsole:!!e.closest('[data-design="legacy"]'),bounds:{width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}}))});
  }
 }
 await context.close();
}
fs.writeFileSync(dir+'/browser-evidence.json',JSON.stringify(evidence,null,2));
await browser.close();await vite.close();console.log(JSON.stringify({screenshots:fs.readdirSync(dir).filter(x=>x.endsWith('.png')),evidence:'browser-evidence.json',pageErrors:evidence.flatMap(e=>e.errors??[])}));
})().catch(e=>{console.error(e);process.exitCode=1});
