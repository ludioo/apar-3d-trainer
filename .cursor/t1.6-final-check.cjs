const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '..');
const reportPath = path.join(__dirname, 't1.6-qa.json');
const report = JSON.parse(fs.readFileSync(reportPath));
report.finalChecks = [];
const record = (name, detail = {}) => {
  report.finalChecks.push({ name, status: 'PASS', detail });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
  console.log('PASS', name);
};
const frame = (page) => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const ready = (page) => page.waitForFunction(() => window.__aparDebug && getComputedStyle(document.querySelector('#splash')).opacity === '0');
const product = JSON.parse(fs.readFileSync(path.join(root, 'src/data/product.json')));
let browser;
(async () => {
  browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const desktop = await browser.newContext({ viewport: { width: 1365, height: 900 }, locale: 'id-ID' });
  const failed = await desktop.newPage();
  const failureErrors = [];
  failed.on('pageerror', error => failureErrors.push(String(error)));
  await failed.route('**/models/apar.glb', route => route.abort());
  await failed.goto('http://localhost:5173/#configure');
  await failed.locator('.splash__retry').waitFor({ state: 'visible', timeout: 10000 });
  assert.equal(await failed.locator('.config-options button:disabled').count(), 11);
  assert.equal(await failed.locator('.config-bracket input').isDisabled(), true);
  assert.match(await failed.locator('.splash__error').innerText(), /gagal/);
  await failed.unroute('**/models/apar.glb');
  await failed.locator('.splash__retry').click();
  await failed.waitForFunction(() => document.querySelectorAll('.config-options button:disabled').length === 0);
  assert.match(await failed.locator('.config-price__value').innerText(), /600.000/);
  assert.equal(failureErrors.length, 0);
  record('Model failure disables all choices; real Retry loads and enables defaults');
  await failed.close();

  const fallback = await desktop.newPage();
  const fallbackErrors = [];
  fallback.on('pageerror', error => fallbackErrors.push(String(error)));
  await fallback.route('**/src/data/product.json*', async route => {
    const response = await route.fetch();
    const body = (await response.text()).replaceAll('korean_fire_extinguisher_01_body', 'missing-body');
    await route.fulfill({ response, body });
  });
  await fallback.goto('http://localhost:5173/?debug#configure');
  await ready(fallback);
  assert.equal(await fallback.locator('.config-color:disabled').count(), 3);
  assert.match(await fallback.locator('.config-status').innerText(), /strip\/label/);
  await fallback.locator('[data-agent="co2"]').click();
  await fallback.locator('[data-capacity="9kg"]').click();
  await fallback.locator('.config-bracket input').check();
  assert.equal((await fallback.locator('.config-price__value').innerText()).replace(/\s/g, ''), 'IDR1.100.000');
  assert.equal(await fallback.locator('[data-spec="range"]').innerText(), '2,5 m');
  assert.equal(await fallback.evaluate(() => window.__aparDebug.model.getObjectByName('configurator-bracket').visible), true);
  assert.equal(fallbackErrors.length, 0);
  record('Missing body material leaves capacity, agent, specs, price and bracket usable');
  await fallback.close();

  const page = await desktop.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  page.on('console', message => { if (message.type() === 'error' && !message.text().includes('404')) errors.push(message.text()); });
  await page.goto('http://localhost:5173/?debug#configure');
  await ready(page);
  await page.evaluate(() => window.__aparDebug.controls.pauseAutoRotate());
  await page.locator('[data-agent="co2"]').focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('[data-agent="co2"]').getAttribute('aria-pressed'), 'true');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.dataset.agent), 'foam_afff');
  await page.keyboard.press('Space');
  assert.equal(await page.locator('[data-agent="foam_afff"]').getAttribute('aria-pressed'), 'true');
  await page.locator('[data-capacity="1kg"]').focus();
  await page.keyboard.press('Space');
  assert.equal(await page.locator('[data-capacity="1kg"]').getAttribute('aria-pressed'), 'true');
  assert.notEqual(await page.locator('[data-capacity="1kg"]').evaluate(e => getComputedStyle(e).outlineStyle), 'none');
  await page.locator('.config-bracket input').focus();
  await page.keyboard.press('Space');
  assert.equal(await page.locator('.config-bracket input').isChecked(), true);
  record('Keyboard Enter, Space, Tab, switch and visible focus');
  await page.locator('a[href="#about"]').click();
  assert.equal(await page.locator('dialog').evaluate(e => e.open), true);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('dialog').evaluate(e => e.open), false);
  record('About opens and Escape closes while keeping configuration');
  const popupReady = page.waitForEvent('popup');
  await page.locator('.config-source').click();
  const popup = await popupReady;
  await popup.waitForURL(product.sources.fireClasses, { waitUntil: 'commit', timeout: 10000 });
  await popup.close();
  record('Fire-class source link opens the documented Damkar URL');
  await page.locator('.config-bracket input').uncheck();
  await page.locator('[data-capacity="6kg"]').click();
  await page.locator('[data-hotspot="body"]').click();
  await page.locator('[data-capacity="1kg"]').click();
  await page.waitForTimeout(750);
  const focus = await page.evaluate(() => window.__aparDebug.camera.position.toArray());
  [0.9, 0.9, 1.2].forEach((value, i) => assert(Math.abs(focus[i] - value * 0.65) < 0.001));
  record('Capacity change during focus tween replaces its target and keeps the card');
  await page.locator('[data-capacity="9kg"]').click();
  await page.locator('.hotspot-info__close').click();
  await page.waitForTimeout(750);
  assert.equal(await page.evaluate(() => window.__aparDebug.controls.minDistance), 1.5);
  assert.equal(await page.locator('.hotspot-info__card').isVisible(), false);
  record('Closing during a capacity focus tween restores overview without stale focus');
  await page.locator('[data-hotspot="body"]').click();
  await page.locator('a[href="#train"]').click();
  await page.locator('a[href="#configure"]').click();
  assert.equal(await page.locator('.hotspot-info__card').isVisible(), false);
  assert.equal(await page.evaluate(() => window.__aparDebug.controls.minDistance), 1.5);
  record('Tab exit during focus cleans the card and restores camera limits');
  await page.locator('[data-capacity="6kg"]').click();
  for (const agent of product.options.agent) {
    await page.locator('[data-agent="' + agent.id + '"]').click();
    await page.evaluate(() => {
      const d = window.__aparDebug;
      d.controls.pauseAutoRotate();
      d.camera.position.set(0.9, 1, 1.8);
      d.controls.target.set(0, 0.65, 0);
      d.controls.update();
      d.requestRender();
    });
    await frame(page);
    await page.screenshot({ path: path.join(__dirname, 't1.6-agent-' + agent.id + '.png') });
  }
  await page.goto('http://localhost:4173/?debug#configure');
  await ready(page);
  await page.evaluate(() => {
    window.__aparDebug.controls.pauseAutoRotate();
    document.addEventListener('click', event => {
      if (!event.target.closest('.config-options button')) return;
      const start = performance.now();
      window.__timing = new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve(performance.now() - start))));
    }, true);
  });
  const timings = [];
  for (const lang of ['id', 'en']) {
    await page.locator('[data-lang="' + lang + '"]').click();
    for (const agent of product.options.agent) {
      await page.locator('[data-agent="' + agent.id + '"]').click();
      for (const capacity of product.options.capacity) {
        await page.locator('[data-capacity="' + capacity.id + '"]').click();
        timings.push(await page.evaluate(() => window.__timing));
        const currency = lang === 'id' ? 'IDR' : 'USD';
        const total = product.basePrice[currency] + agent.priceAdd[currency] + capacity.priceAdd[currency];
        const expected = new Intl.NumberFormat(lang === 'id' ? 'id-ID' : 'en-US', { style: 'currency', currency, currencyDisplay: 'code', maximumFractionDigits: 0 }).format(total);
        assert.equal((await page.locator('.config-price__value').innerText()).replace(/\s/g, ''), expected.replace(/\s/g, ''));
        assert.equal(await page.locator('[data-spec="agent"]').innerText(), agent.label[lang]);
        assert.equal(await page.locator('[data-spec="capacity"]').innerText(), capacity.kg + ' kg');
      }
    }
  }
  assert(Math.max(...timings) < 100);
  record('Production preview: 32 bilingual variant changes, price/spec and next-frame latency', { count: 32, maxMs: Math.max(...timings), timings });
  await page.locator('[data-lang="id"]').click();
  await page.locator('[data-agent="powder_abc"]').click();
  await page.locator('[data-capacity="6kg"]').click();
  await page.screenshot({ path: path.join(__dirname, 't1.6-production-desktop.png') });
  assert.equal(errors.length, 0);
  record('Normal desktop paths and production shader have no unexpected console/page errors');

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1.5, locale: 'id-ID' });
  const mobile = await mobileContext.newPage();
  const mobileErrors = [];
  mobile.on('pageerror', error => mobileErrors.push(String(error)));
  await mobile.goto('http://localhost:4173/?debug#configure');
  await ready(mobile);
  await mobile.locator('.panel__handle').tap();
  await mobile.evaluate(() => {
    window.__aparDebug.controls.pauseAutoRotate();
    document.addEventListener('click', event => {
      if (!event.target.closest('.config-options button')) return;
      const start = performance.now();
      window.__timing = new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve(performance.now() - start))));
    }, true);
  });
  const mobileTimings = [];
  for (const lang of ['id', 'en']) {
    await mobile.locator('[data-lang="' + lang + '"]').tap();
    for (const agent of product.options.agent) {
      await mobile.locator('[data-agent="' + agent.id + '"]').tap();
      for (const capacity of product.options.capacity) {
        await mobile.locator('[data-capacity="' + capacity.id + '"]').tap();
        mobileTimings.push(await mobile.evaluate(() => window.__timing));
        const currency = lang === 'id' ? 'IDR' : 'USD';
        const price = new Intl.NumberFormat(lang === 'id' ? 'id-ID' : 'en-US', { style: 'currency', currency, currencyDisplay: 'code', maximumFractionDigits: 0 }).format(product.basePrice[currency] + agent.priceAdd[currency] + capacity.priceAdd[currency]);
        assert.equal((await mobile.locator('.config-price__value').innerText()).replace(/\s/g, ''), price.replace(/\s/g, ''));
        assert.equal(await mobile.locator('[data-spec="agent"]').innerText(), agent.label[lang]);
      }
    }
  }
  assert(Math.max(...mobileTimings) < 100);
  record('Production touch: 32 bilingual variants and next-frame latency', { count: 32, maxMs: Math.max(...mobileTimings), timings: mobileTimings });
  await mobile.locator('[data-lang="id"]').tap();
  await mobile.locator('[data-agent="foam_afff"]').tap();
  assert.equal(await mobile.locator('.panel').evaluate(e => e.classList.contains('is-expanded')), true);
  await mobile.locator('[data-capacity="9kg"]').tap();
  await mobile.locator('[data-color="yellow"]').tap();
  await mobile.locator('.config-bracket input').check();
  assert.match(await mobile.locator('.config-price__value').innerText(), /950.000/);
  await mobile.locator('.panel__handle').tap();
  assert.equal(await mobile.locator('.panel').evaluate(e => e.classList.contains('is-expanded')), false);
  await mobile.evaluate(() => { const d = window.__aparDebug; d.controls.pauseAutoRotate(); d.camera.position.set(1, 1, 2); d.controls.target.set(0, 0.7, 0); d.controls.update(); d.requestRender(); });
  await mobile.locator('[data-hotspot="body"]').tap();
  await mobile.waitForTimeout(750);
  await mobile.screenshot({ path: path.join(__dirname, 't1.6-production-mobile-card.png') });
  await mobile.locator('.hotspot-info__close').tap();
  await mobile.waitForTimeout(750);
  await mobile.locator('.panel__handle').tap();
  await mobile.screenshot({ path: path.join(__dirname, 't1.6-production-mobile-options.png') });
  assert.equal(mobileErrors.length, 0);
  record('Production touch: sheet toggle, agent/capacity/color/bracket, hotspot and close');
  const handle = await mobile.locator('.panel__handle').boundingBox();
  await mobile.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await mobile.mouse.down();
  await mobile.mouse.move(handle.x + handle.width / 2, 700, { steps: 10 });
  await mobile.mouse.up();
  await mobile.waitForTimeout(300);
  assert.equal(await mobile.locator('.panel').evaluate(e => e.classList.contains('is-expanded')), false);
  record('Sheet drag still snaps to compact after expanded configuration');
  const luminance = hex => {
    const rgb = hex.match(/\w\w/g).map(value => parseInt(value, 16) / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  };
  const pairs = [['UI text', 'f2f3f5', '16191e'], ['Muted', '9aa1ac', '16191e'], ['Accent ink', '111111', 'ffc629'], ...product.options.agent.map(agent => [agent.id, agent.visual.ink.slice(1), agent.visual.strip.slice(1)])];
  const ratios = pairs.map(([name, ink, background]) => {
    const values = [luminance(ink), luminance(background)].sort((a, b) => a - b);
    const ratio = (values[1] + 0.05) / (values[0] + 0.05);
    assert(ratio >= 4.5);
    return { name, ratio: Number(ratio.toFixed(2)) };
  });
  record('AA contrast for panel text and all four procedural strip labels', { ratios });
  const reducedContext = await browser.newContext({ viewport: { width: 1365, height: 900 }, reducedMotion: 'reduce' });
  const reduced = await reducedContext.newPage();
  await reduced.addInitScript(() => {
    const native = window.requestAnimationFrame;
    window.__rafCount = 0;
    window.requestAnimationFrame = callback => { window.__rafCount++; return native.call(window, callback); };
  });
  await reduced.goto('http://localhost:4173/?debug#configure');
  await ready(reduced);
  await reduced.locator('[data-hotspot="body"]').click();
  await reduced.locator('[data-capacity="1kg"]').click();
  await reduced.waitForTimeout(1000);
  const before = await reduced.evaluate(() => window.__rafCount);
  await reduced.waitForTimeout(1000);
  const after = await reduced.evaluate(() => window.__rafCount);
  assert.equal(after, before);
  record('Reduced motion: focused scaled model schedules no idle animation frames', { before, after });
  report.finalStatus = report.acceptance?.result === 'passed' ? 'accepted_by_barkah' : 'automated_checks_passed_awaiting_barkah';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
})().catch(error => {
  report.failure = String(error.stack);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
  console.error(error);
  process.exitCode = 1;
}).finally(async () => { await browser?.close(); });
