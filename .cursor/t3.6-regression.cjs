const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, 't3.2-regression.cjs'), 'utf8')
  .replace("replaceAll('t3.1', 't3.2')", "replaceAll('t3.1', 't3.6')");
module._compile(source, path.join(__dirname, 't3.2-regression.cjs'));
