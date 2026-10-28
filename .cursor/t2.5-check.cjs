const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const origin = process.argv[2] || 'http://localhost:5183';
const prefix = origin.includes('5183') ? 't2.5-dev' : 't2.5';
const questions = require('../src/data/quiz.json');
const report = { date: '2026-10-28', origin, checks: [], errors: [], images: [] };
const folder = path.join(__dirname, 't2.5-pdfs');
fs.mkdirSync(folder, { recursive: true });
const save = () => fs.writeFileSync(path.join(__dirname, `${prefix}-qa.json`), JSON.stringify(report, null, 2));
const pass = (name, detail) => { report.checks.push({ name, detail }); save(); console.log('PASS', name); };
const button = (p, type) => p.locator(`[data-pdf="${type}"]`);
const nav = (p, mode) => p.locator(`.tab[href="#${mode}"]`).click();
function attempt(score, i = 0) {
  const start = Date.parse('2026-10-28T01:00:00.000Z') + i * 60000;
  return { id: (i + 1).toString(16).padStart(32, '0'), startedAt: new Date(start).toISOString(),
    finishedAt: new Date(start + 20000).toISOString(), durationSec: 20, score, total: 8, passed: score >= 6,
    answers: questions.map((q, index) => ({ qId: q.id, correct: index < score,
      given: index < score ? q.answer : q.type === 'choice' ? q.choices.find(c => c.id !== q.answer).id : 'body' })) };
}
async function ready(p, hash = 'results', debug = false) {
  await p.goto(`${origin}/${debug ? '?debug' : ''}#${hash}`);
  await p.waitForFunction(() => getComputedStyle(document.querySelector('#splash')).opacity === '0');
}
async function seed(p, attempts) {
  await p.evaluate(attempts => localStorage.setItem('apar3d:attempts', JSON.stringify({ schemaVersion: 1, attempts })), attempts);
  await nav(p, 'configure'); await nav(p, 'results');
}
async function download(p, type, filename) {
  const next = p.waitForEvent('download');
  await button(p, type).click();
  const file = await next;
  assert.match(file.suggestedFilename(), new RegExp(`^apar-${type}-(en|id)-\\d{4}-\\d{2}-\\d{2}\\.pdf$`));
  if (filename) await file.saveAs(path.join(folder, filename));
  else await file.delete();
  await p.waitForFunction(type => document.querySelector(`[data-pdf="${type}"]`).getAttribute('aria-busy') === 'false', type);
  return file.suggestedFilename();
}
async function camera(p) {
  return p.evaluate(() => {
    const { camera, controls, renderer, scene, model } = window.__aparDebug;
    const debug = []; model.traverse(o => { if (o.userData.debugMarker) debug.push(o.visible); });
    return { camera: camera.position.toArray(), target: controls.target.toArray(), quaternion: camera.quaternion.toArray(),
      size: [renderer.domElement.width, renderer.domElement.height], ratio: renderer.getPixelRatio(),
      meshes: renderer.info.memory.geometries, textures: renderer.info.memory.textures,
      ring: scene.children.find(o => o.renderOrder === 999)?.visible, debug };
  });
}
async function installCaptureProbe(p) {
  await p.evaluate(() => {
    const original = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function(type, ...args) {
      if (type === 'image/jpeg' && this === document.querySelector('#canvas-root canvas')) {
        if (window.__captureFail) throw Error('QA capture fault');
        const result = original.call(this, type, ...args);
        window.__captureImage = result;
        return result;
      }
      return original.call(this, type, ...args);
    };
  });
}
async function inspectImage(p) {
  return p.evaluate(async () => {
    const image = new Image(); image.src = window.__captureImage; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
    const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let left = image.width, top = image.height, right = 0, bottom = 0, count = 0;
    for (let y = 0; y < image.height; y += 2) for (let x = 0; x < image.width; x += 2) {
      const i = (y * image.width + x) * 4;
      if (pixels[i] + pixels[i + 1] + pixels[i + 2] > 150) {
        left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y); count++;
      }
    }
    return { size: [image.width, image.height], bounds: [left, top, right, bottom], count };
  });
}
async function delayed(p, type) {
  let release;
  let reached;
  let continued;
  const gate = new Promise(resolve => { release = resolve; });
  const seen = new Promise(resolve => { reached = resolve; });
  const done = new Promise(resolve => { continued = resolve; });
  const pattern = new RegExp(`/pdf-${type}[^/]*\\.js(?:\\?.*)?$`);
  await p.route(pattern, async route => { reached(); await gate; await route.continue(); continued(); });
  await button(p, type).click();
  await seen;
  return async () => { release(); await done; await p.unroute(pattern); };
}
async function hit(p, locator) {
  await locator.evaluate(el => el.scrollIntoView({ block: 'center' }));
  assert.ok(await locator.evaluate(el => {
    const b = el.getBoundingClientRect(), panel = el.closest('.panel__body').getBoundingClientRect();
    const top = Math.max(b.top, panel.top, 0), bottom = Math.min(b.bottom, panel.bottom, innerHeight);
    return bottom > top && el.contains(document.elementFromPoint(b.x + b.width / 2, (top + bottom) / 2));
  }), 'export must be reachable');
  assert.ok((await locator.boundingBox()).height >= 44);
}
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const newPage = async options => {
    const p = await browser.newPage({ viewport: { width: 1365, height: 900 }, locale: 'id-ID', reducedMotion: 'reduce', ...options });
    p.on('pageerror', e => report.errors.push(String(e)));
    p.on('console', m => { if (m.type() === 'error' && !/404|net::ERR_FAILED/.test(m.text())) report.errors.push(m.text()); });
    return p;
  };
  try {
    const p = await newPage(); const requests = [];
    p.on('request', r => requests.push(r.url()));
    await ready(p); assert.ok(await button(p, 'report').isDisabled());
    await seed(p, [attempt(5, 1), attempt(8)]);
    assert.equal(requests.filter(u => /jspdf|pdf-report|pdf-spec|html2canvas|purify/.test(u)).length, 0);
    await p.locator('#participant-name').fill('  Barkah Mauludi  ');
    await download(p, 'report', `${prefix}-report-id.pdf`);
    await p.locator('[data-lang="en"]').click();
    await download(p, 'report', `${prefix}-report-en.pdf`);
    assert.ok(requests.some(u => /jspdf/.test(u)));
    assert.ok(!requests.some(u => /html2canvas|purify|index\.es-/.test(u)));
    await p.locator('#participant-name').fill('名字🔥');
    await button(p, 'report').click();
    await p.getByText('This PDF font cannot display', { exact: false }).waitFor();
    assert.equal(await p.locator('#participant-name').inputValue(), '名字🔥');
    await p.locator('#participant-name').fill('José D’Angelo');
    await download(p, 'report', `${prefix}-name-latin.pdf`);
    await p.locator('#participant-name').fill(''); await download(p, 'report', `${prefix}-name-empty.pdf`);
    await p.locator('#participant-name').fill('B'.repeat(60)); await download(p, 'report', `${prefix}-name-long.pdf`);
    await p.evaluate(() => { const set = Storage.prototype.setItem; Storage.prototype.setItem = function(k,v) { if(k==='apar3d:participantName') throw Error('QA name write'); return set.call(this,k,v); }; });
    await p.locator('#participant-name').fill('Draft gagal simpan');
    await download(p, 'report', `${prefix}-name-draft.pdf`);
    await p.evaluate(() => localStorage.setItem('apar3d:attempts', '{'));
    await nav(p, 'configure'); await nav(p, 'results'); assert.ok(await button(p, 'report').isDisabled());
    pass('Report downloads, latest 5/8, EN/ID, optional/60-character/Latin names, unsupported-name feedback, failed-save draft and corrupt history; PDF libraries load only on export');
    await p.close();

    const s = await newPage(); await ready(s, 'configure', true); await installCaptureProbe(s);
    for (const lang of ['id', 'en']) {
      await s.locator(`[data-lang="${lang}"]`).click();
      await s.locator('[data-agent="co2"]').click(); await s.locator('[data-capacity="9kg"]').click();
      await s.locator('[data-color="silver"]').click(); await s.locator('.config-bracket input').check();
      const before = await camera(s); await download(s, 'spec', `${prefix}-spec-${lang}.pdf`);
      assert.deepEqual(await camera(s), before);
    }
    for (const capacity of ['1kg', '3kg', '6kg', '9kg']) for (const color of ['red', 'yellow', 'silver']) for (const bracket of [false, true]) {
      await s.locator(`[data-capacity="${capacity}"]`).click(); await s.locator(`[data-color="${color}"]`).click();
      await s.locator('.config-bracket input').setChecked(bracket);
      const before = await camera(s); await download(s, 'spec'); assert.deepEqual(await camera(s), before);
      const image = await inspectImage(s);
      assert.deepEqual(image.size, [1200, 900]); assert.ok(image.count > 5000);
      assert.ok(image.bounds[0] > 10 && image.bounds[1] > 10 && image.bounds[2] < 1190 && image.bounds[3] < 890, 'model fits capture');
      report.images.push({ capacity, color, bracket, ...image });
    }
    await s.locator('[data-hotspot="pin"]:visible').click(); await s.waitForTimeout(100);
    const focused = await camera(s); assert.equal(focused.ring, true);
    await download(s, 'spec'); assert.deepEqual(await camera(s), focused);
    await s.evaluate(() => { const {camera,controls,requestRender}=window.__aparDebug; camera.position.set(-2,1.3,2); controls.update(); requestRender(); });
    const orbited = await camera(s); await download(s, 'spec'); assert.deepEqual(await camera(s), orbited);
    await s.evaluate(() => window.__captureFail = true); const beforeFail = await camera(s);
    await button(s, 'spec').click(); await s.getByText('The PDF could not be created.', { exact: false }).waitFor();
    assert.deepEqual(await camera(s), beforeFail);
    await s.evaluate(() => window.__captureFail = false); await download(s, 'spec');
    pass('Active unsaved spec, CO2 9kg/bracket prices EN/ID, 24 capacity/color/bracket captures, 1200x900 nonblank image bounds, orbit/close-up/debug/highlight/resource restoration and failed capture retry');
    await s.close();

    const d = await newPage(); await ready(d); await seed(d, [attempt(6)]);
    const release = await delayed(d, 'report'); let downloads = 0; d.on('download', () => downloads++);
    assert.ok(await button(d, 'report').isDisabled()); await button(d, 'report').evaluate(el => { el.click(); el.click(); });
    await d.locator('[data-lang="en"]').click(); await d.locator('#participant-name').fill('Changed after click');
    const pending = d.waitForEvent('download'); await release(); const frozen = await pending;
    await frozen.saveAs(path.join(folder, `${prefix}-snapshot-report.pdf`)); await d.waitForTimeout(80); assert.equal(downloads, 1);
    await d.close();
    for (const cancel of ['navigate', 'clear']) {
      const c = await newPage(); await ready(c); await seed(c, [attempt(8)]); let count = 0; c.on('download', () => count++);
      const release = await delayed(c, 'report');
      if (cancel === 'navigate') await nav(c, 'configure');
      else { await c.locator('[data-results="clear"]').click(); await c.locator('[data-results="confirm"]').click(); }
      await release(); await c.waitForTimeout(700); assert.equal(count, 0);
      if (cancel === 'clear') assert.ok(await button(c, 'report').isDisabled());
      await c.close();
    }
    const cs = await newPage(); await ready(cs, 'configure'); await installCaptureProbe(cs);
    const releaseSpec = await delayed(cs, 'spec');
    await cs.locator('[data-agent="co2"]').click(); await cs.locator('[data-capacity="9kg"]').click(); await cs.locator('[data-lang="en"]').click();
    const pendingSpec = cs.waitForEvent('download'); await releaseSpec(); const frozenSpec = await pendingSpec;
    await frozenSpec.saveAs(path.join(folder, `${prefix}-snapshot-spec.pdf`)); await cs.close();
    const fi = await newPage(); await ready(fi); await seed(fi, [attempt(6)]);
    const pattern = /\/pdf-report[^/]*\.js(?:\?.*)?$/;
    await fi.route(pattern, route => route.abort()); await button(fi, 'report').click();
    await fi.getByText('PDF belum dapat dibuat.', { exact: false }).waitFor(); assert.ok(!await button(fi, 'report').isDisabled());
    await fi.unroute(pattern); await download(fi, 'report'); await fi.close();
    pass('Frozen report/spec data and language across delayed import, duplicate clicks rejected, pending report cancelled on navigation/Clear, failed import feedback and retry');

    const layout = await newPage(); await ready(layout); await seed(layout, [attempt(6)]);
    let combinations = 0;
    for (const [width,height] of [[360,800],[390,844],[768,1024],[844,390],[390,420]]) {
      await layout.setViewportSize({width,height});
      for (const lang of ['en','id']) {
        await layout.locator(`[data-lang="${lang}"]`).click();
        for (const scale of [1,2]) {
          await layout.addStyleTag({ content: `.results {font-size:${14*scale}px} .results__name input{font-size:${16*scale}px} .config-options [data-pdf], .config-status{font-size:${14*scale}px!important}` });
          for (const mode of ['results','configure']) {
            await nav(layout,mode);
            for (let snap=0;snap<2;snap++) {
              await layout.locator('.panel__handle').click(); await layout.waitForTimeout(30);
              const b = button(layout, mode==='results'?'report':'spec'); await hit(layout,b);
              assert.equal(await layout.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
            }
          }
          combinations++;
        }
      }
    }
    await layout.setViewportSize({width:1365,height:900}); await nav(layout,'results'); await layout.locator('[data-lang="id"]').click();
    await button(layout,'report').scrollIntoViewIfNeeded(); await layout.screenshot({path:path.join(__dirname,`${prefix}-desktop.png`)});
    await layout.close();
    const touch=await newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
    await ready(touch); await seed(touch,[attempt(6)]); await touch.locator('.panel__handle').tap();
    await button(touch,'report').scrollIntoViewIfNeeded(); const touchFile=touch.waitForEvent('download'); await button(touch,'report').tap(); await (await touchFile).delete();
    await touch.screenshot({path:path.join(__dirname,`${prefix}-mobile.png`)});
    await nav(touch,'configure'); await button(touch,'spec').scrollIntoViewIfNeeded(); const specFile=touch.waitForEvent('download'); await button(touch,'spec').tap(); await (await specFile).delete();
    await button(touch,'spec').focus(); const keyboardFile=touch.waitForEvent('download'); await touch.keyboard.press('Enter'); await (await keyboardFile).delete();
    await touch.close();
    pass('Export buttons reachable at 20 viewport/language/text combinations x two snaps (40 states, 80 button checks), mobile touch downloads, keyboard and reduced motion', {combinations, snapStates:combinations*2, buttonChecks:combinations*4});
    assert.deepEqual(report.errors, []);
  } catch(error) {report.failure=String(error.stack);save();throw error;}
  finally {await browser.close();save();}
})();
