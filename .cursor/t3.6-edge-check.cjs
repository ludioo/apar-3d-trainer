const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const origin = 'http://trainer.barkahmauludi.com:4196';
const questions = require('../src/data/quiz.json');
const report = { checks: [], errors: [] };
const pass = x => { report.checks.push(x); console.log('PASS', x); };
const mock = 'window.__events=[];window.umami={track(name,data){window.__events.push({name,data})}}';
const count = p => p.evaluate(() => window.__events.filter(e => e.name === 'pdf_export').length);
const nav = (p, mode) => p.locator(`.tab[href="#${mode}"]`).click();
function gate() { let release, reached; return { gate: new Promise(r => release = r), seen: new Promise(r => reached = r), release: () => release(), reached: () => reached() }; }
async function ready(p, hash = 'configure') {
  await p.goto(origin + '/#' + hash);
  await p.waitForFunction(() => !!window.umami?.track && performance.getEntriesByName('apar:visible').length);
}
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true,
    args: ['--no-proxy-server', '--host-resolver-rules=MAP trainer.barkahmauludi.com 127.0.0.1'] });
  async function page(options = {}) {
    const c = await browser.newContext({ viewport: { width: 1365, height: 900 }, locale: 'en-US', reducedMotion: 'reduce', ...options });
    await c.route('https://cloud.umami.is/script.js', r => r.fulfill({ contentType: 'text/javascript', body: mock }));
    const p = await c.newPage(); p.on('pageerror', e => report.errors.push(String(e)));
    return { c, p };
  }
  try {
    const { c: early, p: e } = await page();
    const delayed = gate();
    await early.route('https://cloud.umami.is/script.js', async r => {
      delayed.reached(); await delayed.gate; await r.fulfill({ contentType: 'text/javascript', body: mock });
    });
    await e.goto(origin + '/#configure', { waitUntil: 'domcontentloaded' }); await delayed.seen;
    await e.locator('[data-agent="co2"]').click(); await e.locator('[data-lang="id"]').click();
    delayed.release(); await e.waitForFunction(() => !!window.umami);
    assert.deepEqual(await e.evaluate(() => window.__events), []);
    await e.locator('[data-color="silver"]').click();
    assert.deepEqual(await e.evaluate(() => window.__events), [{ name: 'variant_change', data: { option: 'color', value: 'silver' } }]);
    await early.close(); pass('Delayed script drops early variant/language events; never replays');

    const { c: failure, p: f } = await page(); await ready(f);
    await failure.route(/jspdf.*\.js/, r => r.abort());
    await f.locator('[data-pdf="spec"]').click(); await f.getByText('The PDF could not be created.', { exact: false }).waitFor();
    assert.equal(await count(f), 0);
    await failure.unroute(/jspdf.*\.js/);
    const done = f.waitForEvent('download'); await f.locator('[data-pdf="spec"]').click(); await (await done).delete();
    await f.waitForFunction(() => window.__events.some(e => e.name === 'pdf_export'));
    assert.equal(await count(f), 1); await failure.close(); pass('Failed PDF import emits nothing; successful same-page retry emits once');

    const { c: cancel, p: a } = await page(); await ready(a);
    const paused = gate(), handled = gate();
    await cancel.route(/\/pdf-spec[^/]*\.js$/, async r => { paused.reached(); await paused.gate; await r.continue(); handled.reached(); });
    let downloads = 0; a.on('download', () => downloads++);
    await a.locator('[data-pdf="spec"]').click(); await paused.seen; await nav(a, 'results'); paused.release(); await handled.seen;
    await a.waitForTimeout(800); assert.equal(await count(a), 0); assert.equal(downloads, 0);
    await cancel.close(); pass('Exit while spec import pending cancels download and event');

    const { c: clear, p: r } = await page();
    const attempt = { id: '00000000000000000000000000000036', startedAt: '2026-10-28T01:00:00.000Z',
      finishedAt: '2026-10-28T01:00:20.000Z', durationSec: 20, score: 8, total: 8, passed: true,
      answers: questions.map(q => ({ qId: q.id, given: q.answer, correct: true })) };
    await clear.addInitScript(attempt => localStorage.setItem('apar3d:attempts', JSON.stringify({ schemaVersion: 1, attempts: [attempt] })), attempt);
    await ready(r, 'results'); const hold = gate(), continued = gate();
    await clear.route(/\/pdf-report[^/]*\.js$/, async route => { hold.reached(); await hold.gate; await route.continue(); continued.reached(); });
    let reportDownloads = 0; r.on('download', () => reportDownloads++);
    await r.locator('[data-pdf="report"]').click(); await hold.seen;
    await r.locator('[data-results="clear"]').click(); await r.locator('[data-results="confirm"]').click();
    hold.release(); await continued.seen; await r.waitForTimeout(800);
    assert.equal(await count(r), 0); assert.equal(reportDownloads, 0);
    await clear.close(); pass('Clear during pending report cancels download and event');

    const { c: replace, p: s } = await page(); await ready(s);
    await s.evaluate(() => localStorage.setItem('apar3d:configs', JSON.stringify({ schemaVersion: 1, configs:
      Array.from({ length: 10 }, (_, i) => ({ id: String(i), name: 'PRIVATE OLD ' + i,
        createdAt: new Date(Date.UTC(2026, 9, 27, i)).toISOString(), agent: 'powder_abc', capacity: '6kg',
        color: 'red', bracket: false, priceSnapshot: { IDR: 100, USD: 10 } })) })));
    await nav(s, 'results'); await nav(s, 'configure');
    await s.locator('[data-action="save"]').click(); await s.locator('#saved-name').fill('PRIVATE REPLACEMENT');
    assert.match(await s.locator('.saved-dialog button[type="submit"]').innerText(), /Replace/i);
    await s.locator('.saved-dialog button[type="submit"]').click();
    assert.deepEqual(await s.evaluate(() => window.__events.filter(e => e.name === 'config_save')), [
      { name: 'config_save', data: { agent: 'powder_abc', capacity: '6kg', color: 'red' } }]);
    await replace.close(); pass('Confirmed ten-item replacement emits one payload without saved names');

    const { c: mobile, p: m } = await page({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await ready(m); await m.locator('[data-color="silver"]').tap(); await m.locator('[data-lang="id"]').tap();
    await m.locator('.topbar__about').tap();
    for (const lang of ['id', 'en']) {
      if (lang === 'en') { await m.locator('#about .modal__close').tap(); await m.locator('[data-lang="en"]').tap(); await m.locator('.topbar__about').tap(); }
      const text = m.locator('[data-i18n="about.analytics"]'); await text.scrollIntoViewIfNeeded();
      assert.match(await text.innerText(), /trainer\.barkahmauludi\.com/);
      assert.equal(await m.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await m.screenshot({ path: path.join(__dirname, `t3.6-about-${lang}-mobile.png`) });
    }
    await m.locator('#about .modal__close').tap(); await m.locator('.tab[href="#train"]').tap();
    await m.locator('[data-training="start"]').tap();
    for (let i = 0; i < 4; i++) { await m.locator('[data-training="skip"]').tap(); await m.locator('[data-training="next"]').tap(); }
    assert.equal((await m.evaluate(() => window.__events.filter(e => e.name === 'training_finish'))).length, 1);
    await mobile.close(); pass('Mobile native touch, bilingual About copy, no horizontal overflow, PASS events');

    const real = await browser.newContext({ locale: 'en-US', reducedMotion: 'reduce' });
    const payloads = [];
    await real.route(/umami/, async route => {
      if (new URL(route.request().url()).pathname.endsWith('/script.js')) return route.continue();
      if (route.request().postData()) payloads.push(JSON.parse(route.request().postData()));
      await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ cache: 'qa' }) });
    });
    const realPage = await real.newPage(); await ready(realPage);
    await realPage.locator('[data-agent="co2"]').click();
    await realPage.waitForTimeout(1000);
    assert.ok(payloads.some(x => x.payload?.name === 'variant_change' && x.payload.data.option === 'agent' && x.payload.data.value === 'co2'));
    assert.ok(!JSON.stringify(payloads).includes('PRIVATE')); assert.deepEqual(await real.cookies(), []);
    report.realPayloads = payloads;
    await real.close(); pass('Original cloud tracker sends expected custom payload; collector intercepted; zero cookies');
    assert.deepEqual(report.errors, []);
  } catch(e) { report.failure = String(e.stack); throw e; }
  finally { await browser.close(); fs.writeFileSync(path.join(__dirname, 't3.6-edge-qa.json'), JSON.stringify(report, null, 2)); }
})().catch(e => { console.error(e); process.exitCode = 1; });
