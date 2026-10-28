const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const questions = require('../src/data/quiz.json');
const origin = 'https://trainer.barkahmauludi.com';
const report = { date: '2026-10-28', origin, checks: [], events: [], errors: [], pageviewsAccepted: 0 };
const pending = new Set();
const marker = 'UJI PRIVASI T36';
const expectedKeys = { variant_change: ['option','value'], hotspot_open: ['id'], config_save: ['agent','capacity','color'],
  training_start: [], training_finish: ['durationSec','skipped'], quiz_finish: ['score','total','passed'], pdf_export: ['type'], lang_change: ['lang'] };
const save = () => fs.writeFileSync(path.join(__dirname, 't3.6-live-qa.json'), JSON.stringify(report, null, 2));
const pass = (name, detail) => { report.checks.push({ name, detail }); save(); console.log('PASS', name); };
const nav = (p, key) => p.locator(`.tab[href="#${key}"]`).click();
async function download(p, type) {
  const done = p.waitForEvent('download'); await p.locator(`[data-pdf="${type}"]`).click(); await (await done).delete();
  await p.waitForFunction(type => document.querySelector(`[data-pdf="${type}"]`).getAttribute('aria-busy') === 'false', type);
}
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const c = await browser.newContext({ viewport: { width: 1365, height: 900 }, locale: 'en-US', reducedMotion: 'reduce' });
    const p = await c.newPage(); p.on('pageerror', e => report.errors.push(String(e)));
    p.on('response', response => {
      if (!response.url().includes('umami') || !response.request().postData()) return;
      const job = (async () => {
        const payload = JSON.parse(response.request().postData()).payload;
        assert.ok(!JSON.stringify(payload).includes(marker), 'private input must not reach collector');
        if (!payload?.name) { if (response.ok()) report.pageviewsAccepted++; return; }
        assert.ok(Object.hasOwn(expectedKeys, payload.name), 'only approved custom event names');
        assert.deepEqual(Object.keys(payload.data).sort(), [...expectedKeys[payload.name]].sort());
        report.events.push({ name: payload.name, data: payload.data, status: response.status() });
      })().catch(e => report.errors.push(String(e)));
      pending.add(job); job.finally(() => pending.delete(job));
    });
    const response = await p.goto(origin + '/#configure', { waitUntil: 'domcontentloaded' });
    assert.equal(response.status(), 200);
    await p.waitForFunction(() => performance.getEntriesByName('apar:visible').length, { timeout: 60000 });
    await p.waitForFunction(() => !!window.umami?.track, { timeout: 30000 });
    const tracker = await p.locator('script[data-website-id]').evaluate(script => ({
      src: script.src, defer: script.defer, domain: script.dataset.domains,
      websiteIdValid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(script.dataset.websiteId),
      visibleMs: performance.getEntriesByName('apar:visible')[0].startTime,
      scriptStartMs: performance.getEntriesByType('resource').find(r => r.name === script.src)?.startTime }));
    assert.equal(tracker.domain, 'trainer.barkahmauludi.com'); assert.equal(tracker.defer, true); assert.equal(tracker.websiteIdValid, true);
    assert.ok(tracker.scriptStartMs >= tracker.visibleMs);
    pass('Public HTTPS app and configured Umami script load after APAR visible', tracker);
    await p.locator('[data-agent="co2"]').click(); await p.locator('[data-capacity="9kg"]').click();
    await p.locator('[data-color="silver"]').click(); await p.locator('.config-bracket input').check();
    await p.locator('[data-action="save"]').click(); await p.locator('#saved-name').fill(marker);
    await p.locator('.saved-dialog button[type="submit"]').click();
    await p.locator('[data-part="body"]').click(); await p.locator('.hotspot-info__close').click();
    await p.locator('[data-lang="id"]').click(); await p.locator('[data-lang="en"]').click();
    await download(p, 'spec');
    await nav(p, 'train'); await p.locator('[data-training="start"]').click();
    for (let i = 0; i < 4; i++) { await p.locator('[data-training="skip"]').click(); await p.locator('[data-training="next"]').click(); }
    await p.locator('[data-training="quiz"]').click();
    for (let i = 0; i < 8; i++) {
      const q = questions[i];
      if (q.type === 'pick-hotspot') await p.locator(`.hotspot-pins:not([hidden]) [data-hotspot="${q.answer}"]`).click();
      else await p.locator(`[data-choice="${q.answer}"]`).click();
      await p.locator('[data-quiz="next"]').click();
    }
    assert.match(await p.locator('.quiz').innerText(), /8\/8/);
    await nav(p, 'results'); await p.locator('#participant-name').fill(marker); await download(p, 'report');
    await p.waitForTimeout(1500); await Promise.all([...pending]);
    for (const name of Object.keys(expectedKeys)) assert.ok(report.events.some(e => e.name === name && e.status >= 200 && e.status < 300), `accepted event ${name}`);
    assert.deepEqual(report.events.filter(e => e.name === 'pdf_export').map(e => e.data.type).sort(), ['report','spec']);
    assert.ok(report.pageviewsAccepted >= 1); assert.ok(!JSON.stringify(report.events).includes(marker));
    assert.deepEqual(await c.cookies(), []);
    pass('Eight custom event types and both PDF types accepted by live collector; private inputs absent; no cookies',
      { events: report.events.length, statuses: [...new Set(report.events.map(e => e.status))], dashboardVerified: false });
    await p.screenshot({ path: path.join(__dirname, 't3.6-live-results.png') });
    await c.close();

    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'id-ID', reducedMotion: 'reduce' });
    const m = await mobile.newPage(); m.on('pageerror', e => report.errors.push(String(e)));
    await m.goto(origin + '/#configure'); await m.waitForFunction(() => performance.getEntriesByName('apar:visible').length, { timeout: 60000 });
    await m.locator('[data-color="silver"]').tap(); await m.locator('.topbar__about').tap();
    const text = m.locator('[data-i18n="about.analytics"]'); await text.scrollIntoViewIfNeeded();
    assert.match(await text.innerText(), /Nama peserta dan nama konfigurasi tidak dikirim/);
    assert.equal(await m.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await m.screenshot({ path: path.join(__dirname, 't3.6-live-mobile.png') });
    await mobile.close(); pass('Live mobile touch, Indonesian About copy and no horizontal overflow');
    assert.deepEqual(report.errors, []);
  } catch(e) { report.failure = String(e.stack); throw e; }
  finally { await browser.close(); save(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
