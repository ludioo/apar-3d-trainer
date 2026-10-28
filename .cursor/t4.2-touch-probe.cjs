const fs = require('node:fs');
const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const p = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    await p.goto('http://localhost:4192/#configure');
    await p.waitForFunction(() => getComputedStyle(document.querySelector('#splash')).opacity === '0');
    await p.evaluate(() => {
      window.events = [];
      for (const name of ['touchstart', 'touchend', 'pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'lostpointercapture', 'mousedown', 'mouseup', 'click'])
        document.addEventListener(name, e => events.push({ time: performance.now(), name, detail: e.detail, y: e.clientY,
          primary: e.isPrimary, target: e.target.className, focused: document.hasFocus(), snap: document.querySelector('#panel').dataset.snap }), true);
      for (const name of ['resize', 'scroll']) visualViewport.addEventListener(name, () => events.push({ name, time: performance.now() }));
    });
    const cdp = await p.context().newCDPSession(p);
    await p.bringToFront();
    await p.locator('.panel__handle').tap(); await p.waitForTimeout(400);
    console.log('initial tap', await p.locator('#panel').getAttribute('data-snap'));
    await p.locator('.panel__handle').tap(); await p.waitForTimeout(400);
    await p.locator('.panel__handle').tap(); await p.waitForTimeout(400);
    for (let n = 0; n < 12; n++) {
      const box = await p.locator('.panel__handle').boundingBox();
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: box.y + 22 }] });
      for (let i = 1; i <= 10; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y: box.y + 22 + i * 21 }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await p.waitForTimeout(300);
      await p.waitForTimeout(800);
      await p.locator('.panel__handle').tap(); await p.waitForTimeout(300);
      const snap = await p.locator('#panel').getAttribute('data-snap');
      console.log(n, snap);
      if (snap !== 'half') throw Error(`tap remained ${snap}`);
    }
    fs.writeFileSync('.cursor/t4.2-touch-events.json', JSON.stringify(await p.evaluate(() => events), null, 2));
  } catch (e) { console.error(e); process.exitCode = 1; }
  finally { for (const p of browser.contexts().flatMap(c => c.pages())) fs.writeFileSync('.cursor/t4.2-touch-events.json', JSON.stringify(await p.evaluate(() => window.events), null, 2)); await browser.close(); }
})();
