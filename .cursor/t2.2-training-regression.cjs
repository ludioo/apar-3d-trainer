const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const origin = process.argv[2] || 'http://localhost:5181';
const production = process.argv.includes('--production');
const report = { date: '2026-10-28', origin, production, checks: [], errors: [] };
const prefix = production ? 't2.2-training-regression-production' : 't2.2-training-regression';
const save = () => fs.writeFileSync(path.join(__dirname, `${prefix}-qa.json`), JSON.stringify(report, null, 2));
function pass(name, detail) { report.checks.push({ name, detail, status: 'PASS' }); save(); console.log('PASS', name); }
const action = (p, name) => p.locator(`[data-training="${name}"]`);
const next = (p) => action(p, 'next');
const target = (p) => p.locator('.training-target__button');
async function ready(p, hash = 'train') {
  await p.goto(`${origin}/?debug#${hash}`);
  await p.waitForFunction(() => window.__aparDebug && getComputedStyle(document.querySelector('#splash')).opacity === '0');
}
async function settle(p) { await p.waitForTimeout(760); }
async function skipTo(p, index) {
  while (Number((await p.locator('.training h3').innerText()).charAt(0)) < index) {
    if (await action(p, 'skip').isEnabled()) await action(p, 'skip').click();
    await next(p).click();
  }
  await settle(p);
}
async function hold(p, duration, keyboard = false) {
  if (keyboard) {
    await target(p).focus();
    await p.keyboard.down('Space');
    await p.waitForTimeout(duration);
    await p.keyboard.up('Space');
  } else {
    const b = await target(p).boundingBox();
    await p.mouse.move(b.x + 22, b.y + 22);
    await p.mouse.down();
    await p.waitForTimeout(duration);
    await p.mouse.up();
  }
}
async function sweep(p, touch = false) {
  await p.locator('#training-sweep').scrollIntoViewIfNeeded();
  const b = await p.locator('#training-sweep').boundingBox();
  const start = { x: b.x + 22, y: b.y + b.height / 2 };
  const points = Array.from({ length: 6 }, (_, i) => ({ x: i % 2 ? start.x : b.x + b.width - 22, y: start.y }));
  if (touch) {
    const cdp = await p.context().newCDPSession(p);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
    for (const pt of points) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [pt] });
      await p.waitForTimeout(100);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await p.waitForTimeout(100);
    await cdp.detach();
  } else {
    await p.mouse.move(start.x, start.y); await p.mouse.down();
    for (const pt of points) await p.mouse.move(pt.x, pt.y, { steps: 8 });
    await p.mouse.up();
  }
}
async function hit(p, locator) {
  await locator.scrollIntoViewIfNeeded();
  assert.equal(await locator.evaluate(el => {
    const b = el.getBoundingClientRect();
    const root = el.closest('.training').getBoundingClientRect();
    const nav = document.querySelector('.training__nav');
    const bottom = Math.min(b.bottom, root.bottom, nav.hidden ? root.bottom : nav.getBoundingClientRect().top);
    const top = Math.max(b.top, root.top);
    return bottom > top && el.contains(document.elementFromPoint(b.x + b.width / 2, (top + bottom) / 2));
  }), true, 'element must be reachable above sticky controls');
}

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1365, height: 900 }, locale: 'id-ID' });
    const p = await context.newPage();
    p.on('pageerror', e => report.errors.push(String(e)));
    p.on('console', message => { if (message.type() === 'error' && !message.text().includes('404')) report.errors.push(message.text()); });
    await ready(p, 'configure');
    await p.locator('[data-agent="co2"]').click();
    await p.locator('[data-capacity="9kg"]').click();
    await p.locator('[data-color="silver"]').click();
    await p.locator('.config-bracket input').check();
    const baseline = await p.evaluate(() => ({ scale: window.__aparDebug.model.scale.toArray(), camera: window.__aparDebug.camera.position.toArray() }));
    await p.locator('.tab[href="#train"]').click();
    const trainScale = await p.evaluate(() => window.__aparDebug.model.scale.x);
    assert.ok(Math.abs(baseline.scale[0] / trainScale - 1.12) < 0.0001);
    assert.equal(await p.evaluate(() => window.__aparDebug.model.getObjectByName('configurator-bracket').visible), false);
    await p.locator('[data-lang="en"]').click();
    await p.locator('[data-lang="id"]').click();
    assert.equal(await p.evaluate(() => window.__aparDebug.model.scale.x), trainScale);
    pass('Train uses default appearance while language changes');
    await action(p, 'start').click(); await settle(p);
    assert.equal(await next(p).isDisabled(), true);
    assert.equal(await action(p, 'back').isDisabled(), true);
    await p.screenshot({ path: path.join(__dirname, `${prefix}-desktop.png`) });
    await target(p).click();
    assert.equal(await p.locator('.training-target__pin').isVisible(), true);
    await next(p).click(); await settle(p);
    assert.equal(await next(p).isDisabled(), true);
    await target(p).focus(); await p.keyboard.press('Enter');
    await action(p, 'back').click();
    assert.equal(await next(p).isEnabled(), true);
    await next(p).click();
    assert.equal(await next(p).isEnabled(), true);
    await next(p).click(); await settle(p);
    pass('Pull/Aim click and keyboard, pin overlay, Back preserves completion');
    await hold(p, 450);
    assert.equal(await next(p).isDisabled(), true);
    assert.match(await target(p).getAttribute('style'), /--hold-progress: 0deg/);
    await hold(p, 1100, true);
    assert.equal(await next(p).isEnabled(), true);
    await next(p).click(); await settle(p);
    const cameraBefore = await p.evaluate(() => window.__aparDebug.camera.position.toArray());
    await sweep(p);
    assert.match(await p.locator('#training-sweep-count').innerText(), /3\/3/);
    assert.deepEqual(await p.evaluate(() => window.__aparDebug.camera.position.toArray()), cameraBefore);
    await next(p).click();
    assert.equal(await p.evaluate(() => localStorage.getItem('apar3d:trainingDone')), 'true');
    assert.equal(await p.locator('.training__contacts a[href="tel:113"]').count(), 1);
    assert.equal(await p.locator('.training__contacts a[href="tel:112"]').count(), 1);
    assert.equal(await p.locator('.training__contacts a[target="_blank"]').getAttribute('href'), 'https://layanan112.komdigi.go.id/tentang');
    await p.locator('[data-lang="en"]').click();
    assert.match(await p.locator('.training h3').innerText(), /Training complete/);
    await p.screenshot({ path: path.join(__dirname, `${prefix}-complete.png`) });
    pass('Early release resets, one-second keyboard hold, six-stroke Sweep without orbit, completion storage and bilingual emergency links');
    await p.locator('.tab[href="#configure"]').click();
    assert.equal(await p.locator('[data-agent="co2"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await p.locator('[data-capacity="9kg"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await p.locator('[data-color="silver"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await p.locator('.config-bracket input').isChecked(), true);
    assert.deepEqual(await p.evaluate(() => window.__aparDebug.model.scale.toArray()), baseline.scale);
    assert.deepEqual(await p.evaluate(() => window.__aparDebug.camera.position.toArray()), baseline.camera);
    pass('Configure choices, scale, bracket and camera restored');
    await p.locator('.tab[href="#train"]').click();
    await action(p, 'restart').click();
    await skipTo(p, 3);
    const b = await target(p).boundingBox();
    await p.mouse.move(b.x + 22, b.y + 22); await p.mouse.down(); await p.waitForTimeout(350);
    await p.evaluate(() => window.dispatchEvent(new Event('blur')));
    await p.waitForTimeout(800); await p.mouse.up();
    assert.equal(await next(p).isDisabled(), true);
    await target(p).focus(); await p.keyboard.down('Enter'); await p.waitForTimeout(300);
    await p.locator('.topbar__about').click(); await p.keyboard.up('Enter');
    await p.waitForTimeout(850); await p.keyboard.press('Escape');
    assert.equal(await next(p).isDisabled(), true);
    await p.locator('.tab[href="#results"]').click();
    assert.equal(await p.locator('.training-target').isVisible(), false);
    await p.locator('.tab[href="#train"]').click();
    assert.match(await p.locator('.training h3').innerText(), /3\/4/);
    assert.equal(await next(p).isDisabled(), true);
    await settle(p); await action(p, 'refocus').click(); await settle(p);
    await hold(p, 1100);
    assert.equal(await next(p).isEnabled(), true);
    pass('Blur/About/exit cancel partial hold; step preserved across routes; refocus and mouse hold work');
    await next(p).click(); await action(p, 'skip').click();
    await p.evaluate(() => { Storage.prototype.setItem = function () { throw new DOMException('Quota', 'QuotaExceededError'); }; });
    await next(p).click();
    assert.equal(await p.locator('.training__error').isVisible(), true);
    await p.reload();
    await p.waitForFunction(() => window.__aparDebug && getComputedStyle(document.querySelector('#splash')).opacity === '0');
    assert.equal(await action(p, 'start').isVisible(), true);
    assert.equal(await p.evaluate(() => localStorage.getItem('apar3d:trainingDone')), 'true');
    pass('Skip completion and storage failure keep walkthrough usable; refresh returns to intro without clearing completion');

    if (!production) {
      await action(p, 'start').click(); await settle(p);
      const point = await p.evaluate(async () => {
        const { pickFromNdc } = await import('/src/core/picking.js');
        const { camera, model, hotspots, Vector3 } = window.__aparDebug;
        const canvas = document.querySelector('canvas'); const rect = canvas.getBoundingClientRect();
        const h = hotspots.find(h => h.id === 'pin');
        const center = model.localToWorld(new Vector3(...h.pinPosition)).project(camera);
        for (let dy = -45; dy <= 45; dy += 3) for (let dx = -45; dx <= 45; dx += 3) {
          const x = (center.x + 1) * rect.width / 2 + dx;
          const y = (1 - center.y) * rect.height / 2 + dy;
          if (document.elementFromPoint(rect.left + x, rect.top + y) !== canvas) continue;
          if (pickFromNdc(x / rect.width * 2 - 1, -(y / rect.height * 2 - 1), camera, model, hotspots).hotspot?.id === 'pin') return { x: rect.left + x, y: rect.top + y };
        }
      });
      assert.ok(point, 'uncovered mesh point available'); await p.mouse.click(point.x, point.y);
      assert.equal(await next(p).isEnabled(), true);
      pass('Direct GLB pin picking completes Pull without clicking HTML target');
    }

    const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'id-ID' });
    const m = await mobileContext.newPage(); m.on('pageerror', e => report.errors.push(String(e)));
    m.on('console', message => { if (message.type() === 'error' && !message.text().includes('404')) report.errors.push(message.text()); });
    await ready(m); await action(m, 'start').tap(); await settle(m);
    await target(m).tap(); await next(m).tap(); await settle(m); await target(m).tap(); await next(m).tap(); await settle(m);
    const cdp = await mobileContext.newCDPSession(m); const tb = await target(m).boundingBox();
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: tb.x + 22, y: tb.y + 22 }] });
    await m.waitForTimeout(1100);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    assert.equal(await next(m).isEnabled(), true);
    await next(m).tap(); await settle(m);
    await sweep(m, true); assert.equal(await next(m).isEnabled(), true);
    await next(m).tap();
    await m.locator('.training[data-phase="complete"]').waitFor();
    await hit(m, m.locator('[href="tel:113"]')); await hit(m, m.locator('[href="tel:112"]'));
    pass('Touch Pull/Aim/hold/Sweep and hit-tested mobile telephone links');
    await action(m, 'restart').tap(); await settle(m);
    const matrix = [];
    for (const [width, height] of [[360,800], [390,844], [768,1024], [844,390], [390,420]]) {
      await m.setViewportSize({ width, height });
      for (const lang of ['en', 'id']) {
        await m.locator(`[data-lang="${lang}"]`).tap();
        for (const zoom of [1, 2]) {
          await m.evaluate(z => {
            for (const root of document.querySelectorAll('.training, .training-target'))
              for (const n of [12,14,16,20,28,40]) root.style.setProperty(`--fs-${n}`, `${n*z}px`);
          }, zoom);
          for (const expanded of [false, true]) {
            report.scenario = { width, height, lang, zoom, expanded };
            const handle = m.locator('.panel__handle');
            if ((await handle.getAttribute('aria-expanded') === 'true') !== expanded) await handle.tap();
            await m.waitForTimeout(280);
            assert.equal(await m.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
            await hit(m, action(m, 'skip'));
            await hit(m, m.locator('.training__disclaimer'));
            const rect = await m.locator('.training').boundingBox();
            assert.ok(rect.height >= 40, `usable scroll viewport ${width}x${height}`);
            matrix.push({ width, height, lang, zoom, expanded, scrollHeight: rect.height });
          }
        }
      }
    }
    await m.setViewportSize({ width: 390, height: 844 });
    await m.evaluate(() => { for (const el of document.querySelectorAll('.training, .training-target')) el.removeAttribute('style'); document.querySelector('.training').scrollTop = 0; });
    if (await m.locator('.panel__handle').getAttribute('aria-expanded') === 'true') await m.locator('.panel__handle').tap();
    await m.waitForTimeout(300);
    await m.screenshot({ path: path.join(__dirname, `${prefix}-mobile.png`) });
    pass('EN/ID × 100/200% training text × five viewports × both sheet snaps; disclaimer and Skip reachable', matrix);

    const reducedContext = await browser.newContext({ viewport: { width: 1365, height: 900 }, reducedMotion: 'reduce' });
    const reduced = await reducedContext.newPage(); await ready(reduced); await action(reduced, 'start').click();
    assert.equal(await target(reduced).isVisible(), true);
    await reduced.waitForTimeout(100);
    const first = await reduced.locator('canvas').screenshot(); await reduced.waitForTimeout(200);
    assert.ok(first.equals(await reduced.locator('canvas').screenshot()), 'reduced-motion frame remains identical');
    await target(reduced).click();
    assert.equal(await reduced.locator('.training-target__pin').evaluate(el => getComputedStyle(el).animationName), 'none');
    pass('Reduced motion: immediate focus, static highlight/frame and unanimated pin overlay');

    const failedContext = await browser.newContext(); const failed = await failedContext.newPage();
    await failed.route('**/models/apar.glb', route => route.abort()); await failed.goto(`${origin}/#train`);
    await failed.locator('.splash__retry').waitFor();
    assert.equal(await action(failed, 'start').isDisabled(), true);
    await failed.unroute('**/models/apar.glb'); await failed.locator('.splash__retry').click();
    await failed.waitForFunction(() => getComputedStyle(document.querySelector('#splash')).opacity === '0');
    assert.equal(await action(failed, 'start').isEnabled(), true); await action(failed, 'start').click();
    pass('Model failure disables Start; Retry enables training');
    assert.deepEqual(report.errors, []);
    pass('No unexpected page/console errors');
  } catch (error) { report.failure = String(error.stack); save(); throw error; }
  finally { await browser.close(); save(); }
})();
