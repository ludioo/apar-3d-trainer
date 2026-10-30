const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const folder = path.join(__dirname, 't4.19');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const results = [];
  try {
    for (const [device, viewport] of [['desktop', { width: 1280, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
      const p = await browser.newPage({ viewport, hasTouch: device === 'mobile', isMobile: device === 'mobile' });
      await p.goto('http://localhost:4269/#configure');
      await p.waitForFunction(() => getComputedStyle(document.querySelector('#splash')).opacity === '0');
      await p.locator('[data-lang="id"]').click();
      await p.locator('.topbar__about').click();
      const body = p.locator('#about > .modal__body'), close = p.locator('#about .modal__close');
      const before = await close.boundingBox();
      await p.screenshot({ path: path.join(folder, `${device}-id-top.png`) });
      const box = await body.boundingBox(), x = box.x + box.width / 2, y = box.y + box.height * 0.7;
      if (device === 'mobile') {
        const cdp = await p.context().newCDPSession(p);
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
        for (let step = 1; step <= 12; step++) {
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - step * 18 }] });
          await new Promise(resolve => setTimeout(resolve, 16));
        }
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await cdp.detach();
      } else {
        await p.mouse.move(x, y);
        await p.mouse.wheel(0, 220);
      }
      await p.waitForFunction(() => document.querySelector('#about > .modal__body').scrollTop > 100);
      await p.waitForFunction(() => {
        const value = document.querySelector('#about > .modal__body').scrollTop;
        if (window.lastScrollValue !== value) {
          window.lastScrollValue = value;
          window.lastScrollChange = performance.now();
        }
        return performance.now() - window.lastScrollChange > 200;
      });
      assert.deepEqual(await close.boundingBox(), before, 'Close must remain fixed during native scroll input');
      const scroll = await body.evaluate(el => el.scrollTop);
      await p.screenshot({ path: path.join(folder, `${device}-id-scrolled.png`) });
      if (device === 'mobile') await close.tap(); else await close.click();
      await p.waitForFunction(() => !document.querySelector('#about').open && document.activeElement.matches('.topbar__about'));
      results.push({ device, reducedMotion: false, input: device === 'mobile' ? 'CDP touchStart/Move/End swipe' : 'mouse wheel', scroll, closeStable: true });
      console.log('PASS', device, scroll);
      await p.context().close();
    }
    fs.writeFileSync(path.join(folder, 'input-qa.json'), JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results, null, 2));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
