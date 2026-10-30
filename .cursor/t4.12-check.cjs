const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const origin = process.argv[2] || 'http://localhost:4202';
const stage = process.argv.includes('--dev') ? 'dev' : 'production';
const report = { origin, stage, checks: [], states: [], errors: [], warnings: [] };
const file = name => path.join(__dirname, `t4.12-${stage}-${name}`);
const save = () => fs.writeFileSync(file('qa.json'), JSON.stringify(report, null, 2));
const pass = name => { report.checks.push(name); save(); console.log('PASS', name); };
const settle = p => p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
const emergency = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/emergency.json')));
const questions = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/quiz.json')));
async function ready(p, hash = 'configure') {
  await p.goto(`${origin}/#${hash}`);
  await p.waitForFunction(() => getComputedStyle(document.querySelector('#splash')).opacity === '0');
}
async function scaleText(p, scale) {
  await p.evaluate(scale => {
    for (const size of [12,14,16,20,28,40])
      document.documentElement.style.setProperty(`--fs-${size}`, `${size * scale}px`);
  }, scale);
  await settle(p);
}
async function measure(p, tag, checkPanel = true) {
  await settle(p);
  const state = await p.evaluate(() => {
    const bar = document.querySelector('.topbar').getBoundingClientRect();
    const chrome = document.querySelector('.emergency-chrome');
    const box = el => el.getBoundingClientRect().toJSON();
    const hit = el => { const b = box(el); return el.contains(document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2)); };
    const links = [...chrome.querySelectorAll('a')].map(el => ({ box: box(el), href: el.href, text: el.textContent, hit: hit(el) }));
    const pins = [...document.querySelectorAll('.hotspot-pins:not([hidden]) .hotspot-pin:not([hidden]), .training-target:not([hidden]) .training-target__button:not([hidden])')]
      .map(el => ({ id: el.dataset.hotspot || 'training', box: box(el), hit: hit(el) }));
    const tabs = [...document.querySelectorAll('.tabs .tab')].filter(el => el.getClientRects().length)
      .map(el => ({box:box(el), hit:hit(el), clipped:el.scrollWidth > el.clientWidth + 1}));
    return { width: innerWidth, height: innerHeight, bar: bar.toJSON(), chrome: box(chrome), links, pins,
      tabs, note: document.querySelector('#emergency-chrome-note').textContent,
      noteBox: box(document.querySelector('#emergency-chrome-note')),
      topbarVariable: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--topbar-h')),
      panel: box(document.querySelector('#panel')), snap: document.querySelector('#panel').dataset.snap,
      overflow: document.documentElement.scrollWidth > innerWidth };
  });
  report.states.push({ tag, ...state });
  assert.equal(state.overflow, false, `${tag}: overflow`);
  assert.ok(Math.abs(state.bar.height - state.topbarVariable) < 1, `${tag}: reserved topbar height`);
  assert.ok(state.noteBox.bottom <= state.bar.bottom + 1, `${tag}: note fits topbar`);
  assert.ok(state.noteBox.right <= state.width + 1, `${tag}: note fits width`);
  assert.match(state.note, /112/);
  assert.deepEqual(state.links.map(x => x.href), [`tel:${emergency.fire}`, `tel:${emergency.general}`, emergency.sourceUrl]);
  for (const link of state.links) {
    assert.ok(link.box.width >= 43.9 && link.box.height >= 43.9, `${tag}: touch target`);
    assert.ok(link.hit, `${tag}: emergency link hit-test`);
    assert.ok(link.box.left >= 0 && link.box.right <= state.width + 1 && link.box.bottom <= state.height, `${tag}: link in viewport`);
  }
  if (checkPanel) assert.ok(state.panel.top >= state.bar.bottom - 1, `${tag}: panel clears header`);
  for (const tab of state.tabs) {
    assert.ok(tab.hit && !tab.clipped, `${tag}: tab reachable and text fits`);
    assert.ok(tab.box.bottom <= state.chrome.top + 1, `${tag}: tabs clear emergency row`);
  }
  for (const pin of state.pins) {
    assert.ok(pin.hit, `${tag}: visible pin hit-test`);
    assert.ok(pin.box.top >= state.bar.bottom, `${tag}: whole pin clears topbar`);
  }
  return state;
}
async function modal(p) {
  await p.locator('.topbar__about').click();
  await p.locator('#about[open]').waitFor();
  assert.equal(await p.locator('#about [data-emergency="fire"]').getAttribute('href'), 'tel:113');
  assert.equal(await p.locator('#about [data-emergency="general"]').getAttribute('href'), 'tel:112');
  await p.keyboard.press('Escape');
  assert.equal(await p.locator('#about').getAttribute('open'), null);
}
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  async function page(viewport, extra = {}) {
    const p = await browser.newPage({ viewport, reducedMotion: 'reduce', hasTouch: true, ...extra });
    p.on('pageerror', e => report.errors.push(String(e)));
    p.on('console', m => { if (m.type() === 'warning') report.warnings.push(m.text()); });
    return p;
  }
  try {
    for (const viewport of [{width:1280,height:900},{width:390,height:844},{width:360,height:800},{width:768,height:1024},{width:844,height:390},{width:1024,height:768}]) {
      const p = await page(viewport);
      await ready(p);
      for (const scale of (viewport.width === 1280 || viewport.width === 390 ? [1,2] : [1])) {
        await scaleText(p, scale);
        for (const lang of ['en','id']) {
          await p.locator(`[data-lang="${lang}"]`).click();
          assert.equal(await p.locator('.emergency-chrome [data-emergency="fire"]').innerText(), lang === 'id' ? 'Pemadam 113' : 'Fire department 113');
          assert.equal(await p.locator('.emergency-chrome [data-emergency="source"]').innerText(), lang === 'id' ? 'Sumber: Komdigi' : 'Source: Komdigi');
          for (const mode of ['configure','train','results']) {
            await p.locator(`.tab[href="#${mode}"]`).click();
            for (let snap = 0; snap < (viewport.width < 1024 ? 3 : 1); snap++) {
              await measure(p, `${viewport.width}x${viewport.height}/${scale}/${lang}/${mode}/${snap}`);
              await p.locator('#panel-body').evaluate(el => { el.scrollTop = el.scrollHeight; });
              await measure(p, `${viewport.width}/${scale}/${lang}/${mode}/${snap}/scroll`);
              if (viewport.width < 1024) await p.locator('.panel__handle').click();
            }
          }
        }
        if (scale === 2) await p.screenshot({path:file(`${viewport.width}-text200.png`)});
      }
      await scaleText(p, 1);
      await p.locator('.tab[href="#configure"]').click();
      await modal(p);
      await p.screenshot({ path: file(`${viewport.width}.png`) });
      await p.close();
    }
    pass('Responsive chrome: six viewports, EN/ID, desktop and phone 200% text, three snaps, three routes and panel scroll');
    for (const viewport of [{width:1280,height:900},{width:390,height:844}]) {
      const q = await page(viewport);
      await q.goto(`${origin}/?debug#configure`);
      await q.waitForFunction(() => window.__aparDebug && getComputedStyle(document.querySelector('#splash')).opacity === '0');
      for (const scale of viewport.width === 1280 ? [1,2] : [1]) {
        await scaleText(q, scale);
        for (const id of ['handle','pin','nozzle','gauge','label','body']) {
          await q.locator(`[data-part="${id}"]`).click();
          await measure(q, `closeup/${viewport.width}/${scale}/${id}`);
          await q.keyboard.press('Escape');
        }
      }
      await scaleText(q, 1);
      for (const angle of [0,Math.PI / 2,Math.PI]) {
        await q.evaluate(angle => {
          const d = window.__aparDebug; d.controls.pauseAutoRotate();
          d.controls.target.set(0,0.6,0); d.camera.position.set(Math.sin(angle)*3,1.5,Math.cos(angle)*3);
          d.controls.update(); d.controls.dispatchEvent({type:'change'}); d.requestRender();
        }, angle);
        await measure(q, `orbit/${viewport.width}/${angle}`);
      }
      await q.close();
    }
    pass('All six closeups and three orbit angles desktop/phone, desktop 200% chrome: visible pins remain clickable');
    for (const viewport of [{width:390,height:844},{width:844,height:390}]) {
    const p = await page(viewport);
    await ready(p, 'train');
    await p.locator('[data-training="start"]').click();
    for (let i = 0; i < 4; i++) {
      await measure(p, `PASS/${i}`);
      const interact = p.locator('[data-training="interact"]');
      if (i < 2) await interact.click();
      if (i === 2) {
        await interact.focus(); await p.keyboard.down('Space');
        await p.waitForTimeout(1200); await p.keyboard.up('Space');
      }
      if (i === 3) {
        const slider = p.locator('#training-sweep'); await slider.focus();
        for (let stroke = 0; stroke < 6; stroke++) await p.keyboard.press(stroke % 2 ? 'Home' : 'End');
      }
      assert.equal(await p.locator('[data-training="next"]').isEnabled(), true);
      await p.locator('[data-training="next"]').click();
    }
    await measure(p, 'PASS/done');
    await p.locator('[data-training="quiz"]').click();
    for (let i = 0; i < questions.length; i++) {
      await measure(p, `quiz/${i}/question`);
      await p.locator(`[data-choice="${questions[i].answer}"]`).click();
      await measure(p, `quiz/${i}/feedback`);
      await p.locator('[data-quiz="next"]').click();
    }
    await measure(p, 'quiz/summary');
    await p.locator('.tab[href="#results"]').click();
    assert.equal(await p.locator('.results__answers tbody tr').count(), 8);
    await measure(p, 'Results/with-attempt');
    await p.screenshot({path:file(`results-${viewport.width}.png`)});
    pass(`${viewport.width}x${viewport.height}: PASS without Skip, all eight quiz questions/feedback/summary, Results with saved attempt`);
    await p.locator('.topbar__about').focus();
    for (const key of ['fire','general','source']) {
      await p.keyboard.press('Tab');
      assert.equal(await p.evaluate(() => document.activeElement.dataset.emergency), key);
      assert.notEqual(await p.evaluate(() => getComputedStyle(document.activeElement).outlineStyle), 'none');
    }
    await p.evaluate(() => {
      window.emergencyClicks = [];
      document.querySelector('.emergency-chrome').addEventListener('click', e => {
        const link = e.target.closest('a');
        if (link) { e.preventDefault(); window.emergencyClicks.push(link.href); }
      });
    });
    for (const key of ['fire','general','source']) {
      const link = p.locator(`.emergency-chrome [data-emergency="${key}"]`);
      await link.tap(); await link.focus(); await p.keyboard.press('Enter');
    }
    assert.deepEqual(await p.evaluate(() => window.emergencyClicks), ['tel:113','tel:113','tel:112','tel:112',emergency.sourceUrl,emergency.sourceUrl]);
    assert.equal(await p.locator('.emergency-chrome [data-emergency="source"]').getAttribute('target'), '_blank');
    await p.locator('[data-results="clear"]').click();
    assert.equal(await p.evaluate(() => document.activeElement.closest('dialog') !== null), true);
    await p.keyboard.press('Escape');
    await modal(p);
    await p.close();
    pass(`${viewport.width}x${viewport.height}: Tab order, focus, touch and Enter link dispatch (default prevented: no calls), modal focus and About contacts`);
    }
    for (const kind of ['loading','error','fallback']) {
      for (const viewport of [{width:1280,height:900},{width:390,height:844}]) {
        const q = await page(viewport);
        let release;
        const barrier = new Promise(r => { release = r; });
        if (kind === 'fallback') await q.addInitScript(() => {
          const native = HTMLCanvasElement.prototype.getContext;
          HTMLCanvasElement.prototype.getContext = function(type, ...args) { return /webgl/i.test(type) ? null : native.call(this,type,...args); };
        });
        else await q.route('**/models/apar.glb', async route => { if(kind === 'loading') await barrier; await route.abort(); });
        await q.goto(`${origin}/#configure`);
        await q.locator('.emergency-chrome a[href="tel:113"]').waitFor();
        if (kind === 'error') await q.locator('.splash__retry:visible').waitFor();
        if (kind === 'fallback') await q.locator('#webgl-fallback:visible').waitFor();
        await measure(q, `${kind}/${viewport.width}`, false);
        await q.locator('[data-lang="id"]').click();
        await measure(q, `${kind}/${viewport.width}/id`, false);
        await modal(q);
        await q.screenshot({path:file(`${kind}-${viewport.width}.png`)});
        release(); await q.close();
      }
    }
    pass('Chrome before GLB load, load error and WebGL fallback, desktop/phone, EN/ID and About');
    assert.deepEqual(report.errors, []);
  } catch (e) { report.failure = String(e.stack); console.error(report.failure); process.exitCode = 1; }
  finally { save(); await browser.close(); }
})();
