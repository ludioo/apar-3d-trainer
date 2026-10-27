import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const IDLE_MS = 5000;
const AUTO_ROTATE_SPEED = 0.6;

export function initControls(camera, domElement, onChange) {
  const controls = new OrbitControls(camera, domElement);
  controls.enableDamping = false;
  controls.enablePan = false;
  controls.minDistance = 1.5;
  controls.maxDistance = 8;
  controls.minPolarAngle = 0.1;
  controls.maxPolarAngle = Math.PI / 2 - 0.05;
  controls.autoRotate = false;
  controls.autoRotateSpeed = AUTO_ROTATE_SPEED;

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let idleTimer = 0;
  let rotateRaf = 0;

  function stopRotate() {
    controls.autoRotate = false;
    if (rotateRaf) {
      cancelAnimationFrame(rotateRaf);
      rotateRaf = 0;
    }
  }

  function rotateTick() {
    if (!controls.autoRotate) {
      rotateRaf = 0;
      return;
    }
    controls.update();
    rotateRaf = requestAnimationFrame(rotateTick);
  }

  function startRotate() {
    if (reduceMotion || controls.autoRotate) return;
    controls.autoRotate = true;
    if (!rotateRaf) rotateRaf = requestAnimationFrame(rotateTick);
  }

  function clearIdle() {
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = 0;
    }
  }

  function armIdle() {
    clearIdle();
    if (reduceMotion) return;
    idleTimer = setTimeout(startRotate, IDLE_MS);
  }

  controls.addEventListener('change', onChange);
  controls.addEventListener('start', () => {
    clearIdle();
    stopRotate();
  });
  controls.addEventListener('end', armIdle);

  armIdle();
  return controls;
}
