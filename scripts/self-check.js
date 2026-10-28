import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseHash } from '../src/core/router.js';
import { nearestSnap, sheetBounds } from '../src/ui/sheet.js';
import { nearestHotspot } from '../src/core/picking.js';
import hotspots from '../src/data/hotspots.json' with { type: 'json' };
import { Box3, BoxGeometry, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, PerspectiveCamera, Raycaster, ShaderLib, Texture, Vector3 } from 'three';
import './product-check.js';
import './saved-configs-check.js';
import './training-check.js';
import './effects-check.js';
import './quiz-check.js';
import './results-check.js';
import { projectPin, placePin } from '../src/ui/hotspot-pins.js';
import { initCameraTween } from '../src/core/cameraTween.js';
import { initAppearance } from '../src/features/configurator/appearance.js';
import product from '../src/data/product.json' with { type: 'json' };

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
assert.deepEqual(sheetBounds(844, 728, 176), [253.2, 675.2]);
assert.deepEqual(sheetBounds(390, 274, 176), [176, 274], 'landscape keeps room below topbar');
assert.deepEqual(sheetBounds(240, 124, 176), [124, 124], 'both snaps fit a very short viewport');
assert.deepEqual(sheetBounds(800, 684, 176), [240, 640]);
assert.equal(nearestSnap(180, sheetBounds(390, 274, 176)), 176);
assert.equal(nearestSnap(260, sheetBounds(390, 274, 176)), 274);

assert.equal(hotspots.length, 6);
assert.deepEqual(
  hotspots.map((h) => h.id).sort(),
  ['body', 'gauge', 'handle', 'label', 'nozzle', 'pin'],
);

const pin = hotspots.find((h) => h.id === 'pin');
assert.deepEqual(hotspots.map((h) => h.id), ['handle', 'pin', 'nozzle', 'gauge', 'label', 'body'], 'part 1 is the lever, part 2 the safety pin');
// Fixed landmarks from the close-up approved by Barkah, independent of the hotspot lookup under test.
for (const [index, landmark] of [
  { position: [0.085, 0.652, 0.03], anchor: [0.09043, 0.655, 0.04113], radius: 0.028,
    view: { position: [0.45, 1.35, 0.55], target: [0.155, 1.187, -0.055] } },
  { position: [0, 0.612, 0], anchor: [0.00994, 0.61787, 0.02013], radius: 0.04,
    view: { position: [0.4, 1.35, 0.7], target: [0, 1.114, -0.11] } },
].entries()) {
  const hotspot = hotspots[index];
  assert.deepEqual(hotspot.position, landmark.position, `${hotspot.id}: physical picking landmark`);
  assert.deepEqual(hotspot.pinPosition, landmark.anchor, `${hotspot.id}: physical surface landmark`);
  assert.equal(hotspot.radius, landmark.radius);
  assert.deepEqual(hotspot.cameraView, landmark.view);
  assert.equal(nearestHotspot({ x: landmark.position[0], y: landmark.position[1], z: landmark.position[2] }, hotspots)?.id,
    index === 0 ? 'handle' : 'pin');
}
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

const content = readFileSync(new URL('../docs/content-and-assets.md', import.meta.url), 'utf8');
for (const h of hotspots) {
  assert.ok(h.pinPosition.length === 3 && h.pinPosition.every(Number.isFinite), `${h.id}: surface anchor`);
  const row = content.split(/\r?\n/).find((line) => line.startsWith(`| \`${h.id}\` |`));
  const cells = row.split('|');
  for (const [lang, cell] of [['en', cells[2]], ['id', cells[3]]]) {
    const [, title, bodyText] = cell.trim().match(/^\*\*(.+?)\*\* — (.+)$/);
    assert.equal(h.title[lang], title, `${h.id} ${lang} title must match source`);
    assert.equal(h.body[lang], bodyText, `${h.id} ${lang} body must match source`);
  }
}

const camera = new PerspectiveCamera(45, 1, 0.1, 100);
camera.position.set(0, 0, 5);
camera.lookAt(0, 0, 0);
camera.updateMatrixWorld();
const cube = new Mesh(new BoxGeometry(2, 2, 2), new MeshBasicMaterial());
cube.updateMatrixWorld();
assert.deepEqual(projectPin(new Vector3(0, 0, 1), camera, [cube], 360, 360), { x: 180, y: 180 });
assert.equal(projectPin(new Vector3(0, 0, -1), camera, [cube], 360, 360), null, 'back anchor is occluded');
assert.equal(projectPin(new Vector3(0, 0, 6), camera, [], 360, 360), null, 'behind camera');
assert.equal(projectPin(new Vector3(20, 0, 0), camera, [], 360, 360), null, 'outside viewport');
assert.equal(projectPin(new Vector3(0, 0, 0.998), camera, [cube], 360, 360)?.x, 180, 'surface tolerance');
cube.position.set(1, 0, 0);
cube.scale.setScalar(2);
cube.updateMatrixWorld();
assert.ok(projectPin(cube.localToWorld(new Vector3(0, 0, 1)), camera, [cube], 360, 360), 'transformed anchor');

for (const width of [360, 390, 1365]) {
  const occupied = [];
  for (let i = 0; i < 6; i++) {
    const anchor = { x: width / 2 + i, y: 140 + i };
    const point = placePin(anchor, occupied, width, 360);
    assert.deepEqual(point, placePin(anchor, occupied, width, 360), 'layout is deterministic');
    assert.ok(point && point.x >= 26 && point.x <= width - 26 && point.y >= 26 && point.y <= 334);
    assert.ok(occupied.every((q) => Math.abs(point.x - q.x) >= 48 || Math.abs(point.y - q.y) >= 48));
    occupied.push(point);
  }
  assert.ok(placePin({ x: 0, y: 0 }, [], width, 360), 'edge anchors fit inside canvas');
}

const originalGlobals = Object.fromEntries(
  ['performance', 'requestAnimationFrame', 'cancelAnimationFrame', 'matchMedia'].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
);
let time = 0;
let reduced = false;
let frameId = 0;
const frames = new Map();
Object.defineProperty(globalThis, 'performance', { configurable: true, value: { now: () => time } });
globalThis.requestAnimationFrame = (fn) => { frames.set(++frameId, fn); return frameId; };
globalThis.cancelAnimationFrame = (id) => frames.delete(id);
globalThis.matchMedia = () => ({ matches: reduced });
function advance(ms) {
  time += ms;
  const callbacks = [...frames.values()];
  frames.clear();
  callbacks.forEach((fn) => fn(time));
}
try {
  const controls = { target: new Vector3(), update() {} };
  const tweenCamera = { position: new Vector3() };
  const tween = initCameraTween(tweenCamera, controls, () => {});
  const view = { position: [2, 4, 6], target: [1, 2, 3] };
  let completed = 0;
  tween.moveTo(view, { onComplete: () => completed++ });
  advance(350);
  assert.deepEqual(tweenCamera.position.toArray(), [1, 2, 3]);
  assert.deepEqual(controls.target.toArray(), [0.5, 1, 1.5]);
  advance(350);
  assert.deepEqual(tweenCamera.position.toArray(), view.position);
  assert.equal(completed, 1);
  assert.equal(frames.size, 0);
  tween.moveTo({ position: [9, 9, 9], target: [0, 0, 0] }, { onComplete: () => completed++ });
  advance(100);
  const stopped = tweenCamera.position.clone();
  tween.cancel();
  advance(1000);
  assert.ok(tweenCamera.position.equals(stopped));
  assert.equal(completed, 1, 'cancel must not invoke completion');
  tween.moveTo(view, { onComplete: () => completed++ });
  tween.moveTo({ position: [8, 8, 8], target: [0, 0, 0] });
  advance(700);
  assert.deepEqual(tweenCamera.position.toArray(), [8, 8, 8]);
  assert.equal(completed, 1, 'superseded tween must not complete');
  reduced = true;
  tween.moveTo(view, { onComplete: () => completed++ });
  assert.deepEqual(tweenCamera.position.toArray(), view.position);
  assert.equal(frames.size, 0, 'reduced motion must not schedule animation');
  reduced = false;
  tween.moveTo({ position: [0, 0, 0], target: [0, 0, 0] }, { immediate: true });
  assert.deepEqual(tweenCamera.position.toArray(), [0, 0, 0]);
  assert.equal(frames.size, 0);
} finally {
  for (const [key, descriptor] of Object.entries(originalGlobals)) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else delete globalThis[key];
  }
  cube.geometry.dispose();
  cube.material.dispose();
}

assert.deepEqual(product.options.color.map((color) => color.id), ['red', 'yellow', 'silver']);
for (const option of product.options.color) {
  assert.match(option.hex, /^#[\da-f]{6}$/i);
  for (const lang of ['en', 'id']) assert.equal(option.label[lang], load(lang)[`config.color.${option.id}`]);
}
const paintedModel = new Group();
paintedModel.scale.setScalar(2);
paintedModel.position.set(1, 1, -1);
const labelWrites = [];
const savedDocument = globalThis.document;
globalThis.document = { createElement: () => ({ getContext: () => ({ fillRect() {}, fillText: (...args) => labelWrites.push(args) }) }) };
const config = { agentId: 'powder_abc', capacityId: '6kg', colorId: 'red', bracketEnabled: false };
const labels = { agent: 'Dry Powder ABC', capacity: '6 kg' };
const paint = new MeshStandardMaterial();
paint.name = product.bodyMaterialName;
paint.map = new Texture();
paint.normalMap = new Texture();
paint.roughnessMap = new Texture();
paint.metalnessMap = new Texture();
const maps = [paint.map, paint.normalMap, paint.roughnessMap, paint.metalnessMap];
const originalCompile = paint.onBeforeCompile;
const originalCacheKey = paint.customProgramCacheKey;
const untouched = new MeshStandardMaterial({ color: 0xabcdef });
const otherCompile = untouched.onBeforeCompile;
paintedModel.add(new Mesh(new BoxGeometry(), paint), new Mesh(new BoxGeometry(), untouched));
let renderRequests = 0;
const appearance = initAppearance(product, () => renderRequests++);
assert.ok(appearance.setModel(paintedModel));
const shader = { uniforms: {}, vertexShader: ShaderLib.standard.vertexShader, fragmentShader: ShaderLib.standard.fragmentShader };
paint.onBeforeCompile(shader);
assert.ok(shader.vertexShader.includes('vAparHeight = position.y;'));
assert.ok(shader.fragmentShader.includes('sampledDiffuseColor'));
assert.equal(shader.uniforms.aparRecolor.value, 0, 'default red bypasses recoloring');
assert.ok(shader.fragmentShader.includes('texture2D(aparLabel, agentUv)'));
const labelTexture = shader.uniforms.aparLabel.value;
assert.equal(labelTexture.image.width, 512);
assert.equal(labelTexture.image.height, 128);
const bracket = paintedModel.getObjectByName('configurator-bracket');
assert.equal(bracket.visible, false);
for (const option of product.options.color) {
  appearance.apply({ ...config, colorId: option.id, bracketEnabled: true }, labels);
  assert.equal(shader.uniforms.aparTint.value.getHexString(), option.hex.slice(1).toLowerCase());
  assert.equal(shader.uniforms.aparRecolor.value, option.id === 'red' ? 0 : 1);
  assert.equal(bracket.visible, true);
}
assert.equal(paint.color.getHex(), 0xffffff, 'global multiplier stays neutral');
assert.deepEqual([paint.map, paint.normalMap, paint.roughnessMap, paint.metalnessMap], maps);
assert.equal(untouched.onBeforeCompile, otherCompile);
assert.equal(untouched.color.getHex(), 0xabcdef);
assert.equal(labelWrites.length, 4, 'color and bracket changes reuse the existing label');
appearance.apply({ ...config, colorId: 'silver' }, labels);
assert.equal(bracket.visible, false);
assert.equal(renderRequests, 4);
appearance.apply({ ...config, colorId: 'unknown' }, labels);
assert.equal(renderRequests, 4, 'unknown product option is ignored');
for (let cycle = 0; cycle < 3; cycle++) {
  for (const capacity of product.options.capacity) {
    appearance.apply({ ...config, capacityId: capacity.id }, { ...labels, capacity: `${capacity.kg} kg` });
    assert.ok(Math.abs(paintedModel.scale.x - 2 * capacity.scale) < 1e-10, 'scale is always relative to baseline');
    assert.ok(paintedModel.position.distanceTo(new Vector3(1, 1, -1).multiplyScalar(capacity.scale)) < 1e-10);
    assert.ok(Math.abs(new Box3().setFromObject(paintedModel).min.y) < 1e-10, 'unit stays on floor');
  }
}
appearance.apply(config, { agent: 'Serbuk Kimia ABC', capacity: '6 kg' });
assert.ok(labelWrites.some(([text]) => text === 'Serbuk Kimia ABC'), 'language updates the 3D label');
let disposedLabel = 0;
labelTexture.addEventListener('dispose', () => disposedLabel++);
for (const mesh of bracket.children) {
  assert.equal(mesh.userData.configuratorAccessory, true);
  const hits = [];
  mesh.raycast(new Raycaster(), hits);
  assert.equal(hits.length, 0, 'accessories cannot intercept hotspot picking');
}
let disposedGeometry = 0;
let disposedMaterial = 0;
bracket.children.forEach((mesh) => mesh.geometry.addEventListener('dispose', () => disposedGeometry++));
bracket.children[0].material.addEventListener('dispose', () => disposedMaterial++);
assert.ok(appearance.setModel(paintedModel));
assert.equal(disposedGeometry, 3);
assert.equal(disposedMaterial, 1);
assert.equal(disposedLabel, 1);
assert.equal(paintedModel.scale.x, 2, 'reattaching the same model restores its baseline');
assert.equal(bracket.parent, null);
assert.equal(paintedModel.children.filter((object) => object.name === 'configurator-bracket').length, 1);
assert.equal(appearance.setModel(new Group()), false, 'missing body material does not prevent bracket use');
assert.equal(paint.onBeforeCompile, originalCompile);
assert.equal(paint.customProgramCacheKey, originalCacheKey);
const fallback = new Group();
assert.equal(appearance.setModel(fallback), false);
appearance.apply({ ...config, colorId: 'yellow', capacityId: '1kg', bracketEnabled: true }, labels);
assert.equal(fallback.scale.x, 0.65, 'capacity works without a body material');
assert.equal(fallback.getObjectByName('configurator-bracket').visible, true);
assert.equal(appearance.setModel(null), false);
if (savedDocument) globalThis.document = savedDocument;
else delete globalThis.document;
maps.forEach((map) => map.dispose());
paintedModel.children.forEach((mesh) => mesh.geometry.dispose());
paint.dispose();
untouched.dispose();

console.log(`self-check ok: ${Object.keys(en).length} i18n keys, router, sheet, ${hotspots.length} hotspots, K3 copy, occlusion, pin layout, camera tween, selective paint, bracket lifecycle`);
