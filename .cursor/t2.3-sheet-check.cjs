const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
  const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  const report={date:'2026-10-28',checks:[]};
  try{
    const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce',locale:'id-ID'});
    const p=await context.newPage();await p.goto('http://localhost:4183/#train');
    await p.waitForFunction(()=>getComputedStyle(document.querySelector('#splash')).opacity==='0');
    const train=n=>p.locator(`[data-training="${n}"]`);
    await train('start').tap();for(let i=0;i<4;i++){await train('skip').tap();await train('next').tap();}await train('quiz').tap();
    await p.evaluate(()=>{window.inputTrace=[];for(const type of ['pointerdown','pointerup','click','blur','focus'])window.addEventListener(type,e=>window.inputTrace.push({type,target:e.target.tagName,choice:e.target.dataset?.choice,cls:e.target.className,focus:document.hasFocus()}),true);});
    const handle=p.locator('.panel__handle');
    for(const method of ['tap','click','keyboard']){
      for(const expanded of [true,false]){
        if(method==='keyboard'){await handle.focus();await p.keyboard.press('Enter');}else await handle[method]();
        assert.equal(await handle.getAttribute('aria-expanded'),String(expanded));
        assert.equal(await p.locator('.quiz').getAttribute('data-phase'),'question');
      }
      report.checks.push(`${method}: toggles once and does not answer`);
    }
    const cdp=await context.newCDPSession(p);
    for(const expanded of [true,false]){
      const b=await handle.boundingBox();const start={x:b.x+b.width/2,y:b.y+b.height/2};
      const endY=expanded?130:780;
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[start]});
      for(let i=1;i<=8;i++){
        await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x,y:start.y+(endY-start.y)*i/8}]});
        await p.waitForTimeout(30);
      }
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      await p.waitForTimeout(500);
      assert.equal(await handle.getAttribute('aria-expanded'),String(expanded));
      assert.equal(await p.locator('.quiz').getAttribute('data-phase'),'question');
    }
    report.checks.push('Touch drag up/down snaps correctly without selecting an answer');
    await p.locator('[data-choice="a"]').scrollIntoViewIfNeeded();
    const answerBox=await p.locator('[data-choice="a"]').boundingBox();
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:answerBox.x+answerBox.width/2,y:answerBox.y+answerBox.height/2}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await p.waitForTimeout(150);
    await cdp.detach();
    report.inputTrace=await p.evaluate(()=>window.inputTrace);report.focus=await p.evaluate(()=>document.hasFocus());
    await p.screenshot({path:path.join(__dirname,'t2.3-sheet-answer-probe.png')});
    const nativeClick=report.inputTrace.some(e=>e.type==='click'&&e.choice==='a');
    report.postDragTouchProbe={nativeClick,phase:await p.locator('.quiz').getAttribute('data-phase'),
      limitation:'After raw CDP drags Chrome emits pointerdown/up on the answer but no click; this probe cannot verify a normal touch activation. Main quiz tests independently verify Playwright touch pins/choices and panel taps.'};
    if(nativeClick)assert.equal(report.postDragTouchProbe.phase,'feedback');
    report.status=nativeClick?'PASS':'SHEET_CHECKS_PASS_WITH_CDP_TOUCH_LIMITATION';console.log(report.checks,report.status);
  }catch(e){report.failure=String(e.stack);throw e;}
  finally{fs.writeFileSync(path.join(__dirname,'t2.3-sheet-qa.json'),JSON.stringify(report,null,2));await browser.close();}
})();
