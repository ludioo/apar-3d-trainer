const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const origin = process.argv[2] || 'http://localhost:4191';
const report = { origin, checks: [], errors: [] };
const save = () => fs.writeFileSync(path.join(__dirname, 't3.1-startup-qa.json'), JSON.stringify(report, null, 2));
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const pass = (name, detail) => { report.checks.push({ name, detail }); save(); console.log('PASS', name); };
  async function page(debug = false, setup) {
    const p = await browser.newPage({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true, reducedMotion: 'reduce', locale: 'en-US' });
    p.on('pageerror', e => report.errors.push(String(e)));
    const requests = [];
    p.on('request', r => requests.push(r.url()));
    if (setup) await setup(p);
    await p.goto(`${origin}/${debug ? '?debug' : ''}#configure`);
    await p.waitForFunction(() => performance.getEntriesByName('apar:visible').length || performance.getEntriesByName('apar:fallback-visible').length);
    await p.waitForTimeout(100);
    return { p, requests };
  }
  async function details(p) {
    return p.evaluate(() => ({ marks: performance.getEntriesByType('mark').map(m => ({ name: m.name, time: m.startTime })), measures: performance.getEntriesByName('apar:load').length, splash: getComputedStyle(document.getElementById('splash')).opacity, debug: !!window.__aparDebug, enabled: !document.querySelector('[data-pdf="spec"]').disabled }));
  }
  try {
    const normal = await page();
    let d = await details(normal.p);
    assert.equal(d.debug, false); assert.equal(d.splash, '0'); assert.equal(d.enabled, true); assert.equal(d.measures, 1);
    assert.equal(normal.requests.filter(u => /\/models\/apar.glb$/.test(u)).length, 1);
    assert.equal(normal.requests.filter(u => /\/hdri\/studio_1k.hdr.gz$/.test(u)).length, 1);
    assert.equal(normal.requests.filter(u => /debug-|stats|jspdf|pdf-spec|pdf-report/.test(u)).length, 0);
    await normal.p.screenshot({ path: path.join(__dirname, 't3.1-mobile.png') });
    pass('Normal production: one model/HDR request, no debug/PDF download or global; splash gone/controls enabled; one visible mark', d);
    await normal.p.close();

    for (const kind of ['model', 'environment']) {
      const { p } = await page(false, async p => {
        await p.route(kind === 'model' ? '**/models/apar.glb' : '**/hdri/studio_1k.hdr.gz', async r => { await new Promise(resolve => setTimeout(resolve, 2500)); await r.continue(); });
      });
      d = await details(p);
      const time = name => d.marks.find(m => m.name === name).time;
      assert.ok(kind === 'model' ? time('apar:environment-ready') < time('apar:model-ready') : time('apar:model-ready') < time('apar:environment-ready'));
      assert.ok(time('apar:visible') > Math.max(time('apar:environment-ready'), time('apar:model-ready')));
      pass(`${kind} completes last: final visible mark waits for both`, d);
      await p.close();
    }
    for (const kind of ['corrupt', 'missing', 'no-decompression']) {
      const { p, requests } = await page(false, async p => {
        if (kind === 'no-decompression') await p.addInitScript(() => { window.DecompressionStream = undefined; });
        else await p.route('**/hdri/studio_1k.hdr.gz', r => kind === 'corrupt' ? r.fulfill({ status: 200, contentType: 'application/gzip', body: 'invalid gzip' }) : r.fulfill({ status: 404, body: '' }));
      });
      d = await details(p);
      assert.ok(d.marks.some(m => m.name === 'apar:visible'));
      assert.equal(requests.filter(u => /\/hdri\/studio_1k.hdr$/.test(u)).length, 1);
      if (kind === 'no-decompression') assert.equal(requests.filter(u => /\.hdr.gz$/.test(u)).length, 0);
      pass(`${kind}: original HDR fallback succeeds without duplicate original requests`, d);
      await p.close();
    }
    const failed = await page(false, async p => { await p.route('**/hdri/**', r => r.abort()); });
    d = await details(failed.p);
    assert.ok(d.marks.some(m => m.name === 'apar:fallback-visible'));
    assert.equal(d.marks.some(m => m.name === 'apar:visible'), false);
    assert.equal(d.enabled, true);
    pass('Both HDR downloads fail: directional-light fallback usable, never counted as success', d);
    await failed.p.close();

    const retry = await browser.newPage({ reducedMotion: 'reduce', locale: 'en-US' });
    await retry.route('**/models/apar.glb', r => r.abort());
    await retry.goto(origin);
    await retry.locator('.splash__retry').waitFor();
    assert.ok(await retry.locator('[data-pdf="spec"]').isDisabled());
    assert.equal(await retry.evaluate(() => performance.getEntriesByName('apar:visible').length), 0);
    await retry.unroute('**/models/apar.glb'); await retry.locator('.splash__retry').click();
    await retry.waitForFunction(() => performance.getEntriesByName('apar:visible').length === 1);
    assert.equal(await retry.evaluate(() => performance.getEntriesByName('apar:load-start').length), 2);
    pass('Model failure then Retry: two attempts, one successful visible mark, export disabled while failed', await details(retry));
    await retry.close();

    const debug = await page(true);
    assert.ok(await debug.p.locator('#debug-stats').count());
    const idle = await debug.p.evaluate(async () => {
      const { renderer } = window.__aparDebug;
      const before = renderer.info.render.frame;
      await new Promise(r => setTimeout(r, 550));
      const stats = document.getElementById('debug-stats').getBoundingClientRect();
      const topbar = document.querySelector('.topbar').getBoundingClientRect();
      return { renders: renderer.info.render.frame - before, statsTop: stats.top, topbarBottom: topbar.bottom };
    });
    assert.equal(idle.renders, 0); assert.ok(idle.statsTop >= idle.topbarBottom);
    assert.equal(debug.requests.filter(u => /\/debug-/.test(u)).length, 1);
    pass('Debug imports stats once, preserves markers/bridge, lies below navigation, reduced-motion idle renders zero frames', idle);
    await debug.p.screenshot({ path: path.join(__dirname, 't3.1-debug-mobile.png') });
    await debug.p.close();
    const unavailableDebug = await page(true, async p => { await p.route('**/assets/debug-*.js', r => r.abort()); });
    d = await details(unavailableDebug.p);
    assert.ok(d.marks.some(m => m.name === 'apar:visible'));
    assert.equal(d.enabled, true);
    pass('Optional debug chunk failure keeps production model and controls usable', d);
    await unavailableDebug.p.close();
    assert.deepEqual(report.errors, []);
  } catch (error) { report.failure = String(error.stack); throw error; }
  finally { save(); await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
