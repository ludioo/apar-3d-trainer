const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { gzipSync } = require('node:zlib');
const toolRoot = 'C:/Users/Aryaguna3/AppData/Local/npm-cache/_npx/0f94ee7615faf582/node_modules';
const puppeteer = require(path.join(toolRoot, 'puppeteer-core'));
const lighthouseCli = path.join(toolRoot, 'lighthouse/cli/index.js');
const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const origin = 'http://127.0.0.1:4191';
const url = origin + '/#configure';
const runId = process.argv[2];
assert.match(runId || '', /^[a-z0-9-]+$/, 'Usage: node .cursor/t4.25-audit.cjs <new-run-id>');
const output = path.join(__dirname, 't4.25', runId);
const resume = process.argv[3] === '--resume';
fs.mkdirSync(path.dirname(output), { recursive: true });
if (!resume) fs.mkdirSync(output); // Preserve earlier runs, including failures.
const write = (name, data) => fs.writeFileSync(path.join(output, name), JSON.stringify(data, null, 2));
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const forbidden = /\/hdri\/|\/(?:HDRLoader|debug|jspdf|pdf-report|pdf-spec|purify|html2canvas|index\.es)[^/]*\.(?:js|hdr|gz)(?:$|\?)/;
const range = values => ({ median: [...values].sort((a, b) => a - b)[1], min: Math.min(...values), max: Math.max(...values) });
const report = resume ? JSON.parse(fs.readFileSync(path.join(output, 'summary.json'))) : {
  runId, startedAt: new Date().toISOString(), timeZone: 'Asia/Jakarta', url,
  commit: git('rev-parse', 'HEAD'), branch: git('branch', '--show-current'),
  existingStatus: git('status', '--short'), trackedDiffSha256: sha256(git('diff', '--binary')),
  node: process.version, lighthouse: require(path.join(toolRoot, 'lighthouse/package.json')).version,
  puppeteer: require(path.join(toolRoot, 'puppeteer-core/package.json')).version, chrome,
  dependencies: require('../package.json'),
  server: 't3.1-server.cjs: gzip HTML/JS/CSS; binary unchanged; no-store; local, no Umami',
  fourG: { downloadMbps: 9, uploadMbps: 1.5, latencyMs: 60, cpuSlowdown: 4, deviceScaleFactor: 1.75 },
  method: 'Fresh browser/profile per run, sequential, normal motion, default browser language, no interaction. Navigation time origin to apar:visible. Resource Timing navigation + network resources after 750ms network idle; blob workers excluded.',
  lighthouseRuns: [], fourGRuns: [], failures: [],
  files: fs.readdirSync('dist/assets').filter(name => /\.(js|css)$/.test(name)).map(name => {
    const bytes = fs.readFileSync(path.join('dist/assets', name));
    return { name, bytes: bytes.length, gzipBytes: gzipSync(bytes).length, sha256: sha256(bytes) };
  }),
  glb: { bytes: fs.statSync('dist/models/apar.glb').size, sha256: sha256(fs.readFileSync('dist/models/apar.glb')) }
};
if (resume) {
  report.resumes ??= [];
  write(`summary-before-resume-${report.resumes.length + 1}.json`, report);
  report.resumes.push({ at: new Date().toISOString(), harnessSha256: sha256(fs.readFileSync(__filename)) });
}
report.status = 'running';
write('summary.json', report);

async function measureFourG(width, height, run) {
  const attempt = report.fourGRuns.filter(sample => sample.width === width && sample.run === run).length + 1;
  const name = `4g-${width}-${run}${attempt > 1 ? '-attempt-' + attempt : ''}`;
  const sample = { name, width, height, run, valid: false, errors: [], consoleErrors: [], warnings: [], requests: [], failedRequests: [], badResponses: [] };
  let browser;
  try {
    browser = await puppeteer.launch({ executablePath: chrome, headless: true });
    sample.chrome = await browser.version();
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true });
    page.on('pageerror', error => sample.errors.push(String(error)));
    page.on('console', message => {
      if (message.type() === 'error') sample.consoleErrors.push(message.text());
      if (message.type() === 'warn') sample.warnings.push(message.text());
    });
    page.on('request', request => sample.requests.push(request.url()));
    page.on('requestfailed', request => sample.failedRequests.push({ url: request.url(), failure: request.failure(), type: request.resourceType(), responseStatus: request.response()?.status() }));
    page.on('response', response => { if (response.status() >= 400) sample.badResponses.push({ url: response.url(), status: response.status() }); });
    const client = await page.createCDPSession();
    sample.network = [];
    client.on('Network.requestWillBeSent', event => sample.network.push({ event: 'request', id: event.requestId, time: event.timestamp, url: event.request.url }));
    client.on('Network.loadingFinished', event => sample.network.push({ event: 'finished', id: event.requestId, time: event.timestamp, encodedBytes: event.encodedDataLength }));
    client.on('Network.loadingFailed', event => sample.network.push({ event: 'failed', ...event }));
    await client.send('Network.enable');
    await client.send('Network.setCacheDisabled', { cacheDisabled: true });
    await client.send('Network.emulateNetworkConditions', {
      offline: false, latency: 60, downloadThroughput: 9e6 / 8, uploadThroughput: 1.5e6 / 8, connectionType: 'cellular4g'
    });
    await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(() => performance.getEntriesByName('apar:visible').length > 0, { timeout: 60000 });
    await page.waitForNetworkIdle({ idleTime: 750, timeout: 60000 });
    Object.assign(sample, await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const entries = performance.getEntriesByType('resource').filter(entry => /^https?:/.test(entry.name)).map(entry => ({
        url: entry.name, initiator: entry.initiatorType, transferBytes: entry.transferSize,
        encodedBytes: entry.encodedBodySize, decodedBytes: entry.decodedBodySize, responseEnd: entry.responseEnd
      }));
      const splash = document.getElementById('splash');
      const canvas = document.querySelector('canvas');
      return {
        readyMs: performance.getEntriesByName('apar:visible').at(-1).startTime,
        marks: performance.getEntriesByType('mark').map(mark => ({ name: mark.name, time: mark.startTime })),
        documentTransferBytes: navigation.transferSize, entries,
        transferBytes: navigation.transferSize + entries.reduce((sum, entry) => sum + entry.transferBytes, 0),
        splash: { opacity: getComputedStyle(splash).opacity, hidden: splash.getAttribute('aria-hidden'), inert: splash.inert },
        canvas: { width: canvas.width, height: canvas.height }, sampledAtMs: performance.now(),
        language: document.documentElement.lang, coarse: matchMedia('(pointer: coarse)').matches,
        debugBridge: !!window.__aparDebug
      };
    }));
    await page.screenshot({ path: path.join(output, name + '.png') });
    assert.deepEqual(sample.errors, [], 'Page errors');
    assert.deepEqual(sample.consoleErrors, [], 'Console errors');
    assert.deepEqual(sample.failedRequests, [], 'Failed requests');
    assert.deepEqual(sample.badResponses, [], 'HTTP errors');
    const marks = new Map(sample.marks.map(mark => [mark.name, mark.time]));
    assert.ok(marks.has('apar:environment-ready') && marks.has('apar:model-ready'));
    assert.ok(sample.readyMs >= marks.get('apar:environment-ready') && sample.readyMs >= marks.get('apar:model-ready'));
    assert.ok(!marks.has('apar:fallback-visible') && !marks.has('apar:environment-failed'));
    assert.equal(sample.splash.opacity, '0');
    assert.equal(sample.splash.hidden, 'true');
    assert.equal(sample.splash.inert, true);
    assert.ok(sample.canvas.width > 0 && sample.canvas.height > 0);
    assert.equal(sample.coarse, true);
    assert.equal(sample.debugBridge, false);
    assert.ok(sample.requests.some(request => request.endsWith('/models/apar.glb')));
    assert.deepEqual(sample.requests.filter(request => forbidden.test(request)), [], 'Unexpected startup libraries');
    assert.deepEqual(sample.entries.filter(entry => !entry.url.startsWith(origin + '/')), [], 'Unexpected external transfer');
    assert.ok(sample.documentTransferBytes > 0 && sample.entries.find(entry => entry.url.endsWith('/models/apar.glb'))?.transferBytes > 0);
    sample.valid = true;
    return sample;
  } catch (error) {
    sample.failure = String(error.stack || error);
    throw error;
  } finally {
    write(name + '.json', sample);
    report.fourGRuns.push(sample);
    await browser?.close();
    write('summary.json', report);
  }
}

(async () => {
  try {
    for (let run = report.lighthouseRuns.length + 1; run <= 3; run++) {
      console.log(`Lighthouse ${run}/3 started`);
      const prefix = path.join(output, 'lighthouse-' + run);
      execFileSync(process.execPath, [lighthouseCli, url, '--output=json', '--output=html', '--output-path=' + prefix,
        '--only-categories=performance,accessibility', '--chrome-flags=--headless --no-first-run', '--quiet'], {
        env: { ...process.env, CHROME_PATH: chrome }, stdio: 'inherit'
      });
      const lh = JSON.parse(fs.readFileSync(prefix + '.report.json'));
      assert.ok(!lh.runtimeError, JSON.stringify(lh.runtimeError));
      assert.ok(Number.isFinite(lh.categories.performance.score) && Number.isFinite(lh.categories.accessibility.score));
      const metrics = {
        run, valid: true, performance: lh.categories.performance.score * 100,
        accessibility: lh.categories.accessibility.score * 100,
        lcpMs: lh.audits['largest-contentful-paint'].numericValue,
        tbtMs: lh.audits['total-blocking-time'].numericValue,
        transferBytes: lh.audits['total-byte-weight'].numericValue,
        config: lh.configSettings, environment: lh.environment, warnings: lh.runWarnings, lighthouseVersion: lh.lighthouseVersion
      };
      report.lighthouseRuns.push(metrics);
      write('summary.json', report);
      console.log(JSON.stringify({ type: 'lighthouse', ...metrics, config: undefined, environment: undefined }));
    }
    for (const [width, height] of [[412, 823], [390, 844]]) {
      const completed = report.fourGRuns.filter(sample => sample.width === width && sample.valid).length;
      for (let run = completed + 1; run <= 3; run++) {
        console.log(`4G ${width} ${run}/3 started`);
        const sample = await measureFourG(width, height, run);
        console.log(JSON.stringify({ type: '4g', width, run, readyMs: sample.readyMs, transferBytes: sample.transferBytes }));
      }
    }
    assert.equal(report.lighthouseRuns.length, 3);
    assert.equal(report.fourGRuns.filter(run => run.valid).length, 6);
    report.aggregate = {
      performance: range(report.lighthouseRuns.map(run => run.performance)),
      accessibility: range(report.lighthouseRuns.map(run => run.accessibility)),
      lcpMs: range(report.lighthouseRuns.map(run => run.lcpMs)),
      fourG: [412, 390].map(width => {
        const samples = report.fourGRuns.filter(run => run.width === width && run.valid);
        return { width, readyMs: range(samples.map(run => run.readyMs)), transferBytes: range(samples.map(run => run.transferBytes)) };
      })
    };
    report.budgets = {
      performance85: report.aggregate.performance.median >= 85,
      aparUnder3Seconds: report.aggregate.fourG.every(profile => profile.readyMs.median < 3000),
      transferUnder3MB: report.fourGRuns.filter(run => run.valid).every(run => run.transferBytes < 3000000),
      glbUnder2MB: report.glb.bytes < 2000000
    };
    report.status = report.failures.length ? 'complete-with-invalid-attempts' : 'complete';
    console.log(JSON.stringify({ aggregate: report.aggregate, budgets: report.budgets }));
  } catch (error) {
    report.status = 'interrupted';
    report.failures.push(String(error.stack || error));
    console.error(error);
    process.exitCode = 1;
  } finally {
    report.finishedAt = new Date().toISOString();
    write('summary.json', report);
  }
})();
