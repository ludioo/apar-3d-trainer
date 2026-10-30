import assert from 'node:assert/strict';
import { Box3, PerspectiveCamera, Vector3 } from 'three';
import { overviewView } from '../src/features/configurator/overview-view.js';
import product from '../src/data/product.json' with { type: 'json' };

const bounds = new Box3(new Vector3(-0.255, 0, -0.335), new Vector3(0.255, 1.2, 0.335));
const maxScale = Math.max(...product.options.capacity.map((capacity) => capacity.scale));
function project(box, camera, viewport) {
  const points = [];
  for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) {
    for (const z of [box.min.z, box.max.z]) {
      const point = new Vector3(x, y, z).project(camera);
      points.push({ x: (1 + point.x) * viewport.width / 2, y: (1 - point.y) * viewport.height / 2 });
    }
  }
  return points;
}
for (const [width, height, top, right] of [[1280, 900, 134, 888], [390, 216, 16, 374],
  [1024, 900, 134, 632], [390, 16, 4, 386]]) {
  const viewport = { width, height };
  const available = { left: Math.min(16, height / 4), top, right, bottom: height - Math.min(16, height / 4) };
  const camera = new PerspectiveCamera(45, width / height, 0.1, 100);
  const view = overviewView(bounds, camera, viewport, available, new Vector3(2.5, 1.2, 3.5), maxScale);
  assert.ok(view && [...view.target, ...view.position].every(Number.isFinite));
  camera.position.fromArray(view.position);
  camera.lookAt(new Vector3(...view.target));
  camera.updateMatrixWorld();
  for (const capacity of product.options.capacity) {
    const box = bounds.clone();
    box.min.multiplyScalar(capacity.scale); box.max.multiplyScalar(capacity.scale);
    const points = project(box, camera, viewport);
    for (const point of points) {
      assert.ok(point.x >= available.left - 1e-6 && point.x <= available.right + 1e-6, 'capacity fits horizontally');
      assert.ok(point.y >= available.top - 1e-6 && point.y <= available.bottom + 1e-6, 'capacity fits vertically');
    }
  }
  const points = project(bounds, camera, viewport);
  const ratio = (Math.max(...points.map((point) => point.y)) - Math.min(...points.map((point) => point.y))) /
    (available.bottom - available.top);
  if (width === 1280 || height === 216) assert.ok(ratio >= 0.6 && ratio <= 0.75, 'default readable framing');
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
    const direction = new Vector3(Math.sin(angle), 0.28, Math.cos(angle));
    assert.ok(overviewView(bounds, camera, viewport, available, direction, maxScale), 'idle angle remains fit-able');
  }
}
const camera = new PerspectiveCamera();
for (const viewport of [{ width: 0, height: 216 }, { width: 390, height: 0 }]) {
  assert.equal(overviewView(bounds, camera, viewport, { left: 0, right: 390, top: 0, bottom: 216 },
    new Vector3(0, 0, 1), maxScale), null, 'wait for a nonzero viewport');
}
assert.equal(overviewView(new Box3(), camera, { width: 390, height: 216 },
  { left: 0, right: 390, top: 0, bottom: 216 }, new Vector3(0, 0, 1), maxScale), null);
console.log('Overview: projected bounds, capacity sizes, idle directions, narrow/short viewports and zero-size safety passed.');
