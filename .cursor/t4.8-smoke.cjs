const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
  const report = { date: '2026-10-30', checks: [], errors: [], warnings: [] };
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    for (const origin of ['http://localhost:5198', 'http://localhost:4198']) {
      for (const mobile of [false, true]) {
        const p = await browser.newPage({ viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 },
          isMobile: mobile, hasTouch: mobile, locale: mobile ? 'id-ID' : 'en-US' });
        p.on('pageerror', e => report.errors.push(String(e)));
        p.on('console', m => {
          if (m.type() === 'error' && !m.text().includes('404')) report.errors.push(m.text());
          if (m.type() === 'warning') report.warnings.push({ origin, message: m.text() });
        });
        p.on('websocket', ws => ws.on('framereceived', frame => {
          if (typeof frame.payload === 'string' && frame.payload.includes('ResizeObserver loop'))
            report.warnings.push({ origin, source: 'vite-overlay', message: frame.payload });
        }));
        await p.goto(`${origin}/#train`);
        await p.waitForFunction(() => getComputedStyle(document.querySelector('#splash')).opacity === '0');
        assert.equal(await p.evaluate(() => !!window.__aparDebug), false);
        const action = name => p.locator(`[data-training="${name}"]`);
        await action('start').click();
        for (let i = 0; i < 2; i++) { await action('interact').click(); await action('next').click(); }
        await p.waitForTimeout(800); await action('interact').scrollIntoViewIfNeeded();
        const label = await action('interact').innerText();
        await action('interact').focus(); await p.keyboard.down('Space');
        await p.waitForTimeout(300);
        const progress = await p.locator('.training__hold-ring').evaluate(el => parseFloat(el.style.getPropertyValue('--hold-progress')));
        assert(progress > 0 && progress < 360);
        await p.waitForFunction(() => !document.querySelector('[data-training="next"]').disabled);
        await p.keyboard.up('Space');
        assert.equal(await p.locator('.training__hold-ring').evaluate(el => el.style.getPropertyValue('--hold-progress')), '360deg');
        assert.match(await p.locator('.training h3').innerText(), /3\/4/);
        await p.screenshot({ path: path.join(__dirname, `t4.8-${origin.includes('5198') ? 'dev' : 'production'}-normal-${mobile ? 'mobile' : 'desktop'}.png`) });
        report.checks.push({ origin, mobile, label, progress, nextEnabled: true });
        await p.close();
      }
    }
    assert.deepEqual(report.errors, []); console.log('PASS', report.checks);
  } catch (error) { report.failure = String(error.stack); throw error; }
  finally { fs.writeFileSync(path.join(__dirname, 't4.8-smoke-qa.json'), JSON.stringify(report, null, 2)); await browser.close(); }
})();
