import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './ui/components.css';
import { Box3, Vector3 } from 'three';
import { initScene, requestRender } from './core/scene.js';
import { initControls } from './core/controls.js';
import { loadModel } from './core/loader.js';
import { on } from './core/events.js';
import { initLang, getLang, setLang, t } from './i18n/i18n.js';
import { initRouter, closeOverlay } from './core/router.js';
import { openModal, closeModal } from './ui/modal.js';
import { initSheet } from './ui/sheet.js';

const MODEL_HEIGHT = 1.2;
const SLOW_LOAD_MS = 8000;

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
initRouter({ configure: {}, train: {}, results: {} });

const root = document.getElementById('canvas-root');
const { scene, camera, renderer } = initScene(root);
const controls = initControls(camera, renderer.domElement, requestRender);
controls.target.set(0, MODEL_HEIGHT / 2, 0);
controls.update();

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
  const model = gltf.scene;
  const size = new Box3().setFromObject(model).getSize(new Vector3());
  model.scale.setScalar(MODEL_HEIGHT / size.y);
  const box = new Box3().setFromObject(model);
  const center = box.getCenter(new Vector3());
  model.position.set(-center.x, -box.min.y, -center.z);
  model.traverse((o) => {
    if (o.isMesh) o.castShadow = true;
  });
  scene.add(model);
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
