import { Mesh, MeshBasicMaterial, SphereGeometry, Vector3 } from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { on } from './events.js';

export function initDebug({ scene, renderer, camera, controls, requestRender, hotspots }) {
  const stats = new Stats();
  stats.dom.id = 'debug-stats';
  stats.dom.className = 'debug-stats';
  stats.dom.style.cssText = '';
  stats.dom.setAttribute('aria-hidden', 'true');
  stats.dom.style.pointerEvents = 'none';
  document.body.appendChild(stats.dom);
  scene.onBeforeRender = () => stats.begin();
  scene.onAfterRender = () => stats.end();

  const hud = document.createElement('div');
  hud.id = 'debug-hud';
  hud.className = 'debug-hud';
  hud.textContent = 'Click model for local coords';
  document.body.appendChild(hud);
  on('hotspot:pick', ({ hotspot, local, distance }) => {
    if (!local) {
      hud.textContent = 'miss (no hit)';
      console.log('[debug] miss');
      return;
    }
    const p = `${local.x.toFixed(3)}, ${local.y.toFixed(3)}, ${local.z.toFixed(3)}`;
    const near = hotspot ? `${hotspot.id} d=${distance.toFixed(3)} r=${hotspot.radius}` : 'none';
    hud.textContent = `local [${p}]\nnearest: ${near}`;
    console.log('[debug]', { local: [local.x, local.y, local.z], hotspot: hotspot?.id ?? null, distance });
  });

  function setModel(model) {
    const geometry = new SphereGeometry(0.012, 12, 12);
    const material = new MeshBasicMaterial({ color: 0xffc629, depthTest: false });
    for (const hotspot of hotspots) {
      const marker = new Mesh(geometry, material);
      marker.renderOrder = 998;
      marker.position.fromArray(hotspot.position);
      marker.userData.debugMarker = true;
      marker.raycast = () => {};
      model.add(marker);
    }
    window.__aparDebug = { scene, renderer, camera, model, hotspots, Vector3, controls, requestRender };
  }
  return { setModel };
}
