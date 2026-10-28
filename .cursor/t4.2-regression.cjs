const fs = require('node:fs');
const path = require('node:path');
const name = process.argv.includes('--results') ? 't2.4-check.cjs'
  : process.argv.includes('--effects') ? 't2.2-check.cjs'
    : process.argv.includes('--training') ? 't2.1-check.cjs'
      : process.argv.includes('--pdf') ? 't2.5-check.cjs' : 't2.3-check.cjs';
let source = fs.readFileSync(path.join(__dirname, name), 'utf8');
if (name === 't2.4-check.cjs') source = source.replaceAll('t2.4', 't4.2-results');
else if (name === 't2.1-check.cjs') source = source.replace("const prefix = production ? 't2.1-production' : 't2.1';", "const prefix = 't4.2-training';");
else if (name === 't2.2-check.cjs') source = source.replaceAll('t2.2', 't4.2-effects');
else if (name === 't2.5-check.cjs') source = source.replaceAll('t2.5', 't4.2-pdf');
else source = source.replace("const prefix = origin.includes('5183') ? 't2.3-dev' : 't2.3';", "const prefix = 't4.2-quiz';");
if (name !== 't2.4-check.cjs') source = source.replace(/(?<!\.tab)\[href="#(train|results|configure)"\]/g, '.tab[href="#$1"]');
source = source.replaceAll("locator('canvas')", "locator('#canvas-root canvas')")
  .replaceAll('[href="tel:113"]', '[href="tel:113"]:visible')
  .replaceAll('[href="tel:112"]', '[href="tel:112"]:visible')
  .replaceAll('.results > a[href="#train"]', '.results > [data-route="train"]')
  .replaceAll('.results a[href="#configure"]', '.results [data-route="configure"]');
source = source.replace(/for \(const expanded of \[false,\s*true\]\)/g, "for (const expanded of ['peek','half','full'])")
  .replace(/if\s*\(\(await handle\.getAttribute\('aria-expanded'\)\s*===\s*'true'\)\s*!==\s*expanded\)\s*await handle\.tap\(\);/g, 'await t42Snap(m, expanded);')
  .replace("assert.equal(await handle.getAttribute('aria-expanded'),String(expanded),", "assert.equal(await m.locator('#panel').getAttribute('data-snap'),expanded,")
  .replace("document.querySelector('#panel').classList.toggle('is-expanded',expanded);", '')
  .replace('}, {scale,expanded});', '}, {scale,expanded}); await t42Snap(p, expanded);')
  .replace(/if\s*\(await m\.locator\('\.panel__handle'\)\.getAttribute\('aria-expanded'\)\s*===\s*'true'\)\s*await m\.locator\('\.panel__handle'\)\.tap\(\);/g, "await t42Snap(m, 'peek');")
  .replace('snap<2', 'snap<3').replace('snapStates:combinations*2', 'snapStates:combinations*3')
  .replace('buttonChecks:combinations*4', 'buttonChecks:combinations*6')
  .replaceAll('both sheet snaps', 'three sheet snaps').replaceAll('both snaps', 'three snaps')
  .replaceAll('two sheet snaps', 'three sheet snaps').replaceAll('two snaps (40 states, 80 button checks)', 'three snaps (60 states, 120 button checks)')
  .replace('40 mobile layout combinations', '60 mobile layout combinations');
source += `\nasync function t42Snap(page, name) {
  if (page.viewportSize().width >= 1024) return;
  for (let i = 0; i < 3 && await page.locator('#panel').getAttribute('data-snap') !== name; i++) {
    await page.locator('.panel__handle').click();
    await page.waitForTimeout(300);
  }
  require('node:assert/strict').equal(await page.locator('#panel').getAttribute('data-snap'), name);
}`;
module._compile(source, path.join(__dirname, name));
