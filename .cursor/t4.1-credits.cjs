const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const report = { browser: browser.version(), checks: [] };
  try {
    for (const mobile of [false, true]) for (const lang of ['en', 'id']) {
      const page = await browser.newPage({ viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 },
        isMobile: mobile, hasTouch: mobile, reducedMotion: 'reduce' });
      await page.goto('http://127.0.0.1:4191/#configure');
      await page.waitForFunction(() => performance.getEntriesByName('apar:visible').length > 0);
      await page.locator(`[data-lang="${lang}"]`).click();
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
      await page.locator('.topbar__about').click();
      const credit = page.locator('[data-i18n="about.roomEnvironment"]');
      await credit.focus(); await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
      assert.equal(await credit.evaluate(el => el === document.activeElement && el.matches(':focus-visible')), true);
      await credit.evaluate(el => el.scrollIntoView({ block: 'center' }));
      assert.equal(await credit.evaluate(el => {
        const rect = el.getClientRects()[0];
        const x = rect.x + rect.width / 2, y = rect.y + rect.height / 2;
        return el.contains(document.elementFromPoint(x, y));
      }), true);
      const url = await credit.getAttribute('href');
      await page.context().route(url, route => route.fulfill({ body: 'QA intercepted external credit URL', contentType: 'text/plain' }));
      const popup = page.waitForEvent('popup'); await credit.press('Enter');
      const destination = await popup; await destination.waitForLoadState('domcontentloaded');
      assert.equal(destination.url(), url); await destination.close();
      await page.screenshot({ path: path.join(__dirname, `t4.1-credits-${mobile ? 'mobile' : 'desktop'}-${lang}-200.png`) });
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#about').evaluate(el => el.open), false);
      assert.equal(await page.locator('.topbar__about').evaluate(el => el === document.activeElement), true);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      report.checks.push({ mobile, lang, textPercent: 200, keyboardFocus: true, hitTest: true, newTabUrl: url,
        externalNavigationIntercepted: true, escapeFocusRestored: true });
      await page.close();
    }
    fs.writeFileSync(path.join(__dirname, 't4.1-credits-qa.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
