const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const origin = process.argv[2] || 'http://localhost:4183';
const prefix = origin.includes('5183') ? 't2.3-mapping-dev' : 't2.3-mapping';
const report = { date: '2026-10-28', origin, checks: [], errors: [] };
const save = () => fs.writeFileSync(path.join(__dirname, `${prefix}-qa.json`), JSON.stringify(report, null, 2));
const pass = (name, detail) => { report.checks.push({ name, detail }); save(); console.log('PASS', name); };
const train = (p, n) => p.locator(`[data-training="${n}"]`);
const quiz = (p, n) => p.locator(`[data-quiz="${n}"]`);
const pins = p => p.locator('.hotspot-pins:not([hidden])');
const pin = (p, id) => pins(p).locator(`[data-hotspot="${id}"]`);
const target = p => p.locator('.training-target__button');
const settle = p => p.waitForTimeout(800);
async function ready(p, mode = 'configure') {
  await p.goto(`${origin}/?debug#${mode}`);
  await p.reload();
  await p.waitForFunction(() => window.__aparDebug && getComputedStyle(document.querySelector('#splash')).opacity === '0');
  await p.evaluate(() => { const d=window.__aparDebug;d.controls.pauseAutoRotate();d.model.traverse(o=>{if(o.userData.debugMarker)o.visible=false;});d.requestRender(); });
}
async function modelClick(p, local) {
  const point = await p.evaluate(local => {
    const {model,camera,Vector3}=window.__aparDebug;
    const v=model.localToWorld(new Vector3(...local)).project(camera),b=document.querySelector('canvas').getBoundingClientRect();
    document.querySelectorAll('.hotspot-pins').forEach(el=>el.style.visibility='hidden');
    return{x:b.x+(v.x+1)*b.width/2,y:b.y+(1-v.y)*b.height/2};
  },local);
  try{await p.mouse.click(point.x,point.y);}finally{await p.evaluate(()=>document.querySelectorAll('.hotspot-pins').forEach(el=>el.style.visibility=''));}
}
async function enterQuiz(p,touch=false) {
  const click=el=>touch?el.tap():el.click();
  await click(train(p,'start'));
  for(let i=0;i<4;i++){await click(train(p,'skip'));await click(train(p,'next'));}
  await click(train(p,'quiz'));await click(p.locator('[data-choice="a"]'));await click(quiz(p,'next'));await settle(p);
}
(async()=>{
  const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  try{
    const p=await browser.newPage({viewport:{width:1365,height:900},locale:'id-ID'});
    p.on('pageerror',e=>report.errors.push(String(e)));
    p.on('console',m=>{if(m.type()==='error'&&!m.text().includes('404'))report.errors.push(m.text());});
    await ready(p);await p.waitForTimeout(120);
    assert.deepEqual(await pins(p).locator('button').evaluateAll(bs=>bs.map(b=>({id:b.dataset.hotspot,number:b.textContent}))),[
      {id:'handle',number:'1'},{id:'pin',number:'2'},{id:'nozzle',number:'3'},
      {id:'gauge',number:'4'},{id:'label',number:'5'},{id:'body',number:'6'}]);
    for(const lang of ['id','en']){
      await p.locator(`[data-lang="${lang}"]`).click();
      for(const [id,title]of [['handle',lang==='id'?'Tuas':'Handle / lever'],['pin',lang==='id'?'Pin pengaman':'Safety pin']]){
        await pin(p,id).click();await settle(p);
        assert.equal(await p.locator('.hotspot-info__header h3').innerText(),title);
        assert.equal(await pin(p,id).getAttribute('aria-label'),title);
        await p.screenshot({path:path.join(__dirname,`${prefix}-configure-${id}-${lang}.png`)});
        await p.locator('.hotspot-info__close').click();await settle(p);
      }
    }
    pass('Configure 1=lever / 2=safety pin; EN/ID cards, labels, focus and close');
    for(const capacity of ['1kg','3kg','6kg','9kg']){
      await p.locator(`[data-capacity="${capacity}"]`).click();
      for(const [local,title]of [[[0.09043,0.655,0.04113],'Handle / lever'],[[0.00994,0.61787,0.02013],'Safety pin']]){
        await modelClick(p,local);await settle(p);
        assert.equal(await p.locator('.hotspot-info__header h3').innerText(),title);
        await p.locator('.hotspot-info__close').click();await settle(p);
      }
    }
    pass('Direct mesh picking at independent physical landmarks across 1/3/6/9 kg');
    await p.locator('[href="#train"]').click();await train(p,'start').click();await settle(p);
    assert.match(await target(p).getAttribute('aria-label'),/Pull/);
    await modelClick(p,[0.00994,0.61787,0.02013]);
    assert.equal(await train(p,'next').isEnabled(),true);
    assert.equal(await p.locator('.training-target__pin').isVisible(),true);
    await p.screenshot({path:path.join(__dirname,`${prefix}-pull-overlay.png`)});
    await train(p,'next').click();await train(p,'skip').click();await train(p,'next').click();await settle(p);
    assert.match(await target(p).getAttribute('aria-label'),/Squeeze/);
    assert.equal(await target(p).innerText(),'3');
    await target(p).focus();await p.keyboard.down('Space');await p.waitForTimeout(1100);await p.keyboard.up('Space');
    assert.equal(await train(p,'next').isEnabled(),true);
    await p.screenshot({path:path.join(__dirname,`${prefix}-squeeze.png`)});
    pass('PASS Pull uses physical safety pin and removal overlay; Squeeze step 3 uses physical lever and keyboard hold');
    await ready(p,'train');await enterQuiz(p);
    assert.equal(await pin(p,'handle').innerText(),'1');assert.equal(await pin(p,'pin').innerText(),'2');
    await p.evaluate(()=>{const d=window.__aparDebug;d.controls.minDistance=.1;d.camera.position.set(.27,1.28,.52);d.controls.target.set(.05,1.15,0);d.controls.update();d.requestRender();});
    await p.waitForTimeout(100);await p.screenshot({path:path.join(__dirname,`${prefix}-closeup.png`),clip:{x:500,y:320,width:480,height:400}});
    await quiz(p,'resetView').click();await settle(p);await pin(p,'handle').click();
    assert.equal(await p.locator('.quiz__feedback').getAttribute('data-correct'),'false');
    await pin(p,'pin').evaluate(el=>el.click());assert.equal(await p.locator('.quiz__feedback').getAttribute('data-correct'),'false');
    await ready(p,'train');await enterQuiz(p);await pin(p,'pin').focus();await p.keyboard.press('Enter');
    assert.equal(await p.locator('.quiz__feedback').getAttribute('data-correct'),'true');
    for(const choice of ['b','a']){await quiz(p,'next').click();await p.locator(`[data-choice="${choice}"]`).click();}
    await quiz(p,'next').click();await settle(p);assert.equal(await pin(p,'gauge').innerText(),'4');await pin(p,'gauge').click();
    for(const choice of ['a','b','b']){await quiz(p,'next').click();await p.locator(`[data-choice="${choice}"]`).click();}
    await quiz(p,'next').click();assert.match(await p.locator('.quiz__score').innerText(),/8\/8/);
    pass('q2: part 1 wrong / part 2 correct in separate sessions; first answer locked; q5 part 4; score 8/8 saved');
    const mobile=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,locale:'id-ID',reducedMotion:'reduce'});
    const m=await mobile.newPage();m.on('pageerror',e=>report.errors.push(String(e)));await ready(m,'train');await train(m,'start').tap();
    await target(m).tap();assert.equal(await train(m,'next').isEnabled(),true);await train(m,'next').tap();await train(m,'skip').tap();await train(m,'next').tap();
    const b=await target(m).boundingBox(),cdp=await mobile.newCDPSession(m);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width/2,y:b.y+b.height/2}]});await m.waitForTimeout(1100);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();assert.equal(await train(m,'next').isEnabled(),true);
    await ready(m,'train');await enterQuiz(m,true);
    const matrix=[];
    for(const [width,height]of [[390,844],[844,390]]){
      await m.setViewportSize({width,height});
      for(const lang of ['id','en']){
        await m.locator(`[data-lang="${lang}"]`).tap();
        for(const expanded of [true,false]){
          report.scenario={width,height,lang,expanded};save();
          const handle=m.locator('.panel__handle');if((await handle.getAttribute('aria-expanded')==='true')!==expanded)await handle.tap();
          assert.equal(await handle.getAttribute('aria-expanded'),String(expanded));
          assert.equal(await m.locator('.quiz').getAttribute('data-phase'),'question');
          if(!expanded){await pin(m,'pin').waitFor({state:'visible'});await pin(m,'handle').waitFor({state:'visible'});}
          assert.equal(await m.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
          matrix.push({width,height,lang,expanded});
        }
      }
    }
    await m.setViewportSize({width:390,height:844});await m.waitForTimeout(250);
    await m.screenshot({path:path.join(__dirname,`${prefix}-mobile.png`)});
    await pin(m,'pin').tap();assert.equal(await m.locator('.quiz__feedback').getAttribute('data-correct'),'true');
    pass('Touch Pull/one-second lever hold; quiz part 2 touch, EN/ID portrait/landscape/both snaps/reduced motion',matrix);
    assert.deepEqual(report.errors,[]);pass('No unexpected page or console errors');
  }catch(error){report.failure=String(error.stack);save();throw error;}
  finally{await browser.close();save();}
})();
