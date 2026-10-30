const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const root = path.join(__dirname, '..');
const origin = process.argv[2] || 'http://localhost:4214';
const read = file => fs.readFileSync(path.join(root, file));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const baseline = JSON.parse(read('.cursor/t4.14-baseline.json'));
const report = { date: '2026-10-30', origin, checks: [], states: [], faviconResponses: [], errors: [], warnings: [] };
const pass = (name, detail) => report.checks.push({ name, detail });
const seo = html => html.match(/    <title>[\s\S]*?<\/script>/)[0];

(async () => {
  assert.equal(seo(read('index.html').toString()), baseline.seo);
  for (const [file, expected] of Object.entries(baseline.hashes)) assert.equal(hash(read(file)), expected, file);
  pass('Preserved SEO, OG, model, config, dependencies and existing local edits', baseline.hashes);
  const svg = read('public/favicon.svg');
  const ico = read('public/favicon.ico');
  for (const file of ['favicon.svg', 'favicon.ico']) assert.deepEqual(read(`dist/${file}`), read(`public/${file}`));
  assert.equal(ico.readUInt16LE(0), 0);
  assert.equal(ico.readUInt16LE(2), 1);
  assert.equal(ico.readUInt16LE(4), 3);
  const images = [];
  let end = 54;
  for (const [index, size] of [16, 32, 48].entries()) {
    const entry = 6 + index * 16;
    const length = ico.readUInt32LE(entry + 8);
    const offset = ico.readUInt32LE(entry + 12);
    assert.equal(offset, end);
    const png = ico.subarray(offset, offset + length);
    assert.equal(ico[entry], size);
    assert.equal(ico[entry + 1], size);
    assert.equal(ico.readUInt16LE(entry + 4), 1);
    assert.equal(ico.readUInt16LE(entry + 6), 32);
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(png.readUInt32BE(16), size);
    assert.equal(png.readUInt32BE(20), size);
    images.push({ size, source: `data:image/png;base64,${png.toString('base64')}` });
    end = offset + length;
  }
  assert.equal(end, ico.length);
  pass('Build copies and ICO directory/PNG dimensions', { sizes: images.map(i => i.size), svgBytes: svg.length, icoBytes: ico.length, totalBytes: svg.length + ico.length });
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const context = await browser.newContext();
    for (const [file, expected, mime] of [['favicon.svg', svg, /image\/svg\+xml/], ['favicon.ico', ico, /image\/(?:x-icon|vnd.microsoft.icon)/], ['og-image.jpg', read('public/og-image.jpg'), /image\/jpeg/]]) {
      const response = await context.request.get(`${origin}/${file}`);
      assert.equal(response.status(), 200);
      assert.match(response.headers()['content-type'], mime);
      assert.deepEqual(await response.body(), expected);
      pass(`HTTP asset ${file}`, { status: response.status(), contentType: response.headers()['content-type'], bytes: expected.length });
    }
    const page = await context.newPage();
    const decoded = await page.evaluate(async images => {
      const results = [];
      for (const { size, source } of images) {
        const image = new Image();
        image.src = source;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0);
        results.push({ size, width: image.naturalWidth, height: image.naturalHeight, background: [...context.getImageData(0, 0, 1, 1).data], body: [...context.getImageData(size / 2, size / 2, 1, 1).data] });
      }
      return results;
    }, images);
    for (const image of decoded) {
      assert.equal(image.width, image.size);
      assert.equal(image.height, image.size);
      assert.deepEqual(image.background, [14, 16, 19, 255]);
      assert.deepEqual(image.body, [255, 198, 41, 255]);
    }
    pass('All embedded ICO images decode with approved palette', decoded);
    await context.close();
    for (const [name, options] of [['desktop', { viewport: { width: 1280, height: 900 } }], ['mobile', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 }]]) {
      const session = await browser.newContext(options);
      const view = await session.newPage();
      view.on('pageerror', error => report.errors.push({ name, error: String(error) }));
      view.on('console', message => {
        if (message.type() === 'error') report.errors.push({ name, error: message.text() });
        if (message.type() === 'warning') report.warnings.push({ name, warning: message.text() });
      });
      view.on('response', response => {
        if (response.status() >= 400) report.errors.push({ name, url: response.url(), status: response.status() });
        if (/\/favicon\.(svg|ico)$/.test(response.url())) report.faviconResponses.push({ name, url: response.url(), status: response.status() });
      });
      view.on('requestfailed', request => report.errors.push({ name, url: request.url(), failure: request.failure() }));
      for (const route of ['configure', 'train', 'results']) {
        if (route === 'configure') await view.goto(`${origin}/#configure`);
        await view.waitForFunction(() => getComputedStyle(document.querySelector('#splash')).opacity === '0');
        await view.locator(`.tab[href="#${route}"]`).click();
        await view.reload();
        await view.waitForFunction(() => getComputedStyle(document.querySelector('#splash')).opacity === '0');
        assert.equal(await view.locator(`.tab[href="#${route}"]`).getAttribute('aria-current'), 'page');
        const links = await view.locator('link[rel="icon"]').evaluateAll(nodes => nodes.map(node => ({ href: node.getAttribute('href'), sizes: node.getAttribute('sizes'), type: node.getAttribute('type') })));
        assert.deepEqual(links, [{ href: '/favicon.ico', sizes: '16x16 32x32 48x48', type: null }, { href: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }]);
        assert.equal(await view.locator('link[rel="manifest"]').count(), 0);
        assert.equal(await view.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        const registrations = await view.evaluate(() => navigator.serviceWorker.getRegistrations().then(values => values.length));
        assert.equal(registrations, 0);
        await view.locator('[data-lang="id"]').click();
        assert.equal(await view.locator('html').getAttribute('lang'), 'id');
        await view.locator('[data-lang="en"]').click();
        assert.equal(await view.locator('html').getAttribute('lang'), 'en');
        await view.screenshot({ path: path.join(__dirname, `t4.14-${name}-${route}.png`) });
        report.states.push({ name, route, reload: true, links, overflow: false, serviceWorkers: registrations });
      }
      pass(`${name} routes, reload, bilingual and layout`, { viewport: options.viewport, routes: ['configure', 'train', 'results'] });
      await session.close();
    }
    const lan = await browser.newContext();
    const response = await lan.request.get('http://192.168.100.4:4214/favicon.svg');
    assert.equal(response.status(), 200);
    assert.deepEqual(await response.body(), svg);
    pass('LAN preview reachable', { url: 'http://192.168.100.4:4214/', faviconStatus: response.status() });
    await lan.close();
    assert.deepEqual(report.errors, []);
  } finally {
    await browser.close();
  }
  console.log(JSON.stringify({ checks: report.checks.length, states: report.states.length, faviconResponses: report.faviconResponses, errors: report.errors, warningCount: report.warnings.length }));
})().catch(error => { report.errors.push(String(error)); console.error(error); process.exitCode = 1; }).finally(() => {
  fs.writeFileSync(path.join(__dirname, 't4.14-production-qa.json'), JSON.stringify(report, null, 2));
});
