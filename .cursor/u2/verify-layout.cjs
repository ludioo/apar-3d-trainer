/**
 * U2 layout verify (ad-hoc Playwright — formal config lands in U4).
 * Asserts viewport-fit, short-landscape peek + canvas ≥40% vh, SE scroll, desktop 360 panel.
 */
const fs = require('node:fs');
const path = require('node:path');

function loadPlaywright() {
  const candidates = [process.env.PLAYWRIGHT_PATH, 'playwright', 'playwright-core'].filter(Boolean);
  for (const id of candidates) {
    try {
      return require(id);
    } catch {
      /* try next */
    }
  }
  throw new Error('Playwright not found. Set PLAYWRIGHT_PATH or install playwright (U4).');
}

const { chromium } = loadPlaywright();
const OUT = path.resolve(__dirname, '../../docs/_baselines/u2');
const ORIGIN = process.env.U2_ORIGIN || 'http://127.0.0.1:4173';
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const MIN_LANDSCAPE_CANVAS_PCT = 40;

const VIEWPORTS = [
  { id: 'iphone13-390x844', width: 390, height: 844, isMobile: true, hasTouch: true },
  { id: 'iphone-se-375x667', width: 375, height: 667, isMobile: true, hasTouch: true },
  { id: 'landscape-844x390', width: 844, height: 390, isMobile: true, hasTouch: true },
  { id: 'desktop-1440x900', width: 1440, height: 900, isMobile: false, hasTouch: false },
];

async function measure(page) {
  return page.evaluate(() => {
    const canvasRoot = document.querySelector('#canvas-root');
    const canvas = canvasRoot?.querySelector('canvas') || document.querySelector('canvas');
    const topbar = document.querySelector('.topbar');
    const panel = document.querySelector('#panel');
    const body = document.querySelector('#panel-body');
    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        w: Math.round(r.width * 100) / 100,
        h: Math.round(r.height * 100) / 100,
        top: Math.round(r.top * 100) / 100,
        bottom: Math.round(r.bottom * 100) / 100,
      };
    };
    return {
      title: document.title,
      viewportMeta: document.querySelector('meta[name="viewport"]')?.content || null,
      shortLandscape: document.documentElement.classList.contains('is-short-landscape'),
      emergencyDisplay: (() => {
        const el = document.querySelector('.emergency-chrome');
        return el ? getComputedStyle(el).display : null;
      })(),
      snap: panel?.dataset.snap || null,
      overflowHidden: getComputedStyle(document.documentElement).overflow.includes('hidden')
        && getComputedStyle(document.body).overflow.includes('hidden'),
      scrollY: window.scrollY,
      canvasRoot: box(canvasRoot),
      canvas: box(canvas),
      topbar: box(topbar),
      panel: box(panel),
      panelBody: body
        ? {
          scrollHeight: body.scrollHeight,
          clientHeight: body.clientHeight,
          canScroll: body.scrollHeight > body.clientHeight + 1,
        }
        : null,
      viewport: { w: window.innerWidth, h: window.innerHeight },
      topbarPadTop: topbar ? getComputedStyle(topbar).paddingTop : null,
      panelPadBottom: panel ? getComputedStyle(panel).paddingBottom : null,
    };
  });
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    executablePath: fs.existsSync(CHROME) ? CHROME : undefined,
    headless: true,
  });
  const meta = {
    date: new Date().toISOString().slice(0, 10),
    origin: ORIGIN,
    route: '#configure',
    minLandscapeCanvasPct: MIN_LANDSCAPE_CANVAS_PCT,
    viewports: [],
    asserts: [],
    errors: [],
  };
  const fail = (msg) => {
    meta.asserts.push({ ok: false, msg });
    console.error('FAIL', msg);
  };
  const pass = (msg) => {
    meta.asserts.push({ ok: true, msg });
    console.log('PASS', msg);
  };

  try {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        isMobile: vp.isMobile,
        hasTouch: vp.hasTouch,
        deviceScaleFactor: 1,
        locale: 'en-US',
        reducedMotion: 'reduce',
      });
      const page = await context.newPage();
      page.on('pageerror', (e) => meta.errors.push({ viewport: vp.id, error: String(e) }));
      const response = await page.goto(`${ORIGIN}/#configure`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForFunction(() => performance.getEntriesByName('apar:visible').length > 0, null, { timeout: 90000 }).catch(() => null);
      await page.waitForTimeout(900);
      const m = await measure(page);
      const file = `configure-${vp.id}.png`;
      await page.screenshot({ path: path.join(OUT, file), fullPage: false });
      const canvasH = m.canvasRoot?.h ?? m.canvas?.h ?? 0;
      const canvasPct = m.viewport.h ? Math.round((canvasH / m.viewport.h) * 1000) / 10 : null;
      meta.viewports.push({
        id: vp.id,
        width: vp.width,
        height: vp.height,
        httpStatus: response?.status() ?? null,
        screenshot: `docs/_baselines/u2/${file}`,
        ...m,
        canvasPctViewportH: canvasPct,
      });
      console.log('OK', vp.id, 'canvasH=', canvasH, 'pct=', canvasPct, 'snap=', m.snap, 'topbarH=', m.topbar?.h);

      if (!m.viewportMeta?.includes('viewport-fit=cover')) fail(`${vp.id}: missing viewport-fit=cover`);
      else pass(`${vp.id}: viewport-fit=cover`);
      if (!m.overflowHidden) fail(`${vp.id}: html/body overflow not hidden`);
      else pass(`${vp.id}: overflow hidden`);
      if (m.scrollY !== 0) fail(`${vp.id}: document scrollY=${m.scrollY}`);
      else pass(`${vp.id}: scrollY 0`);

      if (vp.id === 'landscape-844x390') {
        if (!m.shortLandscape) fail(`${vp.id}: missing is-short-landscape`);
        else pass(`${vp.id}: is-short-landscape`);
        if (m.snap !== 'peek') fail(`${vp.id}: expected peek, got ${m.snap}`);
        else pass(`${vp.id}: snap peek`);
        if (m.emergencyDisplay !== 'none') fail(`${vp.id}: emergency should be hidden in short-landscape`);
        else pass(`${vp.id}: emergency hidden (unobstructed canvas)`);
        if (canvasPct == null || canvasPct < MIN_LANDSCAPE_CANVAS_PCT) {
          fail(`${vp.id}: canvas ${canvasPct}% < ${MIN_LANDSCAPE_CANVAS_PCT}%`);
        } else pass(`${vp.id}: canvas ${canvasPct}% ≥ ${MIN_LANDSCAPE_CANVAS_PCT}%`);
      }

      if (vp.id === 'iphone-se-375x667') {
        if (!m.panelBody) fail(`${vp.id}: no panel body`);
        else if (!m.panelBody.canScroll && m.panelBody.scrollHeight > m.panelBody.clientHeight + 1) {
          fail(`${vp.id}: panel should scroll`);
        } else pass(`${vp.id}: panel body scrollable or fits (scrollH=${m.panelBody.scrollHeight}, clientH=${m.panelBody.clientHeight})`);
        if (m.snap !== 'half' && m.snap !== 'peek') fail(`${vp.id}: unexpected snap ${m.snap}`);
        else pass(`${vp.id}: snap ${m.snap}`);
      }

      if (vp.id === 'desktop-1440x900') {
        const pw = m.panel?.w ?? 0;
        if (Math.abs(pw - 360) > 1) fail(`${vp.id}: panel width ${pw} ≠ 360`);
        else pass(`${vp.id}: panel width 360`);
        if (m.shortLandscape) fail(`${vp.id}: should not be short-landscape`);
        else pass(`${vp.id}: not short-landscape`);
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }

  fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify(meta, null, 2));
  const failed = meta.asserts.filter((a) => !a.ok);
  console.log('Wrote', path.join(OUT, 'meta.json'), 'fails=', failed.length, 'pageerrors=', meta.errors.length);
  if (failed.length || meta.errors.length) process.exit(1);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
