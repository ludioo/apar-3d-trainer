import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SITE_ORIGIN, SITE_NAME, OG_IMAGE_PATH } from '../src/core/siteConfig.js';

const html = readFileSync(process.argv[2] || new URL('../index.html', import.meta.url), 'utf8');
const en = JSON.parse(readFileSync(new URL('../src/i18n/en.json', import.meta.url), 'utf8'));
const baseUrl = `${SITE_ORIGIN}/`;
const description = 'FireDrill helps you configure a 3D fire extinguisher, explore its parts, practice PASS, take an eight-question quiz, and export results to PDF. Built with Three.js and WebGL.';
const imageAlt = 'FireDrill showing a red fire extinguisher and its configuration controls.';
const decode = (value) => value.replaceAll('&amp;', '&');
const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1];
assert.ok(head, 'HTML contains a head');
assert.equal(en['app.name'], SITE_NAME);
const meta = [...head.matchAll(/<meta\s+[^>]+>/g)].map(([tag]) =>
  Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, key, value]) => [key, decode(value)])));
const expected = {
  description,
  keywords: 'Three.js, WebGL, GLTF/GLB, 3D product configurator, interactive 3D viewer, hotspots, real-time material swapping, browser-based training simulation',
  'theme-color': '#0E1013',
  'og:title': en['app.title'],
  'og:description': description,
  'og:type': 'website',
  'og:site_name': en['app.name'],
  'og:url': baseUrl,
  'og:image': `${SITE_ORIGIN}${OG_IMAGE_PATH}`,
  'og:image:type': 'image/jpeg',
  'og:image:width': '1200',
  'og:image:height': '630',
  'og:image:alt': imageAlt,
  'twitter:card': 'summary_large_image',
  'twitter:title': en['app.title'],
  'twitter:description': description,
  'twitter:image': `${SITE_ORIGIN}${OG_IMAGE_PATH}`,
  'twitter:image:alt': imageAlt,
};
for (const [key, value] of Object.entries(expected)) {
  const attribute = key.startsWith('og:') ? 'property' : 'name';
  const tags = meta.filter((tag) => tag[attribute] === key);
  assert.equal(tags.length, 1, `one static ${key} tag`);
  assert.equal(tags[0].content, value, key);
}
assert.equal(decode(head.match(/<title>([^<]+)<\/title>/)?.[1] || ''), en['app.title']);
const canonicals = [...head.matchAll(/<link\s+[^>]*rel="canonical"[^>]*>/g)];
assert.equal(canonicals.length, 1, 'one canonical');
assert.equal(canonicals[0][0].match(/href="([^"]+)"/)?.[1], baseUrl);
assert.match(head, /rel="manifest"[^>]*href="\/site\.webmanifest"/);
assert.match(head, /rel="apple-touch-icon"[^>]*href="\/apple-touch-icon\.png"/);
const schemas = [...head.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
assert.equal(schemas.length, 1, 'one static JSON-LD document');
assert.deepEqual(JSON.parse(schemas[0][1]), {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: en['app.title'],
  description,
  url: baseUrl,
  screenshot: `${SITE_ORIGIN}${OG_IMAGE_PATH}`,
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Any',
  inLanguage: ['en', 'id'],
  isAccessibleForFree: true,
  author: { '@type': 'Person', name: 'Barkah Mauludi', url: 'https://barkahmauludi.com' },
});
const robots = readFileSync(new URL('../public/robots.txt', import.meta.url), 'utf8');
assert.match(robots, new RegExp(`^User-agent: \\*\\r?\\nAllow: \\/\\r?\\n\\r?\\nSitemap: ${SITE_ORIGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\/sitemap\\.xml\\s*$`));
const sitemap = readFileSync(new URL('../public/sitemap.xml', import.meta.url), 'utf8');
assert.match(sitemap, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
assert.deepEqual([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => url), [baseUrl]);
const jpeg = readFileSync(new URL('../public/og-image.jpg', import.meta.url));
assert.equal(jpeg.readUInt16BE(0), 0xffd8, 'JPEG start marker');
assert.equal(jpeg.readUInt16BE(jpeg.length - 2), 0xffd9, 'JPEG end marker');
const apple = readFileSync(new URL('../public/apple-touch-icon.png', import.meta.url));
assert.equal(apple[0], 0x89);
assert.equal(apple[1], 0x50);
assert.equal(apple[2], 0x4e);
assert.equal(apple[3], 0x47);
const manifest = JSON.parse(readFileSync(new URL('../public/site.webmanifest', import.meta.url), 'utf8'));
assert.equal(manifest.name, SITE_NAME);
assert.equal(manifest.short_name, SITE_NAME);
assert.equal(manifest.theme_color, '#0E1013');
console.log('SEO: static metadata, canonical, JSON-LD, robots, sitemap, PWA chrome and JPEG passed');
