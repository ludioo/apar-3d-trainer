import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './ui/components.css';
import './ui/hotspots.css';
import { Box3, Mesh, MeshBasicMaterial, SphereGeometry, Vector3 } from 'three';
import { initScene, requestRender } from './core/scene.js';
import { initControls } from './core/controls.js';
import { loadModel } from './core/loader.js';
import { on } from './core/events.js';
import { initLang, getLang, setLang, t } from './i18n/i18n.js';
import { initRouter, closeOverlay } from './core/router.js';
import { openModal, closeModal } from './ui/modal.js';
import { initSheet } from './ui/sheet.js';
import { initHighlight } from './core/highlight.js';
import { initConfigurator } from './features/configurator/configurator.js';
import { initTraining } from './features/training/training.js';
import hotspots from './data/hotspots.json';

const MODEL_HEIGHT = 1.2;
const SLOW_LOAD_MS = 8000;
const DEBUG = new URLSearchParams(location.search).has('debug');

const langToggle = document.querySelector('.lang-toggle');
const langButtons = langToggle.querySelectorAll('[data-lang]');
function syncLangToggle() {
  langToggle.setAttribute('aria-label', t('lang.label'));
  langButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === getLang())));
}
langButtons.forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
on('lang:change', syncLangToggle);
initLang();
syncLangToggle();

const tabs = document.querySelector('.tabs');
const tabLinks = tabs.querySelectorAll('.tab');
const panel = document.getElementById('panel');
const panelTitle = document.getElementById('panel-title');
const sheetHandle = panel.querySelector('.panel__handle');
const about = document.getElementById('about');
let mode;

function syncChrome() {
  tabs.setAttribute('aria-label', t('nav.label'));
  sheetHandle.setAttribute('aria-label', t('sheet.toggle'));
  if (mode) panelTitle.textContent = t(`tabs.${mode}`);
}
on('lang:change', syncChrome);
on('route:change', (route) => {
  mode = route.mode;
  tabLinks.forEach((a) => {
    if (a.hash === `#${mode}`) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  syncChrome();
});
on('about:open', () => openModal(about, closeOverlay));
about.querySelector('.modal__close').addEventListener('click', () => closeModal(about));
initSheet(panel, sheetHandle);
syncChrome();

const root = document.getElementById('canvas-root');
const { scene, camera, renderer } = initScene(root);
const controls = initControls(camera, renderer.domElement, requestRender);
controls.target.set(0, MODEL_HEIGHT / 2, 0);
controls.update();

const highlight = initHighlight(scene, camera, requestRender);
const configurator = initConfigurator({
  camera, controls, canvas: renderer.domElement, container: root,
  panelBody: document.getElementById('panel-body'), highlight, requestRender,
});
const training = initTraining({
  camera, controls, canvas: renderer.domElement, container: root,
  panelBody: document.getElementById('panel-body'), highlight, requestRender,
  setTrainingAppearance: configurator.setTrainingAppearance,
});
initRouter({ configure: configurator, train: training, results: {} });
let model = null;

let debugHud = null;
if (DEBUG) {
  debugHud = document.createElement('div');
  debugHud.id = 'debug-hud';
  debugHud.className = 'debug-hud';
  debugHud.textContent = 'Click model for local coords';
  document.body.appendChild(debugHud);
}

function addDebugMarkers() {
  const geo = new SphereGeometry(0.012, 12, 12);
  const mat = new MeshBasicMaterial({ color: 0xffc629, depthTest: false });
  for (const h of hotspots) {
    const m = new Mesh(geo, mat);
    m.renderOrder = 998;
    m.position.fromArray(h.position);
    m.userData.debugMarker = true;
    m.raycast = () => {};
    model.add(m);
  }
}

on('hotspot:pick', ({ hotspot, local, distance }) => {
  if (DEBUG && debugHud) {
    if (!local) {
      debugHud.textContent = 'miss (no hit)';
      console.log('[debug] miss');
    } else {
      const p = `${local.x.toFixed(3)}, ${local.y.toFixed(3)}, ${local.z.toFixed(3)}`;
      const near = hotspot
        ? `${hotspot.id} d=${distance.toFixed(3)} r=${hotspot.radius}`
        : 'none';
      debugHud.textContent = `local [${p}]\nnearest: ${near}`;
      console.log('[debug]', { local: [local.x, local.y, local.z], hotspot: hotspot?.id ?? null, distance });
    }
  }
});

const splash = document.getElementById('splash');
const fill = splash.querySelector('.splash__fill');
const percent = splash.querySelector('.splash__percent');
const loadingEls = splash.querySelectorAll('.splash__text, .splash__bar, .splash__percent');
const slowEl = splash.querySelector('.splash__slow');
const errorEl = splash.querySelector('.splash__error');
const retryBtn = splash.querySelector('.splash__retry');
let slowTimer;

function startLoad() {
  loadingEls.forEach((el) => (el.hidden = false));
  errorEl.hidden = true;
  retryBtn.hidden = true;
  slowEl.hidden = true;
  fill.style.width = '0';
  percent.textContent = '';
  slowTimer = setTimeout(() => (slowEl.hidden = false), SLOW_LOAD_MS);
  loadModel(renderer);
}

on('load:progress', (p) => {
  fill.style.width = `${p ?? 100}%`;
  percent.textContent = p === null ? '' : `${p}%`;
});

on('load:done', (gltf) => {
  clearTimeout(slowTimer);
  if (model) scene.remove(model);
  model = gltf.scene;
  const size = new Box3().setFromObject(model).getSize(new Vector3());
  model.scale.setScalar(MODEL_HEIGHT / size.y);
  const box = new Box3().setFromObject(model);
  const center = box.getCenter(new Vector3());
  model.position.set(-center.x, -box.min.y, -center.z);
  model.traverse((o) => {
    if (o.isMesh) o.castShadow = true;
  });
  scene.add(model);
  configurator.setModel(model);
  training.setModel(model);
  if (DEBUG) {
    addDebugMarkers();
    window.__aparDebug = { camera, model, hotspots, Vector3, controls, requestRender };
  }
  requestRender();
  splash.classList.add('is-done');
});

on('load:error', (err) => {
  clearTimeout(slowTimer);
  console.error('Model load failed', err);
  loadingEls.forEach((el) => (el.hidden = true));
  slowEl.hidden = true;
  errorEl.hidden = false;
  retryBtn.hidden = false;
  retryBtn.focus();
});

retryBtn.addEventListener('click', startLoad);

startLoad();
