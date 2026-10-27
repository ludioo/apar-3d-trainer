import { Vector3 } from 'three';
import { on } from '../core/events.js';
import { projectPin, placePin } from './hotspot-pins.js';

export function initTrainingTarget({ container, camera, controls, panelBody }) {
  const layer = document.createElement('div');
  layer.className = 'training-target';
  layer.hidden = true;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'training-target__button';
  const number = document.createElement('span');
  button.appendChild(number);
  const pin = document.createElement('div');
  pin.className = 'training-target__pin';
  pin.setAttribute('aria-hidden', 'true');
  // A drawn overlay illustrates removal; the GLB pin remains part of the original mesh.
  pin.innerHTML = '<svg viewBox="0 0 80 40"><circle cx="18" cy="20" r="12"/><path d="M30 20H68V28"/></svg>';
  layer.append(button, pin);
  container.appendChild(layer);
  let model = null;
  let meshes = [];
  let hotspot = null;
  let showPin = false;
  let active = false;
  let raf = 0;
  let offResize;
  const observer = new ResizeObserver(() => refresh());

  function update() {
    raf = 0;
    if (!active || !model || !hotspot) { button.hidden = true; pin.hidden = true; return; }
    camera.updateMatrixWorld();
    model.updateWorldMatrix(true, true);
    const rect = container.getBoundingClientRect();
    const panel = panelBody.closest('.panel').getBoundingClientRect();
    const world = model.localToWorld(new Vector3(...hotspot.pinPosition));
    const anchor = projectPin(world, camera, meshes, rect.width, rect.height);
    const desktop = matchMedia('(min-width: 1024px)').matches;
    const width = desktop ? Math.min(rect.width, panel.left - rect.left - 8) : rect.width;
    const height = desktop ? rect.height : Math.min(rect.height, panel.top - rect.top - 8);
    const point = anchor && placePin(anchor, [], width, height);
    button.hidden = !point;
    pin.hidden = !point || !showPin;
    if (!point) return;
    button.style.left = `${point.x}px`;
    button.style.top = `${point.y}px`;
    pin.style.left = `${point.x}px`;
    pin.style.top = `${point.y}px`;
  }
  function refresh() {
    if (active && !raf) raf = requestAnimationFrame(update);
  }
  function setModel(next) {
    model = next;
    meshes = [];
    model?.traverse((o) => {
      if (o.isMesh && !o.userData.debugMarker && !o.userData.configuratorAccessory) meshes.push(o);
    });
    refresh();
  }
  function setStep(next, index, label, done, pulled) {
    hotspot = next;
    number.textContent = String(index + 1);
    button.setAttribute('aria-label', label);
    button.setAttribute('aria-disabled', String(done || next?.interaction === 'drag'));
    button.dataset.complete = String(done);
    button.dataset.interaction = next?.interaction ?? '';
    showPin = pulled;
    button.hidden = !next;
    pin.hidden = !next || !pulled;
    refresh();
  }
  function enter() {
    active = true;
    layer.hidden = false;
    controls.addEventListener('change', refresh);
    offResize = on('scene:resize', refresh);
    observer.observe(panelBody.closest('.panel'));
    refresh();
  }
  function exit() {
    active = false;
    layer.hidden = true;
    controls.removeEventListener('change', refresh);
    offResize?.();
    observer.disconnect();
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }
  return { button, enter, exit, setModel, setStep, refresh,
    progress(value) { button.style.setProperty('--hold-progress', `${value * 360}deg`); } };
}
