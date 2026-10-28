const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { gzipSync } = require('node:zlib');
const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const stage = process.argv[2];
assert.ok(['before', 'after', 'hdri'].includes(stage));
const origin = 'http://127.0.0.1:4191';
const report = { stage, profile: { width: 390, height: 844, dpr: 1.75, downloadMbps: 9, uploadMbps: 1.5, latencyMs: 60, cpuSlowdown: 4 },
  method: 'Fresh browser per run; cache disabled; gzip HTML/JS/CSS; navigation + resource transferSize at apar:visible + network idle 750ms; localhost, no production analytics', runs: [] };
const output = path.join(__dirname, `t4.1-${stage}.json`);
(async () => {
  const assets = fs.readdirSync('dist/assets');
  report.bundles = assets.filter(name => /^(index-|HDRLoader-).+\.(js|css)$/.test(name)).map(name => {
    const bytes = fs.readFileSync(path.join('dist/assets', name));
    return { name, bytes: bytes.length, gzip: gzipSync(bytes).length };
  });
  for (let run = 1; run <= 3; run++) {
    const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
    try {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(String(e)));
      const client = await context.newCDPSession(page);
      await client.send('Network.enable');
      await client.send('Network.setCacheDisabled', { cacheDisabled: true });
      await client.send('Network.emulateNetworkConditions', { offline: false, latency: 60, downloadThroughput: 9e6 / 8, uploadThroughput: 1.5e6 / 8, connectionType: 'cellular4g' });
      await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      await page.goto(`${origin}/${stage === 'hdri' ? '?hdri=1' : ''}#configure`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => performance.getEntriesByName('apar:visible').length > 0, { timeout: 60000 });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(750);
      const data = await page.evaluate(() => {
        const entries = performance.getEntriesByType('resource').map(r => ({ url: new URL(r.name).pathname, transfer: r.transferSize, encoded: r.encodedBodySize, decoded: r.decodedBodySize }));
        const documentTransfer = performance.getEntriesByType('navigation')[0].transferSize;
        return { readyMs: performance.getEntriesByName('apar:visible').at(-1).startTime, documentTransfer, entries,
          transferBytes: documentTransfer + entries.reduce((sum, r) => sum + r.transfer, 0),
          hdri: entries.filter(r => r.url.startsWith('/hdri/')), hdrLoader: entries.filter(r => r.url.includes('HDRLoader')) };
      });
      assert.deepEqual(errors, []);
      assert.equal(data.hdri.length, stage === 'after' ? 0 : 1);
      if (stage === 'after') assert.equal(data.hdrLoader.length, 0);
      report.runs.push({ run, ...data, errors });
      fs.writeFileSync(output, JSON.stringify(report, null, 2));
      console.log(JSON.stringify({ stage, run, readyMs: data.readyMs, transferBytes: data.transferBytes, hdri: data.hdri }));
    } finally { await browser.close(); }
  }
  const median = key => report.runs.map(r => r[key]).sort((a, b) => a - b)[1];
  report.median = { transferBytes: median('transferBytes'), readyMs: median('readyMs') };
  fs.writeFileSync(output, JSON.stringify(report, null, 2));
})().catch(e => { report.failure = String(e); fs.writeFileSync(output, JSON.stringify(report, null, 2)); console.error(e); process.exitCode = 1; });
