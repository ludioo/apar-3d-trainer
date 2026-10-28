const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
  const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  try{
    const p=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce',locale:'id-ID'});
    await p.goto('http://localhost:4183/#train');await p.waitForFunction(()=>getComputedStyle(document.querySelector('#splash')).opacity==='0');
    const train=n=>p.locator(`[data-training="${n}"]`),next=()=>p.locator('[data-quiz="next"]').tap();
    await train('start').tap();for(let i=0;i<4;i++){await train('skip').tap();await train('next').tap();}await train('quiz').tap();
    await p.locator('[data-choice="a"]').tap();await next();await p.waitForTimeout(500);
    await p.screenshot({path:path.join(__dirname,'t2.3-preview-mobile.png')});
    const pins=p.locator('.hotspot-pins:not([hidden])');await pins.locator('[data-hotspot="pin"]').tap();await next();
    for(const choice of ['b','a']){await p.locator(`[data-choice="${choice}"]`).tap();await next();}
    await pins.locator('[data-hotspot="gauge"]').tap();await next();
    for(const choice of ['a','b','b']){await p.locator(`[data-choice="${choice}"]`).tap();await next();}
    await p.waitForTimeout(500);await p.screenshot({path:path.join(__dirname,'t2.3-preview-summary-mobile.png')});
    await p.setViewportSize({width:1365,height:900});await p.waitForTimeout(850);
    await p.screenshot({path:path.join(__dirname,'t2.3-preview-summary-desktop.png')});
    console.log('Preview screenshots captured without debug markers or active tap highlight.');
  }finally{await browser.close();}
})();
