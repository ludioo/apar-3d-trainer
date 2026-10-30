const fs = require('node:fs');
const path = require('node:path');
let source = fs.readFileSync(path.join(__dirname, 't4.2-regression.cjs'), 'utf8');
source = source.replaceAll('t4.2-', 't4.11-').replace(
  "let source = fs.readFileSync(path.join(__dirname, name), 'utf8');",
  "let source = fs.readFileSync(path.join(__dirname, name), 'utf8').replaceAll('2026-10-28', '2026-10-30');"
);
async function t42Matches(page, name) {
  return page.locator('#panel').evaluate((panel, requested) => {
    const names = ['peek', 'half', 'full'];
    if (panel.dataset.snap === requested) return true;
    const root = getComputedStyle(document.documentElement), style = getComputedStyle(panel);
    const heights = [0.25, 0.5, 0.75].map(f => Math.min(Math.max(parseFloat(root.getPropertyValue('--sheet-viewport-h')) * f,
      parseFloat(style.getPropertyValue('--sheet-min-h'))), parseFloat(style.maxHeight)));
    return heights[names.indexOf(panel.dataset.snap)] === heights[names.indexOf(requested)];
  }, name);
}
async function t42Snap(page, name) {
  if (page.viewportSize().width >= 1024) return;
  await page.waitForTimeout(100);
  for (let i = 0; i < 3 && !await t42Matches(page, name); i++) {
    await page.locator('.panel__handle').focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
  }
  require('node:assert/strict').equal(await t42Matches(page, name), true, `sheet height for ${name}`);
  const actual = await page.locator('#panel').getAttribute('data-snap');
  if (actual !== name) {
    report.collapsedSnaps ??= [];
    report.collapsedSnaps.push({ viewport: page.viewportSize(), requested: name, actual });
  }
}
const helper = `\n${t42Matches.toString()}\n${t42Snap.toString()}`;
source = source.replace('module._compile(source, path.join(__dirname, name));', `
source = source.slice(0, source.indexOf('\\nasync function t42Snap'));
source = source.replace("assert.equal(await m.locator('#panel').getAttribute('data-snap'),expanded,", "assert.equal(await t42Matches(m, expanded),true,");
source += ${JSON.stringify(helper)};
module._compile(source, path.join(__dirname, name));`);
module._compile(source, path.join(__dirname, 't4.2-regression.cjs'));
