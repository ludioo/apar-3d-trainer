import assert from 'node:assert/strict';
import { Box3, BoxGeometry, Group, Mesh, MeshBasicMaterial, PerspectiveCamera, Scene, Vector3 } from 'three';
import { initEffects, fireLevel, FIRE_PARTICLES, SPRAY_PARTICLES, SPRAY_IDLE_MS } from '../src/features/training/effects.js';
import { trainingView } from '../src/features/training/training-view.js';
import { createTrainingSession, createSweep } from '../src/features/training/training-state.js';
import hotspots from '../src/data/hotspots.json' with { type: 'json' };

const globals = ['document', 'getComputedStyle', 'matchMedia', 'performance', 'requestAnimationFrame',
  'cancelAnimationFrame', 'setTimeout', 'clearTimeout'];
const saved = new Map(globals.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
let now = 0;
let nextId = 0;
const frames = new Map();
const timers = new Map();
const motion = { matches: false, addEventListener(_, fn) { this.change = fn; }, removeEventListener() {} };
const context = { createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), beginPath() {}, moveTo() {}, bezierCurveTo() {}, fill() {}, fillRect() {} };
const mocks = {
  document: { documentElement: {}, createElement: () => ({ getContext: () => context }) },
  getComputedStyle: () => ({ getPropertyValue: () => '#ffc629' }), matchMedia: () => motion,
  performance: { now: () => now }, requestAnimationFrame: (fn) => { frames.set(++nextId, fn); return nextId; },
  cancelAnimationFrame: (id) => frames.delete(id),
  setTimeout: (fn, delay) => { timers.set(++nextId, { fn, delay }); return nextId; }, clearTimeout: (id) => timers.delete(id),
};
for (const key of globals) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: mocks[key] });
function frame(at) {
  now = at;
  const callbacks = [...frames.values()];
  frames.clear();
  callbacks.forEach((fn) => fn(now));
}
try {
  const session = createTrainingSession(4);
  const sweep = createSweep();
  const scene = new Scene();
  const effects = initEffects({ scene, requestRender() {} });
  const root = scene.getObjectByName('training-effects');
  const fire = scene.getObjectByName('training-fire');
  const spray = scene.getObjectByName('training-spray');
  const model = new Group();
  model.position.set(0.2, 0.1, -0.3);
  model.scale.setScalar(1.7);
  effects.setModel(model);
  const nozzle = new Vector3(...hotspots.find((h) => h.id === 'nozzle').pinPosition);
  assert.deepEqual(effects.nozzle.toArray(), model.localToWorld(nozzle).toArray());
  assert.equal(fire.geometry.attributes.position.count, FIRE_PARTICLES);
  assert.equal(spray.geometry.attributes.position.count, SPRAY_PARTICLES);
  session.start();
  effects.sync(session, sweep, true);
  assert.equal(fireLevel(session, sweep), 0);
  assert.equal(frames.size, 0);
  session.complete(); session.next();
  assert.equal(fireLevel(session, sweep), 0, 'Aim must be interacted with first');
  session.complete(true);
  effects.sync(session, sweep, true);
  assert.equal(fire.visible, true);
  assert.equal(frames.size, 1, 'one effect loop only');
  effects.setSpray(true);
  assert.equal(spray.visible, true);
  effects.setSpray(false);
  assert.equal(spray.visible, false);
  session.next(); session.complete(); session.next();
  for (const [i, value] of [100, 0, 100, 0, 100, 0].entries()) {
    sweep.update(value);
    effects.sync(session, sweep, true);
    effects.setSpray(i < 5, true);
    const start = now;
    frame(start + 125);
    assert.ok(Math.abs(fire.scale.x - ((1 - i / 6) + fireLevel(session, sweep)) / 2) < 1e-8,
      'flame is halfway to the next level at 125ms');
    frame(start + 250);
    assert.equal(fireLevel(session, sweep), Math.max(0, 1 - (i + 1) / 6));
    assert.equal(fire.scale.x, fireLevel(session, sweep));
    assert.equal(fire.material.size, 0.28 * fireLevel(session, sweep), 'Points sprite size shrinks with flame positions');
    if (i < 5) {
      assert.equal([...timers.values()][0].delay, SPRAY_IDLE_MS);
      [...timers.values()][0].fn();
      assert.equal(spray.visible, false);
    }
  }
  assert.equal(fire.visible, false);
  assert.equal(frames.size, 0, 'extinguished fire stops the loop');
  session.back(); effects.sync(session, sweep, true);
  assert.equal(fire.visible, false, 'Back cannot reignite extinguished fire');
  session.restart(); sweep.reset();
  session.complete(); session.next(); session.complete(); session.next(); session.complete(); session.next();
  effects.sync(session, sweep, true);
  effects.setSpray(true, true);
  effects.pause();
  assert.equal(frames.size, 0);
  assert.equal(timers.size, 0);
  assert.equal(spray.visible, false);
  effects.resume();
  assert.equal(frames.size, 1);
  assert.equal(spray.visible, false, 'resume waits for fresh spray input');
  effects.setModel(model);
  assert.equal(frames.size, 1, 'model replacement cannot duplicate loops');
  session.complete(true); effects.sync(session, sweep, true);
  assert.equal(sweep.count, 0, 'Skip does not fabricate strokes');
  assert.equal(fire.visible, false);
  frame(now + 300);
  assert.equal(frames.size, 0);
  session.restart(); sweep.reset();
  effects.sync(session, sweep, true);
  assert.equal(fire.visible, false);
  session.complete(); session.next(); session.complete();
  motion.matches = true; motion.change();
  effects.sync(session, sweep, true);
  assert.equal(frames.size, 0);
  assert.equal(fire.visible, true);
  effects.setSpray(true, true);
  assert.equal(spray.visible, true);
  assert.equal(frames.size, 0, 'static reduced motion spray has no animation loop');
  const positions = [...fire.geometry.attributes.position.array];
  effects.sync(session, sweep, true);
  assert.deepEqual([...fire.geometry.attributes.position.array], positions);
  effects.sync(session, sweep, false);
  assert.equal(root.visible, false);
  assert.equal(timers.size, 0);
  effects.setModel(null);
  assert.equal(frames.size, 0);
  effects.dispose();
  assert.equal(scene.children.length, 0);

  const mesh = new Mesh(new BoxGeometry(0.45, 1.2, 0.4), new MeshBasicMaterial());
  mesh.position.y = 0.6;
  const base = new Vector3(-0.4, 0.02, 0.8);
  for (const [width, height, freeWidth] of [[1365, 900, 957], [360, 460, 360], [844, 114, 844]]) {
    const camera = new PerspectiveCamera(45, width / height, 0.1, 100);
    const view = trainingView(mesh, base, camera, { width, height }, { width: freeWidth, height });
    camera.position.fromArray(view.position); camera.lookAt(new Vector3(...view.target)); camera.updateMatrixWorld();
    const box = new Box3().setFromObject(mesh);
    for (const point of [box.min, box.max, base, base.clone().add(new Vector3(0, 0.5, 0))]) {
      const p = point.clone().project(camera);
      assert.ok(p.x > -1 && p.x < freeWidth / width * 2 - 1 && Math.abs(p.y) < 1, 'stage fits usable viewport');
    }
    assert.ok(camera.position.distanceTo(new Vector3(...view.target)) <= 8, 'view fits orbit distance limits');
  }
  mesh.geometry.dispose(); mesh.material.dispose();
  console.log('effects-check ok: nozzle transform, particle limits, six strokes, Skip/Back/reset, pause/model/exit, reduced motion, responsive framing');
} finally {
  for (const [key, descriptor] of saved) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else delete globalThis[key];
  }
}
