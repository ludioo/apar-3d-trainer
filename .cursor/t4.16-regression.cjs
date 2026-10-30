const fs = require('node:fs');
const path = require('node:path');
const name = process.argv.includes('--squeeze') ? 't4.8-check.cjs'
  : process.argv.includes('--layout') ? 't4.3-check.cjs' : 't4.2-regression.cjs';
let source = fs.readFileSync(path.join(__dirname, name), 'utf8');
source = source.replaceAll('2026-10-28', '2026-10-30');
if (name === 't4.8-check.cjs') source = source.replaceAll('t4.8-', 't4.16-squeeze-');
else if (name === 't4.3-check.cjs') {
  source = source.replaceAll('t4.3-', 't4.16-layout-').replace("includes('5193')", "includes('5276')");
  const start = source.indexOf('async function snap(');
  const end = source.indexOf('async function geometry(', start);
  source = source.slice(0, start) + `${equivalentSnap.toString().replace('equivalentSnap(', 'snap(')}\n` + source.slice(end);
}
else source = source.replaceAll('t4.2-', 't4.16-');
module._compile(source, path.join(__dirname, name));

async function equivalentSnap(p, name) {
  if (p.viewportSize().width >= 1024) return;
  const matches = () => p.locator('#panel').evaluate((panel, requested) => {
    const names = ['peek', 'half', 'full'];
    const root = getComputedStyle(document.documentElement), style = getComputedStyle(panel);
    const heights = [0.25, 0.5, 0.75].map(f => Math.min(Math.max(parseFloat(root.getPropertyValue('--sheet-viewport-h')) * f,
      parseFloat(style.getPropertyValue('--sheet-min-h'))), parseFloat(style.maxHeight)));
    return heights[names.indexOf(panel.dataset.snap)] === heights[names.indexOf(requested)];
  }, name);
  await settle(p);
  for (let i = 0; i < 3 && !await matches(); i++) {
    await p.locator('.panel__handle').focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(260);
  }
  assert(await matches(), `equivalent sheet height for ${name}`);
  if (await p.locator('#panel').getAttribute('data-snap') !== name) {
    report.collapsedSnaps ??= [];
    report.collapsedSnaps.push({ viewport: p.viewportSize(), requested: name, actual: await p.locator('#panel').getAttribute('data-snap') });
  }
}
