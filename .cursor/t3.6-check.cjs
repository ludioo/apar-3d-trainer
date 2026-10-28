const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const questions = require('../src/data/quiz.json');
const origin = 'http://trainer.barkahmauludi.com:4196';
const report = { date: '2026-10-28', checks: [], errors: [] };
const save = () => fs.writeFileSync(path.join(__dirname, 't3.6-qa.json'), JSON.stringify(report, null, 2));
const pass = (name, detail) => { report.checks.push({ name, detail }); save(); console.log('PASS', name); };
const train = (p, key) => p.locator(`[data-training="${key}"]`);
const quiz = (p, key) => p.locator(`[data-quiz="${key}"]`);
const nav = (p, key) => p.locator(`.tab[href="#${key}"]`).click();
const events = (p, key) => p.evaluate(key => window.__events.filter(e => !key || e.name === key), key);
const mock = 'window.__events=[];window.umami={track(name,data){window.__events.push({name,data});return Promise.resolve()}}';
async function ready(p, hash = 'configure') {
  await p.goto(origin + '/#' + hash);
  await p.waitForFunction(() => performance.getEntriesByName('apar:visible').length);
  await p.waitForFunction(() => !!window.umami?.track);
}
async function context(browser, options = {}, script = mock) {
  const c = await browser.newContext({ viewport: { width: 1365, height: 900 }, locale: 'en-US', reducedMotion: 'reduce', ...options });
  await c.route('https://cloud.umami.is/script.js', r => script === null ? r.abort() : r.fulfill({ contentType: 'text/javascript', body: script }));
  const p = await c.newPage(); p.on('pageerror', e => report.errors.push(String(e)));
  return { c, p };
}
async function download(p, type) {
  const done = p.waitForEvent('download');
  await p.locator(`[data-pdf="${type}"]`).click();
  await (await done).delete();
  await p.waitForFunction(type => document.querySelector(`[data-pdf="${type}"]`)?.getAttribute('aria-busy') === 'false', type);
}
async function finishTraining(p) {
  for (let i = 0; i < 4; i++) { await train(p, 'skip').click(); await train(p, 'next').click(); }
}
async function finishQuiz(p, score = 8) {
  for (let i = 0; i < 8; i++) {
    const q = questions[i];
    const given = i < score ? q.answer : q.type === 'choice' ? q.choices.find(c => c.id !== q.answer).id : 'body';
    if (q.type === 'pick-hotspot') await p.locator(`.quiz [data-pick="${given}"]`).count()
      ? p.locator(`.quiz [data-pick="${given}"]`).click()
      : p.locator(`.hotspot-pins:not([hidden]) [data-hotspot="${given}"]`).click();
    else await p.locator(`[data-choice="${given}"]`).click();
    await quiz(p, 'next').click();
  }
}
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true,
    args: ['--no-proxy-server', '--host-resolver-rules=MAP trainer.barkahmauludi.com 127.0.0.1'] });
  try {
    const { c, p } = await context(browser);
    await c.addInitScript(() => {
      const original = window.requestIdleCallback;
      window.__idleCalls = [];
      window.requestIdleCallback = (fn) => {
        window.__idleCalls.push(performance.getEntriesByName('apar:visible').length);
        return original.call(window, fn);
      };
    });
    await ready(p);
    assert.deepEqual(await p.evaluate(() => window.__idleCalls), [1]);
    const script = await p.locator('script[data-website-id]').evaluate(el => ({ src: el.src, defer: el.defer, domain: el.dataset.domains }));
    assert.deepEqual(script, { src: 'https://cloud.umami.is/script.js', defer: true, domain: 'trainer.barkahmauludi.com' });
    assert.equal((await events(p)).length, 0);
    await p.locator('[data-agent="co2"]').click(); await p.locator('[data-agent="co2"]').click();
    await p.locator('[data-capacity="9kg"]').click(); await p.locator('[data-capacity="9kg"]').click();
    await p.locator('[data-color="silver"]').click(); await p.locator('[data-color="silver"]').click();
    await p.locator('.config-bracket input').check();
    await p.locator('.config-bracket input').dispatchEvent('change');
    assert.deepEqual((await events(p, 'variant_change')).map(e => e.data), [
      { option: 'agent', value: 'co2' }, { option: 'capacity', value: '9kg' },
      { option: 'color', value: 'silver' }, { option: 'bracket', value: true }]);
    await p.locator('[data-lang="id"]').click(); await p.locator('[data-lang="id"]').click();
    await p.locator('[data-lang="en"]').click();
    assert.deepEqual((await events(p, 'lang_change')).map(e => e.data), [{ lang: 'id' }, { lang: 'en' }]);
    pass('Ready → idle → one deferred script; manual variant/language changes only', script);

    await p.locator('[data-action="save"]').click(); await p.locator('.saved-dialog button[type="button"]').click();
    assert.equal((await events(p, 'config_save')).length, 0);
    await p.locator('[data-action="save"]').click(); await p.locator('#saved-name').fill('PRIVATE CONFIG NAME');
    await p.evaluate(() => { window.__set = Storage.prototype.setItem; Storage.prototype.setItem = function(k,v) {
      if (k === 'apar3d:configs') throw Error('qa quota'); return window.__set.call(this,k,v); }; });
    await p.locator('.saved-dialog button[type="submit"]').click();
    assert.equal((await events(p, 'config_save')).length, 0);
    await p.evaluate(() => { Storage.prototype.setItem = window.__set; });
    await p.locator('.saved-dialog button[type="submit"]').click();
    assert.deepEqual((await events(p, 'config_save')).map(e => e.data), [{ agent: 'co2', capacity: '9kg', color: 'silver' }]);
    await p.locator('[data-action="load"]').click();
    assert.equal((await events(p, 'variant_change')).length, 4);
    await p.locator('[data-action="delete"]').click(); await p.locator('.saved-dialog button[type="submit"]').click();
    assert.equal((await events(p, 'config_save')).length, 1);
    pass('Save success only, cancel/error/Load/Delete silent; private configuration name excluded');

    await p.locator('[data-part="body"]').click(); await p.locator('.hotspot-info__close').click();
    await p.locator('.hotspot-pins:not([hidden]) [data-hotspot="pin"]').click();
    await p.locator('.hotspot-info__close').click();
    assert.deepEqual((await events(p, 'hotspot_open')).map(e => e.data), [{ id: 'body' }, { id: 'pin' }]);
    await nav(p, 'train'); assert.equal((await events(p, 'training_start')).length, 0);
    await p.evaluate(() => { window.__dateNow = Date.now; window.__now = Date.now(); Date.now = () => window.__now; });
    await train(p, 'start').click(); await nav(p, 'configure'); await nav(p, 'train');
    assert.equal((await events(p, 'training_start')).length, 1);
    await p.locator('.topbar__about').click(); await p.locator('#about .modal__close').click();
    await p.evaluate(() => { window.__now += 12600; Storage.prototype.setItem = function(k,v) {
      if (k === 'apar3d:trainingDone') throw Error('qa quota'); return window.__set.call(this,k,v); }; });
    await finishTraining(p);
    assert.deepEqual((await events(p, 'training_finish')).map(e => e.data), [{ durationSec: 13, skipped: 4 }]);
    await train(p, 'restart').click(); await train(p, 'interact').click(); await train(p, 'next').click();
    await p.evaluate(() => { window.__now += 2200; });
    for (let i = 0; i < 3; i++) { await train(p, 'skip').click(); await train(p, 'next').click(); }
    assert.deepEqual((await events(p, 'training_finish'))[1].data, { durationSec: 2, skipped: 3 });
    assert.equal((await events(p, 'training_start')).length, 2);
    assert.equal((await events(p, 'variant_change')).length, 4);
    await p.evaluate(() => { Date.now = window.__dateNow; Storage.prototype.setItem = window.__set; });
    pass('Hotspot shared paths; training duration/skip count/restart/resume and failed storage');

    await train(p, 'quiz').click();
    await finishQuiz(p);
    assert.deepEqual((await events(p, 'quiz_finish')).map(e => e.data), [{ score: 8, total: 8, passed: true }]);
    assert.equal((await events(p, 'hotspot_open')).length, 2, 'quiz pins are not Configure hotspot events');
    await nav(p, 'results'); await nav(p, 'train');
    assert.equal((await events(p, 'quiz_finish')).length, 1);
    await quiz(p, 'restart').click();
    await p.evaluate(() => { Storage.prototype.setItem = function(k,v) {
      if (k === 'apar3d:attempts') throw Error('qa quota'); return window.__set.call(this,k,v); }; });
    await finishQuiz(p, 5);
    assert.deepEqual((await events(p, 'quiz_finish'))[1].data, { score: 5, total: 8, passed: false });
    await p.evaluate(() => { Storage.prototype.setItem = window.__set; });
    pass('Quiz finish once at final answer; 8/8 and 5/8; failed save still tracked; navigation silent');
    await nav(p, 'results'); await p.locator('#participant-name').fill('PRIVATE PARTICIPANT NAME');
    await download(p, 'report'); await nav(p, 'configure'); await download(p, 'spec');
    assert.deepEqual((await events(p, 'pdf_export')).map(e => e.data), [{ type: 'report' }, { type: 'spec' }]);
    const all = await events(p);
    assert.deepEqual([...new Set(all.map(e => e.name))].sort(), [
      'variant_change','hotspot_open','config_save','training_start','training_finish','quiz_finish','pdf_export','lang_change'].sort());
    assert.ok(!JSON.stringify(all).includes('PRIVATE'));
    assert.deepEqual(await c.cookies(), []);
    report.payloads = all;
    pass('All eight event payloads; both real PDF downloads; no participant/configuration names or cookies');
    await c.close();

    for (const kind of ['blocked', 'throw', 'reject', 'no-idle']) {
      const { c, p } = await context(browser, {}, kind === 'blocked' ? null : kind === 'throw'
        ? 'window.umami={track(){throw Error("qa tracker error")}}' : kind === 'reject'
          ? 'window.umami={track(){return Promise.reject(Error("qa rejection"))}}' : mock);
      if (kind === 'no-idle') await c.addInitScript(() => { delete window.requestIdleCallback; });
      await p.goto(origin + '/#configure'); await p.waitForFunction(() => performance.getEntriesByName('apar:visible').length);
      await p.locator('script[data-website-id]').waitFor({ state: 'attached' });
      if (kind !== 'blocked') await p.waitForFunction(() => !!window.umami);
      await p.locator('[data-color="silver"]').click(); await p.locator('[data-lang="id"]').click();
      await nav(p, 'train'); await train(p, 'start').click(); await finishTraining(p);
      assert.equal(await train(p, 'quiz').isVisible(), true);
      assert.equal(await p.locator('script[data-website-id]').count(), 1);
      await c.close(); pass('App stays usable: ' + kind);
    }
    const { c: local, p: l } = await context(browser);
    let localRequests = 0;
    l.on('request', r => { if (r.url().includes('umami')) localRequests++; });
    await l.goto('http://localhost:4196/#configure');
    await l.waitForFunction(() => performance.getEntriesByName('apar:visible').length);
    await l.locator('[data-color="silver"]').click(); await l.locator('[data-lang="id"]').click();
    assert.equal(await l.locator('script[data-website-id]').count(), 0); assert.equal(localRequests, 0);
    await local.close(); pass('Localhost with Website ID configured makes zero Umami requests');

    const { c: retry, p: r } = await context(browser);
    await retry.route('**/models/apar.glb', route => route.abort());
    await r.goto(origin + '/#configure'); await r.locator('.splash__retry').waitFor();
    assert.equal(await r.locator('script[data-website-id]').count(), 0);
    await retry.unroute('**/models/apar.glb'); await r.locator('.splash__retry').click();
    await r.waitForFunction(() => !!window.umami);
    assert.equal(await r.locator('script[data-website-id]').count(), 1);
    await retry.close(); pass('Failed model load has no tracker; successful Retry inserts exactly once');
    assert.deepEqual(report.errors, []);
  } catch(e) { report.failure = String(e.stack); throw e; }
  finally { await browser.close(); save(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
