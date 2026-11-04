/**
 * U0 one-shot baseline screenshots (not a product dependency — U4 adds Playwright properly).
 */
const fs = require('node:fs');
const path = require('node:path');
function loadPlaywright() {
  const candidates = [
    process.env.PLAYWRIGHT_PATH,
    'playwright',
    'playwright-core',
  ].filter(Boolean);
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

const OUT = path.resolve(__dirname, '../../docs/_baselines/u0');
const ORIGIN = process.env.U0_ORIGIN || 'http://127.0.0.1:4173';
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const VIEWPORTS = [
  { id: 'iphone13-390x844', width: 390, height: 844, isMobile: true, hasTouch: true },
  { id: 'iphone-se-375x667', width: 375, height: 667, isMobile: true, hasTouch: true },
  { id: 'landscape-844x390', width: 844, height: 390, isMobile: true, hasTouch: true },
  { id: 'desktop-1440x900', width: 1440, height: 900, isMobile: false, hasTouch: false },
];

async function measure(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector('#stage canvas, canvas');
    const topbar = document.querySelector('.topbar, header.topbar, [data-topbar]');
    const panel = document.querySelector('.panel, #panel, [data-panel]');
    const brand = document.querySelector('.topbar__brand, [data-brand], .brand');
    const title = document.title;
    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { w: Math.round(r.width * 100) / 100, h: Math.round(r.height * 100) / 100, top: Math.round(r.top * 100) / 100, bottom: Math.round(r.bottom * 100) / 100 };
    };
    return {
      title,
      brandText: brand?.textContent?.trim() || null,
      canvas: box(canvas),
      topbar: box(topbar),
      panel: box(panel),
      viewport: { w: window.innerWidth, h: window.innerHeight },
      hasThemeColor: !!document.querySelector('meta[name="theme-color"]'),
      hasAppleTouch: !!document.querySelector('link[rel="apple-touch-icon"]'),
      hasManifest: !!document.querySelector('link[rel="manifest"]'),
      viewportMeta: document.querySelector('meta[name="viewport"]')?.content || null,
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
    lighthouseAuditNeo2026_11_04: {
      source: 'https://apar-3d-trainer.vercel.app',
      performance: 36,
      accessibility: 100,
      bestPractices: 100,
      seo: 100,
    },
    viewports: [],
    errors: [],
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
      const url = `${ORIGIN}/#configure`;
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForFunction(() => performance.getEntriesByName('apar:visible').length > 0, null, { timeout: 90000 }).catch(() => null);
      await page.waitForTimeout(800);
      const m = await measure(page);
      const file = `configure-${vp.id}.png`;
      await page.screenshot({ path: path.join(OUT, file), fullPage: false });
      meta.viewports.push({
        id: vp.id,
        width: vp.width,
        height: vp.height,
        httpStatus: response?.status() ?? null,
        screenshot: `docs/_baselines/u0/${file}`,
        ...m,
        canvasPctViewportH: m.canvas && m.viewport.h ? Math.round((m.canvas.h / m.viewport.h) * 1000) / 10 : null,
      });
      console.log('OK', vp.id, 'canvasH=', m.canvas?.h, 'topbarH=', m.topbar?.h, 'title=', m.title);
      await context.close();
    }
  } finally {
    await browser.close();
  }

  fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify(meta, null, 2));
  console.log('Wrote', path.join(OUT, 'meta.json'));
  if (meta.errors.length) {
    console.error('pageerrors', meta.errors);
    process.exitCode = 1;
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
