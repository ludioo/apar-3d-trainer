/**
 * U3 onboarding verify (ad-hoc Playwright — formal suite = U5).
 * First visit: overlay; Skip writes flag; second visit: no overlay / no driver chunk;
 * reduced-motion path; emergency tel still hit-testable; screenshots mobile+desktop.
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
const OUT = path.resolve(__dirname, '../../docs/_baselines/u3');
const ORIGIN = process.env.U3_ORIGIN || 'http://127.0.0.1:4173';
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

fs.mkdirSync(OUT, { recursive: true });

async function waitReady(page) {
  await page.waitForFunction(() => !document.getElementById('splash'), null, { timeout: 120_000 });
  await page.waitForTimeout(600);
}

async function tourState(page) {
  return page.evaluate(() => {
    const overlay = document.querySelector('.driver-overlay, .driver-popover');
    const popover = document.querySelector('.driver-popover.firedrill-tour');
    const fire = document.querySelector('a[data-emergency="fire"]');
    const general = document.querySelector('a[data-emergency="general"]');
    const topZ = document.querySelector('.topbar')
      ? Number.parseInt(getComputedStyle(document.querySelector('.topbar')).zIndex, 10)
      : null;
    const hit = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      const top = document.elementFromPoint(x, y);
      return {
        href: el.getAttribute('href'),
        hitSelfOrChild: !!(top && (top === el || el.contains(top))),
        topTag: top?.tagName || null,
      };
    };
    return {
      hasOverlay: !!overlay,
      hasPopover: !!popover,
      onboardingClass: document.documentElement.classList.contains('is-onboarding'),
      storage: localStorage.getItem('apar3d:onboarding'),
      topbarZ: topZ,
      fire: hit(fire),
      general: hit(general),
    };
  });
}

(async () => {
  const browser = await chromium.launch({
    executablePath: fs.existsSync(CHROME) ? CHROME : undefined,
    headless: true,
  });
  const meta = { origin: ORIGIN, runs: [] };

  // --- First visit mobile ---
  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();
    const driverReqs = [];
    page.on('request', (req) => {
      const u = req.url();
      if (/driver/i.test(u) || /onboarding/i.test(u)) driverReqs.push(u);
    });
    await page.goto(`${ORIGIN}/#configure`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await waitReady(page);
    await page.waitForSelector('.driver-popover.firedrill-tour', { timeout: 30_000 });
    const first = await tourState(page);
    await page.screenshot({ path: path.join(OUT, 'tour-first-iphone13-390x844.png'), fullPage: false });
    if (!first.hasPopover) throw new Error('first visit mobile: missing popover');
    if (!first.fire?.hitSelfOrChild) {
      throw new Error(`emergency fire not hittable during tour (top=${first.fire?.topTag})`);
    }
    if (!first.general?.hitSelfOrChild) {
      throw new Error(`emergency general not hittable during tour (top=${first.general?.topTag})`);
    }
    // Skip via close button (aria-label)
    await page.locator('.driver-popover-close-btn').click();
    await page.waitForTimeout(400);
    const afterSkip = await tourState(page);
    if (afterSkip.storage !== 'true') throw new Error(`skip did not set flag: ${afterSkip.storage}`);
    if (afterSkip.hasPopover) throw new Error('popover still visible after skip');
    meta.runs.push({ id: 'first-mobile', first, afterSkip, driverReqs });
    await context.close();
  }

  // --- Second visit mobile (same origin storage via storageState) ---
  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    });
    await context.addInitScript(() => {
      localStorage.setItem('apar3d:onboarding', 'true');
    });
    const page = await context.newPage();
    const driverReqs = [];
    page.on('request', (req) => {
      const u = req.url();
      if (/driver\.js|driver-.*\.css|onboarding-.*\.(js|css)/i.test(u)) driverReqs.push(u);
    });
    await page.goto(`${ORIGIN}/#configure`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await waitReady(page);
    await page.waitForTimeout(1500);
    const second = await tourState(page);
    await page.screenshot({ path: path.join(OUT, 'tour-second-iphone13-390x844.png'), fullPage: false });
    if (second.hasPopover || second.hasOverlay) throw new Error('second visit still shows tour');
    if (driverReqs.length) throw new Error(`second visit fetched tour chunks: ${driverReqs.join(', ')}`);
    meta.runs.push({ id: 'second-mobile', second, driverReqs });
    await context.close();
  }

  // --- Reduced motion desktop first visit ---
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      colorScheme: 'light',
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.goto(`${ORIGIN}/#configure`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await waitReady(page);
    await page.waitForSelector('.driver-popover.firedrill-tour', { timeout: 30_000 });
    const reduced = await page.evaluate(() => ({
      hasPopover: !!document.querySelector('.driver-popover.firedrill-tour'),
      mq: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      animatedClass: document.querySelector('.driver-overlay')?.classList.contains('driver-overlay-animated') ?? null,
    }));
    await page.screenshot({ path: path.join(OUT, 'tour-reduced-desktop-1440x900.png'), fullPage: false });
    if (!reduced.hasPopover || !reduced.mq) throw new Error('reduced-motion path failed');
    meta.runs.push({ id: 'reduced-desktop', reduced });
    await context.close();
  }

  // --- Desktop first visit (fresh) ---
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${ORIGIN}/#configure`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await waitReady(page);
    await page.waitForSelector('.driver-popover.firedrill-tour', { timeout: 30_000 });
    const desk = await tourState(page);
    await page.screenshot({ path: path.join(OUT, 'tour-first-desktop-1440x900.png'), fullPage: false });
    if (!desk.hasPopover) throw new Error('desktop first visit missing popover');
    meta.runs.push({ id: 'first-desktop', desk });
    await context.close();
  }

  fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify(meta, null, 2));
  console.log('U3 verify OK', OUT);
  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
