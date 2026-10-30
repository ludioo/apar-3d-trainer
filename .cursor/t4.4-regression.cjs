const fs = require('node:fs');
const path = require('node:path');
const squeeze = process.argv.includes('--squeeze');
const name = squeeze ? 't4.8-check.cjs' : 't4.2-regression.cjs';
let source = fs.readFileSync(path.join(__dirname, name), 'utf8');
if (squeeze) source = source.replaceAll('t4.8-', 't4.4-squeeze-');
else source = source.replaceAll('t4.2-', 't4.4-')
  .replace("let source = fs.readFileSync(path.join(__dirname, name), 'utf8');",
    "let source = fs.readFileSync(path.join(__dirname, name), 'utf8').replaceAll('2026-10-28', '2026-10-30');");
module._compile(source, path.join(__dirname, name));
