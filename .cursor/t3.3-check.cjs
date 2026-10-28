const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const capture = process.argv.includes('--capture');
const origin = process.argv[2] || 'http://localhost:4184';
const root = path.resolve(__dirname, '..');
const en = require('../src/i18n/en.json');
const id = require('../src/i18n/id.json');
const report = { date: '2026-10-28', origin, checks: [], pageErrors: [], consoleErrors: [], failedRequests: [] };
const pass = (name, details) => { report.checks.push({ name, details }); console.log('PASS', name); };
const save = () => fs.writeFileSync(path.join(__dirname, capture ? 't3.3-capture-qa.json' : 't3.3-production-qa.json'), JSON.stringify(report, null, 2));
async function ready(page) {
  await page.goto(origin + '/#configure');
  await page.waitForFunction(() => document.querySelector('#splash').inert);
  await page.locator('[data-agent="powder_abc"]:enabled').waitFor();
}
async function click(page, selector) {
  await page.locator(selector).click();
}
async function pdf(page, type, suffix) {
  const event = page.waitForEvent('download');
  await click(page, `[data-pdf="${type}"]`);
  const download = await event;
  const output = path.join(__dirname, `t3.3-${suffix}-${type}.pdf`);
  await download.saveAs(output);
  assert.equal(fs.readFileSync(output).subarray(0, 5).toString(), '%PDF-');
}
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    if (capture) {
      const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, locale: 'en-US' });
      page.on('pageerror', error => report.pageErrors.push(String(error)));
      await ready(page);
      await click(page, '#rotation-toggle');
      assert.equal(await page.locator('#rotation-toggle').getAttribute('aria-pressed'), 'true');
      for (const selector of ['[data-agent="powder_abc"]', '[data-capacity="6kg"]', '[data-color="red"]']) {
        assert.equal(await page.locator(selector).getAttribute('aria-pressed'), 'true');
      }
      assert.equal(await page.locator('.config-bracket input').isChecked(), false);
      assert.equal(await page.locator('[data-action="load"]').count(), 0);
      await page.waitForFunction(() => getComputedStyle(document.querySelector('#splash')).opacity === '0');
      await page.mouse.move(600, 315);
      await page.mouse.wheel(0, -700);
      await page.waitForTimeout(700);
      await page.screenshot({ path: path.join(root, 'public/og-image.jpg'), type: 'jpeg', quality: 85 });
      pass('OG capture: actual Configure EN, red Powder ABC 6 kg, no bracket, paused rotation, clean context, 1200x630 DPR1 JPEG q85', { bytes: fs.statSync(path.join(root, 'public/og-image.jpg')).size });
      assert.deepEqual(report.pageErrors, []);
      return;
    }
    const raw = await browser.newPage({ javaScriptEnabled: false });
    const response = await raw.goto(origin + '/');
    assert.equal(response.status(), 200);
    assert.equal(await raw.title(), en['app.title']);
    assert.equal(await raw.locator('meta[property="og:title"]').getAttribute('content'), en['app.title']);
    const schema = JSON.parse(await raw.locator('script[type="application/ld+json"]').textContent());
    assert.equal(schema['@type'], 'SoftwareApplication');
    assert.equal(await raw.locator('link[rel="canonical"]').getAttribute('href'), 'https://trainer.barkahmauludi.com/');
    pass('Built HTML exposes EN title, metadata, canonical and parseable JSON-LD with JavaScript disabled');
    for (const [file, type] of [['robots.txt', 'text/plain'], ['sitemap.xml', 'xml'], ['og-image.jpg', 'image/jpeg']]) {
      const asset = await raw.request.get(origin + '/' + file);
      assert.equal(asset.status(), 200);
      assert.ok(asset.headers()['content-type'].includes(type));
      const bytes = await asset.body();
      assert.deepEqual(bytes, fs.readFileSync(path.join(root, 'public', file)));
      pass('Public asset HTTP 200, MIME and exact bytes: ' + file, { bytes: bytes.length });
    }
    const xml = await raw.request.get(origin + '/sitemap.xml');
    const locations = await raw.evaluate(xml => {
      const parsed = new DOMParser().parseFromString(xml, 'application/xml');
      return { errors: parsed.querySelectorAll('parsererror').length, urls: [...parsed.querySelectorAll('loc')].map(el => el.textContent) };
    }, await xml.text());
    assert.deepEqual(locations, { errors: 0, urls: ['https://trainer.barkahmauludi.com/'] });
    await raw.goto(origin + '/og-image.jpg');
    assert.deepEqual(await raw.locator('img').evaluate(img => [img.naturalWidth, img.naturalHeight]), [1200, 630]);
    pass('Sitemap parsed as XML with one root URL; browser decoded JPEG at 1200x630');
    await raw.close();
    for (const mobile of [false, true]) {
      const name = mobile ? 'mobile' : 'desktop';
      const page = await browser.newPage({ viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 }, isMobile: mobile, hasTouch: mobile, locale: 'en-US', reducedMotion: 'reduce', acceptDownloads: true });
      const requests = [];
      page.on('pageerror', error => report.pageErrors.push(name + ': ' + error));
      page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push(name + ': ' + message.text()); });
      page.on('requestfailed', request => report.failedRequests.push({ viewport: name, url: request.url(), error: request.failure() }));
      page.on('request', request => requests.push(request.url()));
      await ready(page);
      if (mobile) await click(page, '.panel__handle');
      await click(page, '[data-color="yellow"]');
      assert.equal(await page.locator('[data-color="yellow"]').getAttribute('aria-pressed'), 'true');
      await click(page, '.config-bracket input');
      assert.equal(await page.locator('.config-bracket input').isChecked(), true);
      await click(page, '[data-lang="id"]');
      assert.equal(await page.title(), id['app.title']);
      assert.equal(await page.locator('html').getAttribute('lang'), 'id');
      assert.equal(await page.locator('meta[property="og:title"]').getAttribute('content'), en['app.title']);
      await click(page, '.topbar__about');
      await page.locator('#about[open]').waitFor();
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => document.activeElement === document.querySelector('.topbar__about'));
      await click(page, '[data-lang="en"]');
      assert.equal(await page.title(), en['app.title']);
      await pdf(page, 'spec', name);
      pass(name + ': Configure color/bracket, bilingual title/UI, stable EN OG, About/Escape/focus and spec PDF');
      await click(page, '.tab[href="#train"]');
      await click(page, '[data-training="start"]');
      for (let step = 0; step < 2; step++) {
        await click(page, '[data-training="interact"]');
        await click(page, '[data-training="next"]');
      }
      await page.locator('[data-training="interact"]').focus();
      await page.keyboard.down('Space');
      await page.waitForTimeout(1100);
      await page.keyboard.up('Space');
      await click(page, '[data-training="next"]');
      await page.locator('#training-sweep').focus();
      for (let cycle = 0; cycle < 3; cycle++) { await page.keyboard.press('End'); await page.keyboard.press('Home'); }
      await click(page, '[data-training="next"]');
      await click(page, '[data-training="quiz"]');
      for (const question of require('../src/data/quiz.json')) {
        await click(page, `.quiz__choices [data-choice="${question.answer}"]`);
        await click(page, '[data-quiz="next"]');
      }
      assert.match(await page.locator('.quiz__score').innerText(), /8\/8/);
      await click(page, '[data-quiz="results"]');
      await page.locator('#participant-name').fill('T3.3 QA');
      await page.locator('#participant-name').press('Enter');
      await pdf(page, 'report', name);
      await click(page, '[data-results="clear"]');
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => document.activeElement === document.querySelector('[data-results="clear"]'));
      assert.equal(requests.some(url => url.includes('og-image.jpg')), false, 'OG image is not downloaded by app');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: path.join(__dirname, `t3.3-${name}-results.png`) });
      pass(name + ': PASS without Skip, 8/8 quiz, Results name/report, Clear cancel; no OG image request or horizontal overflow');
      await page.close();
    }
    assert.deepEqual(report.pageErrors, []);
    assert.deepEqual(report.failedRequests, []);
    assert.ok(report.consoleErrors.every(error => error.includes('404')), 'no unexpected console error');
    pass('No page errors or failed requests; only existing favicon 404 console error allowed', { consoleErrors: report.consoleErrors });
  } finally { save(); await browser.close(); }
})().catch(error => { report.failure = String(error.stack); save(); console.error(error); process.exitCode = 1; });
