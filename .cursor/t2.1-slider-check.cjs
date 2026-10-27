const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const origin = process.argv[2] || 'http://localhost:4181';
const report = { date: '2026-10-28', origin, checks: [], errors: [] };
const save = () => fs.writeFileSync(path.join(__dirname, 't2.1-slider-qa.json'), JSON.stringify(report, null, 2));
function pass(name, detail) { report.checks.push({ name, status: 'PASS', detail }); save(); console.log('PASS', name); }
const action = (p, name) => p.locator(`[data-training="${name}"]`);
const slider = p => p.locator('#training-sweep');
async function ready(p) {
  await p.goto(`${origin}/?debug#train`);
  await p.waitForFunction(() => window.__aparDebug && getComputedStyle(document.querySelector('#splash')).opacity === '0');
}
async function toSweep(p) {
  for (let i = 0; i < 3; i++) { await action(p, 'skip').click(); await action(p, 'next').click(); }
  await p.waitForTimeout(760);
  await slider(p).scrollIntoViewIfNeeded();
}
async function position(p, ratio) {
  await slider(p).scrollIntoViewIfNeeded();
  const b = await slider(p).boundingBox();
  return { x: b.x + 22 + (b.width - 44) * ratio, y: b.y + b.height / 2 };
}
async function clickAt(p, ratio) { const pt = await position(p, ratio); await p.mouse.click(pt.x, pt.y); }
async function status(p) {
  return { value: Number(await slider(p).inputValue()), cycles: await p.locator('#training-sweep-count').innerText(),
    goal: await p.locator('#training-sweep-goal').innerText() };
}
async function visibleHit(p) {
  await slider(p).scrollIntoViewIfNeeded();
  assert.equal(await slider(p).evaluate(el => {
    const b = el.getBoundingClientRect();
    return document.elementFromPoint(b.x + b.width / 2, b.y + 22) === el;
  }), true, 'native input center is above footer');
  assert.equal(await action(p, 'next').evaluate(el => {
    const b = el.getBoundingClientRect();
    return document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2) === el;
  }), true, 'footer stays above range/zone layers');
}

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1365, height: 900 }, locale: 'id-ID' });
    const p = await context.newPage();
    p.on('pageerror', e => report.errors.push(String(e)));
    p.on('console', m => { if (m.type() === 'error' && !m.text().includes('404')) report.errors.push(m.text()); });
    await ready(p); await action(p, 'start').click(); await toSweep(p);
    assert.deepEqual(await status(p), { value: 0, cycles: 'Siklus: 0/3', goal: 'Tujuan: Kanan' });
    assert.equal(await slider(p).getAttribute('min'), '0');
    assert.equal(await slider(p).getAttribute('max'), '100');
    assert.equal(await slider(p).getAttribute('step'), '1');
    await slider(p).evaluate(el => { window.originalSlider = el; });
    let camera = await p.evaluate(() => window.__aparDebug.camera.position.toArray());
    await clickAt(p, 0.5);
    assert.ok(Math.abs((await status(p)).value - 50) <= 1);
    assert.match((await status(p)).cycles, /0\/3/);
    await clickAt(p, 1);
    assert.equal((await status(p)).goal, 'Tujuan: Kiri');
    assert.match((await status(p)).cycles, /0\/3/);
    await clickAt(p, 1);
    assert.equal((await status(p)).goal, 'Tujuan: Kiri');
    await clickAt(p, 0.5);
    const partial = await status(p);
    await p.locator('[data-lang="en"]').click();
    assert.equal(await slider(p).inputValue(), String(partial.value));
    assert.equal((await status(p)).goal, 'Target: Left');
    assert.equal(await slider(p).evaluate(el => el === window.originalSlider), true);
    await p.locator('[data-lang="id"]').click();
    await action(p, 'back').click(); await action(p, 'next').click();
    assert.deepEqual(await status(p), partial);
    await p.locator('.tab[href="#results"]').click(); await p.locator('.tab[href="#train"]').click();
    assert.deepEqual(await status(p), partial);
    await p.waitForTimeout(760);
    camera = await p.evaluate(() => window.__aparDebug.camera.position.toArray());
    pass('Native range, initial target, rail clicks, middle ignored, repeated end ignored, position and element retained across language/Back/modes');

    await slider(p).focus();
    await p.locator('.topbar__about').click();
    await p.locator('#about[open]').waitFor();
    await slider(p).evaluate(el => { el.value = '0'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    assert.equal(await slider(p).inputValue(), String(partial.value));
    await p.keyboard.press('Escape');
    assert.deepEqual(await status(p), partial);
    await slider(p).focus();
    await p.evaluate(() => window.dispatchEvent(new Event('blur')));
    await slider(p).evaluate(el => { el.value = '0'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    assert.deepEqual(await status(p), partial);
    await slider(p).focus();
    await p.evaluate(() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
    await slider(p).evaluate(el => { el.value = '0'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    assert.deepEqual(await status(p), partial);
    await p.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
    await slider(p).focus(); await p.keyboard.press('ArrowRight');
    assert.equal(Number(await slider(p).inputValue()), partial.value + 1);
    await p.keyboard.press('Home');
    assert.match((await status(p)).cycles, /1\/3/);
    await p.keyboard.press('Home');
    assert.match((await status(p)).cycles, /1\/3/);
    await p.keyboard.press('End'); await p.keyboard.press('Home');
    assert.match((await status(p)).cycles, /2\/3/);
    await p.keyboard.press('End'); await p.keyboard.press('Home');
    assert.match((await status(p)).cycles, /3\/3/);
    assert.equal(await slider(p).isDisabled(), true);
    assert.equal(await action(p, 'next').isEnabled(), true);
    assert.equal(await p.locator('.training').getAttribute('data-phase'), 'steps');
    assert.deepEqual(await p.evaluate(() => window.__aparDebug.camera.position.toArray()), camera);
    await action(p, 'next').click();
    assert.equal(await p.evaluate(() => localStorage.getItem('apar3d:trainingDone')), 'true');
    pass('About/blur/visibility block late input, partial position survives, native arrows/Home/End finish three cycles without orbit or auto-advance');

    await action(p, 'restart').click(); await toSweep(p);
    assert.equal(await slider(p).inputValue(), '0');
    assert.match((await status(p)).cycles, /0\/3/);
    await action(p, 'skip').click();
    assert.equal(await slider(p).isDisabled(), true);
    assert.match((await status(p)).cycles, /0\/3/);
    assert.match(await p.locator('.training__status').innerText(), /dilewati/);
    await action(p, 'next').click(); await p.reload();
    await p.waitForFunction(() => getComputedStyle(document.querySelector('#splash')).opacity === '0');
    assert.equal(await action(p, 'start').isVisible(), true);
    assert.equal(await p.evaluate(() => localStorage.getItem('apar3d:trainingDone')), 'true');
    pass('Repeat resets, Skip keeps honest cycle count, refresh returns to intro and retains completed flag');

    const mc = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'id-ID', isMobile: true, hasTouch: true });
    const m = await mc.newPage();
    m.on('pageerror', e => report.errors.push(String(e)));
    m.on('console', msg => { if (msg.type() === 'error' && !msg.text().includes('404')) report.errors.push(msg.text()); });
    await ready(m); await action(m, 'start').tap(); await toSweep(m);
    const end = await position(m, 1); await m.touchscreen.tap(end.x, end.y);
    assert.equal((await status(m)).goal, 'Tujuan: Kiri');
    const cdp = await mc.newCDPSession(m);
    const start = await position(m, 1); const middle = await position(m, 0.5);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [middle] });
    await m.waitForTimeout(100);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    assert.ok(Math.abs((await status(m)).value - 50) <= 1);
    assert.match((await status(m)).cycles, /0\/3/);
    pass('Mobile track tap and partial thumb drag/release preserve value without counting an unfinished pass');

    const matrix = [];
    for (const [width, height] of [[360,800],[390,844],[768,1024],[844,390],[390,420]]) {
      await m.setViewportSize({ width, height });
      for (const lang of ['en', 'id']) {
        await m.locator(`[data-lang="${lang}"]`).tap();
        for (const zoom of [1, 2]) {
          await m.locator('.training').evaluate((el, z) => { for (const n of [12,14,16,20,28,40]) el.style.setProperty(`--fs-${n}`, `${n*z}px`); }, zoom);
          for (const expanded of [false, true]) {
            report.scenario = { width, height, lang, zoom, expanded };
            const handle = m.locator('.panel__handle');
            if ((await handle.getAttribute('aria-expanded') === 'true') !== expanded) await handle.tap();
            await m.waitForTimeout(280);
            await visibleHit(m);
            assert.equal(await m.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
            assert.equal(await slider(m).isEnabled(), true);
            assert.ok(Math.abs(Number(await slider(m).inputValue()) - 50) <= 1);
            assert.match(await slider(m).getAttribute('aria-valuetext'), lang === 'id' ? /Tujuan: Kiri/ : /Target: Left/);
            matrix.push({ width, height, lang, zoom, expanded });
          }
        }
      }
    }
    pass('Slider hit-tested above footer across 40 viewport/language/text/sheet combinations; partial state retained and accessible goal translated', matrix);
    await m.setViewportSize({ width: 390, height: 844 });
    await m.locator('.training').evaluate(el => { for (const n of [12,14,16,20,28,40]) el.style.removeProperty(`--fs-${n}`); });
    if (await m.locator('.panel__handle').getAttribute('aria-expanded') === 'true') await m.locator('.panel__handle').tap();
    await m.waitForTimeout(280); await slider(m).scrollIntoViewIfNeeded();
    await m.screenshot({ path: path.join(__dirname, 't2.1-slider-mobile.png') });
    const leftPoint = await position(m, 0); await m.touchscreen.tap(leftPoint.x, leftPoint.y);
    assert.match((await status(m)).cycles, /1\/3/);
    await slider(m).focus();
    for (let i = 0; i < 2; i++) { await m.keyboard.press('End'); await m.keyboard.press('Home'); }
    assert.equal(await slider(m).isDisabled(), true);
    assert.match((await status(m)).cycles, /3\/3/);
    pass('Mobile finishes remaining cycles after release, reflow and input changes');
    assert.deepEqual(report.errors, []);
    pass('No unexpected browser/console errors');
  } catch (error) { report.failure = error.stack; save(); throw error; }
  finally { await browser.close(); save(); }
})();
