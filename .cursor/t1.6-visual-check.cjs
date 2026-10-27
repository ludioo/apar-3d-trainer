const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1365, height: 900 }, locale: 'id-ID' });
    await page.goto('http://localhost:5173/?debug#configure');
    await page.waitForFunction(() => window.__aparDebug && getComputedStyle(document.querySelector('#splash')).opacity === '0');
    await page.evaluate(() => {
      const d = window.__aparDebug;
      d.controls.pauseAutoRotate();
      d.camera.position.set(0.9, 1, 1.8);
      d.controls.target.set(0, 0.65, 0);
      d.controls.update();
      d.requestRender();
    });
    await page.waitForTimeout(100);
    await page.screenshot({ path: __dirname + '/t1.6-band-calibration.png' });
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
