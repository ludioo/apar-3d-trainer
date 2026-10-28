import { Vector3 } from 'three';

export function initCameraTween(camera, controls, requestRender) {
  let raf = 0;
  const cancel = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };

  function moveTo(view, { immediate = false, onComplete } = {}) {
    cancel();
    const fromPosition = camera.position.clone();
    const fromTarget = controls.target.clone();
    const toPosition = new Vector3(...view.position);
    const toTarget = new Vector3(...view.target);
    const duration = immediate || matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 700;
    const start = performance.now();

    function tick(now) {
      raf = 0;
      const t = duration && !matchMedia('(prefers-reduced-motion: reduce)').matches
        ? Math.min(1, (now - start) / duration) : 1;
      const eased = t * t * (3 - 2 * t);
      camera.position.lerpVectors(fromPosition, toPosition, eased);
      controls.target.lerpVectors(fromTarget, toTarget, eased);
      controls.update();
      requestRender();
      if (t < 1) raf = requestAnimationFrame(tick);
      else onComplete?.();
    }

    if (duration) raf = requestAnimationFrame(tick);
    else tick(start);
  }

  return { moveTo, cancel };
}
