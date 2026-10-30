const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const p = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  try {
    await p.goto('http://localhost:4198/?debug#train');
    await p.waitForFunction(() => getComputedStyle(document.querySelector('#splash')).opacity === '0');
    const action = name => p.locator(`[data-training="${name}"]`);
    await action('start').click();
    for (let i = 0; i < 2; i++) { await action('interact').click(); await action('next').click(); }
    await p.waitForTimeout(800);
    await p.evaluate(() => {
      window.captureEvents = [];
      const el = document.querySelector('[data-training="interact"]');
      for (const type of ['pointerdown', 'gotpointercapture', 'lostpointercapture', 'pointermove', 'pointerup'])
        el.addEventListener(type, e => window.captureEvents.push({ type, pointerId: e.pointerId, capture: el.hasPointerCapture(e.pointerId) }));
    });
    const b = await action('interact').boundingBox();
    await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await p.mouse.down();
    await p.mouse.move(b.x + b.width / 2 + 1, b.y + b.height / 2); await p.waitForTimeout(250);
    console.log('before', await p.evaluate(() => ({ events: captureEvents, capture1: document.querySelector('[data-training="interact"]').hasPointerCapture(1) })));
    console.log('release', await action('interact').evaluate(el => {
      const id = captureEvents.find(e => e.type === 'pointerdown').pointerId;
      el.releasePointerCapture(id); return { id, capture: el.hasPointerCapture(id) };
    }));
    await p.mouse.move(20, 150); await p.waitForTimeout(1100); await p.mouse.up();
    console.log('after', await p.evaluate(() => ({ events: captureEvents,
      nextDisabled: document.querySelector('[data-training="next"]').disabled,
      ring: document.querySelector('.training__hold-ring').style.cssText })));
  } finally { await browser.close(); }
})();
