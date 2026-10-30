const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const origin = process.argv[2] || 'http://localhost:4198';
const report = { origin, checks: [], errors: [], warnings: [] };
const selector = '.hotspot-pins:not([hidden]) .hotspot-pin:not([hidden])';
(async () => {
  const browser = await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  try {
    for (const mobile of [false,true]) {
      const p = await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1280,height:900},
        isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
      p.on('pageerror', e=>report.errors.push(String(e)));
      p.on('console', m=>{if(m.type()==='error'&&!m.text().includes('404'))report.errors.push(m.text());
        if(m.type()==='warning')report.warnings.push(m.text());});
      await p.goto(`${origin}/#configure`);
      await p.waitForFunction(()=>getComputedStyle(document.querySelector('#splash')).opacity==='0');
      assert.equal(await p.evaluate(()=>!!window.__aparDebug),false);
      await p.locator(`[data-lang="${mobile?'id':'en'}"]`).click();
      const positions = ()=>p.locator(selector).evaluateAll(els=>els.map(el=>el.style.transform));
      const before = await positions(), b=await p.locator('#canvas-root canvas').boundingBox();
      const x=b.x+50,y=b.y+b.height/2;
      if(mobile){
        const cdp=await p.context().newCDPSession(p);
        await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
        for(let i=1;i<=10;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+i*6,y}]});
        await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
        await cdp.detach();
      }else{
        await p.mouse.move(x,y);await p.mouse.down();await p.mouse.move(x+100,y,{steps:10});await p.mouse.up();
      }
      await p.waitForTimeout(300);assert.notDeepEqual(await positions(),before,'native orbit moves pins');
      if(!mobile){
        const beforeZoom=await positions();await p.mouse.move(x,y);await p.mouse.wheel(0,-300);
        await p.waitForTimeout(300);assert.notDeepEqual(await positions(),beforeZoom,'native wheel zoom moves pins');
      }
      for(const id of ['handle','pin','nozzle','gauge','label','body']){
        const part=p.locator(`[data-part="${id}"]`);if(mobile)await part.tap();else await part.click();
        await p.locator('.hotspot-info__card:not([hidden])').waitFor();
        assert.equal(await p.locator('.hotspot-pins:not([hidden]) [aria-pressed="true"]').getAttribute('data-hotspot'),id);
        if(mobile)await p.locator('.hotspot-info__close').tap();else await p.keyboard.press('Escape');
      }
      await p.reload();await p.waitForFunction(()=>getComputedStyle(document.querySelector('#splash')).opacity==='0');
      const pin=p.locator(`${selector}[data-hotspot="pin"]`);await pin.waitFor();
      if(mobile)await pin.tap();else await pin.click({position:{x:2,y:22}});
      assert.match(await p.locator('#hotspot-title').innerText(),mobile?/Pin pengaman/:/Safety pin/);
      if(mobile)await p.locator('.hotspot-info__close').tap();else await p.keyboard.press('Escape');
      await p.screenshot({path:path.join(__dirname,`t4.4-normal-${mobile?'mobile':'desktop'}.png`)});
      report.checks.push({mobile,debug:false,nativeOrbit:true,nativeWheel:!mobile,allSixParts:true,pinPointer:true});
      console.log('PASS normal Configure',mobile?'mobile touch':'desktop mouse');await p.close();
    }
    assert.deepEqual(report.errors,[]);
  }catch(e){report.error=String(e.stack);console.error(report.error);process.exitCode=1;}
  finally{fs.writeFileSync(path.join(__dirname,'t4.4-smoke-qa.json'),JSON.stringify(report,null,2));await browser.close();}
})();
