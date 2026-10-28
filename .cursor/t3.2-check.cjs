const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const origin = process.argv[2] || 'http://localhost:5183';
const stage = origin.includes('5183') ? 'dev' : 'production';
const report = { date: '2026-10-28', origin, stage, checks: [], errors: [], screenshots: [] };
const save = () => fs.writeFileSync(path.join(__dirname, `t3.2-${stage}-qa.json`), JSON.stringify(report, null, 2));
const pass = (name, details) => { report.checks.push({ name, details }); save(); console.log('PASS', name); };
async function tabTo(p, selector) {
  const target = p.locator(selector);
  await target.waitFor({ state: 'visible' });
  for (let n = 0; n < 250; n++) {
    if (await target.evaluate(el => el === document.activeElement)) {
      assert(await target.evaluate(el => getComputedStyle(el).outlineStyle !== 'none'), `focus outline ${selector}`);
      return;
    }
    await p.keyboard.press('Tab');
  }
  throw Error('Unreachable by Tab: ' + selector);
}
async function activate(p, selector, key = 'Enter') { await tabTo(p, selector); await p.keyboard.press(key); }
async function ready(p, hash = 'configure', debug = false) {
  await p.goto(`${origin}/${debug ? '?debug' : ''}#${hash}`);
  await p.waitForFunction(() => document.querySelector('#splash').inert);
}
async function shot(p, name) {
  const file = `t3.2-${stage}-${name}.png`;
  await p.screenshot({ path: path.join(__dirname, file) });
  report.screenshots.push(file);
}
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  async function page(options = {}) {
    const p = await browser.newPage({ viewport: { width: 1280, height: 900 }, locale: 'en-US', reducedMotion: 'reduce', ...options });
    p.on('pageerror', e => { report.errors.push(String(e)); save(); });
    return p;
  }
  try {
    const p = await page();
    const requests = [];
    p.on('request', r => requests.push(r.url()));
    await ready(p, 'configure', true);
    assert.equal(requests.filter(u => u.includes('apar-fallback.webp')).length, 0);
    for (const part of require('../src/data/hotspots.json')) {
      await activate(p, `[data-part="${part.id}"]`);
      assert.equal(await p.locator('#hotspot-title').innerText(), part.title.en);
      await p.keyboard.press('Escape');
      assert(await p.locator(`[data-part="${part.id}"]`).evaluate(el => el === document.activeElement));
    }
    pass('All six parts reached by Tab/Enter, Escape restores their trigger; fallback asset absent on normal load');
    const specDownload = p.waitForEvent('download');
    await activate(p, '[data-pdf="spec"]');
    await (await specDownload).saveAs(path.join(__dirname, `t3.2-${stage}-spec.pdf`));
    // Wait for this first export separately so the later report cannot satisfy it.
    await p.waitForFunction(() => document.querySelector('[data-pdf="spec"]').getAttribute('aria-busy') === 'false');
    await activate(p, '.saved-configs > button');
    await p.keyboard.type('Keyboard QA');
    await p.keyboard.press('Enter');
    await p.locator('.saved-dialog').waitFor({ state: 'hidden' });
    await activate(p, '[data-action="load"]');
    await activate(p, '[data-action="delete"]');
    await p.keyboard.press('Escape');
    assert(await p.locator('[data-action="delete"]').evaluate(el => el === document.activeElement));
    await activate(p, '[data-action="delete"]');
    await activate(p, '.saved-dialog button[type="submit"]');
    assert.equal(await p.locator('[data-action="load"]').count(), 0);
    pass('Keyboard save/load/delete, cancel/focus restoration, spec export');
    await activate(p, '.tab[href="#train"]');
    await activate(p, '[data-training="start"]');
    for (let index = 0; index < 2; index++) {
      await activate(p, '[data-training="interact"]');
      assert.equal(await p.locator('[data-training="next"]').isEnabled(), true);
      await activate(p, '[data-training="next"]');
    }
    await tabTo(p, '[data-training="interact"]');
    await p.keyboard.down('Space'); await p.waitForTimeout(200); await p.keyboard.up('Space');
    assert.equal(await p.locator('[data-training="next"]').isEnabled(), false);
    await p.keyboard.down('Enter'); await p.waitForTimeout(1100); await p.keyboard.up('Enter');
    assert.equal(await p.locator('[data-training="next"]').isEnabled(), true);
    await activate(p, '[data-training="next"]');
    await tabTo(p, '#training-sweep');
    for (let n = 0; n < 3; n++) { await p.keyboard.press('End'); await p.keyboard.press('Home'); }
    assert.equal(await p.locator('[data-training="next"]').isEnabled(), true);
    await activate(p, '[data-training="next"]');
    await activate(p, '[data-training="quiz"]');
    for (const q of require('../src/data/quiz.json')) {
      if (q.type === 'pick-hotspot') {
        const names = await p.locator('.quiz__choices button').allTextContents();
        assert.deepEqual(names, [1, 2, 3, 4, 5, 6].map(n => 'Part ' + n));
      }
      await activate(p, `.quiz__choices [data-choice="${q.answer}"]`);
      assert.equal(await p.locator('.quiz__choices button:enabled').count(), 0);
      await activate(p, '[data-quiz="next"]');
    }
    assert.match(await p.locator('.quiz__score').innerText(), /8\/8/);
    pass('PASS completed without Skip, partial and full hold, six keyboard Sweep strokes; quiz 8/8 with neutral choices and answer locking');
    await activate(p, '[data-quiz="results"]');
    await tabTo(p, '#participant-name'); await p.keyboard.type('Keyboard QA'); await p.keyboard.press('Enter');
    const download = p.waitForEvent('download');
    await activate(p, '[data-pdf="report"]');
    const pdf = await download;
    await pdf.saveAs(path.join(__dirname, `t3.2-${stage}-report.pdf`));
    await activate(p, '[data-results="clear"]');
    await p.keyboard.press('Escape');
    assert(await p.locator('[data-results="clear"]').evaluate(el => el === document.activeElement));
    pass('Results name/report and Clear cancel reachable by keyboard');
    for (const mode of ['configure', 'train', 'results']) {
      await activate(p, `.tab[href="#${mode}"]`);
      await activate(p, '.topbar__about');
      assert(await p.locator('#about-title').evaluate(el => el === document.activeElement));
      for (let n = 0; n < 18; n++) {
        await p.keyboard.press(n % 2 ? 'Shift+Tab' : 'Tab');
        assert(await p.evaluate(() => document.querySelector('#about').contains(document.activeElement)));
      }
      assert.equal(await p.locator('#about a').count(), 9);
      await p.keyboard.press('Escape');
      await p.waitForFunction(() => document.activeElement === document.querySelector('.topbar__about'));
    }
    await ready(p, 'about');
    await p.locator('#about[open]').waitFor();
    await p.keyboard.press('Escape');
    await p.waitForFunction(() => location.hash === '#configure');
    await activate(p, '.topbar__about');
    await p.goBack();
    await p.waitForFunction(() => !document.querySelector('#about').open);
    pass('About from all tabs and direct URL, focus/Tab containment/Escape/history');
    await ready(p, 'configure', true);
    await p.emulateMedia({ reducedMotion: 'no-preference' });
    await p.locator('.topbar__name').click();
    await p.waitForTimeout(5300);
    assert.equal(await p.evaluate(() => window.__aparDebug.controls.autoRotate), true);
    await activate(p, '#rotation-toggle');
    assert.equal(await p.evaluate(() => window.__aparDebug.controls.autoRotate), false);
    assert.equal(await p.locator('#rotation-toggle').getAttribute('aria-pressed'), 'true');
    await activate(p, '#rotation-toggle');
    await activate(p, '[data-part="gauge"]');
    await p.waitForTimeout(50);
    await p.emulateMedia({ reducedMotion: 'reduce' });
    await p.waitForTimeout(80);
    const staticCamera = await p.evaluate(() => window.__aparDebug.camera.position.toArray());
    await p.waitForTimeout(250);
    assert.deepEqual(await p.evaluate(() => window.__aparDebug.camera.position.toArray()), staticCamera);
    assert.equal(await p.evaluate(() => window.__aparDebug.scene.children.find(o => o.renderOrder === 999).scale.x), 1);
    assert.equal(await p.locator('#rotation-toggle').isDisabled(), true);
    pass('Live reduced motion stops auto-rotate/pulse/tween; pause/resume control');
    await p.close();
    for (const thrown of [false, true]) {
      const f = await page({ viewport: { width: 390, height: 844 }, isMobile: true });
      await f.addInitScript(thrown => {
        localStorage.setItem('apar3d:qa-keep', 'untouched');
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function(type, ...args) {
          if (/^webgl/.test(type)) { if (thrown) throw Error('QA renderer failure'); return null; }
          return original.call(this, type, ...args);
        };
      }, thrown);
      await f.goto(origin + '/#about');
      await f.locator('#webgl-fallback').waitFor();
      await f.locator('#about[open]').waitFor(); await f.keyboard.press('Escape');
      assert.equal(await f.locator('.tabs').isVisible(), false);
      assert.equal(await f.locator('#splash').isVisible(), false);
      assert.equal(await f.locator('#canvas-root canvas').count(), 0);
      assert.equal(await f.locator('#webgl-fallback img').evaluate(el => el.complete && el.naturalWidth > 0), true);
      await activate(f, '[data-lang="id"]');
      assert.match(await f.locator('#webgl-fallback h1').innerText(), /tidak tersedia/);
      await activate(f, '.topbar__about');
      assert.match(await f.locator('#about').innerText(), /Direncanakan: analytics tanpa cookie/);
      await f.keyboard.press('Escape');
      assert.equal(await f.evaluate(() => localStorage.getItem('apar3d:qa-keep')), 'untouched');
      await shot(f, thrown ? 'fallback-throw' : 'fallback');
      await f.close();
    }
    pass('No WebGL and thrown renderer: bilingual fallback image/About/direct hash, hidden dead controls, storage preserved');
    assert.deepEqual(report.errors, []);
  } finally { save(); await browser.close(); }
})().catch(e => { report.failure = String(e.stack); save(); console.error(e); process.exitCode = 1; });
