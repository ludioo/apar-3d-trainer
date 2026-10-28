const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const origin = 'http://localhost:4191';
const report = { origin, hardware: 'Local Chrome, GPU enabled; no network/CPU throttle; mobile is emulation', checks: [], fps: [], errors: [] };
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    for (const mobile of [false, true]) {
      const p = await browser.newPage({ viewport: mobile ? { width: 390, height: 844 } : { width: 1365, height: 900 }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2.75 : 1, locale: 'en-US' });
      p.on('pageerror', e => report.errors.push(String(e)));
      await p.goto(origin + '/?debug#configure');
      await p.waitForFunction(() => performance.getEntriesByName('apar:visible').length);
      const hardware = await p.evaluate(() => {
        const { renderer } = window.__aparDebug;
        const gl = renderer.getContext(), info = gl.getExtension('WEBGL_debug_renderer_info');
        return { renderer: info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), dpr: renderer.getPixelRatio() };
      });
      assert.equal(hardware.dpr, mobile ? 1.5 : 1);
      await p.evaluate(() => window.__aparDebug.controls.pauseAutoRotate());
      if (mobile) await p.locator('.panel__handle').click();
      await p.locator('[data-agent="co2"]').click();
      await p.locator('[data-capacity="9kg"]').click();
      await p.locator('[data-color="silver"]').click();
      await p.locator('.config-bracket input').check();
      await p.locator('[data-action="save"]').click();
      await p.locator('#saved-name').fill('T3.1 QA configuration');
      await p.locator('.saved-dialog [type="submit"]').click();
      await p.locator('.saved-dialog').waitFor({ state: 'hidden' });
      await p.locator('[data-color="yellow"]').click();
      await p.locator('[data-action="load"]').click();
      assert.equal(await p.locator('[data-color="silver"]').getAttribute('aria-pressed'), 'true');
      if (mobile) await p.locator('.panel__handle').click();
      await p.locator('[data-color="silver"]').scrollIntoViewIfNeeded();
      await p.screenshot({ path: path.join(__dirname, `t3.1-variant-${mobile ? 'mobile' : 'desktop'}.png`) });
      report.checks.push({ mobile, check: 'CO2/9kg/silver/bracket saved and loaded after yellow selection; DPR unchanged', hardware });

      await p.evaluate(() => window.__aparDebug.controls.resumeAutoRotate());
      await p.waitForTimeout(5300);
      async function frames(label) {
        const sample = await p.evaluate(async () => {
          const { renderer } = window.__aparDebug;
          const render = renderer.render;
          const times = [];
          renderer.render = function (...args) { times.push(performance.now()); return render.apply(this, args); };
          const start = performance.now();
          await new Promise(r => setTimeout(r, 2000));
          const duration = performance.now() - start;
          renderer.render = render;
          const gaps = times.slice(1).map((time, i) => time - times[i]).sort((a, b) => a - b);
          return { frames: times.length, duration, fps: times.length * 1000 / duration, p95Ms: gaps[Math.floor(gaps.length * .95)] };
        });
        assert.ok(sample.frames > 0);
        report.fps.push({ mobile, label, ...sample });
        console.log(JSON.stringify({ mobile, label, ...sample }));
      }
      await frames('Configure auto-orbit');
      await p.locator('.tab[href="#train"]').click();
      const action = name => p.locator(`[data-training="${name}"]`);
      await action('start').click(); await action('skip').click(); await action('next').click();
      await action('skip').click(); await action('next').click();
      await p.waitForTimeout(900);
      await frames('Squeeze active fire');
      await p.close();
    }
    assert.deepEqual(report.errors, []);
  } catch (error) { report.failure = String(error.stack); throw error; }
  finally { await browser.close(); fs.writeFileSync(path.join(__dirname, 't3.1-visual-fps-qa.json'), JSON.stringify(report, null, 2)); }
})().catch(e => { console.error(e); process.exitCode = 1; });
