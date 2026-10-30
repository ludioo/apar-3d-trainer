const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '..');
const folder = path.join(__dirname, 't4.17');
fs.mkdirSync(folder, { recursive: true });
const load = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const questions = load('src/data/quiz.json');
const hotspots = load('src/data/hotspots.json');
const steps = load('src/data/pass-steps.json');
const dictionaries = { id: load('src/i18n/id.json'), en: load('src/i18n/en.json') };
const forbidden = /\b(?:bracket|nozzle|gauge|review|source|mouse|ring|strip|rating|checklist)\b|\bClass C\b/i;
const report = { date: '2026-10-30', origin: 'http://localhost:4257', checks: [], states: [], errors: [], warnings: [] };
const save = () => fs.writeFileSync(path.join(folder, 'qa.json'), JSON.stringify(report, null, 2));
function pass(name, detail) { report.checks.push({ name, detail }); save(); console.log('PASS', name); }
const key = async (p, selector, value = 'Enter') => { await p.locator(selector).focus(); await p.keyboard.press(value); };
const nav = (p, mode) => key(p, `.tab[href="#${mode}"]`);
const lang = (p, value) => key(p, `[data-lang="${value}"]`);
async function checkpoint(p, name, language, image = false) {
  await p.waitForTimeout(120);
  const state = await p.evaluate(() => {
    const panel = document.querySelector('#panel-body');
    const bad = [...document.querySelectorAll('#panel-body p, #panel-body button, #panel-body h3, #panel-body h4, #panel-body label, dialog[open] p, dialog[open] button')]
      .filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden' && el.scrollWidth > el.clientWidth + 2)
      .map(el => ({ text: el.textContent, width: el.clientWidth, scroll: el.scrollWidth }));
    return { text: panel.innerText, pageOverflow: document.documentElement.scrollWidth > innerWidth + 1,
      panelOverflow: panel.scrollWidth > panel.clientWidth + 1, bad };
  });
  assert(!state.pageOverflow && !state.panelOverflow && !state.bad.length, JSON.stringify({ name, ...state }));
  if (language === 'id') assert(!forbidden.test(state.text.replace(/Config #\d+/g, '')), `${name}: English leak`);
  report.states.push({ name, ...state }); save();
  if (image) await p.screenshot({ path: path.join(folder, `${name}.png`) });
}
function withoutIdTranslations(value) {
  if (Array.isArray(value)) return value.map(withoutIdTranslations);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).filter(([key]) => !(key === 'id' && typeof value.en === 'string')).map(([key, val]) => [key, withoutIdTranslations(val)]));
}
for (const file of ['src/data/hotspots.json', 'src/data/pass-steps.json', 'src/data/quiz.json']) {
  const original = JSON.parse(execFileSync('git', ['show', `HEAD:${file}`], { cwd: root, encoding: 'utf8' }));
  assert.deepEqual(withoutIdTranslations(load(file)), withoutIdTranslations(original), `${file}: only ID text may change`);
}
assert.equal(fs.readFileSync(path.join(root, 'src/i18n/en.json'), 'utf8').replace(/\r\n/g, '\n'), execFileSync('git', ['show', 'HEAD:src/i18n/en.json'], { cwd: root, encoding: 'utf8' }).replace(/\r\n/g, '\n'));
for (const [keyName, value] of Object.entries(dictionaries.id)) assert(!forbidden.test(value), keyName);
function scanId(value) {
  if (!value || typeof value !== 'object') return;
  if (typeof value.en === 'string') assert(!forbidden.test(value.id), value.id);
  for (const child of Object.values(value)) scanId(child);
}
[hotspots, steps, questions].forEach(scanId);
pass('EN, identifiers, geometry, answers and non-translated data unchanged; targeted ID terms absent');
async function pdf(p, type, name) {
  const waiting = p.waitForEvent('download');
  await key(p, `[data-pdf="${type}"]`);
  const download = await waiting;
  await download.saveAs(path.join(folder, `${name}.pdf`));
  await p.waitForFunction(type => document.querySelector(`[data-pdf="${type}"]`).getAttribute('aria-busy') === 'false', type);
}
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    for (const [device, viewport] of [['desktop', { width: 1280, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
      const context = await browser.newContext({ viewport, hasTouch: device === 'mobile', reducedMotion: 'reduce' });
      const p = await context.newPage();
      p.on('pageerror', e => { report.errors.push(String(e)); save(); });
      p.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()); if (m.type() === 'warning') report.warnings.push(m.text()); });
      await p.goto(`${report.origin}/#configure`);
      await p.waitForFunction(() => getComputedStyle(document.querySelector('#splash')).opacity === '0');
      const saveConfig = async (language, custom) => {
        await lang(p, language);
        await key(p, '[data-action="save"]');
        const input = p.locator('#saved-name');
        const initial = await input.inputValue();
        assert.equal(initial, dictionaries[language]['saved.defaultName'].replace('{n}', language === 'en' ? 1 : custom ? 3 : 2));
        if (custom) await input.fill(custom);
        await p.screenshot({ path: path.join(folder, `${device}-save-${custom ? 'custom' : language}.png`) });
        await key(p, '.saved-dialog button[type="submit"]');
      };
      await saveConfig('en');
      await saveConfig('id');
      await saveConfig('id', 'Gudang #1');
      if (device === 'mobile') await p.locator('.config-bracket input').tap();
      else await key(p, '.config-bracket input', 'Space');
      for (const language of ['id', 'en']) {
        await lang(p, language);
        const copy = dictionaries[language];
        assert.equal(await p.locator('.config-note').innerText(), copy['config.illustrativeNote']);
        assert((await p.locator('.saved-list').innerText()).includes('Config #1'));
        assert((await p.locator('.saved-list').innerText()).includes('Konfigurasi #2'));
        assert((await p.locator('.saved-list').innerText()).includes('Gudang #1'));
        await checkpoint(p, `${device}-${language}-configure`, language, true);
        if (device === 'desktop') await pdf(p, 'spec', `${device}-${language}-spec`);
        for (const part of hotspots) {
          await key(p, `[data-part="${part.id}"]`);
          assert.equal(await p.locator('.hotspot-info__header h3').innerText(), part.title[language]);
          assert.equal(await p.locator('.hotspot-info__body').innerText(), part.body[language]);
          await checkpoint(p, `${device}-${language}-hotspot-${part.id}`, language, part.id === 'nozzle');
          await key(p, '.hotspot-info__close');
        }
      }
      const configBytes = await p.evaluate(() => localStorage.getItem('apar3d:configs'));
      await p.reload();
      await p.waitForFunction(() => getComputedStyle(document.querySelector('#splash')).opacity === '0');
      assert.equal(await p.evaluate(() => localStorage.getItem('apar3d:configs')), configBytes);
      pass(`${device}: save ID/EN/custom, six hotspots, language changes, reload and storage preservation`);
      await nav(p, 'train');
      await lang(p, 'id');
      await key(p, '[data-training="start"]');
      for (let i = 0; i < steps.length; i++) {
        for (const language of ['id', 'en']) {
          await lang(p, language);
          assert((await p.locator('.training__body').innerText()).includes(steps[i].instruction[language]));
          if (i === 2) assert.equal(await p.locator('#training-hint').innerText(), dictionaries[language]['training.hint.hold']);
          await checkpoint(p, `${device}-${language}-pass-${steps[i].id}`, language, i === 2);
        }
        await key(p, '[data-training="skip"]'); await key(p, '[data-training="next"]');
      }
      await key(p, '[data-training="quiz"]');
      for (const question of questions) {
        const given = question.id === 'q2' ? 'nozzle' : question.answer;
        await key(p, `.quiz [data-choice="${given}"]`);
        for (const language of ['id', 'en']) {
          await lang(p, language);
          assert((await p.locator('.quiz__feedback').innerText()).includes(question.explanation[language]));
          await checkpoint(p, `${device}-${language}-${question.id}-feedback`, language, question.id === 'q6' || question.id === 'q7');
        }
        await key(p, '[data-quiz="next"]');
      }
      for (const language of ['id', 'en']) {
        await lang(p, language);
        assert.equal(await p.locator('#quiz-review-heading').innerText(), dictionaries[language]['quiz.review']);
        assert.equal(await p.locator('.quiz__review li').count(), 8);
        await checkpoint(p, `${device}-${language}-quiz-summary`, language, true);
      }
      await nav(p, 'results');
      const attemptsBytes = await p.evaluate(() => localStorage.getItem('apar3d:attempts'));
      for (const language of ['id', 'en']) {
        await lang(p, language);
        assert.equal(await p.locator('.results__answers tbody tr').count(), 8);
        const text = await p.locator('.results').innerText();
        for (const term of ['Config #1', 'Konfigurasi #2', 'Gudang #1', hotspots.find(h => h.id === 'nozzle').title[language]]) assert(text.includes(term), term);
        assert(text.includes(dictionaries[language]['emergency.source']));
        await checkpoint(p, `${device}-${language}-results`, language, true);
        if (device === 'desktop') await pdf(p, 'report', `${device}-${language}-report`);
        await key(p, '.topbar__about');
        assert.equal(await p.locator('#about [data-i18n="emergency.source"]').innerText(), dictionaries[language]['emergency.source']);
        await p.screenshot({ path: path.join(folder, `${device}-${language}-about.png`) });
        await p.keyboard.press('Escape');
      }
      assert.equal(await p.evaluate(() => localStorage.getItem('apar3d:configs')), configBytes);
      assert.equal(await p.evaluate(() => localStorage.getItem('apar3d:attempts')), attemptsBytes);
      pass(`${device}: all PASS/quiz feedback, summary, populated Results and About bilingual`, { score: '7/8', states: report.states.length });
      await context.close();
    }
    assert.deepEqual(report.errors, []);
    pass('No page errors or console errors; four desktop PDF exports downloaded', { pdfs: fs.readdirSync(folder).filter(name => name.endsWith('.pdf')) });
  } finally { await browser.close(); save(); }
})().catch(error => { report.failure = error.stack; save(); console.error(error); process.exitCode = 1; });
