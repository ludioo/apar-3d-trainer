const fs = require('node:fs');
const path = require('node:path');
const wrapper = fs.readFileSync(path.join(__dirname, 't3.2-regression.cjs'), 'utf8').replaceAll('t3.2', 't4.1');
module._compile(wrapper, path.join(__dirname, 't3.2-regression.cjs'));
