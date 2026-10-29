const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const origin = process.argv[2] || 'http://localhost:4193';
const stage = origin.includes('5193') ? 'dev' : 'production';
const fixtureOnly = process.argv.includes('--fixture-only');
const questions = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/quiz.json')));
const report = { origin, stage, checks: [], states: [], tallOptions: [], errors: [] };
const save = () => fs.writeFileSync(path.join(__dirname, `t4.3-${stage}${fixtureOnly ? '-fixture' : ''}-qa.json`), JSON.stringify(report, null, 2));
const pass = (name, detail) => { report.checks.push({ name, detail }); save(); console.log('PASS', name); };
const button = name => `[data-quiz="${name}"]`;
async function ready(p) {
  p.on('pageerror', e => report.errors.push(String(e)));
  p.on('console', m => { if (m.type() === 'error' && !m.text().includes('404')) report.errors.push(m.text()); });
  await p.goto(`${origin}/#train`);
  await p.waitForFunction(() => getComputedStyle(document.querySelector('#splash')).opacity === '0');
  await p.locator('[data-training="start"]').click();
  for (let i = 0; i < 4; i++) {
    await p.locator('[data-training="skip"]').click(); await p.locator('[data-training="next"]').click();
  }
  await p.locator('[data-training="quiz"]').click();
}
async function snap(p, name) {
  if (p.viewportSize().width >= 1024) return;
  for (let i = 0; i < 3 && await p.locator('#panel').getAttribute('data-snap') !== name; i++) {
    await p.locator('.panel__handle').click(); await p.waitForTimeout(260);
  }
  assert.equal(await p.locator('#panel').getAttribute('data-snap'), name);
}
async function geometry(p) {
  return p.locator('.quiz').evaluate(q => ({
    scroll: q.scrollTop, heading: q.querySelector('h3').getBoundingClientRect().toJSON(),
    root: q.getBoundingClientRect().toJSON(), nav: q.querySelector('.quiz__nav').getBoundingClientRect().toJSON(),
    snap: document.querySelector('#panel').dataset.snap,
  }));
}
async function settle(p) { await p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))); }
async function expose(p, selector, edge = 'top') {
  await p.locator(selector).evaluate((el, edge) => {
    const q = el.closest('.quiz'), r = q.getBoundingClientRect(), b = el.getBoundingClientRect();
    const nav = q.querySelector('.quiz__nav'), bottom = nav.hidden || nav.contains(el) ? r.bottom : nav.getBoundingClientRect().top;
    if (b.height > bottom - r.top - 2) q.scrollTop += edge === 'top' ? b.top - r.top - 1 : b.bottom - bottom + 1;
    else if (b.bottom > bottom - 1) q.scrollTop += b.bottom - bottom + 1;
    else if (b.top < r.top + 1) q.scrollTop += b.top - r.top - 1;
  }, edge);
  await settle(p);
  return p.locator(selector).evaluate(el => {
    const q = el.closest('.quiz'), r = q.getBoundingClientRect(), b = el.getBoundingClientRect();
    const nav = q.querySelector('.quiz__nav');
    const top = Math.max(b.top, r.top), bottom = Math.min(b.bottom, nav.hidden || nav.contains(el) ? r.bottom : nav.getBoundingClientRect().top);
    const x = b.left + b.width / 2, y = (top + bottom) / 2;
    return { width: b.width, height: b.height, visible: bottom - top, full: b.top >= r.top - 1 && b.bottom <= (nav.hidden || nav.contains(el) ? r.bottom : nav.getBoundingClientRect().top) + 1,
      hit: bottom > top && el.contains(document.elementFromPoint(x, y)), x, y, viewportSpace: (nav.hidden ? r.bottom : nav.getBoundingClientRect().top) - r.top };
  });
}
async function press(p, selector) {
  const rect = await expose(p, selector);
  assert(rect.hit, `hit ${selector}: ${JSON.stringify(rect)}`);
  if (p.viewportSize().width < 1024) await p.touchscreen.tap(rect.x, rect.y);
  else await p.mouse.click(rect.x, rect.y);
}
async function verifyAnswer(p, question, id) {
  const selector = `[data-choice="${id}"]`;
  await p.locator('.quiz').evaluate(q => { q.scrollTop = 0; });
  const point = await expose(p, selector);
  const before = await geometry(p);
  if (p.viewportSize().width < 1024) await p.touchscreen.tap(point.x, point.y);
  else await p.mouse.click(point.x, point.y);
  await settle(p);
  const after = await geometry(p);
  assert.equal(await p.locator('.quiz').getAttribute('data-phase'), 'feedback');
  assert(Math.abs(before.scroll - after.scroll) <= 1, JSON.stringify({ before, after }));
  assert(Math.abs(before.heading.top - after.heading.top) <= 1, 'question position must not move');
  assert.equal(after.snap, before.snap);
  assert.equal(await p.locator('.quiz__feedback').evaluate((el, id) => el.previousElementSibling.dataset.choice === id && document.activeElement === el, id), true);
  assert.equal(await p.locator('.quiz__feedback').getAttribute('data-correct'), String(id === question.answer));
  assert.equal(await p.locator('.quiz [data-choice]:enabled').count(), 0);
  assert.equal(await p.locator('.quiz__hint').evaluate(el => getComputedStyle(el).visibility), 'hidden');
  return { before, after };
}
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, locale: 'id-ID', reducedMotion: 'reduce' });
    const p = await context.newPage(); await ready(p);
    if (!fixtureOnly) {
    const baseline = await verifyAnswer(p, questions[0], 'a');
    await p.screenshot({ path: path.join(__dirname, `t4.3-${stage}-feedback.png`) });
    pass('390x844: no feedback scroll jump, heading fixed, feedback directly after selected answer', baseline);
    await press(p, button('next'));
    for (let i = 1; i < questions.length; i++) {
      await verifyAnswer(p, questions[i], questions[i].answer);
      await press(p, button('next'));
    }
    assert.equal(await p.locator('.quiz').getAttribute('data-phase'), 'summary');
    assert.match(await p.locator('.quiz__score').innerText(), /8\/8/);
    pass('Complete eight questions via panel including six choices q2/q5; score, emergency and restart flow preserved');
    await press(p, button('restart'));
    let state = 0;
    for (const [width, height] of [[360,800],[390,844],[844,390],[1365,900]]) {
      await p.setViewportSize({ width, height });
      for (const lang of ['en', 'id']) {
        await p.locator(`[data-lang="${lang}"]`).click();
        for (const scale of [1, 2]) {
          await p.evaluate(scale => { for (const [name, value] of [['14',14],['16',16],['20',20]]) document.documentElement.style.setProperty(`--fs-${name}`, `${value * scale}px`); }, scale);
          for (const position of width < 1024 ? ['peek','half','full'] : ['desktop']) {
            await snap(p, position);
            if (state) await press(p, button('restart'));
            const tags = { width, height, lang, scale, position };
            for (let i = 0; i < questions.length; i++) {
              const q = questions[i], ids = await p.locator('.quiz [data-choice]').evaluateAll(els => els.map(e => e.dataset.choice));
              for (const id of ids) {
                const selector = `.quiz [data-choice="${id}"]`;
                const rect = await expose(p, selector);
                assert(rect.width >= 44 && rect.height >= 44 && rect.hit, `option target ${JSON.stringify({ ...tags, q:q.id, id, rect })}`);
                if (rect.height <= rect.viewportSpace - 2) assert(rect.full, 'whole option above sticky Next');
                else {
                  const bottom = await expose(p, selector, 'bottom'); assert(bottom.hit);
                  report.tallOptions.push({ ...tags, question:q.id, id, height:rect.height, viewportSpace:rect.viewportSpace });
                }
              }
              const selected = ids[(state + i) % ids.length];
              await verifyAnswer(p, q, selected);
              if (q.emergency) {
                assert.equal(await p.locator('.quiz__contacts [href="tel:113"]').count(), 1);
                assert.equal(await p.locator('.quiz__contacts [href="tel:112"]').count(), 1);
              }
              for (const source of await p.locator('.quiz__feedback a').all()) {
                await source.evaluate(el => el.dataset.t43Source = 'active');
                assert((await expose(p, '[data-t43-source="active"]')).hit);
                await source.evaluate(el => delete el.dataset.t43Source);
              }
              if (i === 0 && width === 390 && lang === 'id' && scale === 1 && position === 'half') {
                await p.locator('.quiz').evaluate(el => el.scrollTop = 0);
                await p.screenshot({ path: path.join(__dirname, `t4.3-${stage}-mobile-half.png`) });
              }
              if (i === 0 && width === 1365 && lang === 'id' && scale === 1) {
                await p.locator('.quiz').evaluate(el => el.scrollTop = 0);
                await p.screenshot({ path: path.join(__dirname, `t4.3-${stage}-desktop.png`) });
              }
              assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
              const nav = await expose(p, button('next')); assert(nav.full && nav.hit && nav.height >= 44);
              await press(p, button('next'));
              assert.equal(await p.locator('.quiz').evaluate(el => el.scrollTop), 0);
            }
            report.states.push(tags); save(); state++;
          }
        }
      }
    }
    pass('40 layout states x eight questions: every option/source/footer reachable, no answer-induced scroll, no page overflow', { states:state, tallOptions:report.tallOptions.length });
    await p.setViewportSize({ width:390, height:844 });
    await p.evaluate(() => { for (const x of ['14','16','20']) document.documentElement.style.removeProperty(`--fs-${x}`); });
    await snap(p, 'half'); await press(p, button('restart'));
    for (let i = 0; i < 8; i++) {
      if (questions[i].type === 'pick-hotspot') {
        const selector = `.hotspot-pins:not([hidden]) [data-hotspot="${questions[i].answer}"]`;
        await p.locator(selector).waitFor({ state: 'visible' });
        await p.waitForTimeout(900);
        const before = await geometry(p);
        if (i === 1) {
          await p.locator(selector).focus(); await p.keyboard.press('Space');
        } else await p.locator(selector).tap();
        await settle(p);
        const after = await geometry(p); assert.equal(after.scroll, before.scroll);
        assert.equal(await p.locator('.quiz__feedback').evaluate(el => el.previousElementSibling.dataset.choice), questions[i].answer);
      } else {
        await expose(p, `[data-choice="${questions[i].answer}"]`);
        await p.locator(`[data-choice="${questions[i].answer}"]`).focus();
        const before = await geometry(p);
        await p.keyboard.press(i % 2 ? 'Space' : 'Enter');
        await settle(p); assert.equal((await geometry(p)).scroll, before.scroll);
      }
      assert.equal(await p.locator('.quiz').getAttribute('data-phase'), 'feedback');
      assert.equal(await p.locator('.quiz__feedback').evaluate(el => document.activeElement === el), true);
      for (let tab = 0; tab < 15 && !await p.locator(button('next')).evaluate(el => document.activeElement === el); tab++) await p.keyboard.press('Tab');
      assert.equal(await p.locator(button('next')).evaluate(el => document.activeElement === el), true);
      await p.keyboard.press('Enter');
    }
    assert.match(await p.locator('.quiz__score').innerText(), /8\/8/);
    pass('Keyboard Enter/Space, focus feedback -> Tab -> Next; q2 keyboard pin and q5 native touch pin, score 8/8');
    }
    if (stage === 'dev') {
      await p.evaluate(async () => {
        const { initQuizUi } = await import('/src/ui/quiz.js');
        const { default: questions } = await import('/src/data/quiz.json');
        const q = structuredClone(questions[0]); q.choices.push({ ...q.choices[2], id:'d' });
        const session = { index:0, phase:'question', answers:[] };
        const ui = initQuizUi([q], { answer(id) { session.answers[0] = { given:id, correct:id === q.answer }; session.phase = 'feedback'; ui.render({ session, ready:true }); ui.focusFeedback(); }, next() {}, resetView(){}, restart(){}, training(){}, results(){} });
        const panel = document.querySelector('.panel__body'); panel.replaceChildren(ui.element);
        ui.enter(); ui.render({ session, ready:true }); window.t43Fixture = ui;
      });
      assert.equal(await p.locator('[data-choice]').count(), 4);
      const point = await expose(p, '[data-choice="d"]'); assert(point.full && point.hit);
      const before = await geometry(p); await p.touchscreen.tap(point.x, point.y); await settle(p);
      assert.equal((await geometry(p)).scroll, before.scroll);
      assert.equal(await p.locator('.quiz__feedback').evaluate(el => el.previousElementSibling.dataset.choice), 'd');
      pass('Isolated four-option fixture: fourth option fully reachable, real tap, no scroll jump; production data unchanged');
    }
    assert.deepEqual(report.errors, []); save();
  } catch (error) { report.errors.push(error.stack); save(); throw error; }
  finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
