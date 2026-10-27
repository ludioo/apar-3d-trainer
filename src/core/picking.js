import { Raycaster, Vector2, Vector3 } from 'three';

const _raycaster = new Raycaster();
const _ndc = new Vector2();
const _local = new Vector3();

export function nearestHotspot(point, hotspots) {
  let best = null;
  let bestDist = Infinity;
  for (const h of hotspots) {
    const [x, y, z] = h.position;
    const dx = point.x - x;
    const dy = point.y - y;
    const dz = point.z - z;
    const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (d <= h.radius && d < bestDist) {
      best = h;
      bestDist = d;
    }
  }
  return best;
}

export function pickFromNdc(ndcX, ndcY, camera, model, hotspots) {
  _ndc.set(ndcX, ndcY);
  _raycaster.setFromCamera(_ndc, camera);
  const hits = _raycaster.intersectObject(model, true);
  if (!hits.length) return { hotspot: null, local: null, distance: null };
  _local.copy(hits[0].point);
  model.worldToLocal(_local);
  const hotspot = nearestHotspot(_local, hotspots);
  let distance = null;
  if (hotspot) {
    const [x, y, z] = hotspot.position;
    distance = Math.hypot(_local.x - x, _local.y - y, _local.z - z);
  }
  return { hotspot, local: _local.clone(), distance };
}
