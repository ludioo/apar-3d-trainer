const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const origin = process.argv[2] || 'http://localhost:4183';
const prefix = origin.includes('5183') ? 't2.3-dev' : 't2.3';
const questions = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/quiz.json')));
const report = { date: '2026-10-28', origin, checks: [], errors: [] };
const save = () => fs.writeFileSync(path.join(__dirname, `${prefix}-qa.json`), JSON.stringify(report, null, 2));
const pass = (name, detail) => { report.checks.push({ name, detail }); save(); console.log('PASS', name); };
const train = (p, name) => p.locator(`[data-training="${name}"]`);
const quiz = (p, name) => p.locator(`[data-quiz="${name}"]`);
const pin = (p, id) => p.locator(`.hotspot-pins:not([hidden]) [data-hotspot="${id}"]`);
const next = p => quiz(p, 'next');
const history = p => p.evaluate(() => JSON.parse(localStorage.getItem('apar3d:attempts')));
async function ready(p) {
  await p.goto(`${origin}/#train`);
  await p.waitForFunction(() => getComputedStyle(document.querySelector('#splash')).opacity === '0');
}
async function startQuiz(p, touch = false) {
  const click = locator => touch ? locator.tap() : locator.click();
  await click(train(p, 'start'));
  for (let i = 0; i < 4; i++) { await click(train(p, 'skip')); await click(train(p, 'next')); }
  await click(train(p, 'quiz'));
  await p.locator('.quiz[data-question="q1"]').waitFor();
}
async function answer(p, index, correct = true, touch = false) {
  const q = questions[index];
  let locator;
  if (q.type === 'pick-hotspot') {
    await p.waitForTimeout(800);
    locator = pin(p, correct ? q.answer : 'body');
  } else locator = p.locator(`[data-choice="${correct ? q.answer : q.choices.find(c => c.id !== q.answer).id}"]`);
  if (touch) await locator.tap(); else await locator.click();
  assert.equal(await p.locator('.quiz').getAttribute('data-phase'), 'feedback');
  assert.equal(await p.locator('.quiz__feedback').getAttribute('data-correct'), String(correct));
}
async function finish(p, score, touch = false) {
  for (let i = 0; i < 8; i++) {
    await answer(p, i, i < score, touch);
    if (touch) await next(p).tap(); else await next(p).click();
  }
  await p.locator('.quiz[data-phase="summary"]').waitFor();
}
async function hit(p, locator) {
  await locator.scrollIntoViewIfNeeded();
  assert.ok(await locator.evaluate(el => {
    const b = el.getBoundingClientRect(), root = el.closest('.quiz').getBoundingClientRect();
    const nav = document.querySelector('.quiz__nav');
    const top = Math.max(b.top, root.top), bottom = Math.min(b.bottom, root.bottom,
      nav.hidden || nav.contains(el) ? root.bottom : nav.getBoundingClientRect().top);
    return bottom > top && el.contains(document.elementFromPoint(b.x + b.width / 2, (top + bottom) / 2));
  }), 'control/text must be reachable above footer');
}
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1365, height: 900 }, locale: 'id-ID' });
    const p = await context.newPage();
    p.on('pageerror', e => report.errors.push(String(e)));
    p.on('console', m => { if (m.type() === 'error' && !m.text().includes('404')) report.errors.push(m.text()); });
    await ready(p);
    await p.locator('[href="#configure"]').click();
    await p.locator('[data-agent="co2"]').click(); await p.locator('[data-capacity="9kg"]').click();
    await p.locator('[data-color="silver"]').click(); await p.locator('.config-bracket input').check();
    await p.locator('[href="#train"]').click(); await startQuiz(p);
    assert.equal(await next(p).isDisabled(), true);
    assert.equal(await p.locator('.training').count(), 0);
    assert.equal(await p.locator('.training-target:not([hidden])').count(), 0);
    await p.screenshot({ path: path.join(__dirname, `${prefix}-q1-desktop.png`) });
    await p.locator('[data-choice="a"]').focus(); await p.keyboard.press('Enter');
    assert.equal(await p.locator('[data-choice="b"]').isDisabled(), true);
    assert.equal(await p.locator('.quiz__feedback').getAttribute('data-correct'), 'true');
    await next(p).click(); await p.waitForTimeout(850);
    const labels = await p.locator('.hotspot-pins:not([hidden]) .hotspot-pin').evaluateAll(bs => bs.map(b => b.getAttribute('aria-label')));
    assert.deepEqual(labels, ['Bagian 1','Bagian 2','Bagian 3','Bagian 4','Bagian 5','Bagian 6']);
    assert.equal(await pin(p, 'pin').isVisible(), true); assert.equal(await pin(p, 'gauge').isVisible(), true);
    await p.screenshot({ path: path.join(__dirname, `${prefix}-q2-desktop.png`) });
    const canvas = p.locator('canvas'), b = await canvas.boundingBox();
    await p.mouse.move(b.x+b.width/2,b.y+b.height/2); await p.mouse.down();
    await p.mouse.move(b.x+b.width/2+80,b.y+b.height/2+30,{steps:8}); await p.mouse.up();
    assert.equal(await p.locator('.quiz').getAttribute('data-phase'), 'question');
    await quiz(p,'resetView').click(); await p.waitForTimeout(850);
    await p.locator('[href="#about"]').click();
    await p.evaluate(()=>{window.quizDialogClosed=false;document.querySelector('#about').addEventListener('close',()=>window.quizDialogClosed=true,{once:true});});
    await p.keyboard.press('Escape'); await p.waitForFunction(()=>window.quizDialogClosed);
    await p.evaluate(() => window.dispatchEvent(new Event('blur')));
    await p.evaluate(() => document.querySelector('.hotspot-pins:not([hidden]) [data-hotspot="pin"]').click());
    assert.equal(await p.locator('.quiz').getAttribute('data-phase'), 'question');
    await p.evaluate(() => window.dispatchEvent(new Event('focus')));
    await pin(p,'pin').focus(); await p.keyboard.press('Space');
    assert.equal(await p.locator('.quiz__feedback').getAttribute('data-correct'), 'true');
    await p.locator('[data-lang="en"]').click();
    assert.match(await p.locator('.quiz__feedback').innerText(), /Correct answer: Safety pin/);
    await p.locator('[href="#configure"]').click();
    assert.equal(await p.locator('[data-agent="co2"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await p.locator('[data-capacity="9kg"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await p.locator('[data-color="silver"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await p.locator('.config-bracket input').isChecked(), true);
    await p.locator('[href="#train"]').click();
    assert.equal(await p.locator('.quiz').getAttribute('data-question'), 'q2');
    assert.equal(await p.locator('.quiz').getAttribute('data-phase'), 'feedback');
    await next(p).click();
    for (let i = 2; i < 8; i++) {
      await answer(p,i);
      if (i===5) {
        assert.equal(await p.locator('.quiz__contacts').isVisible(), true);
        assert.equal(await p.locator('.quiz__contacts [href="tel:113"]').count(), 1);
        assert.equal(await p.locator('.quiz__contacts [href="tel:112"]').count(), 1);
        assert.match(await p.locator('.quiz__contacts').innerText(), /Komdigi/);
        await p.screenshot({path:path.join(__dirname,`${prefix}-q6-feedback.png`)});
      }
      if (i===7) { assert.equal((await history(p)).attempts.length,1); assert.equal(await p.locator('.quiz').getAttribute('data-phase'),'feedback'); }
      await next(p).click();
    }
    assert.equal((await history(p)).attempts[0].score,8);
    assert.match(await p.locator('.quiz').innerText(),/8\/8 · 100%/);
    assert.ok((await history(p)).attempts[0].durationSec>=2);
    await p.screenshot({path:path.join(__dirname,`${prefix}-summary-desktop.png`)});
    pass('Eight questions, manual feedback, pins/keyboard/orbit/reset, interruption, EN/ID, q6 emergency, one complete save, configuration restore');
    for (const score of [0,5,6]) {
      await quiz(p,'restart').click(); await finish(p,score);
      const latest=(await history(p)).attempts[0]; assert.equal(latest.score,score); assert.equal(latest.passed,score>=6);
      assert.match(await p.locator('.quiz h3').innerText(),score>=6?/^Passed$/:/^Not yet passed$/);
    }
    assert.equal((await history(p)).attempts.length,4);
    await p.locator('[data-lang="id"]').click(); await p.locator('[href="#results"]').click(); await p.locator('[href="#train"]').click();
    assert.equal((await history(p)).attempts.length,4);
    await quiz(p,'training').click(); assert.equal(await train(p,'quiz').isVisible(),true);
    await train(p,'quiz').click(); await p.locator('[data-choice="a"]').click();
    await p.reload(); await p.waitForFunction(()=>getComputedStyle(document.querySelector('#splash')).opacity==='0');
    assert.equal(await train(p,'start').isVisible(),true); assert.equal((await history(p)).attempts.length,4);
    pass('0/8, 5/8 fail and 6/8 pass; retry/new attempt; summary resumes without duplicate; return to training and refresh');
    await startQuiz(p); await p.evaluate(()=>{window.originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='apar3d:attempts')throw Error('quota');return window.originalSet.call(this,k,v);};});
    await finish(p,8); assert.match(await p.locator('.quiz__error').innerText(),/Hasil belum tersimpan/);
    assert.equal((await history(p)).attempts.length,4);
    await p.evaluate(()=>{Storage.prototype.setItem=window.originalSet;localStorage.setItem('apar3d:attempts','{');});
    await quiz(p,'restart').click(); await finish(p,8);
    assert.equal(await p.evaluate(()=>localStorage.getItem('apar3d:attempts')),'{');
    assert.equal(await p.locator('.quiz__error').isVisible(),true);
    pass('Storage write failure and corrupt history preserve existing bytes while displaying final score');

    const mobileContext=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,locale:'id-ID',reducedMotion:'reduce'});
    const m=await mobileContext.newPage(); m.on('pageerror',e=>report.errors.push(String(e))); await ready(m); await startQuiz(m,true);
    await m.evaluate(()=>{window.quizClicks=[];document.addEventListener('click',e=>window.quizClicks.push({tag:e.target.tagName,choice:e.target.dataset.choice,cls:e.target.className,lang:e.target.dataset.lang,phase:document.querySelector('.quiz')?.dataset.phase}),true);});
    const matrix=[];
    for (const [width,height] of [[360,800],[390,844],[768,1024],[844,390],[390,420]]) {
      await m.setViewportSize({width,height});
      for (const lang of ['en','id']) { await m.locator(`[data-lang="${lang}"]`).tap();
        for (const zoom of [1,2]) {
          await m.evaluate(z=>{for(const n of [12,14,16,20,28,40])document.querySelector('.quiz').style.setProperty(`--fs-${n}`,`${n*z}px`);},zoom);
          for (const expanded of [false,true]) {
            const handle=m.locator('.panel__handle'); if((await handle.getAttribute('aria-expanded')==='true')!==expanded)await handle.tap();
            await m.waitForTimeout(60);
            report.scenario={width,height,lang,zoom,expanded}; save();
            assert.equal(await handle.getAttribute('aria-expanded'),String(expanded),'tap changes the actual sheet snap');
            assert.equal(await m.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
            for(const choice of ['a','b','c'])await hit(m,m.locator(`[data-choice="${choice}"]`));
            await hit(m,m.locator('.quiz__muted').last()); await hit(m,next(m));
            if(await m.locator('.quiz').getAttribute('data-phase')!=='question') {
              report.clicks=await m.evaluate(()=>window.quizClicks);await m.screenshot({path:path.join(__dirname,`${prefix}-unexpected-answer.png`)});
              throw Error('Layout interaction answered a question unexpectedly');
            }
            matrix.push(report.scenario);
          }
        }
      }
    }
    pass('40 mobile layout combinations: EN/ID, text 100/200%, five viewports, both snaps, all choices/disclaimer/footer hit-tested',matrix);
    await m.setViewportSize({width:390,height:844}); await m.locator('.quiz').evaluate(el=>el.removeAttribute('style'));
    if(await m.locator('.panel__handle').getAttribute('aria-expanded')==='true')await m.locator('.panel__handle').tap();
    await m.locator('[data-lang="id"]').tap(); await answer(m,0,true,true); await next(m).tap();
    await pin(m,'pin').waitFor({state:'visible'});
    await m.screenshot({path:path.join(__dirname,`${prefix}-q2-mobile.png`)});
    await pin(m,'pin').tap(); await next(m).tap(); await answer(m,2,true,true); await next(m).tap(); await answer(m,3,true,true); await next(m).tap();
    const firstFrame=await m.locator('canvas').screenshot(); await m.waitForTimeout(200); assert.ok(firstFrame.equals(await m.locator('canvas').screenshot()));
    await pin(m,'gauge').tap(); await next(m).tap(); await answer(m,5,true,true);
    await hit(m,m.locator('.quiz__contacts [href="tel:113"]')); await hit(m,m.locator('.quiz__contacts [href="tel:112"]'));
    await next(m).tap(); await answer(m,6,true,true); await next(m).tap(); await answer(m,7,true,true); await next(m).tap();
    assert.equal((await history(m)).attempts[0].score,8);
    await m.screenshot({path:path.join(__dirname,`${prefix}-summary-mobile.png`)});
    pass('Touch completes both 3D pin questions and all choices; q6 telephone links reachable; reduced-motion frame static');
    const failed=await browser.newPage(); await failed.route('**/models/apar.glb',r=>r.abort()); await failed.goto(`${origin}/#train`);
    await failed.locator('.splash__retry').waitFor(); assert.equal(await train(failed,'start').isDisabled(),true);
    await failed.unroute('**/models/apar.glb'); await failed.locator('.splash__retry').click();
    await failed.waitForFunction(()=>getComputedStyle(document.querySelector('#splash')).opacity==='0'); await startQuiz(failed);
    pass('Model load error blocks entry; Retry restores training and quiz');
    assert.deepEqual(report.errors,[]); pass('No unexpected page or console errors');
  } catch(error) {report.failure=String(error.stack);save();throw error;}
  finally {await browser.close();save();}
})();
