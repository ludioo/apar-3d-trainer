const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const origin = process.argv[2] || 'http://localhost:4192';
const stage = origin.includes('5192') ? 'dev' : 'production';
const report = { origin, stage, checks: [], errors: [], images: [] };
const save = () => fs.writeFileSync(path.join(__dirname, `t4.2-${stage}-qa.json`), JSON.stringify(report, null, 2));
const pass = (name, details) => { report.checks.push({ name, details }); save(); console.log('PASS', name); };
const sleep = p => p.waitForTimeout(300);
async function ready(p) {
  p.on('pageerror', e => report.errors.push(String(e)));
  p.on('console', e => { if (e.type() === 'error' && !e.text().includes('404')) report.errors.push(e.text()); });
  await p.goto(`${origin}/?debug#configure`);
  await p.waitForFunction(() => window.__aparDebug && getComputedStyle(document.querySelector('#splash')).opacity === '0');
  await p.evaluate(() => {
    document.querySelector('#debug-hud').hidden = true;
    document.querySelector('#debug-stats').hidden = true;
  });
}
async function geometry(p) {
  return p.evaluate(() => {
    const panel = document.querySelector('#panel'), canvas = document.querySelector('#canvas-root');
    return { panel: panel.getBoundingClientRect().toJSON(), canvas: canvas.getBoundingClientRect().toJSON(),
      snap: panel.dataset.snap, label: panel.querySelector('button').getAttribute('aria-label'),
      expanded: panel.querySelector('button').getAttribute('aria-expanded'),
      overflow: document.documentElement.scrollWidth > innerWidth };
  });
}
async function setSnap(p, name) {
  for (let i = 0; i < 3 && (await geometry(p)).snap !== name; i++) { await p.locator('.panel__handle').click(); await sleep(p); }
  assert.equal((await geometry(p)).snap, name);
}
async function fitted(p, tolerance = 2) {
  const g = await geometry(p);
  assert(Math.abs(g.canvas.bottom - g.panel.top) <= tolerance, JSON.stringify(g));
  assert(!g.overflow, 'no horizontal page overflow');
  return g;
}
async function shot(p, tag) {
  const file = path.join(__dirname, `t4.2-${stage}-${tag}.png`);
  await p.screenshot({ path: file }); report.images.push(file); save();
}
async function reachable(p, selector) {
  const el = p.locator(selector).first();
  await el.scrollIntoViewIfNeeded();
  const hit = await el.evaluate(e => {
    const r = e.getBoundingClientRect(), x = r.x + r.width / 2, y = r.y + r.height / 2;
    return e.contains(document.elementFromPoint(x, y));
  });
  assert(hit, `reachable ${selector}`);
}
async function drag(p, delta, cancel = false) {
  const box = await p.locator('.panel__handle').boundingBox();
  await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await p.mouse.down();
  await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - delta, { steps: 12 });
  await p.waitForTimeout(40);
  await fitted(p);
  if (cancel) await p.locator('.panel__handle').dispatchEvent('pointercancel', { pointerId: 1 });
  await p.mouse.up(); await sleep(p);
}
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const p = await browser.newPage({ viewport: { width: 390, height: 844 }, locale: 'en-US' });
    await ready(p);
    assert.equal((await geometry(p)).snap, 'half'); assert.equal((await geometry(p)).panel.height, 422);
    await fitted(p); await shot(p, 'mobile-half');
    for (const [snap, height, expanded] of [['full', 633, 'true'], ['peek', 211, 'false'], ['half', 422, 'true']]) {
      await p.locator('.panel__handle').click(); await sleep(p);
      const g = await fitted(p); assert.equal(g.snap, snap); assert.equal(g.panel.height, height); assert.equal(g.expanded, expanded);
      assert.match(g.label, new RegExp(snap));
      await shot(p, `mobile-${snap}`);
    }
    await p.locator('.panel__handle').focus(); await p.keyboard.press('Enter'); await sleep(p);
    assert.equal((await geometry(p)).snap, 'full');
    await p.keyboard.press('Space'); await sleep(p); assert.equal((await geometry(p)).snap, 'peek');
    assert.equal(await p.locator('.panel__handle').evaluate(e => getComputedStyle(e).outlineStyle !== 'none'), true);
    pass('Default half, exact 25/50/75 heights, click cycle, Enter/Space, labels and canvas boundaries');

    await drag(p, 210); assert.equal((await geometry(p)).snap, 'half');
    await drag(p, 210); assert.equal((await geometry(p)).snap, 'full');
    await drag(p, -420); assert.equal((await geometry(p)).snap, 'peek');
    await drag(p, 220, true); assert.equal((await geometry(p)).snap, 'peek');
    await p.mouse.move(190, 655); await p.mouse.down(); await p.mouse.move(190, 500, { steps: 5 });
    await p.locator('.panel__handle').dispatchEvent('lostpointercapture'); await p.mouse.up(); await sleep(p);
    assert.equal((await geometry(p)).snap, 'peek');
    pass('Drag reaches all snaps, canvas follows during drag, pointercancel and lost capture restore previous snap');

    await setSnap(p, 'half');
    await p.locator('[data-color="yellow"]').click();
    await p.locator('[data-agent="co2"]').click();
    assert.equal(await p.locator('[data-color="yellow"]').getAttribute('aria-pressed'), 'true');
    await fitted(p);
    const model = await p.evaluate(() => {
      const d = window.__aparDebug;
      const box = d.model.children.find(o => o.isMesh)?.geometry?.boundingBox;
      return { visible: d.model.visible, height: d.renderer.domElement.clientHeight, hasBounds: !!box };
    });
    assert(model.visible && model.height > 200);
    await shot(p, 'configure-yellow-co2');
    for (const mode of ['train', 'results', 'configure']) {
      await p.locator(`.tab[href="#${mode}"]`).click(); assert.equal((await geometry(p)).snap, 'half');
    }
    await p.locator('[data-lang="id"]').click(); assert.match((await geometry(p)).label, /setengah/);
    await p.locator('[data-lang="en"]').click();
    await p.locator('.topbar__about').click(); await p.keyboard.press('Escape');
    assert.equal(await p.locator('.topbar__about').evaluate(e => document.activeElement === e), true);
    const hotspot = p.locator('.hotspot-pins:not([hidden]) .hotspot-pin:visible').first();
    await hotspot.waitFor(); await hotspot.click(); await p.locator('.hotspot-info__close').click();
    assert.equal((await geometry(p)).snap, 'half');
    pass('Color/agent stay selected, model remains rendered, routes/language/About/hotspot preserve half snap');

    await setSnap(p, 'peek'); await p.setViewportSize({ width: 1280, height: 900 }); await sleep(p);
    const desktop = await geometry(p);
    assert.equal(desktop.panel.width, 360); assert.equal(desktop.panel.right, 1264);
    assert.equal(desktop.canvas.width, 1280); assert.equal(desktop.canvas.height, 900);
    assert.equal(await p.locator('.panel__handle').isVisible(), false); await shot(p, 'desktop');
    await p.setViewportSize({ width: 390, height: 844 }); await sleep(p); assert.equal((await geometry(p)).snap, 'peek');
    await p.reload(); await p.waitForFunction(() => getComputedStyle(document.querySelector('#splash')).opacity === '0');
    assert.equal((await geometry(p)).snap, 'half');
    pass('Desktop panel/canvas unchanged, mobile position survives breakpoint roundtrip, reload returns half');

    await p.setViewportSize({ width: 844, height: 300 }); await sleep(p);
    assert.equal((await geometry(p)).snap, 'half');
    await p.locator('.panel__handle').click(); await sleep(p); assert.equal((await geometry(p)).snap, 'full');
    await p.locator('.panel__handle').click(); await sleep(p); assert.equal((await geometry(p)).snap, 'peek');
    await p.locator('.panel__handle').click(); await sleep(p); assert.equal((await geometry(p)).snap, 'full');
    await p.setViewportSize({ width: 844, height: 240 }); await sleep(p);
    const short = await geometry(p); await p.locator('.panel__handle').click(); await sleep(p);
    assert.equal((await geometry(p)).snap, short.snap); assert.match((await geometry(p)).label, /available screen space/);
    await fitted(p); pass('Short screens clamp to safe available height and skip duplicate positions');
    await p.close();

    const touch = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
      reducedMotion: 'reduce', locale: 'en-US' });
    await ready(touch);
    const cdp = await touch.context().newCDPSession(touch);
    const hb = await touch.locator('.panel__handle').boundingBox();
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: hb.y + 22 }] });
    for (let i = 1; i <= 10; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y: hb.y + 22 + i * 21 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(touch);
    assert.equal((await geometry(touch)).snap, 'peek');
    await touch.waitForTimeout(800);
    await touch.locator('.panel__handle').tap(); await sleep(touch); assert.equal((await geometry(touch)).snap, 'half');
    assert.equal(await touch.locator('#panel').evaluate(e => getComputedStyle(e).transitionDuration), '0s');
    const beforeScroll = (await geometry(touch)).snap;
    await touch.locator('[data-color="silver"]').scrollIntoViewIfNeeded(); assert.equal((await geometry(touch)).snap, beforeScroll);
    await touch.locator('.tab[href="#results"]').tap();
    const input = touch.locator('input').first(); await input.scrollIntoViewIfNeeded(); await input.fill('T4.2 Keyboard');
    // Headless Chrome has no OS keyboard; emulate only its visual viewport geometry.
    await touch.evaluate(() => {
      Object.defineProperty(visualViewport, 'height', { configurable: true, value: 500 });
      visualViewport.dispatchEvent(new Event('resize'));
    }); await sleep(touch);
    const keyboard = await fitted(touch); assert.equal(keyboard.panel.bottom, 500); assert.equal(keyboard.panel.height, 250);
    await reachable(touch, 'input');
    await touch.evaluate(() => { delete visualViewport.height; visualViewport.dispatchEvent(new Event('resize')); }); await sleep(touch);
    assert.equal((await geometry(touch)).panel.height, 422);
    pass('Native touch drag/tap, content scrolling, reduced motion and simulated keyboard viewport fit', { keyboard });
    await touch.close();

    let states = 0;
    for (const [width, height] of [[360, 800], [390, 844], [844, 390], [1023, 768], [1024, 768], [1280, 900]]) {
      const m = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce', locale: 'en-US' });
      await ready(m);
      for (const scale of [1, 2]) for (const lang of ['en', 'id']) {
        await m.locator(`[data-lang="${lang}"]`).click();
        await m.evaluate(scale => {
          for (const n of [12, 14, 16, 20, 28, 40]) document.documentElement.style.setProperty(`--fs-${n}`, `${n * scale}px`);
        }, scale); await sleep(m);
        for (const snap of width < 1024 ? ['peek', 'half', 'full'] : ['desktop']) {
          if (snap !== 'desktop') await setSnap(m, snap);
          report.scenario = { width, height, scale, lang, snap }; save();
          if (width < 1024) await fitted(m);
          await reachable(m, '[data-color="red"]'); await reachable(m, '[data-agent="powder_abc"]');
          await reachable(m, '[data-pdf="spec"]');
          states++;
        }
      }
      if (width === 844) await shot(m, 'landscape-200');
      await m.close();
    }
    delete report.scenario;
    pass('Six viewport layouts with EN/ID, text 100/200%, every mobile snap and reachable configuration/PDF controls', { states });
    assert.deepEqual(report.errors, []); pass('No unexpected page/console errors');
  } finally { save(); await browser.close(); }
})().catch(e => { report.failure = e.stack; save(); console.error(e); process.exitCode = 1; });
