const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const questions = require('../src/data/quiz.json');
const origin = process.argv[2] || 'http://localhost:4276';
const stage = origin.includes('5276') ? 'dev' : 'production';
const folder = path.join(__dirname, 't4.16');
fs.mkdirSync(folder, { recursive: true });
const report = { origin, stage, states: [], checks: [], errors: [], warnings: [], screenshots: [] };
const save = () => fs.writeFileSync(path.join(folder, `${stage}-qa.json`), JSON.stringify(report, null, 2));
const settle = p => p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
const training = name => `[data-training="${name}"]`;
const quiz = name => `[data-quiz="${name}"]`;
async function snap(p, name) {
  if (p.viewportSize().width >= 1024) return;
  for (let i = 0; i < 3 && await p.locator('#panel').getAttribute('data-snap') !== name; i++) {
    await p.locator('.panel__handle').click(); await settle(p);
  }
  assert.equal(await p.locator('#panel').getAttribute('data-snap'), name);
}
async function geometry(p, mode) {
  await settle(p);
  return p.locator(`.${mode}`).evaluate(el => {
    const rect = node => { const r = node.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, height: r.height }; };
    return { scroll: el.scrollTop, root: rect(el), nav: rect(el.querySelector(`.${el.className}__nav`)),
      heading: rect(el.querySelector('h3')), progress: el.querySelector('.quiz__progress') ? rect(el.querySelector('.quiz__progress')) : null,
      horizontalOverflow: el.scrollWidth > el.clientWidth + 1 || document.documentElement.scrollWidth > innerWidth,
      snap: document.querySelector('#panel').dataset.snap };
  });
}
function stable(before, after) {
  assert(Math.abs(before.nav.top - after.nav.top) <= 2, JSON.stringify({ before, after }));
  assert(Math.abs(after.nav.bottom - after.root.bottom) <= 2, JSON.stringify(after));
  assert(!after.horizontalOverflow, JSON.stringify(after));
}
async function expose(p, locator, edge = 'top') {
  await locator.evaluate((el, edge) => {
    const root = el.closest('.training, .quiz'), r = root.getBoundingClientRect(), b = el.getBoundingClientRect();
    const nav = root.querySelector('.training__nav, .quiz__nav');
    const bottom = nav.hidden || nav.contains(el) ? r.bottom : nav.getBoundingClientRect().top;
    if (b.height > bottom - r.top - 2) root.scrollTop += edge === 'top' ? b.top - r.top - 1 : b.bottom - bottom + 1;
    else if (b.bottom > bottom - 1) root.scrollTop += b.bottom - bottom + 1;
    else if (b.top < r.top + 1) root.scrollTop += b.top - r.top - 1;
  }, edge);
  await settle(p);
  return locator.evaluate(el => {
    const root = el.closest('.training, .quiz'), r = root.getBoundingClientRect(), b = el.getBoundingClientRect();
    const nav = root.querySelector('.training__nav, .quiz__nav');
    const top = Math.max(r.top, b.top), bottom = Math.min(b.bottom, nav.hidden || nav.contains(el) ? r.bottom : nav.getBoundingClientRect().top);
    const x = b.left + b.width / 2, y = (top + bottom) / 2;
    return { x, y, hit: bottom > top && el.contains(document.elementFromPoint(x, y)), width: b.width, height: b.height };
  });
}
async function press(p, selector) {
  const point = await expose(p, p.locator(selector));
  assert(point.hit && point.width >= 44 && point.height >= 44, JSON.stringify({ selector, point }));
  if (p.viewportSize().width < 1024) await p.touchscreen.tap(point.x, point.y);
  else await p.mouse.click(point.x, point.y);
  await settle(p);
}
async function screenshot(p, name) {
  const file = `${stage}-${name}.png`;
  await p.screenshot({ path: path.join(folder, file) }); report.screenshots.push(file);
}
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
      const context = await browser.newContext({ viewport, hasTouch: true, reducedMotion: 'reduce' });
      const p = await context.newPage();
      p.on('pageerror', e => report.errors.push(String(e)));
      p.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()); if (m.type() === 'warning') report.warnings.push(m.text()); });
      await p.goto(`${origin}/#train`);
      await p.waitForFunction(() => getComputedStyle(document.querySelector('#splash')).opacity === '0');
      for (const lang of ['en', 'id']) for (const scale of [1, 2]) for (const position of viewport.width < 1024 ? ['peek', 'half', 'full'] : ['desktop']) {
        await p.locator(`[data-lang="${lang}"]`).click();
        await p.evaluate(scale => {
          for (const [size, value] of [['14', 14], ['16', 16], ['20', 20]])
            document.documentElement.style.setProperty(`--fs-${size}`, `${value * scale}px`);
        }, scale);
        await snap(p, position);
        const state = { viewport, lang, scale, position, pass: [], quiz: [] };
        const start = await p.locator(training('start')).isVisible() ? 'start' : 'restart';
        await press(p, training(start));
        let reference;
        for (let i = 0; i < 4; i++) {
          let before = await geometry(p, 'training'); reference ??= before; stable(reference, before);
          if (lang === 'en') await press(p, training('skip'));
          else if (i < 2) await press(p, training('interact'));
          else if (i === 2) {
            await expose(p, p.locator(training('interact')));
            await p.locator(training('interact')).focus();
            await p.keyboard.down('Space'); await p.waitForTimeout(120); await p.keyboard.up('Space');
            assert(await p.locator(training('next')).isDisabled());
            await p.keyboard.down('Space');
            await p.waitForFunction(() => !document.querySelector('[data-training="next"]').disabled);
            await p.keyboard.up('Space');
          } else {
            await expose(p, p.locator('#training-sweep'));
            await p.locator('#training-sweep').focus();
            for (let cycle = 0; cycle < 3; cycle++) { await p.keyboard.press('End'); await p.keyboard.press('Home'); }
            assert(await p.locator(training('next')).isEnabled());
          }
          const after = await geometry(p, 'training'); stable(before, after);
          assert.equal(await p.locator('.training__muted').evaluate(el => getComputedStyle(el).visibility), 'hidden');
          assert.equal(await p.locator('.training__status').evaluate(el => getComputedStyle(el).visibility), 'visible');
          if (i === 3) assert.equal(await p.locator('#training-sweep-goal').evaluate(el => getComputedStyle(el).visibility), 'hidden');
          for (const control of [training('refocus'), training('skip')]) assert((await expose(p, p.locator(control))).hit);
          assert((await expose(p, p.locator('.training__disclaimer'), 'bottom')).hit);
          state.pass.push({ step: i + 1, before, after });
          if (i > 0) {
            await press(p, training('back')); stable(reference, await geometry(p, 'training'));
            await press(p, training('next')); stable(reference, await geometry(p, 'training'));
          }
          if (i === 3 && lang === 'id' && (position === 'half' || position === 'desktop')) {
            await p.locator('.training').evaluate(el => el.scrollTop = 0);
            await screenshot(p, `pass-${viewport.width}-${scale}`);
          }
          await press(p, training('next'));
        }
        await press(p, training('quiz'));
        let quizReference;
        for (const [index, q] of questions.entries()) {
          const initial = await geometry(p, 'quiz'); quizReference ??= initial; stable(quizReference, initial);
          assert.equal(initial.scroll, 0);
          assert(Math.abs(initial.progress.top - quizReference.progress.top) <= 1);
          const options = p.locator('.quiz__choices > button');
          for (const option of await options.all()) {
            assert((await expose(p, option)).hit);
            assert((await expose(p, option, 'bottom')).hit);
          }
          const ids = await options.evaluateAll(els => els.map(el => el.dataset.choice));
          const given = lang === 'id' ? q.answer : ids.find(id => id !== q.answer);
          const selected = p.locator(`[data-choice="${given}"]`);
          await expose(p, selected);
          const before = await geometry(p, 'quiz');
          const choiceBefore = await selected.boundingBox();
          await press(p, `[data-choice="${given}"]`);
          const after = await geometry(p, 'quiz'); stable(before, after);
          assert(Math.abs(before.scroll - after.scroll) <= 1);
          assert(Math.abs(before.heading.top - after.heading.top) <= 1);
          assert.equal((await selected.boundingBox()).height, choiceBefore.height);
          assert.equal(await p.locator('.quiz__feedback').evaluate((el, given) => el.previousElementSibling.dataset.choice === given && document.activeElement === el, given), true);
          assert.equal(await p.locator('.quiz__choices > button:enabled').count(), 0);
          for (const source of await p.locator('.quiz__feedback a').all()) assert((await expose(p, source)).hit);
          if (q.emergency) for (const source of await p.locator('.quiz__contacts a').all()) assert((await expose(p, source)).hit);
          assert((await expose(p, p.locator('.quiz__body > .quiz__muted').last(), 'bottom')).hit);
          state.quiz.push({ question: q.id, before, after });
          if (index === 0 && lang === 'id' && (position === 'half' || position === 'desktop')) {
            await p.locator('.quiz').evaluate(el => el.scrollTop = 0);
            await screenshot(p, `quiz-${viewport.width}-${scale}`);
          }
          await press(p, quiz('next'));
        }
        assert.equal(await p.locator('.quiz').getAttribute('data-phase'), 'summary');
        await press(p, quiz('training'));
        report.states.push(state); save(); console.log('PASS', viewport.width, lang, scale, position);
      }
      await context.close();
    }
    assert.deepEqual(report.errors, []);
    report.checks.push('16 viewport/language/text/snap combinations; all PASS steps, Back/Skip, actual keyboard Squeeze/Sweep, eight right/wrong quiz answers, contacts/sources/disclaimer, touch/click hit tests, footer drift <=2px, progress reset, no horizontal overflow or unexpected errors');
  } catch (e) { report.failure = String(e.stack); throw e; }
  finally { save(); await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
