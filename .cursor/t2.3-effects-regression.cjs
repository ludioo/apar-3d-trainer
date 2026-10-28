const fs = require('node:fs');
const path = require('node:path');
const original = path.join(__dirname, 't2.2-check.cjs');
module._compile(fs.readFileSync(original, 'utf8').replaceAll('t2.2', 't2.3-effects-regression'), original);
