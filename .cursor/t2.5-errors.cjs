const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const origin = process.argv[2] || 'http://localhost:4183';
const report = {origin, checks:[], errors:[]};
(async()=>{
  const browser = await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  try {
    const p = await browser.newPage({reducedMotion:'reduce',locale:'en-US'});
    p.on('pageerror',e=>report.errors.push(String(e)));
    await p.goto(`${origin}/#configure`);
    await p.waitForFunction(()=>getComputedStyle(document.querySelector('#splash')).opacity==='0');
    await p.route(/jspdf.*\.js/,r=>r.abort());
    await p.locator('[data-pdf="spec"]').click();
    await p.getByText('The PDF could not be created.',{exact:false}).waitFor();
    assert.equal(await p.locator('[data-pdf="spec"]').isDisabled(),false);
    await p.unroute(/jspdf.*\.js/);
    const next=p.waitForEvent('download'); await p.locator('[data-pdf="spec"]').click(); await (await next).delete();
    report.checks.push('Heavy jsPDF import failure shows recoverable message; same-page retry downloads spec.');
    await p.close();
    const c=await browser.newPage({reducedMotion:'reduce',locale:'en-US'});
    await c.goto(`${origin}/#configure`);
    await c.waitForFunction(()=>getComputedStyle(document.querySelector('#splash')).opacity==='0');
    let release, reached, handled;
    const gate=new Promise(r=>release=r), seen=new Promise(r=>reached=r), done=new Promise(r=>handled=r);
    await c.route(/\/pdf-spec[^/]*\.js(?:\?.*)?$/,async r=>{reached();await gate;await r.continue();handled();});
    let count=0;c.on('download',()=>count++);
    await c.locator('[data-pdf="spec"]').click();await seen;
    await c.locator('.tab[href="#results"]').click();release();await done;await c.waitForTimeout(700);
    assert.equal(count,0);
    await c.unrouteAll();await c.locator('.tab[href="#configure"]').click();
    const current=c.waitForEvent('download');await c.locator('[data-pdf="spec"]').click();await(await current).delete();
    report.checks.push('Pending spec cancelled after exit; returning to Configure supports a new download.');
    await c.close();
    const loading=await browser.newPage({locale:'en-US'});
    await loading.route('**/models/apar.glb',r=>r.abort());
    await loading.goto(`${origin}/#configure`);
    await loading.locator('.splash__retry').waitFor();
    assert.ok(await loading.locator('[data-pdf="spec"]').isDisabled());
    await loading.unroute('**/models/apar.glb');await loading.locator('.splash__retry').click();
    await loading.waitForFunction(()=>getComputedStyle(document.querySelector('#splash')).opacity==='0');
    assert.ok(!await loading.locator('[data-pdf="spec"]').isDisabled());
    report.checks.push('Model load failure disables spec; successful Retry enables it.');
    await loading.close();assert.deepEqual(report.errors,[]);
    console.log(report.checks.join('\n'));
  } catch(e) {report.failure=String(e.stack);throw e;}
  finally {await browser.close();fs.writeFileSync(path.join(__dirname,origin.includes('5183')?'t2.5-errors-dev-qa.json':'t2.5-errors-qa.json'),JSON.stringify(report,null,2));}
})();
