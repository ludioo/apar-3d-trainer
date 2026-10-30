const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 480, height: 210 }, deviceScaleFactor: 1 });
    const svg = fs.readFileSync(path.join(__dirname, '../public/favicon.svg'), 'utf8');
    const source = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
    const sizes = [16, 32, 48];
    const pngs = [];
    for (const size of sizes) {
      const data = await page.evaluate(async ({ source, size }) => {
        const image = new Image();
        image.src = source;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        canvas.getContext('2d').drawImage(image, 0, 0, size, size);
        return canvas.toDataURL('image/png').split(',')[1];
      }, { source, size });
      const png = Buffer.from(data, 'base64');
      pngs.push(png);
      fs.writeFileSync(path.join(__dirname, `t4.14-icon-${size}.png`), png);
    }
    const header = Buffer.alloc(6 + sizes.length * 16);
    header.writeUInt16LE(1, 2);
    header.writeUInt16LE(sizes.length, 4);
    let offset = header.length;
    sizes.forEach((size, index) => {
      const entry = 6 + index * 16;
      header[entry] = header[entry + 1] = size;
      header.writeUInt16LE(1, entry + 4);
      header.writeUInt16LE(32, entry + 6);
      header.writeUInt32LE(pngs[index].length, entry + 8);
      header.writeUInt32LE(offset, entry + 12);
      offset += pngs[index].length;
    });
    fs.writeFileSync(path.join(__dirname, '../public/favicon.ico'), Buffer.concat([header, ...pngs]));
    await page.setContent(`<body style="margin:0;background:#eef0f2;font:14px Arial;color:#111"><main style="display:flex;align-items:start;gap:28px;padding:28px">${[16, 32, 48, 128].map(size => `<div><img src="${source}" width="${size}" height="${size}"><p>${size} px</p></div>`).join('')}</main></body>`);
    await page.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
    await page.screenshot({ path: path.join(__dirname, 't4.14-icon-review.png') });
    console.log(JSON.stringify({ svgBytes: Buffer.byteLength(svg), icoBytes: offset, sizes }));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
