const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const origin = process.argv[2] || 'http://localhost:5183';
const prefix = origin.includes('5183') ? 't2.4-dev' : 't2.4';
const questions = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/quiz.json')));
const report = { date: '2026-10-28', origin, checks: [], errors: [] };
const save = () => fs.writeFileSync(path.join(__dirname, `${prefix}-qa.json`), JSON.stringify(report, null, 2));
const pass = (name, detail) => { report.checks.push({ name, detail }); save(); console.log('PASS', name); };
const action = (p, name) => p.locator(`[data-results="${name}"]`);
const train = (p, name) => p.locator(`[data-training="${name}"]`);
const quiz = (p, name) => p.locator(`[data-quiz="${name}"]`);
function attempt(score, i = 0) {
  const start = Date.parse('2026-10-28T01:00:00.000Z') + i * 60000;
  return { id: (i + 1).toString(16).padStart(32, '0'), startedAt: new Date(start).toISOString(),
    finishedAt: new Date(start + 20000).toISOString(), durationSec: 20, score, total: 8, passed: score >= 6,
    answers: questions.map((q, index) => ({ qId: q.id, correct: index < score,
      given: index < score ? q.answer : q.type === 'choice' ? q.choices.find(c => c.id !== q.answer).id : 'body' })) };
}
const config = { id: 't24-test', name: '<img src=x onerror=alert(1)>', createdAt: '2026-10-28T01:00:00.000Z',
  agent: 'co2', capacity: '9kg', color: 'silver', bracket: true, priceSnapshot: { IDR: 1100000, USD: 71 } };
async function ready(p, hash = 'results') {
  await p.goto(`${origin}/#${hash}`);
  await p.waitForFunction(() => getComputedStyle(document.querySelector('#splash')).opacity === '0');
}
async function seed(p, attempts = [], configs = []) {
  await p.evaluate(({ attempts, configs }) => {
    localStorage.setItem('apar3d:attempts', JSON.stringify({ schemaVersion: 1, attempts }));
    localStorage.setItem('apar3d:configs', JSON.stringify({ schemaVersion: 1, configs }));
  }, { attempts, configs });
  await p.locator('.tab[href="#configure"]').click();
  await p.locator('.tab[href="#results"]').click();
}
async function faults(p, flags) {
  await p.evaluate(flags => {
    if (!window.__t24Original) {
      window.__t24Original = Object.fromEntries(['getItem','setItem','removeItem'].map(k => [k, Storage.prototype[k]]));
      for (const method of Object.keys(window.__t24Original)) Storage.prototype[method] = function(key, ...args) {
        if (window.__t24Faults?.[method]?.includes(key) || window.__t24Faults?.[method]?.includes('*')) throw Error('QA storage fault');
        return window.__t24Original[method].call(this, key, ...args);
      };
    }
    window.__t24Faults = flags;
  }, flags);
}
async function startQuiz(p) {
  await p.locator('.tab[href="#train"]').click();
  await train(p, 'start').click();
  for (let i = 0; i < 4; i++) { await train(p, 'skip').click(); await train(p, 'next').click(); }
  await train(p, 'quiz').click();
}
async function finishQuiz(p) {
  for (const q of questions) {
    if (q.type === 'choice') await p.locator(`[data-choice="${q.answer}"]`).click();
    else {
      const pin = p.locator(`.hotspot-pins:not([hidden]) [data-hotspot="${q.answer}"]`);
      await pin.waitFor({ state: 'visible' }); await p.waitForTimeout(800); await pin.click();
    }
    await quiz(p, 'next').click();
  }
}
async function hit(p, locator) {
  await locator.evaluate(el => el.scrollIntoView({ block: 'start' }));
  assert.ok(await locator.evaluate(el => {
    const b = el.getBoundingClientRect(), root = el.closest('.panel__body,dialog').getBoundingClientRect();
    const top = Math.max(b.top, root.top, 0), bottom = Math.min(b.bottom, root.bottom, innerHeight);
    return bottom > top && el.contains(document.elementFromPoint(b.x + b.width / 2, (top + bottom) / 2));
  }), 'text/control must be reachable in scroll area');
}
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const p = await browser.newPage({ viewport: { width: 1365, height: 900 }, locale: 'id-ID' });
    p.on('pageerror', e => report.errors.push(String(e)));
    p.on('console', m => { if (m.type() === 'error' && !m.text().includes('404')) report.errors.push(m.text()); });
    await ready(p);
    assert.match(await p.locator('.results').innerText(), /Selesaikan kuis/);
    assert.equal(await p.locator('.results__score-card').isVisible(), false);
    await p.locator('.results > a[href="#train"]').click(); assert.equal(await train(p, 'start').isVisible(), true);
    await p.locator('.tab[href="#results"]').click();
    await p.locator('.results a[href="#configure"]').click(); assert.equal(await p.locator('[data-agent="co2"]').isVisible(), true);
    await p.locator('.tab[href="#results"]').click();
    pass('Empty Results and Train/Manage configurations links work');
    await seed(p, [], [config]);
    assert.match(await p.locator('.results__configs').innerText(), /1.100.000/);
    assert.equal(await p.locator('.results__configs img').count(), 0);
    for (const score of [0,5,6,8]) {
      await seed(p, [attempt(score)], [config]);
      assert.equal(await p.locator('.results__score').innerText(), `${score}/8`);
      assert.equal(await p.locator('.results__ring strong').innerText(), new Intl.NumberFormat('id', { style:'percent', maximumFractionDigits:1 }).format(score/8));
      assert.match(await p.locator('.results__score-details').innerText(), score >= 6 ? /Lulus/ : /Belum lulus/);
      assert.equal(await p.locator('.results__answers tbody tr').count(), 8);
      assert.equal(await p.locator('.results__answers .results__correct').count(), score);
    }
    const entries = Array.from({ length: 20 }, (_, i) => attempt(i % 9, i));
    await seed(p, entries, [config]);
    assert.deepEqual(await p.locator('.results-chart__bar').evaluateAll(bars => bars.map(b => b.dataset.id)), entries.map(e => e.id));
    assert.match(await p.locator('#results-chart-description').textContent(), /Percobaan 20/);
    const bytes = await p.evaluate(() => localStorage.getItem('apar3d:attempts'));
    await p.reload(); await p.locator('.results__answers').waitFor();
    assert.equal(await p.evaluate(() => localStorage.getItem('apar3d:attempts')), bytes);
    await p.locator('[data-lang="en"]').click();
    assert.equal(await p.locator('.results__answers thead th').first().innerText(), 'Question');
    assert.match(await p.locator('.results__configs').innerText(), /\$71/);
    assert.match(await p.locator('.results__answers tbody tr').nth(1).innerText(), /Cylinder/);
    pass('Saved-only configuration, 0/5/6/8 scores, 20 chronological bars, bilingual table/price and read-only refresh');
    const input = p.locator('#participant-name');
    const unsafe = '<img src=x onerror=alert(1)>';
    await input.fill(`  ${unsafe}  `); await input.press('Enter');
    assert.equal(await input.inputValue(), unsafe);
    assert.equal(await p.locator('.results img').count(), 0);
    await input.fill('a'.repeat(60)); await input.press('Tab');
    assert.equal(await p.evaluate(() => JSON.parse(localStorage.getItem('apar3d:participantName'))), 'a'.repeat(60));
    await input.fill('draft name');
    await p.evaluate(async () => document.querySelector('[data-lang="id"]').click());
    assert.equal(await input.inputValue(), 'draft name'); assert.equal(await input.evaluate(el => el === document.activeElement), true);
    await p.locator('.tab[href="#configure"]').click();
    await p.locator('.tab[href="#results"]').click(); assert.equal(await input.inputValue(), 'draft name');
    await input.fill(''); await input.press('Enter');
    assert.equal(await p.evaluate(() => localStorage.getItem('apar3d:participantName')), '""');
    await faults(p, { setItem: ['apar3d:participantName'] });
    await input.fill('unsaved name'); await input.press('Enter');
    assert.match(await p.locator('#participant-status').innerText(), /tidak dapat/);
    await faults(p, {}); await input.press('Enter');
    await p.reload(); await p.locator('.results').waitFor(); assert.equal(await input.inputValue(), 'unsaved name');
    pass('Name trim/optional/60 characters, literal HTML, Enter/blur/tab/language, write failure and retry');
    await p.evaluate(() => localStorage.setItem('apar3d:attempts', '{'));
    await p.locator('.tab[href="#configure"]').click(); await p.locator('.tab[href="#results"]').click();
    assert.match(await p.locator('.results > p').nth(1).innerText(), /rusak/);
    assert.equal(await p.locator('.results__configs li').count(), 1);
    await faults(p, { getItem: ['apar3d:configs'] });
    await p.locator('.tab[href="#train"]').click(); await p.locator('.tab[href="#results"]').click();
    assert.match(await p.locator('.results__configs').locator('..').innerText(), /tidak dapat/);
    await faults(p, {});
    await p.evaluate(() => localStorage.removeItem('apar3d:attempts'));
    await startQuiz(p); await faults(p, { setItem: ['apar3d:attempts'] }); await finishQuiz(p);
    assert.match(await p.locator('.quiz__score').innerText(), /8\/8/);
    await quiz(p, 'results').click();
    assert.equal(await p.locator('.results__score-card').isVisible(), false);
    assert.match(await p.locator('.results > p').first().innerText(), /belum tersimpan/);
    await p.locator('.tab[href="#train"]').click(); assert.match(await p.locator('.quiz__score').innerText(), /8\/8/);
    await faults(p, {}); await quiz(p, 'results').click();
    pass('Corrupt/unavailable data isolated; real failed-save quiz remains in Train and is excluded from Results');
    await p.evaluate(() => { localStorage.setItem('other-app:key', 'keep'); localStorage.setItem('apar3d:trainingDone', 'true'); });
    await seed(p, [attempt(6)], [config]);
    await input.fill('Barkah'); await input.press('Enter');
    await action(p, 'clear').click();
    assert.equal(await action(p, 'cancel').evaluate(el => el === document.activeElement), true);
    await p.keyboard.press('Escape'); await p.waitForTimeout(80);
    assert.equal(await action(p, 'clear').evaluate(el => el === document.activeElement), true);
    assert.ok(await p.evaluate(() => localStorage.getItem('apar3d:attempts')));
    await action(p, 'clear').click(); await action(p, 'cancel').click(); await p.waitForTimeout(80);
    await action(p, 'clear').click(); await action(p, 'confirm').click(); await p.waitForTimeout(80);
    assert.equal(await input.inputValue(), '');
    assert.deepEqual(await p.evaluate(() => ['attempts','configs','participantName','trainingDone'].map(k => localStorage.getItem('apar3d:'+k))), [null,null,null,null]);
    assert.equal(await p.evaluate(() => localStorage.getItem('apar3d:lang')), '"id"');
    assert.equal(await p.evaluate(() => localStorage.getItem('other-app:key')), 'keep');
    await p.locator('.tab[href="#train"]').click(); assert.equal(await train(p, 'start').isVisible(), true);
    await p.locator('.tab[href="#configure"]').click(); assert.equal(await p.locator('.saved-list li').count(), 0);
    await p.locator('.tab[href="#results"]').click(); assert.equal(await input.inputValue(), '');
    await p.reload(); await p.locator('.results').waitFor(); assert.equal(await input.inputValue(), '');
    pass('Clear Cancel/Escape/focus and confirmed deletion; language/unrelated data kept; quiz/PASS/name/config list stay cleared after navigation/refresh');
    for (const [blocked, text] of [[['apar3d:configs'], /sebagian/], [['*'], /tidak dapat dihapus/]]) {
      await seed(p, [attempt(6)], [config]); await faults(p, { removeItem: blocked });
      await action(p, 'clear').click(); await action(p, 'confirm').click();
      assert.match(await p.locator('.results > [role="status"]').innerText(), text);
      assert.equal(await p.locator('.results__configs li').count(), 1);
      await faults(p, {}); await action(p, 'clear').click(); await action(p, 'confirm').click();
      assert.equal(await p.locator('.results__configs li').count(), 0);
    }
    pass('Partial and total deletion failures show honest messages, remaining data, and explicit successful retry');
    await seed(p, entries, Array.from({length:10}, (_,i)=>({...config,id:`test-${i}`,name:`Configuration ${i+1}`})));
    let matrix = 0;
    for (const [width,height] of [[360,800],[390,844],[768,1024],[844,390],[390,420]]) {
      await p.setViewportSize({width,height});
      for (const lang of ['id','en']) for (const scale of [1,2]) for (const expanded of [false,true]) {
        await p.locator('[data-lang="'+lang+'"]').click();
        await p.evaluate(({scale,expanded}) => {
          const root=document.querySelector('.results');
          for(const el of [root,...root.querySelectorAll('*:not(svg):not(svg *)')]) el.style.removeProperty('font-size');
          const sizes=[root,...root.querySelectorAll('*:not(svg):not(svg *)')].map(el=>[el,parseFloat(getComputedStyle(el).fontSize)]);
          for(const [el,size] of sizes) el.style.fontSize=`${size*scale}px`;
          document.querySelector('#panel').classList.toggle('is-expanded',expanded);
        }, {scale,expanded});
        await p.waitForTimeout(300);
        assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
        assert.ok(await p.locator('.results').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
        for(const locator of [p.locator('.results__ring'),p.locator('.results__answers caption'),input,action(p,'clear'),p.locator('.results__contacts a').last()]) await hit(p,locator);
        assert.ok(await input.evaluate(el=>el.getBoundingClientRect().height>=44));
        await action(p,'clear').click(); await p.waitForTimeout(60);
        await hit(p,action(p,'cancel')); await hit(p,action(p,'confirm')); await p.keyboard.press('Escape'); await p.waitForTimeout(60);
        matrix++;
      }
    }
    pass('Results layout/scroll/controls/dialog remain reachable at five viewports × EN/ID × 100/200% text × two sheet snaps', { combinations: matrix });
    await p.setViewportSize({width:1365,height:900}); await p.reload();
    await p.waitForFunction(() => getComputedStyle(document.querySelector('#splash')).opacity === '0');
    await p.locator('.results-chart').waitFor();
    await p.screenshot({path:path.join(__dirname,`${prefix}-desktop.png`)});
    await p.emulateMedia({ reducedMotion:'reduce' });
    await p.setViewportSize({width:390,height:844}); await p.screenshot({path:path.join(__dirname,`${prefix}-mobile.png`)});
    await p.locator('.panel__handle').click();
    await p.locator('.results-chart').scrollIntoViewIfNeeded();
    await p.screenshot({path:path.join(__dirname,`${prefix}-chart-mobile.png`)});
    await action(p,'clear').click(); await p.screenshot({path:path.join(__dirname,`${prefix}-clear-mobile.png`)}); await p.keyboard.press('Escape');
    await hit(p,p.locator('.results__contacts a[href="tel:113"]'));
    assert.equal(await p.locator('.results__contacts a[href="tel:112"]').count(),1);
    assert.equal(await p.locator('.results__contacts a[target="_blank"]').getAttribute('href'),'https://layanan112.komdigi.go.id/tentang');
    const touch = await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true,locale:'id-ID',reducedMotion:'reduce'});
    await ready(touch); await seed(touch,[attempt(6)],[config]);
    await touch.locator('.panel__handle').tap();
    await touch.locator('#participant-name').tap(); await touch.locator('#participant-name').fill('Peserta HP');
    await action(touch,'clear').tap(); assert.equal(await action(touch,'cancel').evaluate(el=>el===document.activeElement),true);
    await action(touch,'cancel').tap();
    await action(touch,'clear').tap(); await action(touch,'confirm').tap();
    assert.equal(await touch.locator('.results__score-card').isVisible(),false);
    assert.equal(await touch.locator('#participant-name').inputValue(),'');
    await touch.locator('.results > a[href="#train"]').tap(); assert.equal(await train(touch,'start').isVisible(),true);
    await touch.close();
    assert.deepEqual(report.errors,[]);
    pass('Native touch name/dialog/Clear/Train, reduced motion, disclaimer/contact links, preview screenshots and no unexpected JS/console errors');
  } catch(error) { report.failure=String(error.stack); save(); throw error; }
  finally { await browser.close(); save(); }
})();
