const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const origin = process.argv[2] || 'http://localhost:4183';
const report = { origin, states: [], errors: [], screenshots: [] };
async function focusCheck(p, selector) {
  const el = p.locator(selector);
  await el.focus();
  await p.waitForTimeout(30);
  const hit = await el.evaluate(e => {
    const r = e.getBoundingClientRect();
    const x = r.x + r.width / 2, y = r.y + r.height / 2;
    const hit = document.elementFromPoint(x, y);
    return { ok: x >= 0 && x <= innerWidth && y >= 0 && y <= innerHeight && (hit === e || e.contains(hit)), rect: r.toJSON(), hit: hit?.outerHTML.slice(0, 120) };
  });
  assert(hit.ok, `${selector}: ${JSON.stringify(hit)}`);
}
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    for (const [width, height] of [[360, 800], [390, 844], [844, 390], [768, 1024], [1280, 900]]) {
      const p = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce', locale: 'en-US', isMobile: width < 1024, hasTouch: true });
      p.on('pageerror', e => report.errors.push(String(e)));
      await p.goto(origin + '/#train');
      await p.waitForFunction(() => document.querySelector('#splash').inert);
      await p.locator('[data-training="start"]').click();
      for (const stage of ['pass', 'quiz']) {
        if (stage === 'quiz') {
          for (let n = 0; n < 4; n++) {
            await p.locator('[data-training="skip"]').click();
            await p.locator('[data-training="next"]').click();
          }
          await p.locator('[data-training="quiz"]').click();
          await p.locator('[data-choice="a"]').click();
          await p.locator('[data-quiz="next"]').click();
        }
        for (const scale of [1, 2]) for (const lang of ['en', 'id']) {
          await p.locator(`[data-lang="${lang}"]`).click();
          await p.evaluate(scale => {
            for (const n of [12, 14, 16, 20, 28, 40]) document.documentElement.style.setProperty('--fs-' + n, n * scale + 'px');
          }, scale);
          for (const expanded of [false, true]) {
            if (width < 1024 && await p.locator('.panel__handle').getAttribute('aria-expanded') !== String(expanded)) await p.locator('.panel__handle').click();
            const modes = stage === 'pass' ? ['train'] : ['configure', 'train', 'results'];
            for (const mode of modes) {
              await p.locator(`.tab[href="#${mode}"]`).click();
              await p.waitForTimeout(75);
              const chrome = await p.evaluate(() => {
                const brand = document.querySelector('.topbar__brand').getBoundingClientRect();
                const actions = document.querySelector('.topbar__actions').getBoundingClientRect();
                return { width: document.documentElement.scrollWidth, viewport: innerWidth, collision: brand.right > actions.left + 1, topbar: document.querySelector('.topbar').getBoundingClientRect().height };
              });
              assert(chrome.width <= chrome.viewport + 1, JSON.stringify(chrome));
              assert.equal(chrome.collision, false, JSON.stringify(chrome));
              const selector = mode === 'configure' ? '[data-part="body"]' : mode === 'train'
                ? stage === 'pass' ? '[data-training="interact"]' : '.quiz__choices [data-choice="body"]' : '[data-results="clear"]';
              await focusCheck(p, selector);
              report.states.push({ width, height, stage, scale, lang, expanded, mode, chrome });
            }
            await p.locator('.topbar__about').click();
            await p.locator('#about[open]').waitFor();
            await focusCheck(p, '#about .modal__close');
            await focusCheck(p, '#about [data-i18n="about.usfa"]');
            assert(await p.locator('#about').evaluate(e => e.scrollWidth <= e.clientWidth + 1));
            if (stage === 'quiz' && expanded && lang === 'id' && ((width === 390 && scale === 2) || (width === 1280 && scale === 1))) {
              await p.locator('#about-title').focus();
              const file = `t3.2-about-${width}-${scale}.png`;
              await p.screenshot({ path: path.join(__dirname, file) }); report.screenshots.push(file);
            }
            await p.mouse.click(2, Math.floor(height / 2));
            await p.waitForFunction(() => !document.querySelector('#about').open);
            await p.locator('.tab[href="#train"]').click();
          }
        }
        await p.evaluate(() => { for (const n of [12, 14, 16, 20, 28, 40]) document.documentElement.style.removeProperty('--fs-' + n); });
      }
      await p.locator('.tab[href="#configure"]').click();
      if (width === 390 || width === 1280) {
        await focusCheck(p, '[data-part="body"]');
        const file = `t3.2-parts-${width}.png`;
        await p.screenshot({ path: path.join(__dirname, file) }); report.screenshots.push(file);
      }
      await p.close();
      console.log('PASS layout', width, height, report.states.length);
    }
    assert.deepEqual(report.errors, []);
  } finally { fs.writeFileSync(path.join(__dirname, 't3.2-layout-qa.json'), JSON.stringify(report, null, 2)); await browser.close(); }
})().catch(e => { report.failure = String(e.stack); fs.writeFileSync(path.join(__dirname, 't3.2-layout-qa.json'), JSON.stringify(report, null, 2)); console.error(e); process.exitCode = 1; });
