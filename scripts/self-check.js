import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseHash } from '../src/core/router.js';
import { nearestSnap } from '../src/ui/sheet.js';
import { nearestHotspot } from '../src/core/picking.js';
import hotspots from '../src/data/hotspots.json' with { type: 'json' };

const load = (lang) => JSON.parse(readFileSync(new URL(`../src/i18n/${lang}.json`, import.meta.url), 'utf8'));
const en = load('en');
const id = load('id');

assert.deepEqual(Object.keys(id).sort(), Object.keys(en).sort(), 'en.json and id.json must have the same keys');
for (const [lang, dict] of Object.entries({ en, id })) {
  for (const [key, value] of Object.entries(dict)) {
    assert.ok(typeof value === 'string' && value.trim(), `${lang}.json "${key}" is empty`);
  }
}

const modes = { configure: {}, train: {}, results: {} };
assert.equal(parseHash('', modes), 'configure');
assert.equal(parseHash('#train', modes), 'train');
assert.equal(parseHash('#xyz', modes), 'configure');
assert.equal(parseHash('#about', modes), 'about');
assert.equal(parseHash('#toString', modes), 'configure');

assert.equal(nearestSnap(300, [240, 640]), 240);
assert.equal(nearestSnap(500, [240, 640]), 640);

assert.equal(hotspots.length, 6);
assert.deepEqual(
  hotspots.map((h) => h.id).sort(),
  ['body', 'gauge', 'handle', 'label', 'nozzle', 'pin'],
);

const pin = hotspots.find((h) => h.id === 'pin');
assert.equal(nearestHotspot({ x: pin.position[0], y: pin.position[1], z: pin.position[2] }, hotspots)?.id, 'pin');

const label = hotspots.find((h) => h.id === 'label');
const body = hotspots.find((h) => h.id === 'body');
assert.ok(
  Math.hypot(
    label.position[0] - body.position[0],
    label.position[1] - body.position[1],
    label.position[2] - body.position[2],
  ) <= body.radius,
  'label must sit inside body radius for overlap test',
);
assert.equal(
  nearestHotspot({ x: label.position[0], y: label.position[1], z: label.position[2] }, hotspots)?.id,
  'label',
);

assert.equal(nearestHotspot({ x: 0, y: -1, z: 0 }, hotspots), null);

console.log(`self-check ok: ${Object.keys(en).length} i18n keys, router, sheet, ${hotspots.length} hotspots`);
