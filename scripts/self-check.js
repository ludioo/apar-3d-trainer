import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseHash } from '../src/core/router.js';
import { nearestSnap } from '../src/ui/sheet.js';
import { nearestHotspot } from '../src/core/picking.js';
import hotspots from '../src/data/hotspots.json' with { type: 'json' };
import { BoxGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera, Vector3 } from 'three';
import { projectPin, placePin } from '../src/ui/hotspot-pins.js';
import { initCameraTween } from '../src/core/cameraTween.js';

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

console.log(`self-check ok: ${Object.keys(en).length} i18n keys, router, sheet, ${hotspots.length} hotspots, K3 copy, occlusion, pin layout, camera tween`);
