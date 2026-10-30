const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const folder = path.join(__dirname, 't4.19');
fs.mkdirSync(folder, { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    await page.goto('http://localhost:4269/#configure');
    await page.waitForFunction(() => getComputedStyle(document.querySelector('#splash')).opacity === '0');
    await page.locator('[data-lang="id"]').click();
    await page.locator('.topbar__about').click();
    const state = await page.evaluate(() => {
      const close = document.querySelector('#about .modal__close');
      const rect = el => {
        const r = el.getBoundingClientRect();
        return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
      };
      const c = rect(close);
      const overlaps = [...document.querySelectorAll('#about p, #about a')].flatMap(el => {
        const r = rect(el);
        const intersection = { left: Math.max(c.left, r.left), top: Math.max(c.top, r.top), right: Math.min(c.right, r.right), bottom: Math.min(c.bottom, r.bottom) };
        if (intersection.right <= intersection.left || intersection.bottom <= intersection.top) return [];
        const hit = document.elementFromPoint((intersection.left + intersection.right) / 2, (intersection.top + intersection.bottom) / 2);
        return [{ text: el.textContent, rect: r, intersection, coveredByClose: hit === close || close.contains(hit) }];
      });
      return { viewport: [innerWidth, innerHeight], close: c, position: getComputedStyle(close).position, links: document.querySelectorAll('#about a').length, overlaps };
    });
    await page.screenshot({ path: path.join(folder, 'baseline-mobile-id.png') });
    assert(state.overlaps.some(x => x.coveredByClose), 'Baseline must reproduce overlap before implementation');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('#about').open);
    const styles = await page.evaluate(() => [...document.querySelectorAll('.saved-dialog, .results-dialog')].map(el => {
      const css = getComputedStyle(el), body = getComputedStyle(el.querySelector('.modal__body'));
      return { selector: `.${el.classList[1]}`, dialog: { display: css.display, maxHeight: css.maxHeight, overflowY: css.overflowY }, body: { display: body.display, overflowY: body.overflowY, padding: body.padding, gap: body.gap } };
    }));
    fs.writeFileSync(path.join(folder, 'baseline.json'), JSON.stringify({ date: '2026-10-30', ...state, sharedModalStyles: styles }, null, 2));
    console.log(JSON.stringify({ position: state.position, links: state.links, covered: state.overlaps.filter(x => x.coveredByClose).map(x => x.text), sharedModalStyles: styles }, null, 2));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
