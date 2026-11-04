/**
 * U1 one-shot: title/header/manifest/CTA + About screenshots (Playwright external until U4).
 */
const fs = require('node:fs');
const path = require('node:path');
function loadPlaywright() {
  for (const id of [process.env.PLAYWRIGHT_PATH, 'playwright', 'playwright-core'].filter(Boolean)) {
    try { return require(id); } catch { /* next */ }
  }
  throw new Error('Playwright not found');
}
const { chromium } = loadPlaywright();
const OUT = path.resolve(__dirname, '../../docs/_baselines/u1');
const ORIGIN = process.env.U1_ORIGIN || 'http://127.0.0.1:4173';
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    executablePath: fs.existsSync(CHROME) ? CHROME : undefined,
    headless: true,
  });
  const results = { date: new Date().toISOString(), origin: ORIGIN, checks: {}, shots: [] };

  async function probe(id, width, height, isMobile) {
    const context = await browser.newContext({
      viewport: { width, height },
      isMobile,
      hasTouch: isMobile,
      deviceScaleFactor: isMobile ? 2 : 1,
    });
    const page = await context.newPage();
    await page.goto(`${ORIGIN}/#configure`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForSelector('.topbar__name', { timeout: 30000 });
    await page.evaluate(() => {
      document.getElementById('splash')?.setAttribute('hidden', '');
    });
    const data = await page.evaluate(async () => {
      const name = document.querySelector('.topbar__name')?.textContent?.trim();
      const theme = document.querySelector('meta[name="theme-color"]')?.content;
      const apple = document.querySelector('link[rel="apple-touch-icon"]')?.href;
      const manifestHref = document.querySelector('link[rel="manifest"]')?.href;
      let manifest = null;
      if (manifestHref) {
        const res = await fetch(manifestHref);
        manifest = await res.json();
      }
      return { title: document.title, name, theme, apple, manifest };
    });
    await page.click('a.topbar__about');
    await page.waitForSelector('#about[open]', { timeout: 10000 });
    const cta = await page.evaluate(() => {
      const el = document.querySelector('#about [data-about="contact"]');
      const r = el?.getBoundingClientRect();
      return {
        text: el?.textContent?.trim() || null,
        href: el?.getAttribute('href') || null,
        className: el?.className || null,
        beforeGithub: (() => {
          const links = [...document.querySelectorAll('#about .modal__body a')].map((a) => a.getAttribute('data-i18n') || a.textContent.trim());
          const iCta = links.indexOf('about.workWithMe');
          const iGh = links.indexOf('about.github');
          return iCta >= 0 && iGh >= 0 && iCta < iGh;
        })(),
        box: r ? { w: r.width, h: r.height } : null,
      };
    });
    const shot = path.join(OUT, `about-${id}.png`);
    await page.screenshot({ path: shot, fullPage: false });
    results.shots.push(shot);
    results.checks[id] = { ...data, cta };
    await context.close();
  }

  await probe('mobile-390x844', 390, 844, true);
  await probe('desktop-1440x900', 1440, 900, false);

  const fail = [];
  for (const [id, c] of Object.entries(results.checks)) {
    if (!c.title?.includes('FireDrill')) fail.push(`${id}: title`);
    if (c.name !== 'FireDrill') fail.push(`${id}: brand`);
    if (c.theme !== '#0E1013') fail.push(`${id}: theme-color`);
    if (!c.apple?.includes('apple-touch-icon.png')) fail.push(`${id}: apple-touch`);
    if (c.manifest?.name !== 'FireDrill' || c.manifest?.short_name !== 'FireDrill') fail.push(`${id}: manifest`);
    if (c.cta?.text !== 'Work with me') fail.push(`${id}: cta text`);
    if (c.cta?.href !== 'https://barkahmauludi.com/contact') fail.push(`${id}: cta href`);
    if (!c.cta?.className?.includes('about-cta')) fail.push(`${id}: cta class`);
    if (!c.cta?.beforeGithub) fail.push(`${id}: cta order`);
    if (!c.cta?.box || c.cta.box.h < 44) fail.push(`${id}: cta tap`);
  }
  fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify(results, null, 2));
  await browser.close();
  if (fail.length) {
    console.error('U1 verify FAIL', fail, results.checks);
    process.exit(1);
  }
  console.log('U1 verify PASS', JSON.stringify(results.checks, null, 2));
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
