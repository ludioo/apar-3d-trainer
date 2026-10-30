const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const origin = process.argv[2] || 'http://localhost:4247';
const prefix = origin.includes('5247') ? 't4.7-dev' : 't4.7-production';
const load = file => JSON.parse(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'));
const questions = load('src/data/quiz.json');
const report = { date: '2026-10-30', origin, checks: [], states: [], errors: [], warnings: [] };
const output = name => path.join(__dirname, `${prefix}-${name}`);
const save = () => fs.writeFileSync(output('qa.json'), JSON.stringify(report, null, 2));
const pass = (name, data) => { report.checks.push({ name, data }); save(); console.log('PASS', name); };
const camera = p => p.evaluate(() => ({ position: __aparDebug.camera.position.toArray(), target: __aparDebug.controls.target.toArray() }));
const key = async (p, selector, value = 'Enter') => { await p.locator(selector).focus(); await p.keyboard.press(value); };
const settle = p => p.waitForTimeout(300);
async function ready(p, hash = 'configure') {
  p.on('pageerror', e => report.errors.push(String(e)));
  p.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()); if (m.type() === 'warning') report.warnings.push(m.text()); });
  await p.goto(`${origin}/?debug#${hash}`);
  await p.waitForFunction(() => window.__aparDebug?.model && getComputedStyle(document.querySelector('#splash')).opacity === '0');
  await p.evaluate(() => __aparDebug.controls.pauseAutoRotate());
}
async function state(p, tag) {
  const value = await p.evaluate(() => {
    const d = __aparDebug, V = d.Vector3;
    d.model.updateWorldMatrix(true, true); d.camera.updateMatrixWorld();
    const min = new V(Infinity, Infinity, Infinity), max = new V(-Infinity, -Infinity, -Infinity);
    d.model.traverseVisible(o => { if (!o.isMesh) return; o.geometry.computeBoundingBox();
      const b = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld); min.min(b.min); max.max(b.max); });
    const r = document.querySelector('#canvas-root').getBoundingClientRect();
    const panel = document.querySelector('#panel'), pr = panel.getBoundingClientRect();
    const top = document.querySelector('.topbar').getBoundingClientRect().bottom;
    const margin = Math.min(16, r.width / 4, r.height / 4), desktop = innerWidth >= 1024;
    const safe = { left: r.left + margin, top: desktop ? top + margin : r.top + margin,
      right: desktop ? pr.left - margin : r.right - margin, bottom: r.bottom - margin };
    const points = [];
    for (const x of [min.x, max.x]) for (const y of [min.y, max.y]) for (const z of [min.z, max.z]) {
      const v = new V(x, y, z).project(d.camera);
      points.push({ x: r.left + (v.x + 1) * r.width / 2, y: r.top + (1 - v.y) * r.height / 2 });
    }
    const visible = el => { const box = el.getBoundingClientRect(); return box.width > 0 && box.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
    const text = [...panel.querySelectorAll('p,button,legend,th,td,h3,h4,h5,a,label,li')].filter(visible)
      .filter(el => [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()))
      .map(el => ({ tag: el.tagName, cls: el.className, font: parseFloat(getComputedStyle(el).fontSize) }));
    const scrollers = [...panel.querySelectorAll('.panel__body,.training,.quiz,.results')].filter(visible)
      .map(el => ({ cls: el.className, width: el.clientWidth, scrollWidth: el.scrollWidth }));
    return { safe, points, text, scrollers, snap: panel.dataset.snap, root: r.toJSON(), overflow: document.documentElement.scrollWidth > innerWidth,
      ratio: (Math.max(...points.map(v => v.y)) - Math.min(...points.map(v => v.y))) / (safe.bottom - safe.top),
      font: getComputedStyle(document.querySelector('.topbar__name')).fontSize };
  });
  assert.equal(value.overflow, false, `${tag}: page overflow`);
  for (const scroller of value.scrollers) assert(scroller.scrollWidth <= scroller.width + 1, `${tag}: ${scroller.cls} horizontal overflow`);
  report.states.push({ tag, ...value }); return value;
}
function fits(s) {
  for (const pt of s.points) assert(pt.x >= s.safe.left - 0.5 && pt.x <= s.safe.right + 0.5 &&
    pt.y >= s.safe.top - 0.5 && pt.y <= s.safe.bottom + 0.5, 'overview model is inside the free canvas');
}
async function snap(p, name) {
  if (p.viewportSize().width >= 1024) return;
  const matches = () => p.locator('#panel').evaluate((el, name) => {
    const style = getComputedStyle(el), root = getComputedStyle(document.documentElement);
    const expected = Math.min(Math.max(parseFloat(root.getPropertyValue('--sheet-viewport-h')) *
      ({peek:0.25,half:0.5,full:0.75})[name], parseFloat(style.getPropertyValue('--sheet-min-h'))), parseFloat(style.maxHeight));
    return Math.abs(el.getBoundingClientRect().height - expected) < 1;
  }, name);
  await settle(p);
  for (let i = 0; i < 3 && !await matches(); i++) { await key(p, '.panel__handle'); await settle(p); }
  assert(await matches(), `requested sheet height ${name}`);
}
async function quizStart(p) {
  await key(p, '.tab[href="#train"]');
  await key(p, '[data-training="start"]');
  for (let i = 0; i < 4; i++) { await key(p, '[data-training="skip"]'); await key(p, '[data-training="next"]'); }
  await key(p, '[data-training="quiz"]');
}
async function finishQuiz(p) {
  for (const q of questions) { await key(p, `.quiz [data-choice="${q.answer}"]`); await key(p, '[data-quiz="next"]'); }
}
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const p = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    await ready(p); let s = await state(p, 'default-desktop'); fits(s); assert(s.ratio >= 0.6 && s.ratio <= 0.75);
    await p.screenshot({ path: output('desktop.png') });
    await p.setViewportSize({ width: 390, height: 844 }); await settle(p);
    s = await state(p, 'default-mobile'); fits(s); assert(s.ratio >= 0.6 && s.ratio <= 0.75);
    await p.screenshot({ path: output('mobile.png') });
    pass('Initial default 6kg framing is 60–75% on desktop and mobile half');
    const defaultCamera = await camera(p), ratios = [];
    for (const id of ['1kg','3kg','6kg','9kg']) {
      await key(p, `[data-capacity="${id}"]`); ratios.push((await state(p, `capacity-${id}`)).ratio);
      assert.deepEqual(await camera(p), defaultCamera, 'capacity change keeps reference camera');
    }
    assert(ratios.every((r, i) => !i || r > ratios[i - 1]));
    await key(p, '.config-bracket input', 'Space'); fits(await state(p, '9kg-bracket'));
    await key(p, '[data-capacity="6kg"]'); await key(p, '.config-bracket input', 'Space');
    pass('Capacity size differences and largest bracket overview', ratios);
    await p.setViewportSize({ width: 1280, height: 900 }); await settle(p);
    const beforeTap = await camera(p); await p.mouse.click(40, 600);
    assert.deepEqual(await camera(p), beforeTap, 'a blank tap does not move the camera');
    await p.setViewportSize({ width: 1200, height: 800 }); await settle(p);
    assert.notDeepEqual(await camera(p), beforeTap, 'blank tap does not disable automatic framing');
    for (const id of ['handle','pin','nozzle','gauge','label','body']) {
      const before = await camera(p); await key(p, `[data-part="${id}"]`); await settle(p);
      assert.notDeepEqual(await camera(p), before);
      await key(p, '.hotspot-info__close'); await settle(p);
      const after = await camera(p);
      for (const field of ['position','target']) after[field].forEach((v,i) => assert(Math.abs(v-before[field][i]) < 1e-6));
    }
    await key(p, '[data-part="body"]'); const focused = await camera(p);
    await p.setViewportSize({ width: 1280, height: 900 }); await settle(p);
    assert.deepEqual(await camera(p), focused, 'overview must not interrupt a hotspot');
    await key(p, '.hotspot-info__close'); await settle(p); fits(await state(p, 'close-after-resize'));
    pass('Tap, six hotspot snapshots, resize while focused and restoration');
    await p.emulateMedia({reducedMotion:'no-preference'});
    await p.evaluate(() => { document.activeElement.blur(); __aparDebug.controls.resumeAutoRotate(); });
    await p.waitForFunction(() => __aparDebug.controls.autoRotate, {timeout:10000});
    await p.waitForTimeout(400); await p.evaluate(() => __aparDebug.controls.pauseAutoRotate());
    const idle = await camera(p);
    await p.setViewportSize({width:1200,height:800}); await settle(p);
    assert.notDeepEqual(await camera(p), idle, 'idle rotation does not claim a manual view');
    await p.emulateMedia({reducedMotion:'reduce'});
    pass('Actual idle auto-rotation keeps automatic overview ownership');
    await p.mouse.move(400, 450); await p.mouse.down(); await p.mouse.move(470, 470, { steps: 10 }); await p.mouse.up();
    const manual = await camera(p); await p.setViewportSize({ width: 1100, height: 800 }); await settle(p);
    assert.deepEqual(await camera(p), manual, 'orbit view persists on resize');
    await key(p, '.tab[href="#train"]'); await key(p, '.tab[href="#configure"]');
    assert.deepEqual(await camera(p), manual, 'train restores manual overview');
    await p.reload(); await p.waitForFunction(() => window.__aparDebug?.model && getComputedStyle(document.querySelector('#splash')).opacity === '0');
    await p.evaluate(() => __aparDebug.controls.pauseAutoRotate());
    await p.mouse.move(400, 450); await p.mouse.wheel(0, -160); await settle(p);
    const zoomed = await camera(p); await p.setViewportSize({ width: 1280, height: 900 }); await settle(p);
    assert.deepEqual(await camera(p), zoomed, 'wheel view persists on resize');
    pass('Real orbit and wheel gestures disable automatic fit; reload resets ownership');
    await p.reload(); await p.waitForFunction(() => window.__aparDebug?.model && getComputedStyle(document.querySelector('#splash')).opacity === '0');
    await p.evaluate(() => __aparDebug.controls.pauseAutoRotate());
    const download = p.waitForEvent('download');
    await key(p, '[data-pdf="spec"]');
    await (await download).saveAs(output('spec.pdf'));
    pass('Spec PDF downloaded through the real export control');
    await quizStart(p); await finishQuiz(p);
    await key(p, '.tab[href="#results"]');
    for (const size of [{width:1280,height:900},{width:1024,height:900},{width:390,height:844},{width:844,height:390}]) {
      await p.setViewportSize(size);
      for (const lang of ['en','id']) {
        await key(p, `[data-lang="${lang}"]`);
        for (const scale of [1,2]) {
          await p.evaluate(scale => { for (const n of [12,14,16,20,28,40]) document.documentElement.style.setProperty(`--fs-${n}`, `${n*scale}px`); }, scale);
          for (const motion of ['reduce','no-preference']) {
            await p.emulateMedia({ reducedMotion: motion });
            for (const name of size.width >= 1024 ? ['half'] : ['peek','half','full']) {
              await snap(p, name); await settle(p);
              for (const mode of ['configure','train','results']) {
                await key(p, `.tab[href="#${mode}"]`); await settle(p);
                const tag = `${size.width}x${size.height}-${lang}-${scale}-${motion}-${name}-${mode}`;
                const v = await state(p, tag);
                for (const el of v.text) assert(el.font >= 14*scale, `${tag}: text below minimum: ${JSON.stringify(el)}`);
                if (mode === 'results') {
                  const labels = await p.locator('.results-chart__label').evaluateAll(els => els.map(el => ({
                    font: parseFloat(getComputedStyle(el).fontSize)*el.getScreenCTM().a,
                    right: el.getBoundingClientRect().right, parentRight: el.closest('svg').getBoundingClientRect().right,
                  })));
                  for (const label of labels) { assert(label.font >= 14*scale-0.1); assert(label.right <= label.parentRight+0.5); }
                }
              }
            }
          }
        }
      }
      pass(`EN/ID, text 100/200%, reduced motion and available snaps at ${size.width}x${size.height}`);
    }
    await p.evaluate(() => { for (const n of [12,14,16,20,28,40]) document.documentElement.style.removeProperty(`--fs-${n}`); });
    await p.setViewportSize({width:390,height:844}); await snap(p,'half'); await key(p,'.tab[href="#results"]'); await settle(p);
    await p.screenshot({path:output('results-mobile.png')});
    await key(p,'.tab[href="#train"]'); await settle(p); await p.screenshot({path:output('quiz-summary-mobile.png')});
    const normal = await browser.newPage({viewport:{width:1280,height:900}, reducedMotion:'reduce'});
    await normal.goto(`${origin}/#configure`);
    await normal.waitForFunction(() => getComputedStyle(document.querySelector('#splash')).opacity === '0');
    assert.equal(await normal.evaluate(() => '__aparDebug' in window), false);
    await normal.screenshot({path:output('normal-desktop.png')});
    await normal.setViewportSize({width:390,height:844}); await settle(normal);
    await normal.screenshot({path:output('normal-mobile.png')});
    pass('Normal production route has no debug bridge; desktop/mobile screenshots');
    assert.deepEqual(report.errors, []); pass('No unexpected page or console errors');
  } finally { save(); await browser.close(); }
})().catch(e => { report.failure = String(e.stack); save(); console.error(e); process.exitCode = 1; });
