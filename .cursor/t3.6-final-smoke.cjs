const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const report = { checks: [], errors: [] };
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true,
    args: ['--no-proxy-server', '--host-resolver-rules=MAP trainer.barkahmauludi.com 127.0.0.1'] });
  try {
    for (const origin of ['http://localhost:4186', 'http://trainer.barkahmauludi.com:4196']) {
      const c = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'en-US', reducedMotion: 'reduce' });
      await c.addInitScript(() => { window.__calls = []; window.umami = { track: (...args) => window.__calls.push(args) }; });
      const p = await c.newPage(); const requests = [];
      p.on('pageerror', e => report.errors.push(String(e)));
      p.on('request', r => { if (r.url().includes('umami')) requests.push(r.url()); });
      await p.goto(origin + '/#configure'); await p.waitForFunction(() => performance.getEntriesByName('apar:visible').length);
      await p.locator('[data-agent="co2"]').click(); await p.locator('[data-lang="id"]').click();
      await p.locator('.topbar__about').click();
      assert.match(await p.locator('[data-i18n="about.analytics"]').innerText(), /Nama peserta dan nama konfigurasi tidak dikirim/);
      await p.locator('#about .modal__close').click();
      await p.locator('.tab[href="#train"]').click(); await p.locator('[data-training="start"]').click();
      for (let i = 0; i < 4; i++) { await p.locator('[data-training="skip"]').click(); await p.locator('[data-training="next"]').click(); }
      assert.equal(await p.locator('[data-training="quiz"]').isVisible(), true);
      assert.equal(await p.locator('script[data-website-id]').count(), 0);
      assert.deepEqual(requests, []); assert.deepEqual(await p.evaluate(() => window.__calls), []);
      report.checks.push({ origin, result: 'env-empty build works; zero tracker scripts/requests/calls even with pre-existing window.umami' });
      if (origin.includes('localhost')) await p.screenshot({ path: path.join(__dirname, 't3.6-final-local.png') });
      await c.close();
    }
    const index = fs.readFileSync(path.join(__dirname, '../dist/index.html'), 'utf8');
    const js = index.match(/src="([^"]+\.js)"/)[1];
    assert.ok(!fs.readFileSync(path.join(__dirname, '../dist', js), 'utf8').includes('00000000-0000-4000-8000-000000000036'));
    assert.deepEqual(report.errors, []);
    console.log(JSON.stringify(report));
  } catch(e) { report.failure = String(e.stack); throw e; }
  finally { await browser.close(); fs.writeFileSync(path.join(__dirname, 't3.6-final-smoke.json'), JSON.stringify(report, null, 2)); }
})().catch(e => { console.error(e); process.exitCode = 1; });
