const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const origin = process.argv[2] || 'http://localhost:4202';
const stage = origin.includes('5202') ? 'dev' : 'production';
const prefix = `t4.11-${stage}`;
const load = file => JSON.parse(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'));
const questions = load('src/data/quiz.json');
const hotspots = load('src/data/hotspots.json');
const copy = { en: load('src/i18n/en.json'), id: load('src/i18n/id.json') };
const report = { date: '2026-10-30', origin, checks: [], states: [], errors: [], warnings: [] };
const save = () => fs.writeFileSync(path.join(__dirname, `${prefix}-qa.json`), JSON.stringify(report, null, 2));
const pass = (name, detail) => { report.checks.push({ name, detail }); save(); console.log('PASS', name); };
const quiz = (p, name) => p.locator(`[data-quiz="${name}"]`);
const settle = p => p.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
async function ready(p) {
  p.on('pageerror', e => report.errors.push(String(e)));
  p.on('console', m => {
    if (m.type() === 'error' && !m.text().includes('404')) report.errors.push(m.text());
    if (m.type() === 'warning') report.warnings.push(m.text());
  });
  await p.goto(`${origin}/#train`);
  await p.waitForFunction(() => getComputedStyle(document.querySelector('#splash')).opacity === '0');
  await p.locator('[data-training="start"]').click();
  for (let i = 0; i < 4; i++) {
    await p.locator('[data-training="skip"]').click();
    await p.locator('[data-training="next"]').click();
  }
  await p.locator('[data-training="quiz"]').click();
}
async function finish(p, score, useTouch = false, wrongHotspot = 'body') {
  for (const [i, question] of questions.entries()) {
    assert.equal(await p.locator('.quiz__review').isVisible(), false);
    assert.equal(await p.locator('.quiz__review li').count(), 0);
    if (question.type === 'pick-hotspot') {
      const lang = await p.locator('[data-lang="id"]').getAttribute('aria-pressed') === 'true' ? 'id' : 'en';
      assert.deepEqual(await p.locator('.quiz__choices > button').allTextContents(),
        hotspots.map((_, n) => copy[lang]['quiz.part'].replace('{n}', n + 1)));
    }
    const given = i < score ? question.answer : question.type === 'choice'
      ? question.choices.find(c => c.id !== question.answer).id : wrongHotspot;
    const option = p.locator(`.quiz [data-choice="${given}"]`);
    if (useTouch) { await option.scrollIntoViewIfNeeded(); await option.tap(); }
    else { await option.focus(); await p.keyboard.press('Enter'); }
    assert.equal(await p.locator('.quiz').getAttribute('data-phase'), 'feedback');
    assert.equal(await p.locator('.quiz__feedback').getAttribute('data-correct'), String(i < score));
    assert.equal(await p.locator('.quiz [data-choice]:enabled').count(), 0);
    if (useTouch) { await quiz(p, 'next').scrollIntoViewIfNeeded(); await quiz(p, 'next').tap(); }
    else { await quiz(p, 'next').focus(); await p.keyboard.press('Space'); }
  }
  assert.equal(await p.locator('.quiz').getAttribute('data-phase'), 'summary');
}
async function verify(p, score, lang, wrongHotspot = 'body') {
  const words = copy[lang];
  assert.equal(await p.locator('.quiz__body > h3').innerText(), words[score >= 6 ? 'quiz.passed' : 'quiz.failed']);
  assert.equal(await p.locator('.quiz__score').innerText(), `${score}/8 · ${new Intl.NumberFormat(lang, { style: 'percent', maximumFractionDigits: 1 }).format(score / 8)}`);
  assert.equal(await p.getByText(words['quiz.passingScore'], { exact: true }).isVisible(), true);
  assert.equal(await p.locator('.quiz__review > h4').innerText(), words['quiz.review']);
  const rows = await p.locator('.quiz__review li').evaluateAll(items => items.map(item => ({
    title: item.querySelector('h5').textContent,
    text: [...item.querySelectorAll('p')].map(p => p.textContent),
    correct: item.querySelector('[data-correct]').dataset.correct,
  })));
  assert.equal(rows.length, 8);
  for (const [i, q] of questions.entries()) {
    const given = i < score ? q.answer : q.type === 'choice' ? q.choices.find(c => c.id !== q.answer).id : wrongHotspot;
    const label = id => q.type === 'choice' ? q.choices.find(c => c.id === id).label[lang] : hotspots.find(h => h.id === id).title[lang];
    const expected = [words['quiz.yourAnswer'].replace('{answer}', label(given)), words[i < score ? 'quiz.correct' : 'quiz.incorrect']];
    if (i >= score) expected.push(words['quiz.correctAnswer'].replace('{answer}', label(q.answer)));
    assert.deepEqual(rows[i], { title: q.question[lang], text: expected, correct: String(i < score) });
  }
  assert.doesNotMatch(await p.locator('.quiz__review').innerText(), /\b(?:Part|Bagian) [1-6]\b/);
  assert.equal(await p.locator('.quiz__nav').isVisible(), false);
  assert.equal(await p.locator('.quiz__review').evaluate(el => el.nextElementSibling.className), 'quiz__tools');
}
async function snap(p, name) {
  if (p.viewportSize().width >= 1024) return;
  const heights = await p.locator('#panel').evaluate(panel => {
    const style = getComputedStyle(panel), root = getComputedStyle(document.documentElement);
    return [0.25, 0.5, 0.75].map(f => Math.min(Math.max(parseFloat(root.getPropertyValue('--sheet-viewport-h')) * f,
      parseFloat(style.getPropertyValue('--sheet-min-h'))), parseFloat(style.maxHeight)));
  });
  const target = heights[['peek', 'half', 'full'].indexOf(name)];
  const matches = async () => heights[['peek', 'half', 'full'].indexOf(await p.locator('#panel').getAttribute('data-snap'))] === target;
  for (let i = 0; i < 3 && !await matches(); i++) {
    await p.locator('.panel__handle').tap(); await settle(p);
  }
  assert.equal(await matches(), true, JSON.stringify({ name, heights }));
}
async function expose(p, selector, edge = 'top') {
  const locator = p.locator(selector);
  await locator.evaluate((el, edge) => {
    const root = el.closest('.quiz'), a = root.getBoundingClientRect(), b = el.getBoundingClientRect();
    root.scrollTop += edge === 'top' ? b.top - a.top - 1 : b.bottom - a.bottom + 1;
  }, edge);
  await settle(p);
  return locator.evaluate(el => {
    const root = el.closest('.quiz').getBoundingClientRect(), b = el.getBoundingClientRect();
    const top = Math.max(root.top, b.top), bottom = Math.min(root.bottom, b.bottom);
    return { hit: bottom > top && el.contains(document.elementFromPoint(b.left + b.width / 2, (top + bottom) / 2)),
      containedX: b.left >= root.left - 1 && b.right <= root.right + 1, width: b.width, height: b.height };
  });
}
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'id-ID', hasTouch: true, reducedMotion: 'reduce' });
    const p = await context.newPage(); await ready(p);
    for (const score of [0, 5, 6, 8]) {
      if (score) await quiz(p, 'restart').click();
      await finish(p, score);
      const bytes = await p.evaluate(() => localStorage.getItem('apar3d:attempts'));
      for (const lang of ['en', 'id']) {
        await p.locator(`[data-lang="${lang}"]`).click(); await verify(p, score, lang);
        await quiz(p, 'results').click();
        assert.equal(await p.locator('.results__score').innerText(), `${score}/8`);
        assert.equal(await p.locator('.results__score-details').getByText(copy[lang]['quiz.passingScore'], { exact: true }).isVisible(), true);
        assert.equal(await p.locator('.results__answers tbody tr').count(), 8);
        assert.equal(await p.evaluate(() => localStorage.getItem('apar3d:attempts')), bytes, 'viewing results must not rewrite attempts');
        await p.locator('.tab[href="#train"]').click(); await verify(p, score, lang);
      }
      pass(`${score}/8: status, threshold, full ordered review EN/ID, results table, round-trip and unchanged storage`);
    }
    await quiz(p, 'restart').click(); await finish(p, 5);
    for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
      await p.setViewportSize(viewport);
      for (const scale of [1, 2]) {
        await p.evaluate(scale => { for (const n of [12, 14, 16, 20, 28, 40]) document.documentElement.style.setProperty(`--fs-${n}`, `${n * scale}px`); }, scale);
        for (const lang of ['en', 'id']) {
          await p.locator(`[data-lang="${lang}"]`).tap(); await verify(p, 5, lang);
          for (const position of viewport.width < 1024 ? ['peek', 'half', 'full'] : ['desktop']) {
            await snap(p, position);
            for (let i = 1; i <= 8; i++) {
              for (const child of ['h5', 'p:last-child']) {
                for (const edge of ['top', 'bottom']) {
                  const geometry = await expose(p, `.quiz__review li:nth-child(${i}) ${child}`, edge);
                  assert(geometry.hit && geometry.containedX, JSON.stringify({ viewport, scale, lang, position, i, child, edge, geometry }));
                }
              }
            }
            for (const action of ['restart', 'training', 'results']) {
              const geometry = await expose(p, `[data-quiz="${action}"]`);
              assert(geometry.hit && geometry.containedX && geometry.width >= 44 && geometry.height >= 44, JSON.stringify({ action, geometry }));
            }
            assert.equal(await p.locator('.quiz').evaluate(el => el.scrollWidth <= el.clientWidth + 1), true);
            assert.equal(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
            report.states.push({ ...viewport, scale, lang, position, effectiveSnap: await p.locator('#panel').getAttribute('data-snap') });
          }
        }
      }
    }
    pass('16 summary layout states: desktop/mobile390, EN/ID, text100/200, all three mobile snaps; every review row and final controls reachable', report.states.length);
    await p.locator('.quiz').evaluate(el => { el.scrollTop = 0; });
    await p.screenshot({ path: path.join(__dirname, `${prefix}-mobile-text200.png`) });
    await expose(p, '.quiz__review li:last-child p:last-child', 'bottom');
    await p.screenshot({ path: path.join(__dirname, `${prefix}-mobile-review-end200.png`) });
    await p.evaluate(() => { for (const n of [12, 14, 16, 20, 28, 40]) document.documentElement.style.removeProperty(`--fs-${n}`); });
    await p.locator('[data-lang="id"]').click(); await snap(p, 'full');
    await p.locator('.quiz').evaluate(el => { el.scrollTop = 0; });
    await p.screenshot({ path: path.join(__dirname, `${prefix}-mobile-summary.png`) });
    await expose(p, '.quiz__review li:nth-child(5) h5');
    await p.screenshot({ path: path.join(__dirname, `${prefix}-mobile-review.png`) });
    await expose(p, '[data-quiz="results"]', 'bottom');
    await p.screenshot({ path: path.join(__dirname, `${prefix}-mobile-controls.png`) });
    await p.setViewportSize({ width: 1280, height: 900 });
    await p.locator('.quiz').evaluate(el => { el.scrollTop = 0; });
    await p.screenshot({ path: path.join(__dirname, `${prefix}-desktop-summary.png`) });
    await quiz(p, 'results').click();
    await p.locator('.panel__body').evaluate(el => { el.scrollTop = 0; });
    await p.screenshot({ path: path.join(__dirname, `${prefix}-desktop-results.png`) });
    await p.locator('.tab[href="#train"]').click();
    await quiz(p, 'restart').focus(); await p.keyboard.press('Space');
    assert.equal(await p.locator('.quiz__review li').count(), 0);
    assert.equal(await p.locator('.quiz__review').isVisible(), false);
    await finish(p, 0, false, 'handle'); await verify(p, 0, 'id', 'handle');
    await quiz(p, 'training').click();
    assert.equal(await p.locator('.quiz').count(), 0);
    assert.equal(await p.locator('[data-training="quiz"]').isVisible(), true);
    await p.locator('[data-training="quiz"]').click();
    assert.equal(await p.locator('.quiz__review li').count(), 0);
    pass('Keyboard restart clears prior review; wrong handle displays Tuas; return to training and new quiz work');
    await p.reload();
    await p.waitForFunction(() => getComputedStyle(document.querySelector('#splash')).opacity === '0');
    assert.equal(await p.locator('.quiz').count(), 0);
    pass('Refresh discards session and opens PASS intro');
    const previous = JSON.parse(await p.evaluate(() => localStorage.getItem('apar3d:attempts'))).attempts.find(a => a.score === 6);
    const failedContext = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'id-ID', hasTouch: true, reducedMotion: 'reduce' });
    await failedContext.addInitScript(previous => {
      localStorage.setItem('apar3d:attempts', JSON.stringify({ schemaVersion: 1, attempts: [previous] }));
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function(key, value) {
        if (key === 'apar3d:attempts') throw Error('T4.11 simulated storage failure');
        return original.call(this, key, value);
      };
    }, previous);
    const f = await failedContext.newPage(); await ready(f); await finish(f, 0, true);
    await verify(f, 0, 'id');
    assert.equal(await f.getByText(copy.id['quiz.saveFailed'], { exact: true }).isVisible(), true);
    for (const lang of ['en', 'id']) {
      await f.locator(`[data-lang="${lang}"]`).tap(); await verify(f, 0, lang);
      await quiz(f, 'results').tap();
      assert.equal(await f.locator('.results__score').innerText(), '6/8');
      assert.equal(await f.locator('.results__error').filter({ hasText: copy[lang]['results.unsaved'] }).isVisible(), true);
      await f.locator('.tab[href="#train"]').tap(); await verify(f, 0, lang);
    }
    assert.equal(await f.evaluate(() => JSON.parse(localStorage.getItem('apar3d:attempts')).attempts.length), 1);
    pass('Mobile native touch, failed save: complete live review survives language/tab changes; Results keeps previous saved6/8');
    const rgb = hex => hex.match(/\w\w/g).map(v => parseInt(v, 16) / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    const lum = hex => rgb(hex).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
    const contrast = hex => (lum(hex) + 0.05) / (lum('16191e') + 0.05);
    const ratios = Object.fromEntries(['f2f3f5', '2bc48a', 'ff5a5f'].map(hex => [hex, contrast(hex)]));
    assert(Object.values(ratios).every(r => r >= 4.5));
    pass('Review text, correct and incorrect statuses meet AA against panel surface', ratios);
    assert.deepEqual(report.errors, []);
    await failedContext.close(); await context.close();
    save();
  } catch (error) { report.failure = String(error.stack); save(); console.error(error); process.exitCode = 1; }
  finally { await browser.close(); }
})();
