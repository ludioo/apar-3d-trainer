import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../public/hdri/studio_1k.hdr', import.meta.url));
const compressed = readFileSync(new URL('../public/hdri/studio_1k.hdr.gz', import.meta.url));
const decoded = gunzipSync(compressed);
assert.deepEqual(decoded, source, 'compressed HDRI must reproduce the original bytes');
assert.ok(compressed.length < source.length, 'compression must reduce transfer');
const loader = new HDRLoader();
const parse = (bytes) => loader.createDataTexture(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const original = parse(source);
const restored = parse(decoded);
assert.equal(restored.image.width, 1024);
assert.equal(restored.image.height, 512);
assert.deepEqual(restored.image.data, original.image.data, 'HDR pixels must be identical');
assert.equal(restored.type, original.type);
assert.equal(restored.colorSpace, original.colorSpace);
original.dispose(); restored.dispose();
console.log(`Environment check: ${source.length} -> ${compressed.length} bytes; identical 1K HDR pixels/type/color space`);

const environmentSource = readFileSync(new URL('../src/core/environment.js', import.meta.url), 'utf8');
const preload = readFileSync(new URL('../index.html', import.meta.url), 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
for (const search of ['', '?hdri', '?hdri=0', '?hdri=true', '?debug&hdri=1']) {
  const links = [];
  const context = { URLSearchParams, location: { search }, DecompressionStream,
    document: { createElement: () => ({}), head: { appendChild: link => links.push(link) } } };
  runInNewContext(preload, context);
  assert.equal(links.length, search.endsWith('hdri=1') ? 1 : 0, 'preload must match the environment selection');
  if (links.length) assert.equal(links[0].href, '/hdri/studio_1k.hdr.gz');
}
const links = [];
runInNewContext(preload, { URLSearchParams, location: { search: '?hdri=1' },
  document: { createElement: () => ({}), head: { appendChild: link => links.push(link) } } });
assert.equal(links[0].href, '/hdri/studio_1k.hdr', 'preload works without DecompressionStream');

for (const options of [{}, { coarse: true }, { search: '?hdri=0' }, { fail: true },
  { search: '?hdri=1' }, { search: '?debug&hdri=1', compressedFails: true },
  { search: '?hdri=1', decompress: false }, { search: '?hdri=1', compressedFails: true, fail: true }]) {
  const calls = [], scene = {}, texture = {};
  const hdr = { dispose: () => calls.push('hdr:dispose') };
  class Generator {
    compileEquirectangularShader() { calls.push('compile'); }
    fromScene(room, sigma, near, far, { size }) {
      calls.push(`room:${size}`);
      if (options.fail) throw Error('GPU fault');
      return { texture };
    }
    fromEquirectangular(value) { assert.equal(value, hdr); calls.push('convert'); return { texture }; }
    dispose() { calls.push('generator:dispose'); }
  }
  class Room { dispose() { calls.push('room:dispose'); } }
  class Loader {
    createDataTexture(buffer) { assert.deepEqual(Buffer.from(buffer), source); calls.push('parse'); return hdr; }
    async loadAsync(url) { calls.push(url); if (options.fail) throw Error('HDR fault'); return hdr; }
  }
  const context = { PMREMGenerator: Generator, RoomEnvironment: Room, URLSearchParams,
    location: { search: options.search || '' }, matchMedia: () => ({ matches: !!options.coarse }),
    loadHdrModule: async () => { calls.push('import:HDRLoader'); return { HDRLoader: Loader }; },
    DecompressionStream: options.decompress === false ? undefined : DecompressionStream, Response,
    fetch: async url => { calls.push(url); return new Response(options.compressedFails ? null : compressed, { status: options.compressedFails ? 503 : 200 }); },
    performance: { mark: name => calls.push(name) }, console: { warn: () => calls.push('warn') } };
  runInNewContext(environmentSource.replace(/^import .+;\r?\n/gm, '')
    .replace("await import('three/addons/loaders/HDRLoader.js')", 'await loadHdrModule()')
    .replace('export async function', 'async function') + '\nglobalThis.loadEnvironment = loadEnvironment;', context);
  assert.equal(await context.loadEnvironment({}, scene, () => calls.push('render')), !options.fail);
  assert.equal(scene.environment, options.fail ? undefined : texture);
  assert.ok(calls.includes(options.fail ? 'apar:environment-failed' : 'apar:environment-ready'));
  assert.equal(calls.includes('render'), !options.fail);
  assert.ok(calls.includes('generator:dispose'));
  if (!options.search?.includes('hdri=1')) {
    assert.ok(calls.includes(`room:${options.coarse ? 128 : 256}`));
    assert.ok(calls.includes('room:dispose'));
    assert.ok(!calls.some(call => call.startsWith('/hdri/') || call === 'import:HDRLoader'));
  } else {
    assert.ok(!calls.includes('room:dispose'));
    assert.equal(calls.includes('/hdri/studio_1k.hdr'), !!options.compressedFails || options.decompress === false);
    assert.equal(calls.includes('hdr:dispose'), !options.fail);
  }
}
console.log('Environment routes/preload, PMREM sizes, HDR fallbacks, failure marks and resource cleanup passed');
