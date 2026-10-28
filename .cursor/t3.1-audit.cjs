const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const puppeteer = require('C:/Users/Aryaguna3/AppData/Local/npm-cache/_npx/0f94ee7615faf582/node_modules/puppeteer-core');
const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const lighthouse = 'C:/Users/Aryaguna3/AppData/Local/npm-cache/_npx/0f94ee7615faf582/node_modules/lighthouse/cli/index.js';
const stage = process.argv[2];
const origin = 'http://127.0.0.1:4191';
const output = path.join(__dirname, 't3.1-' + stage);
fs.mkdirSync(output, { recursive: true });
const report = { stage, chrome, lighthouse: '12.8.2', server: 'gzip HTML/JS/CSS only; binary unchanged; no-store', fourG: { width: 412, height: 823, deviceScaleFactor: 1.75, downloadMbps: 9, uploadMbps: 1.5, latencyMs: 60, cpuSlowdown: 4 }, runs: [] };
(async () => {
  try {
    for (let run = 1; run <= 3; run++) {
      const file = path.join(output, `lighthouse-${run}.report.json`);
      if (!fs.existsSync(file)) execFileSync(process.execPath, [lighthouse, origin + '/#configure', '--output=json', '--output=html', '--output-path=' + path.join(output, 'lighthouse-' + run), '--only-categories=performance,accessibility', '--chrome-flags=--headless --no-first-run', '--quiet'], { env: { ...process.env, CHROME_PATH: chrome }, stdio: 'inherit' });
      const lh = JSON.parse(fs.readFileSync(file));
      const browser = await puppeteer.launch({ executablePath: chrome, headless: true });
      let sample;
      try {
        const page = await browser.newPage();
        await page.setViewport({ width: 412, height: 823, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true });
        const client = await page.createCDPSession();
        await client.send('Network.enable');
        await client.send('Network.setCacheDisabled', { cacheDisabled: true });
        await client.send('Network.emulateNetworkConditions', { offline: false, latency: 60, downloadThroughput: 9e6 / 8, uploadThroughput: 1.5e6 / 8, connectionType: 'cellular4g' });
        await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
        await page.evaluateOnNewDocument(() => {
          let modelDraw = 0;
          for (const type of [WebGLRenderingContext, WebGL2RenderingContext]) {
            const draw = type.prototype.drawElements;
            type.prototype.drawElements = function (mode, count, ...args) {
              const result = draw.call(this, mode, count, ...args);
              if (count > 100) modelDraw = performance.now();
              return result;
            };
          }
          function probe() {
            const splash = document.getElementById('splash');
            const hdr = performance.getEntriesByType('resource').find((r) => /\/hdri\//.test(r.name));
            if (splash && getComputedStyle(splash).opacity === '0' && hdr?.responseEnd > 0 && modelDraw >= hdr.responseEnd) {
              requestAnimationFrame(() => performance.mark('audit:visible'));
            } else requestAnimationFrame(probe);
          }
          requestAnimationFrame(probe);
        });
        const errors = [];
        page.on('pageerror', (e) => errors.push(String(e)));
        await page.goto(origin + '/#configure', { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => performance.getEntriesByName('audit:visible').length, { timeout: 60000 });
        await page.waitForNetworkIdle({ idleTime: 750 });
        sample = await page.evaluate(() => ({ readyMs: (performance.getEntriesByName('apar:visible').at(-1) || performance.getEntriesByName('audit:visible')[0]).startTime, probeMs: performance.getEntriesByName('audit:visible')[0].startTime, entries: performance.getEntriesByType('resource').filter((r) => r.name.startsWith(location.origin)).map((r) => ({ url: r.name, transfer: r.transferSize, decoded: r.decodedBodySize })), documentTransfer: performance.getEntriesByType('navigation')[0].transferSize, marks: performance.getEntriesByType('mark').map((m) => ({ name: m.name, time: m.startTime })) }));
        sample.transferBytes = sample.documentTransfer + sample.entries.reduce((sum, r) => sum + r.transfer, 0);
        sample.errors = errors;
        await page.screenshot({ path: path.join(output, `4g-${run}.png`) });
      } finally { await browser.close(); }
      const metrics = { run, performance: lh.categories.performance.score * 100, accessibility: lh.categories.accessibility.score * 100, lcpMs: lh.audits['largest-contentful-paint'].numericValue, tbtMs: lh.audits['total-blocking-time'].numericValue, lighthouseTransfer: lh.audits['total-byte-weight'].numericValue, chromeVersion: lh.environment.hostUserAgent, ...sample };
      report.runs.push(metrics);
      fs.writeFileSync(path.join(output, 'summary.json'), JSON.stringify(report, null, 2));
      console.log(JSON.stringify({ stage, run, performance: metrics.performance, readyMs: metrics.readyMs, transferBytes: metrics.transferBytes, tbtMs: metrics.tbtMs }));
    }
  } finally { fs.writeFileSync(path.join(output, 'summary.json'), JSON.stringify(report, null, 2)); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
