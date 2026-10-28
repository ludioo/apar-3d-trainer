const fs = require('node:fs');
const path = require('node:path');
const name = process.argv.includes('--results') ? 't2.4-check.cjs'
  : process.argv.includes('--effects') ? 't2.2-check.cjs'
    : process.argv.includes('--training') ? 't2.1-check.cjs'
      : process.argv.includes('--pdf') ? 't2.5-check.cjs'
        : process.argv.includes('--errors') ? 't2.5-errors.cjs' : 't2.3-check.cjs';
let source = fs.readFileSync(path.join(__dirname, name), 'utf8');
if (name === 't2.4-check.cjs') source = source.replaceAll('t2.4', 't3.1-results');
else if (name === 't2.1-check.cjs') source = source.replace("const prefix = production ? 't2.1-production' : 't2.1';", "const prefix = 't3.1-training';");
else if (name === 't2.2-check.cjs') source = source.replaceAll('t2.2', 't3.1-effects');
else if (name.startsWith('t2.5')) source = source.replaceAll('t2.5', 't3.1-pdf');
else source = source.replace("const prefix = origin.includes('5183') ? 't2.3-dev' : 't2.3';", "const prefix = 't3.1-quiz';");
if (name !== 't2.4-check.cjs') source = source.replace(/(?<!\.tab)\[href="#(train|results|configure)"\]/g, '.tab[href="#$1"]');
source = source.replaceAll("locator('canvas')", "locator('#canvas-root canvas')");
module._compile(source, path.join(__dirname, name));
