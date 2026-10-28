const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const report = { checks: [], errors: [] };
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'id-ID' });
    const p = await context.newPage();
    p.on('pageerror', e => report.errors.push(String(e)));
    await p.goto('http://localhost:4183/?debug#train');
    await p.waitForFunction(() => window.__aparDebug && document.querySelector('#splash').inert);
    const action = name => p.locator(`[data-training="${name}"]`);
    await action('start').tap();
    for (let n = 0; n < 2; n++) { await action('interact').tap(); await action('next').tap(); }
    await p.waitForTimeout(800);
    const client = await context.newCDPSession(p);
    await action('interact').scrollIntoViewIfNeeded();
    const r = await action('interact').boundingBox();
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: r.x + r.width / 2, y: r.y + r.height / 2 }] });
    await p.waitForTimeout(150);
    assert(await p.evaluate(() => window.__aparDebug.scene.getObjectByName('training-spray').visible));
    await p.emulateMedia({ reducedMotion: 'reduce' });
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    assert.equal(await action('next').isEnabled(), false);
    await p.waitForTimeout(150);
    const frameCount = await p.evaluate(async () => {
      const renderer = window.__aparDebug.renderer;
      const original = renderer.render;
      let count = 0;
      renderer.render = function(...args) { count++; return original.apply(this, args); };
      await new Promise(resolve => setTimeout(resolve, 300)); renderer.render = original;
      return count;
    });
    assert.equal(frameCount, 0, 'live reduced fire/highlight should be static after hold release');
    await p.emulateMedia({ reducedMotion: 'no-preference' });
    const fire = await p.evaluate(async () => {
      const positions = window.__aparDebug.scene.getObjectByName('training-fire').geometry.attributes.position.array;
      const before = Array.from(positions); await new Promise(resolve => setTimeout(resolve, 180));
      return { before, after: Array.from(positions) };
    });
    assert.notDeepEqual(fire.before, fire.after, 'effects resume when preference is lifted');
    await p.emulateMedia({ reducedMotion: 'reduce' });
    await action('interact').scrollIntoViewIfNeeded();
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: r.x + r.width / 2, y: r.y + r.height / 2 }] });
    await p.waitForTimeout(1100);
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    assert.equal(await action('next').isEnabled(), true);
    await action('next').tap();
    const slider = p.locator('#training-sweep'); await slider.focus();
    for (let n = 0; n < 3; n++) { await p.keyboard.press('End'); await p.keyboard.press('Home'); }
    await action('next').tap(); await action('quiz').tap();
    await p.locator('[data-choice="a"]').tap(); await p.locator('[data-quiz="next"]').tap();
    await p.locator('.quiz__choices [data-choice="pin"]').tap();
    assert.equal(await p.locator('.quiz__feedback').getAttribute('data-correct'), 'true');
    await p.screenshot({ path: '.cursor/t3.2-touch-quiz.png' });
    report.checks.push({ name: 'Panel Pull/Aim/touch partial/full Squeeze, neutral quiz panel tap; live reduced motion during spray stops loops and resumes effects', frameCount });
    assert.deepEqual(report.errors, []);
    console.log('PASS motion and native touch');
  } finally { fs.writeFileSync('.cursor/t3.2-motion-touch-qa.json', JSON.stringify(report, null, 2)); await browser.close(); }
})().catch(e => { report.failure = String(e.stack); fs.writeFileSync('.cursor/t3.2-motion-touch-qa.json', JSON.stringify(report, null, 2)); console.error(e); process.exitCode = 1; });
