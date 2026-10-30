const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const origin = process.argv[2] || 'http://localhost:4276';
const folder = path.join(__dirname, 't4.16');
const report = { origin, checks: [], errors: [], accessibility: [] };
const settle = p => p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
async function accessible(client, selector) {
  const { root } = await client.send('DOM.getDocument');
  const { nodeId } = await client.send('DOM.querySelector', { nodeId: root.nodeId, selector });
  const { nodes } = await client.send('Accessibility.getPartialAXTree', { nodeId });
  return { selector, ignored: nodes[0].ignored, role: nodes[0].role.value, reasons: nodes[0].ignoredReasons };
}
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, hasTouch: true });
    const p = await context.newPage();
    p.on('pageerror', e => report.errors.push(String(e)));
    p.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()); });
    await p.goto(`${origin}/#train`);
    await p.waitForFunction(() => getComputedStyle(document.querySelector('#splash')).opacity === '0');
    await p.locator('[data-training="start"]').click();
    const client = await context.newCDPSession(p);
    const before = [await accessible(client, '#training-hint'), await accessible(client, '.training__status')];
    assert.equal(before[0].ignored, false); assert.equal(before[1].ignored, true);
    const rect = await p.locator('[data-training="interact"]').boundingBox();
    await p.locator('[data-training="interact"]').focus(); await p.keyboard.press('Enter'); await settle(p);
    const after = [await accessible(client, '#training-hint'), await accessible(client, '.training__status')];
    assert.equal(after[0].ignored, true); assert.equal(after[1].ignored, false);
    assert.equal(after[1].role, 'status');
    assert.deepEqual(await p.locator('[data-training="interact"]').boundingBox(), rect);
    report.accessibility.push({ before, after });
    report.checks.push('Chrome accessibility tree excludes inactive hint/status; active status retains role=status; action target geometry unchanged');
    await p.locator('.topbar__about').click(); await p.keyboard.press('Escape');
    await p.waitForFunction(() => document.activeElement === document.querySelector('.topbar__about'));
    assert(await p.locator('.topbar__about').evaluate(el => document.activeElement === el));
    await p.locator('[data-lang="id"]').click();
    assert(await p.locator('[data-training="next"]').isEnabled());
    await p.locator('.tab[href="#configure"]').click(); await p.locator('.tab[href="#train"]').click();
    assert(await p.locator('[data-training="next"]').isEnabled());
    report.checks.push('Normal motion: language change and About Escape/focus return preserve completed step; route away/back keeps session');
    await p.setViewportSize({ width: 390, height: 844 });
    const root = p.locator('.training');
    await p.waitForTimeout(400);
    await root.evaluate(el => el.scrollTop = 0);
    const b = await root.boundingBox();
    const navBefore = await p.locator('.training__nav').boundingBox();
    await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await p.mouse.wheel(0, 200);
    await p.waitForTimeout(350);
    assert(await root.evaluate(el => el.scrollTop > 0));
    const navAfter = await p.locator('.training__nav').boundingBox();
    assert(Math.abs(navBefore.y - navAfter.y) <= 2);
    report.wheelScroll = await root.evaluate(el => el.scrollTop);
    await root.evaluate(el => el.scrollTop = 0); await settle(p);
    const scrollBefore = await root.evaluate(el => el.scrollTop);
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: b.x + 30, y: b.y + b.height * 0.7 }] });
    for (let i = 1; i <= 5; i++) {
      await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: b.x + 30, y: b.y + b.height * (0.7 - 0.08 * i) }] });
      await p.waitForTimeout(30);
    }
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await p.waitForTimeout(400);
    assert(await root.evaluate((el, before) => el.scrollTop > before, scrollBefore));
    report.touchScroll = await root.evaluate(el => el.scrollTop);
    assert(Math.abs((await p.locator('.training__nav').boundingBox()).y - navBefore.y) <= 2);
    assert.equal(await p.evaluate(() => scrollY), 0);
    report.checks.push('Normal motion: wheel and CDP touch swipe scroll existing PASS root while footer stays fixed; document stays at scrollY=0');
    await p.locator('.training').evaluate(el => el.scrollTop = 0);
    await p.locator('[data-training="next"]').tap();
    await p.waitForTimeout(300);
    assert.match(await p.locator('.training h3').innerText(), /2\/4/);
    assert(await p.locator('[data-training="next"]').isDisabled());
    report.checks.push('One native tap on Next advances exactly one step; next interaction remains required');
    assert.deepEqual(report.errors, []);
    await context.close();
  } catch (e) { report.failure = String(e.stack); throw e; }
  finally { fs.writeFileSync(path.join(folder, 'input-qa.json'), JSON.stringify(report, null, 2)); await browser.close(); }
  console.log(JSON.stringify(report.checks));
})().catch(e => { console.error(e); process.exitCode = 1; });
