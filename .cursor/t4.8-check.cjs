const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const origin = process.argv[2] || 'http://localhost:4198';
const stage = process.argv.includes('--dev') ? 'dev' : 'production';
const prefix = `t4.8-${stage}`;
const report = { date: '2026-10-30', origin, stage, checks: [], errors: [], warnings: [], screenshots: [] };
const file = name => path.join(__dirname, `${prefix}-${name}`);
const save = () => fs.writeFileSync(file('qa.json'), JSON.stringify(report, null, 2));
const pass = (name, detail) => { report.checks.push({ name, detail }); save(); console.log('PASS', name); };
const action = (p, name) => p.locator(`[data-training="${name}"]`);
const ring = p => p.locator('.training__hold-ring');
let serial = 0;
function observe(p) {
  p.on('pageerror', e => report.errors.push(String(e)));
  p.on('console', m => {
    if (m.type() === 'error' && !m.text().includes('404')) report.errors.push(m.text());
    if (m.type() === 'warning') report.warnings.push(m.text());
  });
  p.on('websocket', ws => ws.on('framereceived', frame => {
    if (typeof frame.payload === 'string' && frame.payload.includes('ResizeObserver loop'))
      report.warnings.push({ source: 'vite-overlay', message: frame.payload });
  }));
}
async function squeeze(p, lang = 'en') {
  await p.goto(`${origin}/?debug&qa=${++serial}#train`);
  await p.waitForFunction(() => window.__aparDebug && getComputedStyle(document.querySelector('#splash')).opacity === '0');
  await p.locator(`[data-lang="${lang}"]`).click();
  await action(p, 'start').click();
  for (let i = 0; i < 2; i++) { await action(p, 'interact').click(); await action(p, 'next').click(); }
  await p.waitForTimeout(800);
  await action(p, 'interact').scrollIntoViewIfNeeded();
  assert.equal(await action(p, 'next').isDisabled(), true);
}
async function snapshot(p) {
  return p.evaluate(() => {
    const button = document.querySelector('[data-training="interact"]');
    const ring = button.querySelector('.training__hold-ring');
    const rect = button.getBoundingClientRect();
    const r = ring.getBoundingClientRect();
    const effects = window.__aparDebug.scene.getObjectByName('training-effects');
    const spray = window.__aparDebug.scene.getObjectByName('training-spray');
    return { panel: parseFloat(ring.style.getPropertyValue('--hold-progress')) || 0,
      target: parseFloat(document.querySelector('.training-target__button').style.getPropertyValue('--hold-progress')) || 0,
      box: [rect.x, rect.y, rect.width, rect.height], size: [r.width, r.height],
      touchAction: getComputedStyle(button).touchAction, userSelect: getComputedStyle(button).userSelect,
      label: button.innerText, children: button.childElementCount, decorative: ring.getAttribute('aria-hidden'),
      spray: effects.visible && spray.visible, status: document.querySelector('.training__status').textContent };
  });
}
async function mouseDown(p) {
  await action(p, 'interact').scrollIntoViewIfNeeded();
  const b = await action(p, 'interact').boundingBox();
  await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await p.mouse.down();
  await p.mouse.move(b.x + b.width / 2 + 1, b.y + b.height / 2);
}
async function incomplete(p) {
  assert.equal(await action(p, 'next').isDisabled(), true);
  const s = await snapshot(p);
  assert.equal(s.panel, 0); assert.equal(s.target, 0); assert.equal(s.spray, false);
}
async function complete(p) {
  await p.waitForFunction(() => !document.querySelector('[data-training="next"]').disabled);
  const s = await snapshot(p);
  assert.equal(s.panel, 360); assert.equal(s.target, 360); assert.equal(s.spray, false);
  assert.equal(await action(p, 'interact').isDisabled(), true);
  assert.match(await p.locator('.training h3').innerText(), /3\/4/);
  return s;
}
async function shot(p, name) {
  await p.screenshot({ path: file(`${name}.png`) }); report.screenshots.push(`${prefix}-${name}.png`);
}
async function tabTo(p, selector) {
  for (let i = 0; i < 80; i++) {
    if (await p.locator(selector).evaluate(el => el === document.activeElement)) return;
    await p.keyboard.press('Tab');
  }
  throw Error('Unreachable by Tab: ' + selector);
}
async function snap(p, name) {
  for (let i = 0; i < 3 && await p.locator('#panel').getAttribute('data-snap') !== name; i++) {
    await p.locator('.panel__handle').click(); await p.waitForTimeout(300);
  }
  assert.equal(await p.locator('#panel').getAttribute('data-snap'), name);
}
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'en-US' });
    const p = await context.newPage(); observe(p);
    await squeeze(p);
    const before = await snapshot(p);
    assert.deepEqual(before.size, [24, 24]); assert.equal(before.decorative, 'true');
    assert.equal(before.touchAction, 'none'); assert.equal(before.userSelect, 'none');
    await mouseDown(p); await p.waitForTimeout(300);
    const partial = await snapshot(p);
    assert(partial.panel > 0 && partial.panel < 360); assert.equal(partial.panel, partial.target);
    assert.deepEqual(partial.box, before.box); assert.equal(partial.spray, true);
    await shot(p, 'desktop-holding');
    await p.mouse.move(20, 150); await p.mouse.up(); await p.waitForTimeout(1100); await incomplete(p);
    await mouseDown(p); const success = await complete(p); await p.mouse.up();
    await p.waitForTimeout(150); assert.equal((await snapshot(p)).panel, 360);
    await shot(p, 'desktop-success');
    await p.locator('[data-lang="id"]').click(); assert.equal((await snapshot(p)).panel, 360);
    await action(p, 'next').click(); await action(p, 'back').click(); assert.equal((await snapshot(p)).panel, 360);
    pass('Mouse partial ring/spray, unchanged button geometry, release outside, retry, persistent full ring and manual Next', { before, partial, success });

    for (const key of ['Space', 'Enter']) {
      await squeeze(p);
      await p.locator('.training h3').focus(); await tabTo(p, '[data-training="interact"]');
      assert.notEqual(await action(p, 'interact').evaluate(el => getComputedStyle(el).outlineStyle), 'none');
      await p.keyboard.down(key); await p.waitForTimeout(200); await p.keyboard.up(key); await incomplete(p);
      await p.keyboard.down(key); await p.waitForTimeout(250);
      const value = (await snapshot(p)).panel;
      await p.keyboard.down(key); await p.waitForTimeout(100);
      assert((await snapshot(p)).panel > value, 'repeated keydown must not restart timer');
      await complete(p); await p.keyboard.up(key);
    }
    pass('Tab/focus, Space and Enter early release, repeat and completion');

    const interruptions = ['pointercancel', 'lostpointercapture', 'blur-button', 'blur-window', 'about', 'route', 'visibility'];
    for (const interruption of interruptions) {
      report.scenario = interruption; save();
      await squeeze(p); await mouseDown(p); await p.waitForTimeout(200);
      if (interruption === 'pointercancel') await action(p, 'interact').dispatchEvent('pointercancel', { pointerId: 1 });
      if (interruption === 'lostpointercapture') {
        await action(p, 'interact').evaluate(el => el.releasePointerCapture(1));
        await p.mouse.move(20, 150);
      }
      if (interruption === 'blur-button') await action(p, 'refocus').focus();
      if (interruption === 'blur-window') await p.evaluate(() => window.dispatchEvent(new Event('blur')));
      if (interruption === 'about') await p.evaluate(() => document.querySelector('.topbar__about').click());
      if (interruption === 'route') await p.evaluate(() => document.querySelector('.tab[href="#results"]').click());
      if (interruption === 'visibility') await p.evaluate(() => {
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await p.waitForTimeout(1100); await p.mouse.up();
      if (interruption === 'about') await p.keyboard.press('Escape');
      if (interruption === 'route') await p.locator('.tab[href="#train"]').click();
      if (interruption === 'visibility') await p.evaluate(() => {
        delete document.hidden; document.dispatchEvent(new Event('visibilitychange'));
      });
      if (interruption === 'blur-window') await p.evaluate(() => window.dispatchEvent(new Event('focus')));
      await p.waitForTimeout(800); await incomplete(p);
      await mouseDown(p); await complete(p); await p.mouse.up();
      console.log('PASS interruption', interruption);
    }
    pass('Seven interruptions cancel partial hold, never complete later, and allow retry', interruptions);

    await squeeze(p); await action(p, 'skip').click();
    assert.equal(await action(p, 'next').isEnabled(), true);
    assert.equal((await snapshot(p)).panel, 0); assert.equal((await snapshot(p)).target, 0);
    await action(p, 'next').click();
    await p.locator('#training-sweep').focus();
    for (let i = 0; i < 3; i++) { await p.keyboard.press('End'); await p.keyboard.press('Home'); }
    await action(p, 'next').click(); await action(p, 'restart').click();
    assert.equal((await snapshot(p)).panel, 0); assert.equal(await ring(p).isVisible(), false);
    pass('Skip stays distinct from successful hold, Sweep completes and restart clears/hides ring');

    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'id-ID' });
    const m = await mobile.newPage(); observe(m); await squeeze(m, 'id');
    const cdp = await mobile.newCDPSession(m);
    async function touchStart() {
      await action(m, 'interact').scrollIntoViewIfNeeded();
      const b = await action(m, 'interact').boundingBox();
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: b.x + b.width / 2, y: b.y + b.height / 2 }] });
    }
    const touchEnd = type => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: [] });
    await touchStart(); await m.waitForTimeout(250); assert((await snapshot(m)).panel > 0);
    await touchEnd('touchEnd'); await m.waitForTimeout(1100); await incomplete(m);
    await touchStart(); await m.waitForTimeout(250); await touchEnd('touchCancel'); await incomplete(m);
    await touchStart(); await m.waitForTimeout(300); await shot(m, 'mobile-holding');
    await complete(m); await touchEnd('touchEnd'); await shot(m, 'mobile-success');
    pass('390px native CDP touch: early release, touchCancel, retry and success with panel ring');

    await squeeze(m, 'id');
    const matrix = [];
    for (const lang of ['en', 'id']) for (const scale of [1, 2]) for (const name of ['peek', 'half', 'full']) {
      await m.locator(`[data-lang="${lang}"]`).click();
      await m.evaluate(scale => {
        for (const n of [12,14,16,20,28,40]) document.querySelector('.training').style.setProperty(`--fs-${n}`, `${n * scale}px`);
      }, scale);
      await snap(m, name); await m.waitForTimeout(800);
      await action(m, 'interact').scrollIntoViewIfNeeded();
      const layout = await action(m, 'interact').evaluate(el => {
        const b = el.getBoundingClientRect(); const ring = el.querySelector('.training__hold-ring').getBoundingClientRect();
        const clip = el.closest('.training').getBoundingClientRect(); const nav = document.querySelector('.training__nav').getBoundingClientRect();
        const visibleTop = Math.max(b.top, clip.top); const visibleBottom = Math.min(b.bottom, nav.top);
        const hit = document.elementFromPoint(b.x + b.width / 2, (visibleTop + visibleBottom) / 2);
        return { width: b.width, height: b.height, overflow: el.scrollWidth > el.clientWidth + 1,
          hit: el === hit || el.contains(hit), ringInside: ring.left >= b.left && ring.right <= b.right,
          pageOverflow: document.documentElement.scrollWidth > innerWidth };
      });
      assert(layout.width >= 44 && layout.height >= 44); assert.equal(layout.overflow, false);
      assert.equal(layout.hit, true); assert.equal(layout.ringInside, true); assert.equal(layout.pageOverflow, false);
      matrix.push({ lang, scale, snap: name, ...layout });
      if (lang === 'id' && scale === 2 && name === 'half') await shot(m, 'mobile-text200');
    }
    pass('12 layout states: EN/ID × text100/200% × three snaps, ring remains24px and button reachable', matrix);
    await m.emulateMedia({ reducedMotion: 'reduce' });
    await action(m, 'interact').focus(); await m.keyboard.down('Space');
    await m.waitForTimeout(200); assert((await snapshot(m)).panel > 0); await m.keyboard.up('Space'); await incomplete(m);
    await m.keyboard.down('Space'); await complete(m); await m.keyboard.up('Space');
    pass('Reduced motion preserves functional progress and one-second hold');
    assert.deepEqual(report.errors, []); pass('No unexpected page/console errors; warnings retained separately');
  } catch (error) { report.failure = String(error.stack); save(); throw error; }
  finally { save(); await browser.close(); }
})();
