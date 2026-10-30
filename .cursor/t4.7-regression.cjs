const fs = require('node:fs');
const path = require('node:path');
const squeeze = process.argv.includes('--squeeze');
const review = process.argv.includes('--review');
const name = squeeze ? 't4.8-check.cjs' : review ? 't4.11-check.cjs' : 't4.11-regression.cjs';
let source = fs.readFileSync(path.join(__dirname, name), 'utf8');
if (squeeze) source = source.replaceAll('t4.8-', 't4.7-squeeze-');
else if (review) source = source.replaceAll('t4.11-', 't4.7-review-');
else source = source.replaceAll('t4.11-', 't4.7-');
const read = fs.readFileSync;
fs.readFileSync = function(file, ...args) {
  const content = read.call(this, file, ...args);
  if (String(file).endsWith('t2.1-check.cjs') && typeof content === 'string') {
    return content.replaceAll("m.locator('[href=\"tel:113\"]')", "m.locator('.training__contacts [href=\"tel:113\"]')")
      .replaceAll("m.locator('[href=\"tel:112\"]')", "m.locator('.training__contacts [href=\"tel:112\"]')");
  }
  return content;
};
module._compile(source, path.join(__dirname, name));
fs.readFileSync = read;
