const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, 't4.2-regression.cjs'), 'utf8')
  .replaceAll('t4.2-', 't4.8-')
  .replace("let source = fs.readFileSync(path.join(__dirname, name), 'utf8');",
    "let source = fs.readFileSync(path.join(__dirname, name), 'utf8').replaceAll('2026-10-28', '2026-10-30');");
module._compile(source, path.join(__dirname, 't4.2-regression.cjs'));
