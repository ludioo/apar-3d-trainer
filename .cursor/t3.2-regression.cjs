const fs = require('node:fs');
const path = require('node:path');
let wrapper = fs.readFileSync(path.join(__dirname, 't3.1-regression.cjs'), 'utf8');
wrapper = wrapper.replaceAll('t3.1', 't3.2');
wrapper = wrapper.replace('module._compile(source,', `
source = source.replaceAll('[href="tel:113"]', '[href="tel:113"]:visible')
  .replaceAll('[href="tel:112"]', '[href="tel:112"]:visible')
  .replaceAll('.results > a[href="#train"]', '.results > [data-route="train"]')
  .replaceAll('.results a[href="#configure"]', '.results [data-route="configure"]');
module._compile(source,`);
module._compile(wrapper, path.join(__dirname, 't3.1-regression.cjs'));
