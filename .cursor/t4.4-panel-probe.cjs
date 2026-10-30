const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const origin = process.argv[2] || 'http://localhost:5198';
const name = process.argv[3] || 'before';
(async () => {
  const browser = await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  try {
    const page = await browser.newPage({viewport:{width:1280,height:900},reducedMotion:'reduce'});
    await page.goto(`${origin}/?debug#configure`);
    await page.waitForFunction(()=>window.__aparDebug && getComputedStyle(document.querySelector('#splash')).opacity==='0');
    await page.locator('[data-part="gauge"]').click();
    await page.waitForTimeout(400);
    const result = await page.evaluate(()=> {
      const el = document.querySelector('.hotspot-pins:not([hidden]) [data-hotspot="handle"]');
      const b = el.getBoundingClientRect(), panel = document.querySelector('#panel').getBoundingClientRect();
      const x=b.right-2,y=b.y+b.height/2, hit=document.elementFromPoint(x,y);
      return { hidden:el.hidden,box:b.toJSON(), panel:panel.toJSON(), point:[x,y],
        hit:hit?.outerHTML.slice(0,300), correct:el.contains(hit) };
    });
    await page.screenshot({path:path.join(__dirname,`t4.4-panel-${name}.png`)});
    fs.writeFileSync(path.join(__dirname,`t4.4-panel-${name}.json`),JSON.stringify(result,null,2));
    console.log(JSON.stringify(result));
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
