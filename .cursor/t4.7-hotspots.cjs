const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium} = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const origin = process.argv[2] || 'http://localhost:4247';
const report = {origin, date:'2026-10-30',states:[],errors:[]};
const file = name => path.join(__dirname, `t4.7-hotspot-${name}`);
const save = () => fs.writeFileSync(file('qa.json'),JSON.stringify(report,null,2));
const key = async(p,selector) => {await p.locator(selector).focus();await p.keyboard.press('Enter');};
const matches = (p,name) => p.locator('#panel').evaluate((el,name) => {
  const style=getComputedStyle(el),root=getComputedStyle(document.documentElement);
  const expected=Math.min(Math.max(parseFloat(root.getPropertyValue('--sheet-viewport-h'))*({peek:0.25,half:0.5,full:0.75})[name],
    parseFloat(style.getPropertyValue('--sheet-min-h'))),parseFloat(style.maxHeight));
  return Math.abs(el.getBoundingClientRect().height-expected)<1;
},name);
(async()=>{
  const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  try {
    const p=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
    p.on('pageerror',e=>report.errors.push(String(e)));
    p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
    await p.goto(`${origin}/#configure`);
    await p.waitForFunction(()=>getComputedStyle(document.querySelector('#splash')).opacity==='0');
    for(const size of [{width:390,height:844},{width:844,height:390},{width:1280,height:900}]) {
      await p.setViewportSize(size);
      for(const lang of ['en','id']) {
        await key(p,`[data-lang="${lang}"]`);
        for(const scale of [1,2]) {
          await p.evaluate(scale=>{for(const n of[12,14,16,20,28,40])document.documentElement.style.setProperty(`--fs-${n}`,`${n*scale}px`);},scale);
          await p.waitForTimeout(120);
          for(const snap of size.width>=1024?['half']:['peek','half','full']) {
            if(size.width<1024)for(let i=0;i<3&&!await matches(p,snap);i++){await key(p,'.panel__handle');await p.waitForTimeout(120);}
            for(const id of ['handle','pin','nozzle','gauge','label','body']) {
              await key(p,`[data-part="${id}"]`);
              const value=await p.evaluate(()=>{
                const title=document.querySelector('#hotspot-title'),header=title.parentElement,body=document.querySelector('.panel__body');
                return {title:title.getBoundingClientRect().toJSON(),header:header.getBoundingClientRect().toJSON(),body:body.getBoundingClientRect().toJSON(),
                  rotation:getComputedStyle(document.querySelector('.viewer-tools')).display,close:document.querySelector('.hotspot-info__close').getBoundingClientRect().toJSON()};
              });
              assert(value.title.top>=value.body.top-0.5&&value.title.bottom<=value.body.bottom+0.5,'title entirely inside sheet');
              assert(value.close.bottom<=value.body.bottom+0.5,'close button inside sheet');
              assert.equal(value.rotation,size.width>=1024?'block':'none');
              report.states.push({size,lang,scale,snap,id,...value});
              if(size.width===390&&lang==='id'&&scale===2&&snap==='peek'&&id==='pin')await p.screenshot({path:file('peek-text200-after.png')});
              if(size.width===390&&lang==='id'&&scale===1&&snap==='half'&&id==='gauge')await p.screenshot({path:file('mobile-after.png')});
              await key(p,'.hotspot-info__close');
              assert.equal(await p.locator('.viewer-tools').isVisible(),true,'rotation control returns after close');
            }
          }
        }
      }
    }
    assert.deepEqual(report.errors,[]);save();console.log('PASS',report.states.length,'hotspot titles/close controls, EN/ID, font100/200, available snaps and rotation restoration');
  }finally{save();await browser.close();}
})().catch(e=>{report.failure=String(e.stack);save();console.error(e);process.exitCode=1;});
