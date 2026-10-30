const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const root = path.join(__dirname,'..');
const baseline = JSON.parse(fs.readFileSync(path.join(__dirname,'t4.14-baseline.json'),'utf8'));
const checked = [];
for (const [file,hash] of Object.entries(baseline.hashes)) {
  assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex'),hash,file);
  checked.push(file);
}
for (const file of ['src/data/product.json','src/data/hotspots.json','src/data/pass-steps.json','src/data/quiz.json',
  'src/data/emergency.json','src/i18n/en.json','src/i18n/id.json','src/core/analytics.js','src/core/scene.js',
  'public/favicon.svg','public/favicon.ico']) {
  const actual = fs.readFileSync(path.join(root,file));
  const expected = execFileSync('git',['show',`HEAD:${file}`],{cwd:root});
  if (/\.(json|js|svg)$/.test(file)) assert.equal(actual.toString().replaceAll('\r\n','\n'),expected.toString().replaceAll('\r\n','\n'),file);
  else assert.deepEqual(actual,expected,file);
  checked.push(file);
}
fs.writeFileSync(path.join(__dirname,'t4.7-invariants.json'),JSON.stringify({date:'2026-10-30',checked},null,2));
console.log('PASS preserved source/data/K3/i18n, assets, dependencies, SEO and existing local edits:',checked.length,'files');
