import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { gzipSync, gunzipSync } from 'node:zlib';

const source = new URL('../public/hdri/studio_1k.hdr', import.meta.url);
const original = readFileSync(source);
const compressed = gzipSync(original, { level: 9 });
assert.deepEqual(gunzipSync(compressed), original, 'HDRI compression must be lossless');
writeFileSync(new URL('../public/hdri/studio_1k.hdr.gz', import.meta.url), compressed);
console.log(`HDRI: ${original.length} -> ${compressed.length} bytes (lossless gzip)`);
