const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const questions = require('../src/data/quiz.json');
const folder = path.join(__dirname, 't4.16');
const origin = process.argv[2] || 'http://localhost:5276';
fs.mkdirSync(folder, { recursive: true });
const settle = p => p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
async function measure(p, mode, label) {
  await settle(p);
  return p.locator(`.${mode}`).evaluate((el, label) => {
    const rect = x => { const r = x.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, height: r.height }; };
    return { label, scroll: el.scrollTop, root: rect(el), body: rect(el.querySelector(`.${el.className}__body`)),
      nav: rect(el.querySelector(`.${el.className}__nav`)), heading: rect(el.querySelector('h3')) };
  }, label);
}
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const report = { origin, samples: [] };
  try {
    for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
      const p = await browser.newPage({ viewport, reducedMotion: 'reduce' });
      await p.goto(`${origin}/#train`);
      await p.waitForFunction(() => getComputedStyle(document.querySelector('#splash')).opacity === '0');
      await p.locator('[data-lang="id"]').click();
      await p.locator('[data-training="start"]').click();
      for (let i = 0; i < 4; i++) {
        report.samples.push({ viewport, ...await measure(p, 'training', `step-${i + 1}-before`) });
        await p.locator('[data-training="skip"]').click();
        report.samples.push({ viewport, ...await measure(p, 'training', `step-${i + 1}-after`) });
        if (i === 0) await p.screenshot({ path: path.join(folder, `baseline-pass-${viewport.width}.png`) });
        await p.locator('[data-training="next"]').click();
      }
      await p.locator('[data-training="quiz"]').click();
      for (const q of questions) {
        report.samples.push({ viewport, ...await measure(p, 'quiz', `${q.id}-before`) });
        await p.locator(`[data-choice="${q.answer}"]`).click();
        report.samples.push({ viewport, ...await measure(p, 'quiz', `${q.id}-after`) });
        if (q === questions[0]) await p.screenshot({ path: path.join(folder, `baseline-quiz-${viewport.width}.png`) });
        await p.locator('[data-quiz="next"]').click();
      }
      await p.close();
    }
    fs.writeFileSync(path.join(folder, 'baseline.json'), JSON.stringify(report, null, 2));
    for (const width of [1280, 390]) for (const mode of ['step-', 'q']) {
      const samples = report.samples.filter(x => x.viewport.width === width && x.label.startsWith(mode));
      const tops = samples.map(x => x.nav.top);
      console.log(JSON.stringify({ width, mode, navTopRange: Math.max(...tops) - Math.min(...tops), samples: samples.length }));
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
