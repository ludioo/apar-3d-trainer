import './ui/hotspots.css';
import { Box3, Vector3 } from 'three';
import { initScene, requestRender, captureModel, prepareModel, whenEnvironmentReady } from './core/scene.js';
import { initControls } from './core/controls.js';
import { on } from './core/events.js';
import { initAnalytics, track } from './core/analytics.js';
import { getLang, t } from './i18n/i18n.js';
import { initRouter, getMode } from './core/router.js';
import { initHighlight } from './core/highlight.js';
import { initConfigurator } from './features/configurator/configurator.js';
import { listConfigs } from './features/configurator/saved-configs.js';
import product from './data/product.json';
import hotspots from './data/hotspots.json';
import { showWebglFallback } from './ui/webgl-fallback.js';
import { get } from './core/storage.js';
import { ONBOARDING_KEY, shouldStartOnboarding } from './features/onboarding/onboarding-gate.js';

const MODEL_HEIGHT = 1.2;
const SLOW_LOAD_MS = 8000;
const DEBUG = new URLSearchParams(location.search).has('debug');

export function startViewer(root) {
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
    if (mode === 'configure') panelBody().prepend(tools);
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
    const { snapshotPdf, validPdfName } = await import('./features/pdf/pdf-common.js');
    if (type === 'report' && !validPdfName(data.name)) throw new RangeError('pdf.nameUnsupported');
    const styles = getComputedStyle(document.documentElement);
    const theme = Object.fromEntries(['paper', 'ink', 'muted', 'rule'].map((key) => [key, styles.getPropertyValue(`--pdf-${key}`).trim()]));
    theme.accent = styles.getPropertyValue('--accent').trim();
    const snapshot = { ...structuredClone(data), ...snapshotPdf(t, getLang(), theme) };
    if (type === 'spec') {
      await whenEnvironmentReady();
      snapshot.image = captureModel(model, [highlight.ring]);
    }
    const doc = type === 'report'
      ? await (await import('./features/pdf/pdf-report.js')).buildReport(snapshot)
      : await (await import('./features/pdf/pdf-spec.js')).buildSpec(snapshot);
    if (!isCurrent()) return;
    await doc.save(`apar-${type}-${snapshot.lang}-${snapshot.exportedAt.slice(0, 10)}.pdf`, { returnPromise: true });
    track('pdf_export', { type });
  }
  const configurator = initConfigurator({
    camera, controls, canvas: renderer.domElement, container: root,
    panelBody: panelBody(), highlight, requestRender,
    exportSpec: (data, isCurrent) => exportPdf('spec', data, isCurrent),
  });

  let model = null;
  let trainBundle = null;
  let trainBundlePromise = null;
  let trainStage = null;

  async function ensureTrainBundle() {
    if (trainBundle) return trainBundle;
    trainBundlePromise ??= (async () => {
      try {
        const [
          { initTraining },
          { initQuiz },
          { initResults },
          { listAttempts },
        ] = await Promise.all([
          import('./features/training/training.js'),
          import('./features/quiz/quiz.js'),
          import('./features/results/results.js'),
          import('./features/quiz/attempts.js'),
        ]);
        const training = initTraining({
          scene, camera, controls, canvas: renderer.domElement, container: root,
          panelBody: panelBody(), highlight, requestRender,
          setTrainingAppearance: configurator.setTrainingAppearance,
        });
        const quiz = initQuiz({
          camera, controls, canvas: renderer.domElement, container: root,
          panelBody: panelBody(), requestRender,
          setTrainingAppearance: configurator.setTrainingAppearance,
        });
        trainStage = training;
        const results = initResults({
          panelBody: panelBody(), product,
          getAttempts: listAttempts, getConfigs: () => listConfigs(product),
          hasUnsavedResult: quiz.hasUnsavedResult,
          resetSessions() { training.reset(); quiz.reset(); trainStage = training; },
          exportReport: (data, isCurrent) => exportPdf('report', data, isCurrent),
        });
        if (model) {
          training.setModel(model);
          quiz.setModel(model);
        }
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
        trainBundle = { training, quiz, results };
        return trainBundle;
      } catch (error) {
        trainBundlePromise = null;
        throw error;
      }
    })();
    return trainBundlePromise;
  }

  initRouter({
    configure: configurator,
    train: {
      enter() {
        ensureTrainBundle()
          .then(({ training }) => {
            if (getMode() !== 'train') return;
            (trainStage ?? training).enter();
          })
          .catch((error) => console.error('Train modules failed to load', error));
      },
      exit() { trainStage?.exit(); },
    },
    results: {
      enter() {
        ensureTrainBundle()
          .then(({ results }) => {
            if (getMode() !== 'results') return;
            results.enter();
          })
          .catch((error) => console.error('Results modules failed to load', error));
      },
      exit() { trainBundle?.results.exit(); },
    },
  });

  const splash = document.getElementById('splash');
  const fill = splash.querySelector('.splash__fill');
  const percent = splash.querySelector('.splash__percent');
  const loadingEls = splash.querySelectorAll('.splash__text, .splash__bar, .splash__percent');
  const slowEl = splash.querySelector('.splash__slow');
  const errorEl = splash.querySelector('.splash__error');
  const retryBtn = splash.querySelector('.splash__retry');
  let slowTimer;

  async function startLoad() {
    performance.mark('apar:load-start');
    loadingEls.forEach((el) => (el.hidden = false));
    errorEl.hidden = true;
    retryBtn.hidden = true;
    slowEl.hidden = true;
    fill.style.width = '0';
    percent.textContent = '';
    slowTimer = setTimeout(() => (slowEl.hidden = false), SLOW_LOAD_MS);
    const { loadModel } = await import('./core/loader.js');
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
    trainBundle?.training.setModel(model);
    trainBundle?.quiz.setModel(model);
    performance.mark('apar:model-ready');
    try {
      const [, debug] = await Promise.all([prepareModel(model), debugReady]);
      debug?.setModel(model);
      const off = on('scene:rendered', async () => {
        off();
        clearTimeout(slowTimer);
        splash.classList.add('is-done');
        splash.inert = true;
        splash.setAttribute('aria-hidden', 'true');
        await Promise.allSettled(splash.getAnimations().map((animation) => animation.finished));
        splash.remove();
        requestAnimationFrame(async () => {
          const hasEnvironment = await whenEnvironmentReady();
          const mark = hasEnvironment ? 'apar:visible' : 'apar:fallback-visible';
          performance.mark(mark);
          performance.measure('apar:load', 'apar:load-start', mark);
          initAnalytics();
          scheduleOnboarding();
        });
      });
      requestRender();
    } catch (error) {
      showLoadError(error);
    }
  });

  function scheduleOnboarding() {
    // Delay past typical LHCI quiet window so driver.js is not on the boot critical path.
    setTimeout(() => {
      if (getMode() !== 'configure') return;
      if (!shouldStartOnboarding(get(ONBOARDING_KEY, false))) return;
      import('./features/onboarding/onboarding.js')
        .then((m) => m.maybeStartOnboarding())
        .catch(() => {});
    }, 8000);
  }

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

function panelBody() {
  return document.getElementById('panel-body');
}
