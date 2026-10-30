const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, 't4.8-check.cjs'), 'utf8')
  .replaceAll('t4.8-', 't4.12-squeeze-');
module._compile(source, path.join(__dirname, 't4.8-check.cjs'));
