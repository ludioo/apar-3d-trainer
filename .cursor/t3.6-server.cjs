const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, 't3.1-server.cjs'), 'utf8')
  .replace("const root = path.resolve('dist');", '')
  .replace('const pathname =', 'const root = path.resolve(fs.readFileSync(path.join(__dirname, "t3.6-serve-root.txt"), "utf8").trim()); const pathname =')
  .replaceAll('4191', '4196');
module._compile(source, __filename);
