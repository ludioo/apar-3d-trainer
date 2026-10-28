const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const origin = 'http://127.0.0.1:4191';
const report = { date: '2026-10-28', checks: [], errors: [], images: [] };
const save = () => fs.writeFileSync(path.join(__dirname, 't4.1-qa.json'), JSON.stringify(report, null, 2));
const pass = (name, details) => { report.checks.push({ name, details }); save(); console.log('PASS', name); };
async function ready(page, query = '', server = origin) {
  await page.goto(`${server}/${query}#configure`);
  await page.waitForFunction(() => getComputedStyle(document.querySelector('#splash')).opacity === '0');
  await page.locator('[data-color="red"]:enabled').waitFor();
}
function errors(page, expectedNetwork = false) {
  page.on('pageerror', error => report.errors.push(String(error)));
  page.on('console', message => {
    if (message.type() === 'error' && !message.text().includes('404') && !(expectedNetwork && /503|net::ERR_FAILED/.test(message.text()))) report.errors.push(message.text());
  });
}
async function shot(page, name) {
  const file = path.join(__dirname, `t4.1-${name}.png`);
  await page.screenshot({ path: file }); report.images.push(file); save();
}
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    for (const mobile of [false, true]) for (const hdri of [false, true]) {
      const tag = `${mobile ? 'mobile' : 'desktop'}-${hdri ? 'hdri' : 'room'}`;
      const page = await browser.newPage({ viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 },
        deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile, locale: 'en-US', reducedMotion: 'reduce', acceptDownloads: true });
      errors(page);
      await ready(page, `?debug${hdri ? '&hdri=1' : ''}`);
      await page.waitForFunction(() => !!window.__aparDebug);
      const lighting = await page.evaluate(() => {
        const { scene, model, renderer } = window.__aparDebug;
        model.traverse(object => { if (object.userData.debugMarker) object.visible = false; });
        document.querySelector('#debug-hud').hidden = true;
        document.querySelector('#debug-stats').hidden = true;
        window.__aparDebug.requestRender();
        return { width: scene.environment.image.width, height: scene.environment.image.height, exposure: renderer.toneMappingExposure,
          background: scene.background, coarse: matchMedia('(pointer: coarse)').matches };
      });
      assert.equal(lighting.height, mobile && !hdri ? 512 : 1024);
      assert.equal(lighting.exposure, 1); assert.equal(lighting.background, null);
      const getCamera = () => page.evaluate(() => window.__aparDebug.camera.position.toArray());
      const initial = await getCamera();
      const canvas = await page.locator('#canvas-root canvas').boundingBox();
      const touch = mobile ? await page.context().newCDPSession(page) : null;
      const cx = canvas.x + canvas.width * .4, cy = canvas.y + canvas.height * .4;
      if (mobile) {
        await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx - 40, y: cy }] });
        for (let step = 1; step <= 8; step++) await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx - 40 + step * 10, y: cy }] });
        await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      } else {
        await page.mouse.move(canvas.x + canvas.width * .3, canvas.y + canvas.height * .4);
        await page.mouse.down(); await page.mouse.move(canvas.x + canvas.width * .5, canvas.y + canvas.height * .45, { steps: 12 }); await page.mouse.up();
      }
      assert.notDeepEqual(await getCamera(), initial);
      const orbited = await getCamera();
      if (mobile) {
        const points = gap => [{ x: cx - gap, y: cy, id: 1 }, { x: cx + gap, y: cy, id: 2 }];
        await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points(30) });
        for (let step = 1; step <= 6; step++) await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: points(30 + step * 5) });
        await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      } else await page.mouse.wheel(0, -160);
      await page.waitForTimeout(100);
      assert.notDeepEqual(await getCamera(), orbited);
      await page.evaluate(initial => {
        const d = window.__aparDebug; d.camera.position.fromArray(initial); d.controls.update(); d.requestRender();
      }, initial);
      await page.waitForTimeout(100); await shot(page, `${tag}-red`);
      if (mobile) await page.locator('.panel__handle').click();
      await page.locator('.config-bracket input').check();
      for (const color of ['yellow', 'silver']) {
        await page.locator(`[data-color="${color}"]`).click();
        assert.equal(await page.locator(`[data-color="${color}"]`).getAttribute('aria-pressed'), 'true');
        if (mobile) await page.locator('.panel__handle').click();
        await shot(page, `${tag}-${color}-bracket`);
        if (mobile) await page.locator('.panel__handle').click();
      }
      await page.locator('[data-color="red"]').click();
      await page.locator('[data-part="pin"]').click();
      assert.equal(await page.locator('.hotspot-info__card').isVisible(), true);
      await shot(page, `${tag}-pin`);
      await page.locator('.hotspot-info__close').click();
      assert.equal(await page.locator('.hotspot-info__card').isVisible(), false);
      await page.evaluate(() => {
        const original = HTMLCanvasElement.prototype.toDataURL;
        HTMLCanvasElement.prototype.toDataURL = function(type, ...args) {
          const result = original.call(this, type, ...args);
          if (type === 'image/jpeg' && this === document.querySelector('#canvas-root canvas')) window.__captureImage = result;
          return result;
        };
      });
      const download = page.waitForEvent('download');
      await page.locator('[data-pdf="spec"]').click();
      const file = await download;
      const pdfPath = path.join(__dirname, `t4.1-${tag}-spec.pdf`);
      await file.saveAs(pdfPath);
      assert.equal(fs.readFileSync(pdfPath).subarray(0, 5).toString(), '%PDF-');
      const capture = await page.evaluate(() => window.__captureImage);
      assert.ok(capture.startsWith('data:image/jpeg;base64,'));
      fs.writeFileSync(path.join(__dirname, `t4.1-${tag}-capture.jpg`), Buffer.from(capture.split(',')[1], 'base64'));
      await page.locator('[data-lang="id"]').click();
      await page.locator('.topbar__about').click();
      assert.match(await page.locator('[data-i18n="about.roomEnvironment"]').innerText(), /RoomEnvironment.*MIT/);
      assert.match(await page.locator('[data-i18n="about.environment"]').innerText(), /pembanding/);
      assert.equal(await page.locator('[data-i18n="about.roomEnvironment"]').getAttribute('href'), 'https://threejs.org/docs/pages/RoomEnvironment.html');
      await shot(page, `${tag}-about-id`);
      await page.keyboard.press('Escape');
      await page.locator('[data-lang="en"]').click();
      await page.locator('.topbar__about').click();
      assert.match(await page.locator('[data-i18n="about.environment"]').innerText(), /Comparison HDRI/);
      await page.keyboard.press('Escape');
      await page.locator('.tab[href="#results"]').click(); await page.locator('.results').waitFor();
      await page.locator('.tab[href="#train"]').click(); await page.locator('[data-training="start"]').waitFor();
      await page.locator('.tab[href="#configure"]').click();
      assert.equal(await page.locator('.config-bracket input').isChecked(), true);
      assert.equal(await page.locator('[data-color="red"]').getAttribute('aria-pressed'), 'true');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      pass(`${tag}: PMREM, orbit/zoom, three colors/bracket, pin focus/close, PDF capture, About EN/ID and routing`, lighting);
      await page.close();
    }
    for (const query of ['', '?hdri', '?hdri=0', '?hdri=true']) {
      const page = await browser.newPage(); errors(page);
      const requests = []; page.on('request', request => requests.push(request.url()));
      await ready(page, query); await page.waitForLoadState('networkidle');
      assert.ok(!requests.some(url => /\/hdri\/|HDRLoader/.test(url)));
      assert.equal(await page.locator('link[rel="preload"][href*="hdri"]').count(), 0);
      pass(`Production ${query || '(default)'}: no HDRI preload, request or loader chunk`);
      await page.close();
    }
    for (const fault of ['gzip', 'no-decompression', 'both']) {
      const page = await browser.newPage(); errors(page, true);
      const requests = [], warnings = []; page.on('request', r => requests.push(r.url()));
      page.on('console', m => { if (m.type() === 'warning') warnings.push(m.text()); });
      if (fault === 'no-decompression') await page.addInitScript(() => { window.DecompressionStream = undefined; });
      else await page.route('**/hdri/**', route => {
        if (fault === 'both' || route.request().url().endsWith('.gz')) return route.fulfill({ status: 503, body: 'QA intentional failure' });
        return route.continue();
      });
      await ready(page, '?hdri=1');
      assert.ok(requests.some(url => url.endsWith('/hdri/studio_1k.hdr')));
      assert.equal(requests.some(url => url.endsWith('.hdr.gz')), fault !== 'no-decompression');
      const mark = fault === 'both' ? 'apar:fallback-visible' : 'apar:visible';
      assert.ok(await page.evaluate(mark => performance.getEntriesByName(mark).length, mark));
      if (fault === 'both') assert.ok(warnings.some(text => text.includes('directional light only')));
      pass(`Production HDRI ${fault}: expected fallback, splash completes, options enabled`, { warnings });
      await page.close();
    }
    const faultPage = await browser.newPage(); errors(faultPage);
    const faultRequests = []; faultPage.on('request', r => faultRequests.push(r.url()));
    await faultPage.route('**/src/core/environment.js', async route => {
      const response = await route.fetch();
      const source = await response.text();
      const body = source.replace('environment = generator.fromScene(room, 0, 0.1, 100, { size });', "throw new Error('QA intentional PMREM failure');");
      assert.notEqual(body, source);
      await route.fulfill({ response, body });
    });
    await ready(faultPage, '', 'http://127.0.0.1:5191');
    assert.ok(await faultPage.evaluate(() => performance.getEntriesByName('apar:fallback-visible').length));
    assert.ok(!faultRequests.some(url => url.includes('/hdri/')));
    pass('Dev injected RoomEnvironment PMREM failure: directional fallback, no HDRI download, model visible');
    await faultPage.close();
    const retry = await browser.newPage(); errors(retry, true);
    let failModel = true;
    await retry.route('**/models/apar.glb', route => failModel ? route.fulfill({ status: 503, body: 'QA model failure' }) : route.continue());
    await retry.goto(origin + '/#configure');
    await retry.locator('.splash__retry').waitFor(); failModel = false;
    await retry.locator('.splash__retry').click();
    await retry.waitForFunction(() => performance.getEntriesByName('apar:visible').length > 0);
    await retry.locator('[data-color="red"]:enabled').waitFor();
    pass('Production model failure then Retry restores default RoomEnvironment viewer');
    await retry.close();
    assert.deepEqual(report.errors, []); pass('No unexpected page/console errors; favicon 404 and injected network faults excluded');
  } finally { await browser.close(); save(); }
})().catch(error => { report.failure = String(error); save(); console.error(error); process.exitCode = 1; });
