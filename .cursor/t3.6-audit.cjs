const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const puppeteer = require('C:/Users/Aryaguna3/AppData/Local/npm-cache/_npx/0f94ee7615faf582/node_modules/puppeteer-core');
const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const origin = 'http://trainer.barkahmauludi.com:4196';
const stage = process.argv[2];
const output = path.join(__dirname, `t3.6-${stage}`);
fs.mkdirSync(output, { recursive: true });
const report = { stage, origin, lighthouse: '12.8.2', collector: 'intercepted; no dashboard writes', runs: [] };
const save = () => fs.writeFileSync(path.join(output, 'summary.json'), JSON.stringify(report, null, 2));
async function intercept(page) {
  const sent = [];
  await page.setRequestInterception(true);
  page.on('request', req => {
    if (req.url().includes('umami') && !new URL(req.url()).pathname.endsWith('/script.js')) {
      sent.push({ url: req.url(), body: req.postData() });
      req.respond({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ cache: 'qa' }) });
    } else req.continue();
  });
  return sent;
}
(async () => {
  const { default: lighthouse } = await import(pathToFileURL('C:/Users/Aryaguna3/AppData/Local/npm-cache/_npx/0f94ee7615faf582/node_modules/lighthouse/core/index.js'));
  const sequence = stage === 'paired' ? ['before', 'after', 'after', 'before', 'before', 'after'] : [stage, stage, stage];
  for (let run = 1; run <= sequence.length; run++) {
    const variant = sequence[run - 1];
    if (stage === 'paired') {
      const roots = JSON.parse(fs.readFileSync(path.join(__dirname, 't3.6-roots.json')));
      fs.writeFileSync(path.join(__dirname, 't3.6-serve-root.txt'), roots[variant]);
    }
    const browser = await puppeteer.launch({ executablePath: chrome, headless: true,
      args: ['--no-proxy-server', '--host-resolver-rules=MAP trainer.barkahmauludi.com 127.0.0.1'] });
    try {
      const page = await browser.newPage();
      const sent = await intercept(page);
      const result = await lighthouse(origin + '/#configure', { onlyCategories: ['performance', 'accessibility'], output: ['json', 'html'], logLevel: 'error' }, undefined, page);
      const lh = result.lhr;
      fs.writeFileSync(path.join(output, `lighthouse-${run}.json`), result.report[0]);
      fs.writeFileSync(path.join(output, `lighthouse-${run}.html`), result.report[1]);
      const metrics = { run, variant, performance: lh.categories.performance.score * 100,
        accessibility: lh.categories.accessibility.score * 100,
        lcpMs: lh.audits['largest-contentful-paint'].numericValue,
        tbtMs: lh.audits['total-blocking-time'].numericValue,
        lighthouseTransfer: lh.audits['total-byte-weight'].numericValue,
        chrome: lh.environment.hostUserAgent, collectorRequests: sent.length };
      await page.close();
      const p = await browser.newPage();
      await intercept(p);
      await p.setViewport({ width: 412, height: 823, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true });
      const client = await p.createCDPSession();
      await client.send('Network.enable');
      await client.send('Network.setCacheDisabled', { cacheDisabled: true });
      await client.send('Network.emulateNetworkConditions', { offline: false, latency: 60, downloadThroughput: 9e6 / 8, uploadThroughput: 1.5e6 / 8, connectionType: 'cellular4g' });
      await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      await p.goto(origin + '/#configure', { waitUntil: 'domcontentloaded' });
      await p.waitForFunction(() => performance.getEntriesByName('apar:visible').length, { timeout: 60000 });
      if (variant === 'after') await p.waitForFunction(() => !!window.umami?.track, { timeout: 30000 });
      await p.waitForNetworkIdle({ idleTime: 750 });
      Object.assign(metrics, await p.evaluate(() => {
        const readyMs = performance.getEntriesByName('apar:visible')[0].startTime;
        const resources = performance.getEntriesByType('resource');
        const script = resources.find(r => r.name === 'https://cloud.umami.is/script.js');
        return { readyMs, scriptStart: script?.startTime, scriptTransfer: script?.transferSize,
          transferBytes: performance.getEntriesByType('navigation')[0].transferSize + resources.reduce((sum, r) => sum + r.transferSize, 0),
          scriptLoaded: !!window.umami?.track };
      }));
      if (variant === 'after') assert.ok(metrics.scriptStart >= metrics.readyMs, 'Umami must load after APAR visible');
      report.runs.push(metrics); save();
      console.log(JSON.stringify(metrics));
    } finally { await browser.close(); }
  }
})().catch(e => { report.error = String(e.stack); save(); console.error(e); process.exitCode = 1; });
