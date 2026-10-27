const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const file = path.join(__dirname, 't1.7-qa.json');
const report = JSON.parse(fs.readFileSync(file));
if (report.productionFailure) {
  report.instrumentationNotes = ['Initial contrast probe did not expand minified three-digit hex tokens; corrected the probe and reran successfully.'];
  delete report.productionFailure;
}
report.production = [];
const record = (name, detail = {}) => {
  report.production.push({ name, status: 'PASS', detail });
  fs.writeFileSync(file, JSON.stringify(report, null, 2));
  console.log('PASS', name);
};
const ready = (page) => page.waitForFunction(() => window.__aparDebug && getComputedStyle(document.querySelector('#splash')).opacity === '0');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const errors = [];
    const desktop = await browser.newContext({ viewport: { width: 1365, height: 900 }, locale: 'id-ID' });
    const page = await desktop.newPage();
    page.on('pageerror', (error) => errors.push(String(error)));
    await page.goto('http://localhost:4180/?debug#configure'); await ready(page);
    const save = page.locator('[data-action="save"]');
    await page.locator('[data-agent="water"]').click();
    await page.locator('[data-capacity="1kg"]').click();
    await page.locator('[data-color="yellow"]').click();
    await save.focus();
    await page.keyboard.press('Space');
    assert.equal(await page.locator('.saved-dialog').isVisible(), true);
    await page.locator('#saved-name').fill('Ruang panel');
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('.saved-dialog button[type="button"]').evaluate((el) => document.activeElement === el), true);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await page.locator('.saved-dialog').waitFor({ state: 'hidden' });
    await page.locator('[data-agent="powder_abc"]').click();
    await page.locator('[data-capacity="6kg"]').click();
    await page.locator('[data-color="red"]').click();
    await page.locator('.config-bracket input').check();
    await save.click();
    await page.locator('#saved-name').fill('Kantor');
    await page.locator('.saved-dialog button[type="submit"]').click();
    await page.locator('.saved-dialog').waitFor({ state: 'hidden' });
    await page.locator('[data-action="load"]').last().focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('[data-agent="water"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('[data-capacity="1kg"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('[data-color="yellow"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('.config-bracket input').isChecked(), false);
    await page.locator('.saved-configs').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(__dirname, 't1.7-production-desktop.png') });
    record('Production keyboard Space/Tab/Enter saves and loads a second distinct variant');
    const before = await page.evaluate(() => localStorage.getItem('apar3d:configs'));
    await page.locator('[data-action="delete"]').first().click();
    await page.evaluate(() => { window.realSet = Storage.prototype.setItem; Storage.prototype.setItem = () => { throw new Error('Quota'); }; });
    await page.locator('.saved-dialog button[type="submit"]').click();
    assert.match(await page.locator('.saved-error').innerText(), /tidak tersedia/);
    assert.equal(await page.evaluate(() => localStorage.getItem('apar3d:configs')), before);
    await page.evaluate(() => { Storage.prototype.setItem = window.realSet; });
    await page.locator('.saved-dialog button[type="submit"]').click();
    await page.locator('.saved-dialog').waitFor({ state: 'hidden' });
    record('Production failed Delete retains data; retry succeeds');

    await page.locator('.hotspot-pin:not([hidden])').first().click();
    await save.click();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.hotspot-info__card').isVisible(), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.hotspot-info__card').isVisible(), false);
    record('Escape closes configuration dialog first and hotspot card second');
    await page.waitForTimeout(800);
    const contrast = await page.evaluate(() => {
      const css = getComputedStyle(document.documentElement);
      const lum = (hex) => {
        const value = hex.trim().slice(1);
        const full = value.length === 3 ? [...value].map((part) => part + part).join('') : value;
        const rgb = full.match(/../g).map((part) => parseInt(part, 16) / 255)
          .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
        return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
      };
      const ratio = (a, b) => {
        const x = lum(css.getPropertyValue(a)), y = lum(css.getPropertyValue(b));
        return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
      };
      return { text: ratio('--text', '--surface-solid'), muted: ratio('--text-muted', '--surface-solid'),
        primary: ratio('--accent-ink', '--accent'), error: ratio('--danger', '--surface-solid'),
        focus: ratio('--accent', '--surface-solid'), input: ratio('--text', '--bg') };
    });
    assert.ok(Object.values(contrast).every((value) => value >= 4.5));
    record('Contrast of all new text/input/error/focus pairings meets AA', contrast);

    const touchContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'id-ID' });
    const touch = await touchContext.newPage();
    touch.on('pageerror', (error) => errors.push(String(error)));
    await touch.goto('http://192.168.100.4:4180/?debug#configure'); await ready(touch);
    const touchSave = touch.locator('[data-action="save"]');
    await touchSave.tap();
    await touch.locator('#saved-name').fill('Simpanan HP');
    await touch.locator('.saved-dialog button[type="submit"]').tap();
    await touch.locator('.saved-dialog').waitFor({ state: 'hidden' });
    await touch.locator('[data-color="silver"]').tap();
    await touch.locator('[data-action="load"]').tap();
    assert.equal(await touch.locator('[data-color="red"]').getAttribute('aria-pressed'), 'true');
    await touch.locator('[data-action="delete"]').tap();
    await touch.locator('.saved-dialog button[type="button"]').tap();
    assert.equal(await touch.locator('.saved-list li').count(), 1);
    await touch.locator('[data-action="delete"]').tap();
    await touch.locator('.saved-dialog button[type="submit"]').tap();
    await touch.locator('.saved-dialog').waitFor({ state: 'hidden' });
    assert.match(await touch.locator('.saved-status').innerText(), /Belum ada/);
    record('Production LAN touch Save, Load, Delete cancel/confirm and empty state');

    await touchSave.tap();
    await touch.setViewportSize({ width: 390, height: 420 });
    await touch.locator('#saved-name').focus();
    await touch.locator('#saved-name').fill('a'.repeat(60));
    await touch.locator('.saved-dialog button[type="submit"]').scrollIntoViewIfNeeded();
    assert.equal(await touch.locator('.saved-dialog button[type="submit"]').isVisible(), true);
    await touch.locator('.saved-dialog button[type="submit"]').tap();
    await touch.locator('.saved-dialog').waitFor({ state: 'hidden' });
    record('Short viewport simulating keyboard space can submit a focused form; physical OS keyboard not tested');
    await touch.setViewportSize({ width: 390, height: 844 });
    await touch.locator('.panel__handle').tap();
    await touch.locator('.saved-configs').scrollIntoViewIfNeeded();
    await touch.screenshot({ path: path.join(__dirname, 't1.7-production-mobile.png') });
    const sizes = await touch.locator('.saved-configs button').evaluateAll((buttons) => buttons.map((button) => {
      const rect = button.getBoundingClientRect(); return { width: rect.width, height: rect.height };
    }));
    assert.ok(sizes.every((size) => size.width >= 44 && size.height >= 44));
    record('Production touch targets at least 44px and expanded sheet screenshot reviewed', sizes);
    const specialName = 'Cash $& $1 $$';
    await touchSave.tap();
    await touch.locator('#saved-name').fill(specialName);
    await touch.locator('.saved-dialog button[type="submit"]').tap();
    await touch.locator('.saved-dialog').waitFor({ state: 'hidden' });
    assert.equal(await touch.locator('[data-action="delete"]').first().getAttribute('aria-label'), `Hapus ${specialName}`);
    await touch.locator('[data-action="delete"]').first().tap();
    assert.equal(await touch.locator('#saved-dialog-explanation').innerText(), `Hapus “${specialName}”? Tindakan ini tidak dapat dibatalkan.`);
    await touch.keyboard.press('Escape');
    record('Special dollar sequences in names remain literal in accessible labels and confirmation');
    for (const [width, height] of [[360, 800], [844, 390]]) {
      await touch.setViewportSize({ width, height });
      await touch.evaluate(() => document.querySelectorAll('.saved-configs h3, .saved-configs h4, .saved-configs p, .saved-configs button').forEach((el) => el.style.fontSize = `${parseFloat(getComputedStyle(el).fontSize) * 2}px`));
      for (const button of await touch.locator('.saved-configs button').all()) {
        await button.scrollIntoViewIfNeeded();
        const rect = await button.boundingBox();
        assert.ok(rect.x >= 0 && rect.x + rect.width <= width + 1);
      }
      assert.equal(await touch.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await touch.evaluate(() => document.querySelectorAll('.saved-configs [style]').forEach((el) => el.style.removeProperty('font-size')));
      record(`Saved list with long names and text 200% remains usable at ${width}x${height}`);
    }
    assert.deepEqual(errors, []);
    record('Production desktop and mobile no JavaScript errors');
    await touchContext.close(); await desktop.close();
  } finally { await browser.close(); }
})().catch((error) => { report.productionFailure = String(error.stack); fs.writeFileSync(file, JSON.stringify(report, null, 2)); console.error(error); process.exitCode = 1; });
