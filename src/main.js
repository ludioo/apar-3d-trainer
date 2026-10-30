import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './ui/components.css';
import './ui/hotspots.css';
import { Box3, Vector3 } from 'three';
import { initScene, requestRender, captureModel, prepareModel } from './core/scene.js';
import { initControls } from './core/controls.js';
import { loadModel } from './core/loader.js';
import { on } from './core/events.js';
import { initAnalytics, track } from './core/analytics.js';
import { initLang, getLang, setLang, t } from './i18n/i18n.js';
import { initRouter, closeOverlay, getMode } from './core/router.js';
import { openModal, closeModal } from './ui/modal.js';
import { initSheet } from './ui/sheet.js';
import { initHighlight } from './core/highlight.js';
import { initConfigurator } from './features/configurator/configurator.js';
import { initTraining } from './features/training/training.js';
import { initQuiz } from './features/quiz/quiz.js';
import { initResults } from './features/results/results.js';
import { listAttempts } from './features/quiz/attempts.js';
import { listConfigs } from './features/configurator/saved-configs.js';
import { snapshotPdf, validPdfName } from './features/pdf/pdf-common.js';
import product from './data/product.json';
import hotspots from './data/hotspots.json';
import { showWebglFallback } from './ui/webgl-fallback.js';
import { initAbout } from './ui/about.js';
import { initEmergencyChrome } from './ui/emergency-chrome.js';

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
initEmergencyChrome(document.querySelector('.emergency-chrome'));

const tabs = document.querySelector('.tabs');
const tabLinks = tabs.querySelectorAll('.tab');
const panel = document.getElementById('panel');
const panelTitle = document.getElementById('panel-title');
const sheetHandle = panel.querySelector('.panel__handle');
const about = document.getElementById('about');
initAbout(about);
let mode;

function syncChrome() {
  tabs.setAttribute('aria-label', t('nav.label'));
  const { current = 'half', next = 'full' } = sheetHandle.dataset;
  sheetHandle.setAttribute('aria-label', current === next ? t('sheet.fixed')
    : t('sheet.toggle').replace('{current}', t(`sheet.${current}`)).replace('{next}', t(`sheet.${next}`)));
  if (mode) panelTitle.textContent = t(`tabs.${mode}`);
}
on('lang:change', syncChrome);
on('sheet:change', syncChrome);
on('route:change', (route) => {
  mode = route.mode;
  tabLinks.forEach((a) => {
    if (a.hash === `#${mode}`) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  syncChrome();
  if (route.prev && location.hash !== '#about' && !document.body.classList.contains('has-webgl-fallback')) {
    const heading = panel.querySelector('.training h3, .quiz h3') ?? panelTitle;
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }
});
on('about:open', () => {
  openModal(about, () => {
    closeOverlay();
    document.querySelector('.topbar__about').focus({ preventScroll: true });
  });
  document.getElementById('about-title').focus();
});
on('about:close', () => { if (about.open) closeModal(about); });
about.querySelector('.modal__close').addEventListener('click', () => closeModal(about));
initSheet(panel, sheetHandle);
syncChrome();
new ResizeObserver(([entry]) => {
  document.documentElement.style.setProperty('--topbar-h', `${entry.target.getBoundingClientRect().height}px`);
}).observe(document.querySelector('.topbar'));

const root = document.getElementById('canvas-root');
function startViewer() {
  let context;
  try {
    context = initScene(root);
  } catch (error) {
    console.warn('WebGL unavailable', error);
    showWebglFallback();
    initRouter({ configure: {}, train: {}, results: {} });
    return;
  }
  const { scene, camera, renderer } = context;
  const controls = initControls(camera, renderer.domElement, requestRender);
  const rotation = document.getElementById('rotation-toggle');
  function syncRotation() {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    rotation.textContent = t(reduced ? 'viewer.reduced' : controls.isRotationPaused() ? 'viewer.resume' : 'viewer.pause');
    rotation.setAttribute('aria-pressed', String(controls.isRotationPaused()));
    rotation.disabled = reduced;
  }
  rotation.addEventListener('click', () => { controls.toggleRotation(); syncRotation(); });
  on('lang:change', syncRotation);
  on('route:change', ({ mode }) => {
    const tools = rotation.parentElement;
    tools.hidden = mode !== 'configure';
    if (mode === 'configure') panel.querySelector('.panel__body').prepend(tools);
  });
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', syncRotation);
  syncRotation();
  controls.target.set(0, MODEL_HEIGHT / 2, 0);
  controls.update();
  const debugReady = DEBUG
    ? import('./core/debug.js').then(({ initDebug }) => initDebug({ scene, renderer, camera, controls, requestRender, hotspots }))
      .catch((error) => { console.warn('Debug tools unavailable', error); return null; })
    : Promise.resolve(null);

  const highlight = initHighlight(scene, camera, requestRender);
  async function exportPdf(type, data, isCurrent) {
    if (type === 'report' && !validPdfName(data.name)) throw new RangeError('pdf.nameUnsupported');
    const styles = getComputedStyle(document.documentElement);
    const theme = Object.fromEntries(['paper', 'ink', 'muted', 'rule'].map((key) => [key, styles.getPropertyValue(`--pdf-${key}`).trim()]));
    theme.accent = styles.getPropertyValue('--accent').trim();
    const snapshot = { ...structuredClone(data), ...snapshotPdf(t, getLang(), theme) };
    if (type === 'spec') snapshot.image = captureModel(model, [highlight.ring]);
    const doc = type === 'report'
      ? await (await import('./features/pdf/pdf-report.js')).buildReport(snapshot)
      : await (await import('./features/pdf/pdf-spec.js')).buildSpec(snapshot);
    if (!isCurrent()) return;
    await doc.save(`apar-${type}-${snapshot.lang}-${snapshot.exportedAt.slice(0, 10)}.pdf`, { returnPromise: true });
    track('pdf_export', { type });
  }
  const configurator = initConfigurator({
    camera, controls, canvas: renderer.domElement, container: root,
    panelBody: document.getElementById('panel-body'), highlight, requestRender,
    exportSpec: (data, isCurrent) => exportPdf('spec', data, isCurrent),
  });
  const training = initTraining({
    scene, camera, controls, canvas: renderer.domElement, container: root,
    panelBody: document.getElementById('panel-body'), highlight, requestRender,
    setTrainingAppearance: configurator.setTrainingAppearance,
  });
  const quiz = initQuiz({
    camera, controls, canvas: renderer.domElement, container: root,
    panelBody: document.getElementById('panel-body'), requestRender,
    setTrainingAppearance: configurator.setTrainingAppearance,
  });
  let trainStage = training;
  const results = initResults({
    panelBody: document.getElementById('panel-body'), product,
    getAttempts: listAttempts, getConfigs: () => listConfigs(product),
    hasUnsavedResult: quiz.hasUnsavedResult,
    resetSessions() { training.reset(); quiz.reset(); trainStage = training; },
    exportReport: (data, isCurrent) => exportPdf('report', data, isCurrent),
  });
  on('quiz:start', () => {
    if (getMode() !== 'train' || trainStage !== training) return;
    training.exit();
    quiz.start();
    trainStage = quiz;
    quiz.enter();
  });
  on('quiz:training', () => {
    if (getMode() !== 'train' || trainStage !== quiz) return;
    quiz.exit();
    trainStage = training;
    training.enter();
  });
  initRouter({ configure: configurator, train: {
    enter() { trainStage.enter(); }, exit() { trainStage.exit(); },
  }, results });
  let model = null;

  const splash = document.getElementById('splash');
  const fill = splash.querySelector('.splash__fill');
  const percent = splash.querySelector('.splash__percent');
  const loadingEls = splash.querySelectorAll('.splash__text, .splash__bar, .splash__percent');
  const slowEl = splash.querySelector('.splash__slow');
  const errorEl = splash.querySelector('.splash__error');
  const retryBtn = splash.querySelector('.splash__retry');
  let slowTimer;

  function startLoad() {
    performance.mark('apar:load-start');
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

  on('load:done', async (gltf) => {
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
    quiz.setModel(model);
    performance.mark('apar:model-ready');
    try {
      const [hasEnvironment, debug] = await Promise.all([prepareModel(model), debugReady]);
      debug?.setModel(model);
      const off = on('scene:rendered', async () => {
        off();
        clearTimeout(slowTimer);
        splash.classList.add('is-done');
        splash.inert = true;
        splash.setAttribute('aria-hidden', 'true');
        await Promise.allSettled(splash.getAnimations().map((animation) => animation.finished));
        requestAnimationFrame(() => {
          const mark = hasEnvironment ? 'apar:visible' : 'apar:fallback-visible';
          performance.mark(mark);
          performance.measure('apar:load', 'apar:load-start', mark);
          initAnalytics();
        });
      });
      requestRender();
    } catch (error) {
      showLoadError(error);
    }
  });

  function showLoadError(err) {
    clearTimeout(slowTimer);
    console.error('Model load failed', err);
    loadingEls.forEach((el) => (el.hidden = true));
    slowEl.hidden = true;
    errorEl.hidden = false;
    retryBtn.hidden = false;
    retryBtn.focus();
  }
  on('load:error', showLoadError);

  retryBtn.addEventListener('click', startLoad);

  startLoad();
}
startViewer();
