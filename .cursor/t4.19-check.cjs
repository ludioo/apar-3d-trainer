const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const folder = path.join(__dirname, 't4.19');
const origin = 'http://localhost:4269';
const report = { date: '2026-10-30', origin, states: [], checks: [], errors: [], warnings: [] };
const save = () => fs.writeFileSync(path.join(folder, 'qa.json'), JSON.stringify(report, null, 2));
const pass = (name, detail) => { report.checks.push({ name, detail }); save(); console.log('PASS', name); };
const key = async (p, selector, value = 'Enter') => { await p.locator(selector).focus(); await p.keyboard.press(value); };
async function ready(p, hash = 'configure') {
  await p.goto(`${origin}/#${hash}`);
  await p.waitForFunction(() => getComputedStyle(document.querySelector('#splash')).opacity === '0');
}
async function closed(p, hash = 'configure') {
  await p.waitForFunction(hash => !document.querySelector('#about').open && location.hash === `#${hash}` && document.activeElement.matches('.topbar__about'), hash);
  assert.equal(await p.locator('#about').isVisible(), false);
}
async function geometry(p) {
  return p.evaluate(() => {
    const d = document.querySelector('#about'), b = d.querySelector('.modal__body');
    const h = d.querySelector('.modal__header'), c = d.querySelector('.modal__close'), t = d.querySelector('.modal__title');
    const rect = el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom }; };
    const dr = rect(d), br = rect(b), hr = rect(h), cr = rect(c), tr = rect(t);
    const hit = document.elementFromPoint(cr.x + cr.width / 2, cr.y + cr.height / 2);
    return { dialog: dr, body: br, header: hr, close: cr, title: tr, bodyScroll: b.scrollTop, bodyHeight: b.scrollHeight,
      dialogScroll: d.scrollTop, scrollRange: b.scrollHeight - b.clientHeight,
      overflow: b.scrollWidth > b.clientWidth + 1 || d.scrollWidth > d.clientWidth + 1 || document.documentElement.scrollWidth > innerWidth + 1,
      clipped: [...b.querySelectorAll('p, h3, a')].filter(el => el.scrollWidth > el.clientWidth + 1).map(el => el.textContent),
      closeHits: c === hit || c.contains(hit), position: getComputedStyle(c).position,
      focusRing: { style: getComputedStyle(c).outlineStyle, width: getComputedStyle(c).outlineWidth } };
  });
}
async function testState(browser, device, viewport, language, scale) {
  const touch = device !== 'desktop', name = `${device}-${language}-${scale}`;
  const context = await browser.newContext({ viewport, hasTouch: touch, isMobile: touch, reducedMotion: 'reduce' });
  const p = await context.newPage();
  p.on('pageerror', e => report.errors.push(`${name}: ${e}`));
  p.on('console', m => { if (m.type() === 'error') report.errors.push(`${name}: ${m.text()}`); if (m.type() === 'warning') report.warnings.push(m.text()); });
  try {
    await ready(p);
    await key(p, `[data-lang="${language}"]`);
    if (touch) await p.locator('.topbar__about').tap(); else await p.locator('.topbar__about').click();
    await p.waitForFunction(() => document.querySelector('#about').open && document.activeElement.id === 'about-title');
    if (scale === 200) await p.evaluate(() => {
      const sizes = [...document.querySelectorAll('#about, #about *')].map(el => [el, parseFloat(getComputedStyle(el).fontSize)]);
      for (const [el, size] of sizes) el.style.fontSize = `${size * 2}px`;
    });
    const state = { name, viewport, language, scale, scrolls: [], links: [] };
    for (const fraction of [0, 0.5, 1]) {
      await p.locator('#about > .modal__body').evaluate((b, f) => { b.scrollTop = (b.scrollHeight - b.clientHeight) * f; }, fraction);
      const g = await geometry(p);
      assert(!g.overflow && !g.clipped.length, `${name}: overflow ${JSON.stringify(g)}`);
      assert(g.closeHits && g.close.width >= 44 && g.close.height >= 44 && g.body.height > 44, `${name}: close/body unreachable`);
      assert(g.close.bottom <= g.body.y && g.header.bottom <= g.body.y + 1, `${name}: header overlays body`);
      assert(g.title.right <= g.close.x && g.title.y >= g.header.y && g.title.bottom <= g.header.bottom, `${name}: title overlaps close/header`);
      assert(g.dialog.y >= 0 && g.dialog.bottom <= viewport.height && g.dialogScroll === 0, `${name}: outer dialog scrolling`);
      if (state.scrolls.length) assert.deepEqual(g.close, state.scrolls[0].close, `${name}: Close moved during body scroll`);
      state.scrolls.push(g);
    }
    assert(state.scrolls[2].bodyScroll > 0, `${name}: body must scroll`);
    await p.screenshot({ path: path.join(folder, `${name}-bottom.png`) });
    await p.evaluate(() => {
      window.aboutClicks = [];
      document.addEventListener('click', event => {
        const a = event.target.closest('#about a[href]');
        if (a) { event.preventDefault(); window.aboutClicks.push({ href: a.href, trusted: event.isTrusted }); }
      }, true);
    });
    const links = p.locator('#about a[href]');
    assert.equal(await links.count(), 10);
    for (let i = 0; i < 10; i++) {
      const a = links.nth(i);
      const link = await a.evaluate(el => {
        el.scrollIntoView({ block: 'center' });
        const r = el.getBoundingClientRect(), b = el.closest('.modal__body').getBoundingClientRect();
        const points = [];
        for (const x of [r.left + 4, (r.left + r.right) / 2, r.right - 4]) for (const y of [r.top + 4, (r.top + r.bottom) / 2, r.bottom - 4]) {
          const hit = document.elementFromPoint(x, y); points.push(hit === el || el.contains(hit));
        }
        return { href: el.href, label: el.textContent, x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2,
          contained: r.top >= b.top && r.bottom <= b.bottom, height: r.height, points };
      });
      assert(link.contained && link.height >= 44 && link.points.every(Boolean), `${name}: blocked link ${JSON.stringify(link)}`);
      if (touch) await p.touchscreen.tap(link.x, link.y); else await p.mouse.click(link.x, link.y);
      const click = await p.evaluate(() => window.aboutClicks.at(-1));
      assert.deepEqual(click, { href: link.href, trusted: true }, `${name}: link not clicked`);
      assert.equal(await p.evaluate(() => document.querySelector('#about').open && location.hash === '#about'), true);
      state.links.push(link);
    }
    await key(p, '#about .modal__close', 'Tab');
    assert.equal(await p.evaluate(() => document.activeElement.dataset.i18n), 'about.usfa');
    await p.keyboard.press('Shift+Tab');
    assert.equal(await p.evaluate(() => document.activeElement.className), 'modal__close');
    const focused = await geometry(p);
    assert(focused.focusRing.style !== 'none' && focused.focusRing.width !== '0px', `${name}: focus ring absent`);
    await key(p, '#about a[data-i18n="about.github"]', 'Tab');
    assert.equal(await p.evaluate(() => document.activeElement.className), 'modal__close');
    await p.keyboard.press('Shift+Tab');
    assert.equal(await p.evaluate(() => document.activeElement.dataset.i18n), 'about.github');
    await p.keyboard.press('Escape'); await closed(p);
    await key(p, '.topbar__about');
    if (touch) await p.locator('#about .modal__close').tap(); else await p.locator('#about .modal__close').click();
    await closed(p);
    for (const activation of ['Enter', 'Space']) {
      await key(p, '.topbar__about');
      await key(p, '#about .modal__close', activation); await closed(p);
    }
    await key(p, '.topbar__about');
    const r = await p.locator('#about').boundingBox();
    await p.mouse.click(Math.max(1, r.x - 5), r.y + r.height / 2); await closed(p);
    report.states.push(state); save(); console.log('PASS', name, '10 links, scroll, keyboard, close/backdrop');
  } finally { await context.close(); }
}
async function regression(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, reducedMotion: 'reduce' });
  const p = await context.newPage();
  p.on('pageerror', e => report.errors.push(`regression: ${e}`));
  try {
    await ready(p, 'about');
    await p.keyboard.press('Escape'); await closed(p);
    for (const mode of ['configure', 'train', 'results']) {
      await key(p, `.tab[href="#${mode}"]`);
      await key(p, '.topbar__about');
      await p.goBack();
      await p.waitForFunction(mode => location.hash === `#${mode}` && !document.querySelector('#about').open, mode);
      await p.goForward();
      await p.waitForFunction(() => location.hash === '#about' && document.querySelector('#about').open);
      await p.keyboard.press('Escape'); await closed(p, mode);
    }
    pass('hash navigation', 'Direct #about, Back/Forward and restore all three mode hashes');
    for (const language of ['en', 'id']) {
      await key(p, `[data-lang="${language}"]`);
      await key(p, '.tab[href="#configure"]');
      await key(p, '[data-action="save"]');
      await p.locator('#saved-name').fill('T4.19 QA');
      assert.equal(await p.locator('.saved-dialog').evaluate(el => getComputedStyle(el).display), 'block');
      assert.equal(await p.locator('.saved-dialog .modal__body').evaluate(el => getComputedStyle(el).overflowY), 'visible');
      await key(p, '.saved-dialog button[type="submit"]');
      await p.waitForFunction(() => !document.querySelector('.saved-dialog').open);
      assert(await p.locator('.saved-list').innerText().then(t => t.includes('T4.19 QA')));
      await key(p, '[data-action="save"]'); await p.keyboard.press('Escape');
      await p.waitForFunction(() => !document.querySelector('.saved-dialog').open);
      await key(p, '.tab[href="#results"]');
      await key(p, '[data-results="clear"]');
      assert.equal(await p.locator('.results-dialog').evaluate(el => getComputedStyle(el).display), 'block');
      assert.equal(await p.locator('.results-dialog .modal__body').evaluate(el => getComputedStyle(el).overflowY), 'visible');
      await key(p, '[data-results="cancel"]');
      await p.waitForFunction(() => !document.querySelector('.results-dialog').open);
      await key(p, '[data-results="clear"]'); await p.keyboard.press('Escape');
      await p.waitForFunction(() => !document.querySelector('.results-dialog').open);
      await key(p, '[data-results="clear"]'); await key(p, '[data-results="confirm"]');
      await p.waitForFunction(() => !document.querySelector('.results-dialog').open);
      await key(p, '.tab[href="#configure"]'); assert.equal(await p.locator('.saved-list li').count(), 0);
    }
    pass('shared dialogs EN/ID', 'Save/Cancel/Escape and Clear/Cancel/Escape/Confirm in isolated browser storage; dialog display and body overflow unchanged');
  } finally { await context.close(); }
}
(async () => {
  fs.mkdirSync(folder, { recursive: true });
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    for (const [device, viewport] of [['desktop', { width: 1280, height: 900 }], ['mobile', { width: 390, height: 844 }], ['landscape', { width: 844, height: 390 }]]) {
      for (const language of ['en', 'id']) for (const scale of [100, 200]) await testState(browser, device, viewport, language, scale);
    }
    pass('layout matrix', `${report.states.length} states; 36 scroll samples; 120 trusted link activations with navigation prevented; 1080 link hit-tests`);
    await regression(browser);
    const root = path.resolve(__dirname, '..');
    const original = execFileSync('git', ['show', 'HEAD:index.html'], { cwd: root, encoding: 'utf8' }).match(/<dialog id="about"[\s\S]*?<\/dialog>/)[0];
    const current = fs.readFileSync(path.join(root, 'index.html'), 'utf8').match(/<dialog id="about"[\s\S]*?<\/dialog>/)[0];
    for (const pattern of [/data-i18n="[^"]+"/g, /href="[^"]+"/g, /data-emergency="[^"]+"/g]) assert.deepEqual([...current.matchAll(pattern)].map(x => x[0]).sort(), [...original.matchAll(pattern)].map(x => x[0]).sort());
    pass('content invariants', 'About i18n keys, href destinations and emergency bindings identical to HEAD');
    assert.deepEqual(report.errors, [], 'Unexpected browser errors');
    pass('browser errors', 'Zero pageerror/console error in matrix; regression pageerror captured');
  } finally { save(); await browser.close(); }
})().catch(e => { report.failure = String(e.stack); save(); console.error(e); process.exitCode = 1; });
