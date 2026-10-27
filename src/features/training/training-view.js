import { Box3, Vector3 } from 'three';

export function trainingView(model, fireBase, camera, viewport, available) {
  const box = new Box3().setFromObject(model);
  box.expandByPoint(fireBase.clone().add(new Vector3(-0.3, 0, -0.1)));
  box.expandByPoint(fireBase.clone().add(new Vector3(0.3, 0.5, 0.1)));
  const center = box.getCenter(new Vector3());
  const direction = new Vector3(0.35, 0.3, 1).normalize();
  const right = new Vector3().crossVectors(camera.up, direction).normalize();
  const up = new Vector3().crossVectors(direction, right);
  const tanY = Math.tan(camera.fov * Math.PI / 360);
  const tanX = tanY * camera.aspect;
  const width = Math.max(1, available.width);
  const height = Math.max(1, available.height);
  const ratioX = width / viewport.width;
  const ratioY = height / viewport.height;
  let distance = 0;
  for (const x of [box.min.x, box.max.x]) {
    for (const y of [box.min.y, box.max.y]) {
      for (const z of [box.min.z, box.max.z]) {
        const corner = new Vector3(x, y, z).sub(center);
        distance = Math.max(distance, corner.dot(direction) + Math.max(
          Math.abs(corner.dot(right)) / (tanX * ratioX * 0.82),
          Math.abs(corner.dot(up)) / (tanY * ratioY * 0.82)));
      }
    }
  }
  distance = Math.max(1.5, distance);
  // Offset the framing toward the usable area beside/above the existing panel.
  center.addScaledVector(right, (1 - ratioX) * distance * tanX);
  center.addScaledVector(up, -(1 - ratioY) * distance * tanY);
  return { target: center.toArray(), position: center.clone().addScaledVector(direction, distance).toArray() };
}
