const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('C:/Users/Aryaguna3/AppData/Local/npm-cache/_npx/0f94ee7615faf582/node_modules/puppeteer-core');
const report = [];
(async () => {
  for (let run = 1; run <= 3; run++) {
    const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true,
      args: ['--no-proxy-server', '--host-resolver-rules=MAP trainer.barkahmauludi.com 127.0.0.1'] });
    try {
      const p = await browser.newPage();
      await p.setRequestInterception(true);
      p.on('request', r => r.url().includes('umami') && !r.url().endsWith('/script.js')
        ? r.respond({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"cache":"qa"}' }) : r.continue());
      await p.evaluateOnNewDocument(() => {
        window.__longTasks = [];
        new PerformanceObserver(list => window.__longTasks.push(...list.getEntries().map(x => ({ start: x.startTime, duration: x.duration }))))
          .observe({ type: 'longtask', buffered: true });
      });
      const cdp = await p.createCDPSession();
      await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
      await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 60, downloadThroughput: 9e6 / 8, uploadThroughput: 1.5e6 / 8, connectionType: 'cellular4g' });
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 1000 });
      await cdp.send('Profiler.start');
      await p.goto('http://trainer.barkahmauludi.com:4196/#configure', { waitUntil: 'domcontentloaded' });
      await p.waitForFunction(() => !!window.umami?.track, { timeout: 60000 });
      await p.waitForNetworkIdle({ idleTime: 750 });
      const { profile } = await cdp.send('Profiler.stop');
      fs.writeFileSync(path.join(__dirname, `t3.6-profile-${run}.json`), JSON.stringify(profile));
      const parents = new Map();
      const nodes = new Map(profile.nodes.map(n => [n.id, n]));
      profile.nodes.forEach(n => (n.children || []).forEach(id => parents.set(id, n.id)));
      function inTracker(id) { while (id) { if (/cloud\.umami\.is/.test(nodes.get(id)?.callFrame.url || '')) return true; id = parents.get(id); } return false; }
      const trackerCpuUs = profile.samples.reduce((sum, id, i) => sum + (inTracker(id) ? profile.timeDeltas[i] : 0), 0);
      const metrics = await p.evaluate(() => ({ ready: performance.getEntriesByName('apar:visible')[0].startTime,
        script: performance.getEntriesByType('resource').find(x => x.name === 'https://cloud.umami.is/script.js')?.toJSON(), tasks: window.__longTasks }));
      const result = { run, trackerCpuMsSampled: trackerCpuUs / 1000, ...metrics,
        postScriptLongTasks: metrics.tasks.filter(x => x.start >= metrics.script.startTime) };
      report.push(result); console.log(JSON.stringify(result));
    } finally { await browser.close(); }
  }
})().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => fs.writeFileSync(path.join(__dirname, 't3.6-profile-summary.json'), JSON.stringify(report, null, 2)));
