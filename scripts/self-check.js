import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseHash } from '../src/core/router.js';
import { nearestSnap } from '../src/ui/sheet.js';

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

console.log(`self-check ok: ${Object.keys(en).length} i18n keys in en/id, router, sheet snap`);
