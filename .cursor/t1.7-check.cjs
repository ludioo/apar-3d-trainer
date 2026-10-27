const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const report = { date: '2026-10-28', checks: [], errors: [] };
const reportFile = path.join(__dirname, 't1.7-qa.json');
function record(name, detail = {}) {
  report.checks.push({ name, status: 'PASS', detail });
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  console.log('PASS', name);
}
const ready = (page) => page.waitForFunction(() => window.__aparDebug && getComputedStyle(document.querySelector('#splash')).opacity === '0');
const data = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('apar3d:configs')));
const saveButton = (page) => page.locator('[data-action="save"]');
async function saveAs(page, name) {
  await saveButton(page).click();
  await page.locator('#saved-name').fill(name);
  await page.locator('.saved-dialog button[type="submit"]').click();
  await page.locator('.saved-dialog').waitFor({ state: 'hidden' });
}
async function choose(page, { agent = 'co2', capacity = '9kg', color = 'silver', bracket = true } = {}) {
  await page.locator(`[data-agent="${agent}"]`).click();
  await page.locator(`[data-capacity="${capacity}"]`).click();
  await page.locator(`[data-color="${color}"]`).click();
  await page.locator('.config-bracket input').setChecked(bracket);
}
async function verifyVariant(page, { agent = 'co2', capacity = '9kg', color = 'silver', bracket = true } = {}) {
  assert.equal(await page.locator(`[data-agent="${agent}"]`).getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator(`[data-capacity="${capacity}"]`).getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator(`[data-color="${color}"]`).getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('.config-bracket input').isChecked(), bracket);
}
async function dialogBounds(page) {
  const bounds = await page.locator('.saved-dialog').evaluate((dialog) => {
    const box = dialog.getBoundingClientRect();
    return { x: box.x, right: box.right, y: box.y, bottom: box.bottom,
      width: innerWidth, height: innerHeight, overflow: document.documentElement.scrollWidth > innerWidth };
  });
  assert.ok(bounds.x >= 0 && bounds.right <= bounds.width + 1 && bounds.y >= 0 && bounds.bottom <= bounds.height + 1, JSON.stringify(bounds));
  assert.equal(bounds.overflow, false);
  for (const button of await page.locator('.saved-dialog button').all()) {
    await button.scrollIntoViewIfNeeded();
    assert.equal(await button.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return el.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
    }), true, 'dialog action hit-tested');
  }
}

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1365, height: 900 }, locale: 'id-ID' });
    const page = await context.newPage();
    page.on('pageerror', (error) => report.errors.push(String(error)));
    page.on('console', (message) => { if (message.type() === 'error' && !message.text().includes('404')) report.errors.push(message.text()); });
    await page.goto('http://localhost:5180/?debug#configure');
    await ready(page);
    assert.match(await page.locator('.saved-status').innerText(), /Belum ada/);
    await saveButton(page).click();
    assert.equal(await page.locator('#saved-name').inputValue(), 'Konfigurasi #1');
    assert.equal(await page.locator('#saved-name').evaluate((el) => document.activeElement === el), true);
    await page.locator('#saved-name').fill('   ');
    await page.locator('.saved-dialog button[type="submit"]').click();
    assert.match(await page.locator('.saved-error').innerText(), /1 sampai 60/);
    assert.equal(await data(page), null);
    await page.keyboard.press('Escape');
    assert.equal(await saveButton(page).evaluate((el) => document.activeElement === el), true);
    record('Empty state, default name, blank validation, Escape and focus return');

    await choose(page);
    await saveAs(page, '  Gudang utama  ');
    assert.equal((await data(page)).configs[0].name, 'Gudang utama');
    assert.match(await page.locator('.saved-summary').innerText(), /CO₂.*9 kg.*Perak.*Dengan bracket/);
    await page.reload();
    await ready(page);
    await verifyVariant(page, { agent: 'powder_abc', capacity: '6kg', color: 'red', bracket: false });
    const baseline = await page.evaluate(() => window.__aparDebug.model.scale.x);
    await page.locator('[data-action="load"]').click();
    await verifyVariant(page);
    assert.equal((await page.locator('.config-price__value').innerText()).replace(/\s/g, ''), 'IDR1.100.000');
    assert.ok(Math.abs(await page.evaluate(() => window.__aparDebug.model.scale.x) / baseline - 1.12) < 1e-9);
    assert.match(await page.locator('[data-spec="range"]').innerText(), /2,5 m/);
    assert.equal(await page.locator('[data-action="load"]').evaluate((el) => document.activeElement === el), true);
    record('Trimmed name persists across refresh; manual Load restores all four choices, specs, price, scale and focus');
    await saveAs(page, 'Gudang utama');
    assert.equal((await data(page)).configs.length, 2);
    assert.equal(new Set((await data(page)).configs.map((entry) => entry.id)).size, 2);
    const htmlName = '<img src=x onerror=alert(1)>';
    await saveAs(page, htmlName);
    assert.equal(await page.locator('.saved-list h4').first().innerText(), htmlName);
    assert.equal(await page.locator('.saved-list img').count(), 0);
    await saveButton(page).click();
    await page.locator('#saved-name').fill('A'.repeat(60));
    assert.equal(await page.locator('#saved-name').getAttribute('maxlength'), '60');
    await page.locator('#saved-name').press('Enter');
    await page.locator('.saved-dialog').waitFor({ state: 'hidden' });
    record('Duplicate names, text-only HTML-like names, 60-character name, and Enter save');

    await page.locator('[data-lang="en"]').click();
    assert.match(await page.locator('.saved-summary').first().innerText(), /Silver.*With bracket/);
    assert.match(await page.locator('.config-price__value').innerText(), /USD.*71/);
    await saveButton(page).click();
    assert.equal(await page.locator('#saved-name').inputValue(), 'Config #5');
    await page.locator('#saved-name').fill('Keep typed name');
    await page.evaluate(async () => (await import('/src/i18n/i18n.js')).setLang('id'));
    assert.equal(await page.locator('#saved-name').inputValue(), 'Keep typed name');
    assert.match(await page.locator('#saved-dialog-title').innerText(), /Simpan/);
    await page.keyboard.press('Escape');
    await page.locator('[data-lang="en"]').click();
    await page.reload();
    await ready(page);
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    assert.equal(await page.locator('.saved-list h4').first().innerText(), 'A'.repeat(60));
    record('EN/ID summaries, currencies, dialog copy, typed/stored names and persisted language');

    for (let n = 5; n <= 10; n++) await saveAs(page, `Config ${n}`);
    const full = await data(page);
    await saveButton(page).click();
    assert.match(await page.locator('#saved-dialog-explanation').innerText(), /10.*Gudang utama/);
    await page.screenshot({ path: path.join(__dirname, 't1.7-desktop-full.png') });
    await page.locator('.saved-dialog button[type="button"]').click();
    assert.deepEqual(await data(page), full);
    await saveAs(page, 'Eleventh');
    const replaced = await data(page);
    assert.equal(replaced.configs.length, 10);
    assert.equal(replaced.configs[0].name, 'Eleventh');
    assert.ok(!replaced.configs.some((entry) => entry.id === full.configs.at(-1).id));
    record('Ten-save limit, named oldest confirmation, cancel, successful replacement');

    await page.locator('[data-action="delete"]').first().click();
    assert.equal(await page.locator('.saved-dialog button[type="button"]').evaluate((el) => document.activeElement === el), true);
    assert.match(await page.locator('#saved-dialog-explanation').innerText(), /Eleventh/);
    await page.keyboard.press('Escape');
    assert.deepEqual(await data(page), replaced);
    assert.equal(await page.locator('[data-action="delete"]').first().evaluate((el) => document.activeElement === el), true);
    await page.locator('[data-action="delete"]').first().click();
    await page.locator('.saved-dialog button[type="submit"]').click();
    await page.locator('.saved-dialog').waitFor({ state: 'hidden' });
    assert.equal((await data(page)).configs.length, 9);
    assert.equal(await saveButton(page).evaluate((el) => document.activeElement === el), true);
    record('Delete confirmation defaults to Cancel; Escape retains data; confirmed delete updates list/focus');

    await saveAs(page, 'Full again');
    await saveButton(page).click();
    await page.locator('#saved-name').fill('Stale replacement');
    const oldestBefore = (await data(page)).configs.at(-1).id;
    await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('apar3d:configs'));
      saved.configs.pop(); localStorage.setItem('apar3d:configs', JSON.stringify(saved));
    });
    await page.locator('.saved-dialog button[type="submit"]').click();
    assert.match(await page.locator('.saved-error').innerText(), /changed/);
    assert.equal((await data(page)).configs.length, 9);
    assert.ok(!(await data(page)).configs.some((entry) => entry.id === oldestBefore));
    await page.locator('.saved-dialog button[type="submit"]').click();
    await page.locator('.saved-dialog').waitFor({ state: 'hidden' });
    record('Stale full-list confirmation requires a second confirmation without deleting another entry');

    await page.locator('[data-action="delete"]').first().click();
    await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('apar3d:configs'));
      saved.configs[0].name = 'Edited elsewhere'; localStorage.setItem('apar3d:configs', JSON.stringify(saved));
    });
    await page.locator('.saved-dialog button[type="submit"]').click();
    assert.match(await page.locator('#saved-dialog-explanation').innerText(), /Edited elsewhere/);
    assert.match(await page.locator('.saved-error').innerText(), /changed/);
    await page.keyboard.press('Escape');
    record('Stale delete confirms updated name instead of deleting silently');

    const preserved = await data(page);
    await saveButton(page).click();
    await page.evaluate(() => { window.originalSet = Storage.prototype.setItem; Storage.prototype.setItem = function(key, value) {
      if (key === 'apar3d:configs') throw new DOMException('Quota', 'QuotaExceededError');
      return window.originalSet.call(this, key, value);
    }; });
    await page.locator('.saved-dialog button[type="submit"]').click();
    assert.match(await page.locator('.saved-error').innerText(), /not available/);
    assert.deepEqual(await data(page), preserved);
    await page.keyboard.press('Escape');
    await page.evaluate(() => { Storage.prototype.setItem = window.originalSet; });
    record('Quota failure shows error and preserves all ten saved configurations');

    for (const bad of ['{', JSON.stringify({ schemaVersion: 99, configs: [] }), JSON.stringify({ schemaVersion: 1, configs: [{ invalid: true }] })]) {
      await page.evaluate((value) => localStorage.setItem('apar3d:configs', value), bad);
      await page.reload(); await ready(page);
      assert.match(await page.locator('.saved-status').innerText(), /damaged/);
      assert.equal(await saveButton(page).isDisabled(), true);
      await page.locator('[data-agent="water"]').click();
      assert.equal(await page.evaluate(() => localStorage.getItem('apar3d:configs')), bad);
    }
    record('Corrupt JSON, unknown schema and invalid entries remain untouched; configurator still works');
    await page.evaluate((value) => localStorage.setItem('apar3d:configs', JSON.stringify(value)), preserved);
    await page.reload(); await ready(page);
    await page.locator('a[href="#train"]').click();
    assert.equal(await page.locator('.saved-configs').count(), 0);
    await page.locator('a[href="#configure"]').click();
    assert.equal(await page.locator('.saved-list li').count(), 10);
    await page.locator('a[href="#about"]').click();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#about').isVisible(), false);
    await page.locator('.hotspot-pin:not([hidden])').first().click();
    await page.locator('[data-action="load"]').first().click();
    assert.equal(await page.locator('.hotspot-info__card').isVisible(), true);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(800);
    record('Configure/Train lifecycle, About Escape, Load during hotspot camera tween');

    for (const entry of (await data(page)).configs) {
      await page.locator(`[data-action="delete"][data-id="${entry.id}"]`).click();
      await page.locator('.saved-dialog button[type="submit"]').click();
      await page.locator('.saved-dialog').waitFor({ state: 'hidden' });
    }
    await page.reload(); await ready(page);
    assert.match(await page.locator('.saved-status').innerText(), /No saved/);
    record('Delete all and reload returns to empty state');

    const blocked = await context.newPage();
    await blocked.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError'); } }); });
    await blocked.goto('http://localhost:5180/?debug#configure'); await ready(blocked);
    assert.match(await blocked.locator('.saved-status').innerText(), /tidak tersedia/);
    await blocked.locator('[data-agent="water"]').click();
    assert.equal(await saveButton(blocked).isDisabled(), true);
    await blocked.close();
    record('Unavailable localStorage leaves app and variant controls usable');

    const failed = await context.newPage();
    await failed.route('**/models/apar.glb', (route) => route.abort());
    await failed.goto('http://localhost:5180/#configure');
    await failed.locator('.splash__retry').waitFor({ state: 'visible' });
    assert.equal(await saveButton(failed).isDisabled(), true);
    await failed.unroute('**/models/apar.glb');
    await failed.locator('.splash__retry').click();
    await saveButton(failed).waitFor({ state: 'visible' });
    await failed.waitForFunction(() => !document.querySelector('[data-action="save"]').disabled);
    await failed.close();
    record('Model failure disables Save; Retry re-enables it');

    const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'id-ID', reducedMotion: 'reduce' });
    const mobile = await mobileContext.newPage();
    mobile.on('pageerror', (error) => report.errors.push(String(error)));
    await mobile.goto('http://192.168.100.4:5180/?debug#configure'); await ready(mobile);
    await choose(mobile, { agent: 'foam_afff', capacity: '3kg', color: 'yellow', bracket: true });
    await saveAs(mobile, 'APAR HP');
    assert.equal((await data(mobile)).configs[0].id.length, 32);
    record('Save on insecure LAN origin works without crypto.randomUUID');
    for (const [width, height] of [[360, 800], [390, 844], [768, 1024], [844, 390], [390, 420]]) {
      await mobile.setViewportSize({ width, height });
      for (const lang of ['en', 'id']) {
        await mobile.locator(`[data-lang="${lang}"]`).click();
        await saveButton(mobile).click();
        await mobile.locator('#saved-name').fill('L'.repeat(60));
        await mobile.evaluate(() => document.querySelectorAll('.saved-dialog label, .saved-dialog p, .saved-dialog button, .saved-dialog input, .saved-dialog h2').forEach((el) => el.style.fontSize = `${parseFloat(getComputedStyle(el).fontSize) * 2}px`));
        await dialogBounds(mobile);
        await mobile.locator('.saved-dialog button[type="button"]').click();
        await mobile.evaluate(() => document.querySelectorAll('.saved-dialog [style]').forEach((el) => el.style.removeProperty('font-size')));
        assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      }
      record(`Mobile dialog EN/ID, text 200%, scroll/hit-tested actions ${width}x${height}`);
    }
    await mobile.setViewportSize({ width: 390, height: 844 });
    await mobile.locator('[data-action="load"]').click();
    await verifyVariant(mobile, { agent: 'foam_afff', capacity: '3kg', color: 'yellow', bracket: true });
    await mobile.locator('.hotspot-pin:not([hidden])').first().tap();
    assert.equal(await mobile.locator('.saved-configs').isVisible(), false);
    assert.equal(await mobile.locator('.hotspot-info__close').isVisible(), true);
    await mobile.locator('.hotspot-info__close').tap();
    assert.equal(await mobile.locator('.saved-configs').isVisible(), true);
    await saveButton(mobile).click();
    await mobile.screenshot({ path: path.join(__dirname, 't1.7-mobile-dialog.png') });
    await mobile.keyboard.press('Escape');
    await mobile.locator('.saved-configs').scrollIntoViewIfNeeded();
    await mobile.screenshot({ path: path.join(__dirname, 't1.7-mobile-list.png') });
    record('Mobile touch Load, hotspot hides/restores saved UI, reduced motion');
    assert.deepEqual(report.errors, []);
    record('No unexpected desktop/mobile JavaScript or console errors');
    await mobileContext.close();
    await context.close();
  } finally { await browser.close(); }
})().catch((error) => {
  report.failure = String(error.stack);
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  console.error(error); process.exitCode = 1;
});
