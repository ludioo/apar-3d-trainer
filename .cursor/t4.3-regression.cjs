const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, 't4.2-regression.cjs'), 'utf8')
  .replaceAll('t4.2-', 't4.3-');
module._compile(source, path.join(__dirname, 't4.2-regression.cjs'));
