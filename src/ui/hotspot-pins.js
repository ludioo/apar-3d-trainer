import { Raycaster, Vector3 } from 'three';
import { on } from '../core/events.js';

const HIT_SIZE = 44;
const SPACING = 48;
const MARGIN = HIT_SIZE / 2 + 4;
const SURFACE_EPSILON = 0.005;
const ray = new Raycaster();
const direction = new Vector3();

export function projectPin(world, camera, meshes, width, height) {
  const ndc = world.clone().project(camera);
  if (ndc.z < -1 || ndc.z > 1 || Math.abs(ndc.x) > 1 || Math.abs(ndc.y) > 1) return null;
  const distance = camera.position.distanceTo(world);
  direction.copy(world).sub(camera.position).normalize();
  ray.set(camera.position, direction);
  ray.far = Math.max(0, distance - SURFACE_EPSILON);
  if (ray.intersectObjects(meshes, false).length) return null;
  return { x: (ndc.x + 1) * width / 2, y: (1 - ndc.y) * height / 2 };
}

export function placePin(anchor, occupied, width, height) {
  const x = Math.max(MARGIN, Math.min(width - MARGIN, anchor.x));
  const y = Math.max(MARGIN, Math.min(height - MARGIN, anchor.y));
  const candidates = [];
  // shortcut: six pins use a small greedy search; use a label layout solver if the catalog grows.
  for (let row = -6; row <= 6; row++) {
    for (let col = -6; col <= 6; col++) {
      candidates.push({ x: x + col * SPACING, y: y + row * SPACING, distance: row * row + col * col });
    }
  }
  candidates.sort((a, b) => a.distance - b.distance);
  return candidates.find((p) =>
    p.x >= MARGIN && p.x <= width - MARGIN && p.y >= MARGIN && p.y <= height - MARGIN &&
    occupied.every((q) => Math.abs(p.x - q.x) >= SPACING || Math.abs(p.y - q.y) >= SPACING),
  ) ?? null;
}

export function initHotspotPins({ container, camera, controls, hotspots, open }) {
  const layer = document.createElement('div');
  layer.className = 'hotspot-pins';
  layer.hidden = true;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('hotspot-pins__lines');
  svg.setAttribute('aria-hidden', 'true');
  layer.appendChild(svg);
  const pins = hotspots.map((h, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'hotspot-pin';
    button.dataset.hotspot = h.id;
    button.hidden = true;
    const number = document.createElement('span');
    number.textContent = index + 1;
    button.appendChild(number);
    button.addEventListener('click', () => open(h, button));
    const line = document.createElementNS(svg.namespaceURI, 'line');
    line.style.display = 'none';
    svg.appendChild(line);
    layer.appendChild(button);
    return { h, button, line };
  });
  container.appendChild(layer);
  let model = null;
  let meshes = [];
  let active = false;
  let raf = 0;
  let offResize;

  function update() {
    raf = 0;
    if (!active || !model) return;
    camera.updateMatrixWorld();
    model.updateWorldMatrix(true, true);
    const { width, height } = container.getBoundingClientRect();
    const occupied = [];
    for (const { h, button, line } of pins) {
      const world = model.localToWorld(new Vector3(...h.pinPosition));
      const anchor = projectPin(world, camera, meshes, width, height);
      const point = anchor && placePin(anchor, occupied, width, height);
      button.hidden = !point;
      line.style.display = point ? '' : 'none';
      if (!point) continue;
      occupied.push(point);
      button.style.transform = `translate(${point.x - HIT_SIZE / 2}px, ${point.y - HIT_SIZE / 2}px)`;
      line.setAttribute('x1', anchor.x);
      line.setAttribute('y1', anchor.y);
      line.setAttribute('x2', point.x);
      line.setAttribute('y2', point.y);
    }
  }

  function schedule() {
    if (active && model && !raf) raf = requestAnimationFrame(update);
  }

  function setModel(next) {
    model = next;
    meshes = [];
    model.traverse((object) => {
      if (object.isMesh && !object.userData.debugMarker && !object.userData.configuratorAccessory) meshes.push(object);
    });
    schedule();
  }

  function enter() {
    active = true;
    layer.hidden = false;
    controls.addEventListener('change', schedule);
    offResize = on('scene:resize', schedule);
    schedule();
  }

  function exit() {
    active = false;
    layer.hidden = true;
    controls.removeEventListener('change', schedule);
    offResize?.();
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function syncText(lang, selected) {
    for (const { h, button } of pins) {
      button.setAttribute('aria-label', h.title[lang]);
      button.setAttribute('aria-pressed', String(h.id === selected?.id));
    }
  }

  return { enter, exit, setModel, syncText, refresh: schedule };
}
