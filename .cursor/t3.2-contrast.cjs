const fs = require('node:fs');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
function parse(value) {
  if (!value.startsWith('#')) return value.match(/[\d.]+/g).map(Number);
  let hex = value.slice(1);
  if (hex.length <= 4) hex = [...hex].map(c => c + c).join('');
  const channels = hex.match(/../g).map(v => parseInt(v, 16));
  if (channels.length === 4) channels[3] /= 255;
  return channels;
}
function luminance(rgb) {
  return rgb.slice(0, 3).map(v => v / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
}
function contrast(a, b) {
  const [lo, hi] = [luminance(a), luminance(b)].sort((a, b) => a - b);
  return (hi + 0.05) / (lo + 0.05);
}
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const p = await browser.newPage({ reducedMotion: 'reduce' });
    await p.goto('http://localhost:4183/#configure');
    await p.waitForFunction(() => document.querySelector('#splash').inert);
    const tokens = await p.evaluate(() => Object.fromEntries(['bg', 'bg-grad', 'surface', 'surface-solid', 'text', 'text-muted', 'accent', 'accent-ink', 'danger', 'success'].map(key => [key, getComputedStyle(document.documentElement).getPropertyValue('--' + key).trim()])));
    const colors = Object.fromEntries(Object.entries(tokens).map(([k, v]) => [k, parse(v)]));
    const pairs = [];
    const alpha = colors.surface[3];
    const worst = colors.surface.slice(0, 3).map(v => alpha * v + (1 - alpha) * 255);
    for (const [name, bg] of [['solid panel', colors['surface-solid']], ['glass over white (worst backdrop)', worst], ['page', colors.bg]]) {
      for (const key of ['text', 'text-muted', 'danger', 'success', 'accent']) {
        const ratio = contrast(colors[key], bg);
        pairs.push({ foreground: key, background: name, ratio, minimum: 4.5 });
        assert(ratio >= 4.5, key + ' on ' + name);
      }
    }
    pairs.push({ foreground: 'accent-ink', background: 'accent', ratio: contrast(colors['accent-ink'], colors.accent), minimum: 4.5 });
    assert(pairs.at(-1).ratio >= 4.5);
    const border = await p.locator('.config-choice[aria-pressed="false"]').first().evaluate(el => getComputedStyle(el).borderTopColor);
    assert(contrast(parse(border), worst) >= 3, 'unselected configuration boundary');
    await p.locator('.tab[href="#train"]').click(); await p.keyboard.press('Tab'); await p.locator('[data-training="start"]').focus();
    const focus = await p.locator('[data-training="start"]').evaluate(el => ({ color: getComputedStyle(el).outlineColor, background: getComputedStyle(el).backgroundColor, width: getComputedStyle(el).outlineWidth }));
    assert(Number.parseFloat(focus.width) >= 2);
    assert(contrast(parse(focus.color), parse(focus.background)) >= 3, 'primary training focus');
    const result = { tokens, alpha, worstBackdrop: worst, pairs, configurationBoundary: { color: border, ratio: contrast(parse(border), worst) }, primaryFocus: { ...focus, ratio: contrast(parse(focus.color), parse(focus.background)) } };
    fs.writeFileSync('.cursor/t3.2-contrast-qa.json', JSON.stringify(result, null, 2));
    console.log('PASS contrast', pairs.length, 'text pairs; boundary and primary focus');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
