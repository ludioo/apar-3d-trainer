const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const questions = require('../src/data/quiz.json');
const origin = process.argv[2] || 'http://127.0.0.1:5273';
const label = process.argv[3] || 'dev';
assert.match(label, /^[a-z0-9-]+$/);
const folder = path.join(__dirname, 't4.26', label);
fs.mkdirSync(folder, { recursive: true });
const report = { date: '2026-10-31', origin, states: [], checks: [], errors: [], expectedErrors: [], warnings: [] };
const save = () => fs.writeFileSync(path.join(folder, 'qa.json'), JSON.stringify(report, null, 2));
const pass = (name, detail) => { report.checks.push({ name, detail }); save(); console.log('PASS', name); };
const attempt = { id: '00000000000000000000000000000001', startedAt: '2026-10-31T01:00:00.000Z',
  finishedAt: '2026-10-31T01:00:20.000Z', durationSec: 20, score: 4, total: 8, passed: false,
  answers: questions.map((q, i) => ({ qId: q.id, correct: i < 4,
    given: i < 4 ? q.answer : q.type === 'choice' ? q.choices.find(c => c.id !== q.answer).id : 'body' })) };
function watch(page, name, expected = /$^/) {
  page.on('pageerror', error => report.errors.push(`${name}: ${error}`));
  page.on('console', message => {
    const text = `${name}: ${message.text()}`;
    if (message.type() === 'error') (expected.test(message.text()) ? report.expectedErrors : report.errors).push(text);
    if (message.type() === 'warning') report.warnings.push(text);
  });
}
async function ready(page) {
  await page.waitForFunction(() => performance.getEntriesByName('apar:visible').length > 0);
  assert.equal(await page.locator('#splash').count(), 0, 'splash removed after first visible frame and fade');
}
async function closed(page) {
  await page.waitForFunction(() => !document.querySelector('#about').open && document.activeElement.matches('.topbar__about'));
  assert.equal(new URL(page.url()).hash, '#results');
}
async function matrix(browser, width, lang, scale) {
  const name = `${width}-${lang}-${scale}`, touch = width < 1024;
  const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: touch, isMobile: touch, reducedMotion: 'reduce' });
  const page = await context.newPage(); watch(page, name);
  try {
    await page.addInitScript(({ attempt, lang }) => {
      localStorage.setItem('apar3d:lang', JSON.stringify(lang));
      localStorage.setItem('apar3d:attempts', JSON.stringify({ schemaVersion: 1, attempts: [attempt] }));
    }, { attempt, lang });
    await page.goto(`${origin}/#results`); await ready(page);
    assert.equal(await page.locator('html').getAttribute('lang'), lang);
    if (scale === 200) await page.evaluate(() => {
      const sizes = [...document.querySelectorAll('.results, .results *, #about, #about *')]
        .map(el => [el, parseFloat(getComputedStyle(el).fontSize)]);
      sizes.forEach(([el, size]) => { el.style.fontSize = `${size * 2}px`; });
    });
    const state = await page.locator('.results__answers').evaluate(table => {
      const rows = [...table.tBodies[0].rows];
      const status = [...table.querySelectorAll('tr > :last-child')].map(el => {
        const r = el.getBoundingClientRect(), range = document.createRange(); range.selectNodeContents(el);
        const text = range.getBoundingClientRect(), style = getComputedStyle(el);
        return { text: el.textContent, lines: range.getClientRects().length, width: r.width,
          font: style.fontSize, nowrap: style.whiteSpace, contained: text.left >= r.left && text.right <= r.right };
      });
      return { status, rows: rows.length, tableWidth: table.getBoundingClientRect().width,
        panelWidth: document.querySelector('.panel__body').clientWidth,
        overflow: document.documentElement.scrollWidth > innerWidth || table.scrollWidth > table.clientWidth + 1,
        collisions: rows.some(row => { const r = row.cells[2].getBoundingClientRect();
          return [...row.cells].slice(0, 2).some(cell => { const range = document.createRange(); range.selectNodeContents(cell);
            return [...range.getClientRects()].some(text => text.right > r.left + 1); }); }) };
    });
    assert.equal(state.rows, 8); assert(!state.overflow && !state.collisions, JSON.stringify(state));
    assert(state.status.every(s => s.lines === 1 && s.nowrap === 'nowrap' && s.contained), JSON.stringify(state));
    assert.deepEqual([...new Set(state.status.slice(1).map(s => s.text))].sort(), lang === 'en' ? ['Correct', 'Incorrect'] : ['Benar', 'Salah']);
    await page.locator('.results__answers td.results__error').first().evaluate(el => el.scrollIntoView({ block: 'start' }));
    await page.screenshot({ path: path.join(folder, `${name}-results.png`) });
    const open = () => touch ? page.locator('.topbar__about').tap() : page.locator('.topbar__about').click();
    await open();
    await page.waitForFunction(() => document.activeElement.id === 'about-title');
    const close = page.locator('#about .modal__close'), body = page.locator('#about > .modal__body');
    const before = await close.boundingBox();
    assert(before.width >= 44 && before.height >= 44);
    await page.evaluate(() => { document.addEventListener('click', event => {
      if (event.target.closest('#about a')) { event.preventDefault(); window.aboutLinkClicks = (window.aboutLinkClicks || 0) + 1; }
    }, true); });
    const links = page.locator('#about a[href]'); assert.equal(await links.count(), 10);
    for (let i = 0; i < 10; i++) {
      const link = links.nth(i);
      await link.evaluate(el => el.scrollIntoView({ block: 'center' }));
      assert(await link.evaluate(el => {
        const r = el.getBoundingClientRect(), b = el.closest('.modal__body').getBoundingClientRect();
        return r.top >= b.top - 1 && r.bottom <= b.bottom + 1 && el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
      }), `${name}: link ${i} obscured`);
      if (touch) await link.tap(); else await link.click();
    }
    assert.equal(await page.evaluate(() => window.aboutLinkClicks), 10);
    assert.deepEqual(await close.boundingBox(), before, 'Close stable after scrolling every link');
    const about = await close.evaluate(el => { const r = el.getBoundingClientRect(), body = el.closest('dialog').querySelector('.modal__body');
      return { width: r.width, height: r.height, visible: r.top >= 0 && r.bottom <= innerHeight,
        hit: document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) === el,
        separate: r.bottom <= body.getBoundingClientRect().top, scroll: body.scrollTop,
        overflow: el.closest('dialog').scrollWidth > el.closest('dialog').clientWidth + 1 || body.scrollWidth > body.clientWidth + 1 }; });
    assert(about.visible && about.hit && about.separate && !about.overflow, JSON.stringify(about));
    await page.screenshot({ path: path.join(folder, `${name}-about.png`) });
    await close.focus(); await page.keyboard.press('Shift+Tab');
    assert(await links.last().evaluate(el => document.activeElement === el));
    await page.keyboard.press('Tab'); assert(await close.evaluate(el => document.activeElement === el));
    assert(await close.evaluate(el => parseFloat(getComputedStyle(el).outlineWidth) >= 2));
    if (touch) await close.tap(); else await close.click(); await closed(page);
    await open(); await page.keyboard.press('Escape'); await closed(page);
    await open(); if (touch) await page.touchscreen.tap(2, 2); else await page.mouse.click(2, 2); await closed(page);
    for (const route of ['configure', 'train', 'results']) {
      await page.locator(`.tab[href="#${route}"]`).click();
      await page.waitForFunction(route => location.hash === `#${route}`, route);
      assert.equal(await page.locator(route === 'configure' ? '[data-agent="co2"]' : route === 'train' ? '.training' : '.results').isVisible(), true);
      assert.equal(await page.locator('#splash').count(), 0);
    }
    report.states.push({ name, ...state, about, linksClicked: 10, focusTrap: true, closeEscapeBackdropFocus: true, routes: true });
    pass(name, 'Results one line/no overflow; About touch targets, 10 links, focus, close/Escape/backdrop; three routes');
  } finally { await context.close(); }
}
async function loader(browser, motion) {
  const context = await browser.newContext({ viewport: { width: 360, height: 800 }, reducedMotion: motion });
  const page = await context.newPage(); watch(page, `loader-${motion}`, /Model load failed|Failed to load resource: net::ERR_FAILED/);
  try {
    await page.addInitScript(() => {
      window.splashEvents = [];
      new MutationObserver(() => { const el = document.querySelector('#splash');
        const state = el ? { connected: true, done: el.classList.contains('is-done'), ariaHidden: el.getAttribute('aria-hidden'), inert: el.inert }
          : { connected: false };
        if (JSON.stringify(window.splashEvents.at(-1)) !== JSON.stringify(state)) window.splashEvents.push(state);
      }).observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'aria-hidden', 'inert'] });
    });
    let requests = 0, release;
    const gate = new Promise(resolve => { release = resolve; });
    await page.route('**/models/apar.glb', async route => { requests++;
      if (requests === 1) await route.abort('failed'); else { await gate; await route.continue(); } });
    await page.goto(origin);
    await page.locator('.splash__retry').waitFor({ state: 'visible' });
    assert(await page.locator('.splash__error').isVisible()); assert.equal(await page.locator('.splash__text').isVisible(), false);
    await page.locator('.splash__retry').click();
    assert(await page.locator('.splash__text').isVisible()); assert.equal(await page.locator('.splash__error').isVisible(), false);
    await page.locator('.splash__slow').waitFor({ state: 'visible', timeout: 12000 });
    assert.equal(await page.locator('#splash').getAttribute('aria-hidden'), null);
    release(); await ready(page);
    const events = await page.evaluate(() => window.splashEvents);
    const hidden = events.findIndex(s => s.connected && s.done && s.inert && s.ariaHidden === 'true');
    assert(hidden >= 0 && events.slice(hidden + 1).some(s => !s.connected), JSON.stringify(events));
    assert.equal(requests, 2);
    await page.screenshot({ path: path.join(folder, `loader-${motion}-done.png`) });
    pass(`loader-${motion}`, { errorRetrySlowSuccess: true, events });
  } finally { await context.close(); }
}
async function fallback(browser) {
  const context = await browser.newContext({ viewport: { width: 360, height: 800 } });
  const page = await context.newPage(); watch(page, 'webgl-fallback', /THREE.WebGLRenderer: Error creating WebGL context/);
  try {
    await page.addInitScript(() => { const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type, ...args) { return /webgl/.test(type) ? null : original.call(this, type, ...args); }; });
    await page.goto(origin); await page.locator('#webgl-fallback').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#splash').isVisible(), false);
    assert.equal(await page.locator('.splash__text').isVisible(), false);
    assert.equal(await page.locator('#canvas-root canvas').count(), 0);
    await page.locator('.topbar__about').click(); await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('#about').open && document.activeElement.matches('.topbar__about'));
    pass('WebGL fallback', 'fallback visible, loading text hidden, About works');
  } finally { await context.close(); }
}
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    for (const width of [360, 390, 1365]) for (const lang of ['en', 'id']) for (const scale of [100, 200]) await matrix(browser, width, lang, scale);
    for (const motion of ['no-preference', 'reduce']) await loader(browser, motion);
    await fallback(browser);
    assert.deepEqual(report.errors, []); pass('No unexpected console/page errors', { expectedErrors: report.expectedErrors.length });
  } finally { save(); await browser.close(); }
})().catch(error => { report.failure = String(error.stack || error); save(); console.error(error); process.exitCode = 1; });
