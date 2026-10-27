import { Mesh, MeshBasicMaterial, RingGeometry } from 'three';

const ACCENT = 0xffc629;
const PULSE_MIN = 1;
const PULSE_MAX = 1.25;
const PULSE_HZ = 1.2;

export function initHighlight(scene, camera, requestRender) {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ring = new Mesh(
    new RingGeometry(0.035, 0.05, 32),
    new MeshBasicMaterial({
      color: ACCENT,
      transparent: true,
      opacity: 0.9,
      depthTest: false,
      depthWrite: false,
    }),
  );
  ring.renderOrder = 999;
  ring.visible = false;
  scene.add(ring);

  let raf = 0;
  let t0 = 0;

  function tick(now) {
    if (!ring.visible) {
      raf = 0;
      return;
    }
    ring.lookAt(camera.position);
    if (!reduceMotion) {
      const t = ((now - t0) / 1000) * PULSE_HZ * Math.PI * 2;
      const s = PULSE_MIN + (PULSE_MAX - PULSE_MIN) * (0.5 + 0.5 * Math.sin(t));
      ring.scale.setScalar(s);
    }
    requestRender();
    raf = requestAnimationFrame(tick);
  }

  function startLoop() {
    if (raf) return;
    t0 = performance.now();
    raf = requestAnimationFrame(tick);
  }

  function show(worldPos) {
    ring.position.copy(worldPos);
    ring.scale.setScalar(1);
    ring.visible = true;
    ring.lookAt(camera.position);
    if (!reduceMotion) startLoop();
    requestRender();
  }

  function clear() {
    ring.visible = false;
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    requestRender();
  }

  function update() {
    if (!ring.visible) return;
    ring.lookAt(camera.position);
  }

  return { show, clear, update, ring };
}
