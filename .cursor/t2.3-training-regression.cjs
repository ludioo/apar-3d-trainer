const fs = require('node:fs');
const path = require('node:path');
const original = path.join(__dirname, 't2.1-check.cjs');
const source = fs.readFileSync(original, 'utf8').replace(
  "const prefix = production ? 't2.1-production' : 't2.1';",
  "const prefix = 't2.3-training-regression';",
);
module._compile(source, original);
