import { Vector3 } from 'three';

export function overviewView(bounds, camera, viewport, available, direction, maxScale) {
  if (bounds.isEmpty() || viewport.width <= 0 || viewport.height <= 0 ||
      available.right <= available.left || available.bottom <= available.top) return null;
  const center = bounds.getCenter(new Vector3());
  const forward = direction.clone().normalize();
  const right = new Vector3().crossVectors(camera.up, forward).normalize();
  const up = new Vector3().crossVectors(forward, right);
  const tanY = Math.tan(camera.fov * Math.PI / 360);
  const tanX = tanY * viewport.width / viewport.height;
  const corners = (box) => {
    const points = [];
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) {
      for (const z of [box.min.z, box.max.z]) {
        const point = new Vector3(x, y, z).sub(center);
        points.push([point.dot(right), point.dot(up), point.dot(forward)]);
      }
    }
    return points;
  };
  const base = corners(bounds);
  const safe = bounds.clone();
  safe.min.multiplyScalar(maxScale);
  safe.max.multiplyScalar(maxScale);
  // Reserve the largest capacity at every idle-rotation angle around the cylinder.
  const radius = Math.hypot(Math.max(Math.abs(safe.min.x), Math.abs(safe.max.x)),
    Math.max(Math.abs(safe.min.z), Math.abs(safe.max.z)));
  safe.min.x = safe.min.z = -radius;
  safe.max.x = safe.max.z = radius;
  const envelope = corners(safe);
  const project = ([x, y, z], distance) => [
    (1 + x / ((distance - z) * tanX)) * viewport.width / 2,
    (1 - y / ((distance - z) * tanY)) * viewport.height / 2,
  ];
  const fits = (distance) => {
    if (envelope.some((point) => distance - point[2] <= camera.near)) return false;
    const ys = base.map((point) => project(point, distance)[1]);
    if (Math.max(...ys) - Math.min(...ys) > (available.bottom - available.top) * 0.7) return false;
    return envelope.every((point) => {
      const [x, y] = project(point, distance);
      return x >= available.left && x <= available.right && y >= available.top && y <= available.bottom;
    });
  };
  let low = 1.5;
  let high = 2;
  while (high < camera.far / 2 && !fits(high)) high *= 2;
  if (!fits(high)) return null;
  for (let i = 0; i < 36; i++) {
    const middle = (low + high) / 2;
    if (fits(middle)) high = middle; else low = middle;
  }
  return { target: center.toArray(), position: center.clone().addScaledVector(forward, high).toArray() };
}
