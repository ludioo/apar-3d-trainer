const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');
const cli = 'C:/Users/Aryaguna3/AppData/Local/npm-cache/_npx/0f94ee7615faf582/node_modules/lighthouse/cli/index.js';
const report = { origin: 'http://localhost:4183', lighthouse: '12.8.2', cases: [] };
for (const mode of ['configure', 'train', 'results', 'about', 'fallback']) {
  const file = path.join(__dirname, `t3.2-lighthouse-${mode}.json`);
  execFileSync(process.execPath, [cli, report.origin + '/#' + (mode === 'fallback' ? 'configure' : mode), '--only-categories=accessibility', '--output=json', '--output-path=' + file, '--chrome-flags=--headless --no-first-run' + (mode === 'fallback' ? ' --disable-webgl' : ''), '--quiet'], { env: { ...process.env, CHROME_PATH: 'C:/Program Files/Google/Chrome/Application/chrome.exe' }, stdio: 'inherit' });
  const result = JSON.parse(fs.readFileSync(file));
  const failed = Object.values(result.audits).filter(a => a.scoreDisplayMode === 'binary' && a.score === 0).map(a => ({ id: a.id, title: a.title, details: a.details }));
  const entry = { mode, score: result.categories.accessibility.score * 100, failed };
  report.cases.push(entry);
  fs.writeFileSync(path.join(__dirname, 't3.2-lighthouse-qa.json'), JSON.stringify(report, null, 2));
  console.log('Accessibility', mode, entry.score);
  assert(entry.score >= 90, mode + ' accessibility below 90');
}
