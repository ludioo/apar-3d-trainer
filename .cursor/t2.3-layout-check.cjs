const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const origin = process.argv[2] || 'http://localhost:4183';
const report = { date: '2026-10-28', origin, scenarios: [], errors: [] };
const save = () => fs.writeFileSync(path.join(__dirname, 't2.3-layout-qa.json'), JSON.stringify(report,null,2));
const q = (p,n)=>p.locator(`[data-quiz="${n}"]`);
const pin=(p,id)=>p.locator(`.hotspot-pins:not([hidden]) [data-hotspot="${id}"]`);
(async()=>{
  const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  try {
    const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce',locale:'id-ID'});
    const p=await context.newPage();p.on('pageerror',e=>report.errors.push(String(e)));
    await p.goto(`${origin}/#train`);await p.waitForFunction(()=>getComputedStyle(document.querySelector('#splash')).opacity==='0');
    const train=n=>p.locator(`[data-training="${n}"]`);
    await train('start').tap();for(let i=0;i<4;i++){await train('skip').tap();await train('next').tap();}await train('quiz').tap();
    await p.locator('[data-choice="a"]').tap();await q(p,'next').tap();
    async function matrix(stage) {
      for(const [width,height]of [[360,800],[390,844],[768,1024],[844,390],[390,420]]) {
        await p.setViewportSize({width,height});
        for(const lang of ['en','id']){
          await p.locator(`[data-lang="${lang}"]`).tap();
          for(const zoom of [1,2]){
            await p.evaluate(z=>{for(const n of [12,14,16,20,28,40])document.querySelector('.quiz').style.setProperty(`--fs-${n}`,`${n*z}px`);},zoom);
            for(const expanded of [false,true]){
              const scenario={stage,width,height,lang,zoom,expanded};report.current=scenario;save();
              const handle=p.locator('.panel__handle');if((await handle.getAttribute('aria-expanded')==='true')!==expanded)await handle.tap();
              assert.equal(await handle.getAttribute('aria-expanded'),String(expanded));
              await p.waitForTimeout(30);
              assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
              const selectors=stage==='pins'?['[data-quiz="resetView"]','.quiz__muted']:stage==='emergency'?['.quiz__feedback','.quiz__contacts [href="tel:113"]','.quiz__contacts [href="tel:112"]','.quiz__contacts a:last-child']:['.quiz__score','[data-quiz="restart"]','[data-quiz="training"]'];
              for(const selector of selectors){
                const result=await p.locator(selector).first().evaluate(el=>{
                  el.scrollIntoView({block:'nearest'});
                  const b=el.getBoundingClientRect(),root=el.closest('.quiz').getBoundingClientRect(),nav=document.querySelector('.quiz__nav');
                  const top=Math.max(b.top,root.top),bottom=Math.min(b.bottom,root.bottom,nav.hidden?root.bottom:nav.getBoundingClientRect().top);
                  return bottom>top&&el.contains(document.elementFromPoint(b.x+b.width/2,(top+bottom)/2));
                });
                assert.ok(result,`${stage} ${selector} is reachable: ${JSON.stringify(scenario)}`);
              }
              if(stage==='pins'){
                assert.equal(await p.locator('.quiz').getAttribute('data-phase'),'question','sheet tap does not answer');
                if(!expanded){assert.equal(await pin(p,'pin').isVisible(),true);assert.equal(await pin(p,'gauge').isVisible(),true);}
              }
              report.scenarios.push(scenario);
            }
          }
        }
      }
      console.log('PASS',stage,'40 combinations');
      await p.setViewportSize({width:390,height:844});await p.locator('.quiz').evaluate(el=>el.removeAttribute('style'));
      if(await p.locator('.panel__handle').getAttribute('aria-expanded')==='true')await p.locator('.panel__handle').tap();
      await p.locator('[data-lang="id"]').tap();
    }
    await matrix('pins');
    await q(p,'resetView').tap();await pin(p,'pin').tap();await q(p,'next').tap();
    await p.locator('[data-choice="b"]').tap();await q(p,'next').tap();await p.locator('[data-choice="a"]').tap();await q(p,'next').tap();
    await pin(p,'gauge').tap();await q(p,'next').tap();await p.locator('[data-choice="a"]').tap();
    await matrix('emergency');
    await p.locator('.quiz__contacts [href="tel:113"]').evaluate(el=>el.scrollIntoView());
    await p.screenshot({path:path.join(__dirname,'t2.3-q6-mobile.png')});
    await q(p,'next').tap();await p.locator('[data-choice="b"]').tap();await q(p,'next').tap();await p.locator('[data-choice="b"]').tap();await q(p,'next').tap();
    await matrix('summary');
    assert.deepEqual(report.errors,[]);report.status='PASS';
  }catch(e){report.failure=String(e.stack);throw e;}
  finally{save();await browser.close();}
})();
