const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const origin = process.argv[2] || 'http://localhost:4182';
const report = { date: '2026-10-28', origin, checks: [], errors: [] };
const save = () => fs.writeFileSync(path.join(__dirname, origin.includes('5182') ? 't2.2-dev-qa.json' : 't2.2-qa.json'), JSON.stringify(report, null, 2));
const pass = (name, detail) => { report.checks.push({ name, detail }); save(); console.log('PASS', name); };
const action = (p, name) => p.locator(`[data-training="${name}"]`);
const target = p => p.locator('.training-target__button');
const slider = p => p.locator('#training-sweep');
async function snapshot(p) {
  return p.evaluate(() => {
    const { scene, renderer, model, Vector3 } = window.__aparDebug;
    const root = scene.getObjectByName('training-effects');
    const fire = scene.getObjectByName('training-fire');
    const spray = scene.getObjectByName('training-spray');
    const line = root.children.find(o => o.isLine);
    const nozzle = model.localToWorld(new Vector3(...window.__aparDebug.hotspots.find(h => h.id === 'nozzle').pinPosition));
    return { root: root.visible, fire: root.visible && fire.visible, level: fire.scale.x,
      spray: root.visible && spray.visible, line: root.visible && line.visible,
      nozzleError: nozzle.distanceTo(new Vector3().fromBufferAttribute(line.geometry.attributes.position, 0)),
      lineEnd: [...line.geometry.attributes.position.array].slice(3), particles: [fire.geometry.attributes.position.count, spray.geometry.attributes.position.count],
      memory: renderer.info.memory, calls: renderer.info.render.calls };
  });
}
async function ready(p, debug = true) {
  await p.goto(`${origin}/${debug ? '?debug' : ''}#train`);
  await p.waitForFunction(() => getComputedStyle(document.querySelector('#splash')).opacity === '0');
  await action(p, 'start').click();
  await p.waitForTimeout(800);
}
async function next(p) { await action(p, 'next').click(); await p.waitForTimeout(800); }
async function key(p, key) { await slider(p).focus(); await slider(p).press(key); }
async function frames(p, ms = 1100) {
  return p.evaluate(async ms => {
    const renderer = window.__aparDebug.renderer;
    const render = renderer.render;
    const times = [];
    renderer.render = function (...args) { times.push(performance.now()); return render.apply(this, args); };
    await new Promise(resolve => setTimeout(resolve, ms));
    renderer.render = render;
    const intervals = times.slice(1).map((t, i) => t - times[i]).sort((a,b) => a-b);
    return { renderedFrames: times.length, durationMs: ms, fps: times.length / ms * 1000,
      p95Ms: intervals.length ? intervals[Math.floor(intervals.length * .95)] : null };
  }, ms);
}
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1365, height: 900 }, locale: 'id-ID' });
    const p = await context.newPage();
    p.on('pageerror', e => report.errors.push(String(e)));
    p.on('console', m => { if (m.type() === 'error' && !m.text().includes('404')) report.errors.push(m.text()); });
    await ready(p);
    assert.equal((await snapshot(p)).fire, false);
    await target(p).click(); await next(p);
    assert.equal((await snapshot(p)).fire, false);
    await target(p).click();
    let s = await snapshot(p);
    assert.equal(s.fire, true); assert.equal(s.line, true); assert.equal(s.spray, false);
    assert.ok(s.nozzleError < 1e-6); assert.deepEqual(s.particles, [24,72]);
    await p.screenshot({ path: path.join(__dirname, 't2.2-aim-desktop.png') });
    pass('Pull and Aim / nozzle and fixed particle limits', s);
    await next(p);
    await target(p).focus(); await p.keyboard.down('Space'); await p.waitForTimeout(300);
    assert.equal((await snapshot(p)).spray, true);
    const drawCalls = await p.evaluate(() => {
      const {scene,camera,renderer}=window.__aparDebug;
      const root=scene.getObjectByName('training-effects');
      root.visible=false;renderer.render(scene,camera);const baseline=renderer.info.render.calls;
      root.visible=true;renderer.render(scene,camera);return{baseline,active:renderer.info.render.calls,added:renderer.info.render.calls-baseline};
    });
    assert.equal(drawCalls.added,3);
    pass('Effects add three draw calls with fire, spray and aiming line',drawCalls);
    await p.screenshot({ path: path.join(__dirname, 't2.2-squeeze-desktop.png') });
    await p.keyboard.up('Space');
    assert.equal((await snapshot(p)).spray, false); assert.equal(await action(p,'next').isDisabled(), true);
    await target(p).focus(); await p.keyboard.down('Enter'); await p.waitForTimeout(1150); await p.keyboard.up('Enter');
    assert.equal((await snapshot(p)).spray, false); assert.equal((await snapshot(p)).level, 1);
    assert.equal(await action(p,'next').isDisabled(), false);
    pass('Squeeze keyboard early release and one second success', await snapshot(p));
    await next(p);
    await key(p,'End');
    assert.equal((await snapshot(p)).spray, true);
    const right = (await snapshot(p)).lineEnd;
    await p.waitForTimeout(300);
    assert.equal((await snapshot(p)).spray, false);
    assert.ok(Math.abs((await snapshot(p)).level - 5/6) < .001);
    await key(p,'Home'); const left = (await snapshot(p)).lineEnd;
    assert.ok(left[0] < right[0]);
    await p.screenshot({ path: path.join(__dirname, 't2.2-sweep-desktop.png') });
    pass('Sweep direction and 180ms spray idle stop', { left, right });
    await p.waitForTimeout(300);
    const perf = await frames(p);
    pass('Desktop active fire rendered FPS (Chrome headless, no CPU throttle)', perf);
    for (const k of ['End','Home','End','Home']) await key(p,k);
    await p.waitForTimeout(350);
    s = await snapshot(p);
    assert.equal(s.fire, false); assert.equal(s.spray,false); assert.equal(s.line,false);
    assert.match(await p.locator('#training-sweep-count').innerText(), /3\/3/);
    assert.equal(await p.locator('.training').getAttribute('data-phase'),'steps');
    assert.equal((await frames(p,500)).renderedFrames,0);
    pass('Six strokes extinguish / Finish remains manual / renderer idle', s);
    await action(p,'back').click(); await p.waitForTimeout(800);
    assert.equal((await snapshot(p)).fire,false);
    await next(p); await next(p); await action(p,'restart').click();
    for (let i=0;i<3;i++) { await action(p,'skip').click(); await next(p); }
    assert.equal((await snapshot(p)).fire,true);
    await key(p,'End'); await p.waitForTimeout(300);
    await p.locator('a[href="#about"]').click();
    const paused = await snapshot(p);
    assert.equal(paused.spray,false); assert.equal((await frames(p,500)).renderedFrames,0);
    await p.keyboard.press('Escape'); await p.waitForTimeout(100);
    assert.equal((await snapshot(p)).spray,false);
    assert.ok((await frames(p,500)).renderedFrames > 0);
    await p.evaluate(() => window.dispatchEvent(new Event('blur')));
    await p.waitForTimeout(80);
    assert.equal((await frames(p,400)).renderedFrames,0);
    await p.evaluate(() => window.dispatchEvent(new Event('focus')));
    await p.evaluate(() => { Object.defineProperty(document,'hidden',{configurable:true,value:true}); document.dispatchEvent(new Event('visibilitychange')); });
    await p.waitForTimeout(80);
    assert.equal((await frames(p,400)).renderedFrames,0);
    await p.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
    assert.ok((await frames(p,400)).renderedFrames > 0);
    pass('About, blur and visibility stop effects / resume has no unsolicited spray', paused);
    const memory = (await snapshot(p)).memory;
    for(let i=0;i<3;i++) { await p.locator('a[href="#configure"]').click(); assert.equal((await snapshot(p)).root,false); await p.locator('a[href="#train"]').click(); }
    await p.waitForTimeout(800);
    assert.equal((await snapshot(p)).level,5/6);
    assert.deepEqual((await snapshot(p)).memory,memory);
    await action(p,'skip').click();
    assert.equal((await snapshot(p)).fire,false);
    assert.match(await p.locator('#training-sweep-count').innerText(), /0\/3/);
    assert.match(await p.locator('.training__status').innerText(), /dilewati/);
    await p.waitForTimeout(100);
    assert.equal((await frames(p,400)).renderedFrames,0);
    pass('Mode lifecycle / stable resources / Back / Skip keeps actual count', await snapshot(p));
    await context.close();
    assert.deepEqual(report.errors,[]);
  } catch(e) { report.failure=String(e.stack); save(); throw e; }
  finally { await browser.close(); save(); }
})();
