const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium}=require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const origin=process.argv[2]||'http://localhost:4182';
const report={date:'2026-10-28',origin,checks:[],errors:[]};
const save=()=>fs.writeFileSync(path.join(__dirname,'t2.2-mobile-qa.json'),JSON.stringify(report,null,2));
const pass=(name,detail)=>{report.checks.push({name,detail});save();console.log('PASS',name);};
const a=(p,n)=>p.locator(`[data-training="${n}"]`);
const target=p=>p.locator('.training-target__button');
const slider=p=>p.locator('#training-sweep');
async function ready(p){await p.goto(`${origin}/?debug#train`);await p.waitForFunction(()=>window.__aparDebug&&getComputedStyle(document.querySelector('#splash')).opacity==='0');await a(p,'start').click();await p.waitForTimeout(800);}
async function advance(p){await a(p,'next').click();await p.waitForTimeout(800);}
async function effects(p){return p.evaluate(()=>{const d=window.__aparDebug,r=d.scene.getObjectByName('training-effects'),f=d.scene.getObjectByName('training-fire'),s=d.scene.getObjectByName('training-spray');return{root:r.visible,fire:r.visible&&f.visible,spray:r.visible&&s.visible,level:f.scale.x,calls:d.renderer.info.render.calls,memory:d.renderer.info.memory};});}
async function measure(p){return p.evaluate(async()=>{const {renderer}=window.__aparDebug,render=renderer.render;const times=[];const input=document.querySelector('#training-sweep');let flip=false;const inputTimer=setInterval(()=>{input.value=(flip=!flip)?'40':'60';input.dispatchEvent(new Event('input'));},40);renderer.render=function(...args){times.push(performance.now());return render.apply(this,args);};await new Promise(r=>setTimeout(r,1600));clearInterval(inputTimer);renderer.render=render;const gaps=times.slice(1).map((t,i)=>t-times[i]).sort((a,b)=>a-b);return{frames:times.length,ms:1600,fps:times.length/1.6,p95Ms:gaps[Math.floor(gaps.length*.95)],calls:renderer.info.render.calls,memory:renderer.info.memory};});}
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1.5,locale:'id-ID'});
 const p=await context.newPage();p.on('pageerror',e=>report.errors.push(String(e)));p.on('console',m=>{if(m.type()==='error'&&!m.text().includes('404'))report.errors.push(m.text());});
 await ready(p);await target(p).tap();await advance(p);assert.equal(await target(p).isVisible(),true);await target(p).tap();assert.equal((await effects(p)).fire,true);
 await advance(p);assert.equal(await target(p).isVisible(),true);
 const cdp=await context.newCDPSession(p);const box=await target(p).boundingBox(),point={x:box.x+22,y:box.y+22};
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});await p.waitForTimeout(300);assert.equal((await effects(p)).spray,true);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal((await effects(p)).spray,false);assert.equal(await a(p,'next').isDisabled(),true);
 await p.waitForTimeout(150);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});await p.waitForTimeout(1150);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await a(p,'next').isDisabled(),false);
 await advance(p);await slider(p).focus();await slider(p).press('ArrowRight');assert.equal((await effects(p)).spray,true);
 const perf=await measure(p);assert.ok(perf.fps>=30);pass('Mobile emulation touch hold / release / active fire and spray FPS (desktop hardware)',perf);
 await p.waitForTimeout(250);await slider(p).focus();await slider(p).press('Home');
 const cases=[];
 for(const size of [{width:360,height:800},{width:390,height:844},{width:768,height:1024},{width:844,height:390},{width:390,height:420}]){
  await p.setViewportSize(size);await p.waitForTimeout(850);
  for(const lang of ['en','id']){await p.locator(`[data-lang="${lang}"]`).tap();
   for(const zoom of [1,2]){await p.locator('.training').evaluate((el,z)=>{for(const n of [12,14,16,20,28,40])el.style.setProperty(`--fs-${n}`,`${n*z}px`);},zoom);
    for(const expanded of [false,true]){
     if(await p.locator('#panel').evaluate(el=>el.classList.contains('is-expanded'))!==expanded)await p.locator('.panel__handle').tap();await p.waitForTimeout(300);
     await slider(p).scrollIntoViewIfNeeded();
     const hit=await slider(p).evaluate(el=>{const b=el.getBoundingClientRect();return document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)===el;});
     const footer=await a(p,'next').evaluate(el=>{const b=el.getBoundingClientRect();return document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)===el;});
     assert.equal(hit,true);assert.equal(footer,true);
     const geometry=await p.evaluate(()=>{const {scene,camera,Vector3}=window.__aparDebug,f=scene.getObjectByName('training-fire');const rect=document.querySelector('#canvas-root').getBoundingClientRect(),panel=document.querySelector('#panel').getBoundingClientRect();const points=[f.position.clone(),f.position.clone().add(new Vector3(0,.6,0))].map(v=>{v.project(camera);return{x:rect.left+(v.x+1)*rect.width/2,y:rect.top+(1-v.y)*rect.height/2};});return{points,rect:{top:rect.top,left:rect.left,right:rect.right,bottom:Math.min(rect.bottom,panel.top)},overflow:document.documentElement.scrollWidth>innerWidth};});
     assert.equal(geometry.overflow,false);
     if(!expanded)for(const pt of geometry.points){assert.ok(pt.x>=geometry.rect.left&&pt.x<=geometry.rect.right&&pt.y>=geometry.rect.top&&pt.y<=geometry.rect.bottom,'fire fits collapsed viewport');}
     cases.push({...size,lang,zoom,expanded});
    }
   }
  }
 }
 pass('40 responsive combinations: fire fits collapsed canvas / slider and footer hit-tested / no overflow',cases);
 await p.setViewportSize({width:390,height:844});await p.locator('.training').evaluate(el=>{for(const n of [12,14,16,20,28,40])el.style.removeProperty(`--fs-${n}`);});if(await p.locator('#panel').evaluate(el=>el.classList.contains('is-expanded')))await p.locator('.panel__handle').tap();await p.waitForTimeout(850);
 await p.screenshot({path:path.join(__dirname,'t2.2-mobile.png')});
 await context.close();

 const reduced=await browser.newContext({viewport:{width:1365,height:900},reducedMotion:'reduce',locale:'en-US'});const r=await reduced.newPage();r.on('pageerror',e=>report.errors.push(String(e)));await ready(r);
 await a(r,'skip').click();await advance(r);await target(r).click();
 const image=()=>r.evaluate(()=>{const {renderer,scene,camera}=window.__aparDebug;renderer.render(scene,camera);return renderer.domElement.toDataURL();});
 const before=await image();await r.waitForTimeout(300);assert.equal(await image(),before);
 await advance(r);await target(r).focus();await r.keyboard.down('Space');await r.waitForTimeout(300);assert.equal((await effects(r)).spray,true);await r.keyboard.up('Space');assert.equal((await effects(r)).spray,false);
 await a(r,'skip').click();await advance(r);await slider(r).focus();await slider(r).press('End');assert.equal((await effects(r)).level,5/6);await r.waitForTimeout(250);assert.equal((await effects(r)).spray,false);
 const staticImage=await image();await r.waitForTimeout(300);assert.equal(await image(),staticImage);
 for(const k of ['Home','End','Home','End','Home'])await slider(r).press(k);assert.equal((await effects(r)).fire,false);
 pass('Reduced motion: identical stationary canvas, static hold spray, direct shrink and extinction',await effects(r));await reduced.close();

 const errors=await browser.newContext({viewport:{width:1365,height:900}});const f=await errors.newPage();await f.route('**/models/apar.glb',route=>route.abort());await f.goto(`${origin}/#train`);await f.locator('.splash__retry').waitFor({state:'visible'});assert.equal(await a(f,'start').isDisabled(),true);await f.unroute('**/models/apar.glb');await f.locator('.splash__retry').click();await f.waitForFunction(()=>getComputedStyle(document.querySelector('#splash')).opacity==='0');assert.equal(await a(f,'start').isDisabled(),false);pass('Model failure keeps Start disabled / Retry recovers');await errors.close();
 assert.deepEqual(report.errors,[]);pass('No unexpected browser/console errors');
}catch(e){report.failure=String(e.stack);save();throw e;}finally{await browser.close();save();}})();
