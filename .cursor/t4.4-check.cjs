const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const origin = process.argv[2] || 'http://localhost:4198';
const stage = process.argv.includes('--dev') ? 'dev' : 'production';
const baseline = process.argv.includes('--baseline');
const prefix = `t4.4-${stage}${baseline ? '-baseline' : ''}`;
const report = { origin, stage, date: '2026-10-30', checks: [], states: [], errors: [], warnings: [], failures: [] };
const file = name => path.join(__dirname, `${prefix}-${name}`);
const save = () => fs.writeFileSync(file('qa.json'), JSON.stringify(report, null, 2));
const pass = (name, detail) => { report.checks.push({ name, detail }); save(); console.log('PASS', name); };
const settle = p => p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
const selector = '.hotspot-pins:not([hidden]) .hotspot-pin:not([hidden])';
async function snap(p, name) {
  if (p.viewportSize().width >= 1024) return;
  for (let i = 0; i < 3 && await p.locator('#panel').getAttribute('data-snap') !== name; i++) {
    await p.locator('.panel__handle').click(); await p.waitForTimeout(300);
  }
  assert.equal(await p.locator('#panel').getAttribute('data-snap'), name);
}
async function view(p, spec) {
  await p.evaluate(spec => {
    const d = window.__aparDebug;
    d.controls.pauseAutoRotate();
    if (spec.position) {
      d.camera.position.fromArray(spec.position); d.controls.target.fromArray(spec.target);
    } else {
      d.controls.target.set(0, 0.6, 0);
      d.camera.position.set(Math.sin(spec.angle) * 3, 1.5, Math.cos(spec.angle) * 3);
    }
    d.controls.update(); d.controls.dispatchEvent({ type: 'change' }); d.requestRender();
  }, spec);
  await settle(p);
}
async function measure(p, tag) {
  await p.evaluate(() => window.__aparDebug.controls.pauseAutoRotate());
  await settle(p);
  const state = await p.evaluate(() => {
    const root = document.querySelector('#canvas-root').getBoundingClientRect();
    const d = window.__aparDebug, layer = document.querySelector('.hotspot-pins:not([hidden])');
    d.camera.updateMatrixWorld(); d.model.updateWorldMatrix(true, true);
    const pins = [...layer.querySelectorAll('.hotspot-pin')].map((el, i) => {
      const r = el.getBoundingClientRect(), s = el.firstElementChild.getBoundingClientRect();
      const line = layer.querySelectorAll('line')[i];
      const world = d.model.localToWorld(new d.Vector3(...d.hotspots[i].pinPosition));
      const ndc = world.clone().project(d.camera);
      const anchor = [root.left + (ndc.x + 1) * root.width / 2, root.top + (1 - ndc.y) * root.height / 2];
      const points = [[r.x + r.width / 2, r.y + r.height / 2], [r.x + 2, r.y + r.height / 2],
        [r.right - 2, r.y + r.height / 2], [r.x + r.width / 2, r.y + 2], [r.x + r.width / 2, r.bottom - 2]];
      return { id: el.dataset.hotspot, number: el.textContent, hidden: el.hidden, label: el.getAttribute('aria-label'),
        box: r.toJSON(), disc: [s.width, s.height],
        hits: points.map(([x,y]) => document.elementFromPoint(x,y)?.closest('.hotspot-pin')?.dataset.hotspot || null),
        anchor, line: ['x1','y1','x2','y2'].map(k => Number(line.getAttribute(k))),
        lineHidden: line.style.display === 'none' };
    });
    return { root: root.toJSON(), pins, overflow: document.documentElement.scrollWidth > innerWidth };
  });
  const failures = [];
  const visible = state.pins.filter(pin => !pin.hidden);
  state.pins.forEach((pin, i) => {
    if (pin.number !== String(i + 1) || !pin.label.includes(String(i + 1))) failures.push(`${pin.id}: numbering`);
    if (pin.hidden !== pin.lineHidden) failures.push(`${pin.id}: line visibility`);
  });
  for (const pin of visible) {
    const { box: b, id, line: l, anchor: a } = pin;
    if (b.width < 43.99 || b.height < 43.99) failures.push(`${id}: small hitbox`);
    if (pin.disc.some(x => Math.abs(x - 28) > 0.1)) failures.push(`${id}: disc size`);
    if (pin.hits.some(hit => hit !== id)) failures.push(`${id}: obscured hitbox ${pin.hits}`);
    if (b.left < state.root.left - 0.1 || b.top < state.root.top - 0.1 ||
        b.right > state.root.right + 0.1 || b.bottom > state.root.bottom + 0.1) failures.push(`${id}: outside canvas`);
    // OrbitControls suppresses subpixel change events near the end of a tween.
    if (Math.abs(l[0] + state.root.left - a[0]) > 1 || Math.abs(l[1] + state.root.top - a[1]) > 1 ||
        Math.abs(l[2] + state.root.left - b.x - b.width / 2) > 0.2 ||
        Math.abs(l[3] + state.root.top - b.y - b.height / 2) > 0.2) failures.push(`${id}: leader anchor`);
  }
  for (let i = 0; i < visible.length; i++) for (let j = i + 1; j < visible.length; j++) {
    const a = visible[i].box, b = visible[j].box;
    const gap = Math.max(a.left - b.right, b.left - a.right, a.top - b.bottom, b.top - a.bottom);
    if (gap < 3.9) failures.push(`${visible[i].id}/${visible[j].id}: gap ${gap}`);
  }
  if (state.overflow) failures.push('horizontal overflow');
  report.states.push({ tag, ...state, failures });
  if (failures.length) {
    report.failures.push({ tag, failures }); save();
    if (report.failures.length === 1) await p.screenshot({ path:file('first-failure.png') });
    if (!baseline) throw Error(JSON.stringify({tag, failures}));
  }
  return visible;
}
async function cameraState(p) {
  return p.evaluate(() => ({ position: window.__aparDebug.camera.position.toArray(), target: window.__aparDebug.controls.target.toArray() }));
}
async function openClose(p, id, lang, method = 'pointer', edge = false) {
  const before = await cameraState(p);
  const pin = p.locator(`${selector}[data-hotspot="${id}"]`);
  const b = await pin.boundingBox(); assert(b, id);
  if (method === 'keyboard') {
    await p.locator('#canvas-root canvas').focus();
    for (let i = 0; i < 80 && !await pin.evaluate(el => el === document.activeElement); i++) await p.keyboard.press('Tab');
    assert(await pin.evaluate(el => el === document.activeElement), 'pin reachable with Tab');
    assert(await pin.evaluate(el => getComputedStyle(el).outlineStyle !== 'none'), 'visible keyboard focus');
    await p.keyboard.press(id === 'pin' ? 'Space' : 'Enter');
  } else {
    const x = b.x + (edge ? 2 : b.width / 2), y = b.y + b.height / 2;
    if (p.viewportSize().width < 1024) await p.touchscreen.tap(x,y); else await p.mouse.click(x,y);
  }
  await p.locator('.hotspot-info__card:not([hidden])').waitFor(); await p.waitForTimeout(850);
  assert.equal(await p.locator('#hotspot-title').innerText(), await p.evaluate(({id, lang}) => window.__aparDebug.hotspots.find(h=>h.id===id).title[lang], { id, lang }));
  await measure(p, `opened:${id}:${method}:${lang}`);
  if (method === 'keyboard') await p.keyboard.press('Escape');
  else if (p.viewportSize().width < 1024) await p.locator('.hotspot-info__close').tap();
  else await p.locator('.hotspot-info__close').click();
  await p.waitForTimeout(850);
  const after = await cameraState(p);
  for (const key of ['position','target']) before[key].forEach((x,i) => assert(Math.abs(x - after[key][i]) < 0.001, 'restored camera'));
}
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width:1280,height:900 }, hasTouch:true, reducedMotion:'reduce' });
    const p = await context.newPage();
    p.on('pageerror', e => report.errors.push(String(e)));
    p.on('console', m => { if(m.type()==='error' && !m.text().includes('404')) report.errors.push(m.text());
      if(m.type()==='warning') report.warnings.push(m.text()); });
    await p.goto(`${origin}/?debug#configure`);
    await p.waitForFunction(() => window.__aparDebug && getComputedStyle(document.querySelector('#splash')).opacity === '0');
    for (const [width,height] of [[1280,900],[390,844],[360,800],[844,390]]) {
      await p.setViewportSize({width,height}); await p.waitForTimeout(350);
      for (const lang of ['en','id']) {
        await p.locator(`[data-lang="${lang}"]`).click();
        for (const size of ['1kg','3kg','6kg','9kg']) {
          await p.locator(`[data-capacity="${size}"]`).click();
          for (const sheet of width>=1024 ? ['half'] : ['peek','half','full']) {
            await snap(p,sheet);
            for (const angle of [0,Math.PI/2,Math.PI]) {
              await view(p,{angle}); await measure(p,`${width}x${height}:${lang}:${size}:${sheet}:${angle.toFixed(2)}`);
            }
          }
        }
      }
      pass(`layout ${width}x${height}: languages/capacities/snaps/three angles`);
    }
    for (const [width,height] of [[1280,900],[390,844]]) {
      await p.setViewportSize({width,height}); await p.waitForTimeout(350); await snap(p,'half');
      await p.locator('[data-capacity="6kg"]').click();
      for (const lang of ['en','id']) {
        await p.locator(`[data-lang="${lang}"]`).click();
        for (const motion of ['reduce','no-preference']) {
          await p.emulateMedia({reducedMotion:motion}); await view(p,{angle:0});
          const ids = await p.evaluate(()=>window.__aparDebug.hotspots.map(h=>h.id));
          for (const id of ids) {
            const accessible = p.locator(`[data-part="${id}"]`);
            await accessible.click(); await p.waitForTimeout(850);
            await measure(p,`closeup:${width}:${lang}:${motion}:${id}`);
            await p.keyboard.press('Escape'); await p.waitForTimeout(850);
          }
        }
      }
      await p.emulateMedia({reducedMotion:'no-preference'}); await p.locator('[data-lang="en"]').click();
      await view(p,{angle:Math.PI/4});
      const visible = await measure(p,`interaction:${width}`);
      for (const {id} of visible) await openClose(p,id,'en','pointer',true);
      for (const id of ['handle','pin']) {
        await view(p,{angle:Math.PI/4}); await openClose(p,id,'en','keyboard');
      }
      await view(p,{angle:0}); await p.screenshot({path:file(`${width}.png`)});
      const front = (await measure(p,`occlusion-front:${width}`)).map(x=>x.id);
      await view(p,{angle:Math.PI}); const back = (await measure(p,`occlusion-back:${width}`)).map(x=>x.id);
      assert.notDeepEqual(front,back,'orbit changes visible surfaces');
      await view(p,{angle:0}); assert.deepEqual((await measure(p,`occlusion-return:${width}`)).map(x=>x.id),front);
      pass(`closeups, edge input, Tab/Enter/Space/Escape, restored camera, occlusion ${width}`);
    }
    await p.setViewportSize({width:390,height:844}); await snap(p,'full');
    await p.locator('#canvas-root canvas').focus();
    for(let i=0;i<10;i++) await p.keyboard.press('Tab');
    await p.locator('.tab[href="#train"]').click();
    await p.locator('[data-training="start"]').click();
    for(let i=0;i<4;i++){await p.locator('[data-training="skip"]').click();await p.locator('[data-training="next"]').click();}
    await p.locator('[data-training="quiz"]').click();
    for(let i=0;i<5;i++){
      if(i===1 || i===4){
        const id=i===1?'pin':'gauge'; await p.locator(`${selector}[data-hotspot="${id}"]`).waitFor(); await p.waitForTimeout(850);
        await measure(p,`quiz:q${i+1}`); await p.locator(`${selector}[data-hotspot="${id}"]`).tap();
        assert.equal(await p.locator('.quiz__feedback').getAttribute('data-correct'),'true');
        assert.equal(await p.locator(`${selector}:enabled`).count(),0);
      } else await p.locator('.quiz [data-choice]').first().click();
      await p.locator('[data-quiz="next"]').click();
    }
    pass('quiz q2 pin and q5 gauge via touch, answer locking');
    assert.deepEqual(report.errors,[]); assert.equal(report.failures.length,0,'all geometry checks');
    pass('no unexpected console/page errors');
    await context.close();
  } catch(e) { report.error=String(e.stack||e); save(); console.error(report.error); process.exitCode=1; }
  finally { save(); await browser.close(); }
})();
