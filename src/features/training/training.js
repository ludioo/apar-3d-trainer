import { Vector3 } from 'three';
import { on, emit } from '../../core/events.js';
import { initCameraTween } from '../../core/cameraTween.js';
import { pickFromNdc } from '../../core/picking.js';
import { set } from '../../core/storage.js';
import { getLang, t } from '../../i18n/i18n.js';
import { initTrainingUi } from '../../ui/training.js';
import { initTrainingTarget } from '../../ui/training-target.js';
import { createTrainingSession, createSweep, SWEEP_STROKES } from './training-state.js';
import { initTrainingGestures } from './training-gestures.js';
import { initEffects } from './effects.js';
import { trainingView } from './training-view.js';
import steps from '../../data/pass-steps.json';
import hotspots from '../../data/hotspots.json';

export function initTraining(context) {
  const { camera, controls, canvas, container, panelBody, highlight, requestRender, setTrainingAppearance } = context;
  const session = createTrainingSession(steps.length);
  const sweep = createSweep();
  const tween = initCameraTween(camera, controls, requestRender);
  const target = initTrainingTarget({ container, camera, controls, panelBody });
  const effects = initEffects(context);
  const ui = initTrainingUi(steps, {
    start() { if (!model) return; session.start(); changeStep(); },
    restart() { if (!model) return; session.restart(); sweep.reset(); saveFailed = false; changeStep(); },
    back() { session.back(); changeStep(); },
    next() {
      if (!model || !session.next()) return;
      if (session.phase === 'complete') saveFailed = !set('trainingDone', true);
      changeStep();
    },
    skip() { if (canInteract()) complete(true); },
    refocus: focusStep,
    interact: targetClick,
    quiz() { if (active && model && session.phase === 'complete') emit('quiz:start'); },
  });
  let model = null;
  let active = false;
  let saveFailed = false;
  let snapshot = null;
  let gestures = null;
  let down = null;
  let offLang;
  let offAbout;
  let offResize;
  const currentStep = () => steps[session.index];
  const currentHotspot = () => hotspots.find((h) => h.id === currentStep().hotspot);

  function canInteract() {
    return active && !!model && session.phase === 'steps' && !session.status[session.index] &&
      !document.hidden && !document.querySelector('dialog[open]');
  }
  function sync() {
    ui.render({ session, ready: !!model, sweep, saveFailed });
    const step = currentStep();
    const inStep = session.phase === 'steps';
    const done = !!session.status[session.index];
    target.setStep(inStep ? { ...currentHotspot(), interaction: step.interaction } : null, session.index,
      `${step.title[getLang()]}. ${step.instruction[getLang()]} ${t(`training.hint.${step.interaction}`)}`,
      done, inStep && step.id === 'pull' && session.status[0] === 'done');
    if (done || !inStep) highlight.clear();
    canvas.setAttribute('aria-label', t('training.viewer'));
    effects.sync(session, sweep, active);
  }
  function focusStep() {
    if (!active || !model || session.phase !== 'steps') return;
    gestures?.cancel();
    controls.minDistance = 0.35;
    const hotspot = currentHotspot();
    if (!session.status[session.index]) highlight.show(model.localToWorld(new Vector3(...hotspot.pinPosition)));
    if (session.index === 0) tween.moveTo(hotspot.cameraView);
    else {
      const rect = container.getBoundingClientRect();
      const panel = panelBody.closest('.panel').getBoundingClientRect();
      const desktop = matchMedia('(min-width: 1024px)').matches;
      const available = { width: desktop ? panel.left - rect.left - 16 : rect.width,
        height: rect.height };
      tween.moveTo(trainingView(model, effects.base, camera, rect, available));
    }
  }
  function changeStep() {
    cancel();
    if (session.phase !== 'steps') {
      tween.cancel();
      highlight.clear();
    }
    sync();
    focusStep();
    ui.focusHeading();
  }
  function complete(skipped = false) {
    if (!canInteract()) return;
    session.complete(skipped);
    gestures?.cancel();
    sync();
  }
  function cancel() {
    down = null;
    gestures?.cancel();
    effects.setSpray(false);
  }
  function interrupt() { cancel(); effects.pause(); highlight.clear(); }
  function resumeEffects() {
    if (active && !document.hidden && !document.querySelector('dialog[open]')) {
      effects.resume();
      if (model && canInteract()) highlight.show(model.localToWorld(new Vector3(...currentHotspot().pinPosition)));
    }
  }
  function visibility() { if (document.hidden) interrupt(); else resumeEffects(); }
  function targetClick() {
    if (currentStep().interaction === 'click') complete();
  }
  function pointerDown(event) {
    down = canInteract() && currentStep().interaction === 'click' && event.isPrimary && event.button === 0
      ? { id: event.pointerId, x: event.clientX, y: event.clientY } : null;
  }
  function pointerUp(event) {
    const start = down;
    down = null;
    if (!canInteract() || !start || start.id !== event.pointerId || event.button !== 0 ||
      Math.hypot(event.clientX - start.x, event.clientY - start.y) > 5) return;
    const rect = canvas.getBoundingClientRect();
    const result = pickFromNdc((event.clientX - rect.left) / rect.width * 2 - 1,
      -(event.clientY - rect.top) / rect.height * 2 + 1, camera, model, hotspots);
    emit('hotspot:pick', result);
    if (result.hotspot?.id === currentStep().hotspot) complete();
  }
  const stopFocus = () => { tween.cancel(); cancel(); };

  function enter() {
    active = true;
    snapshot = { position: camera.position.toArray(), target: controls.target.toArray(),
      minDistance: controls.minDistance, maxDistance: controls.maxDistance, enabled: controls.enabled };
    controls.pauseAutoRotate();
    setTrainingAppearance(true);
    effects.setModel(model);
    resumeEffects();
    panelBody.closest('.panel').classList.add('is-training');
    panelBody.appendChild(ui.element);
    ui.enter();
    canvas.tabIndex = 0;
    target.enter();
    gestures = initTrainingGestures({ targets: [target.button, ui.interact], sweepInput: ui.sweepInput, sweep,
      canHold: () => canInteract() && currentStep().interaction === 'hold',
      canSweep: () => canInteract() && currentStep().interaction === 'drag',
      progress(value) { target.progress(value); effects.setSpray(value > 0 && value < 1); },
      held: () => complete(),
      swept(count) {
        if (count >= SWEEP_STROKES) complete(); else sync();
        effects.setSpray(count < SWEEP_STROKES, true);
      },
    });
    target.button.addEventListener('click', targetClick);
    canvas.addEventListener('pointerdown', pointerDown);
    canvas.addEventListener('pointerup', pointerUp);
    canvas.addEventListener('pointercancel', cancel);
    controls.addEventListener('start', stopFocus);
    controls.addEventListener('change', highlight.update);
    window.addEventListener('blur', interrupt);
    window.addEventListener('focus', resumeEffects);
    document.addEventListener('visibilitychange', visibility);
    document.addEventListener('close', resumeEffects, true);
    offAbout = on('about:open', interrupt);
    offResize = on('scene:resize', focusStep);
    offLang = on('lang:change', sync);
    sync();
    focusStep();
  }
  function exit() {
    active = false;
    cancel();
    effects.pause();
    effects.sync(session, sweep, false);
    gestures?.destroy();
    gestures = null;
    target.exit();
    target.button.removeEventListener('click', targetClick);
    canvas.removeEventListener('pointerdown', pointerDown);
    canvas.removeEventListener('pointerup', pointerUp);
    canvas.removeEventListener('pointercancel', cancel);
    controls.removeEventListener('start', stopFocus);
    controls.removeEventListener('change', highlight.update);
    window.removeEventListener('blur', interrupt);
    window.removeEventListener('focus', resumeEffects);
    document.removeEventListener('visibilitychange', visibility);
    document.removeEventListener('close', resumeEffects, true);
    offAbout?.();
    offLang?.();
    offResize?.();
    highlight.clear();
    tween.cancel();
    if (snapshot) {
      controls.minDistance = snapshot.minDistance;
      controls.maxDistance = snapshot.maxDistance;
      tween.moveTo(snapshot, { immediate: true });
      controls.enabled = snapshot.enabled;
      snapshot = null;
    }
    setTrainingAppearance(false);
    controls.resumeAutoRotate();
    ui.element.remove();
    ui.exit();
    panelBody.closest('.panel').classList.remove('is-training');
    canvas.removeAttribute('tabindex');
    canvas.removeAttribute('aria-label');
  }
  function setModel(next) {
    cancel();
    if (active) { tween.cancel(); highlight.clear(); }
    model = next;
    effects.setModel(next);
    target.setModel(next);
    if (active) { sync(); focusStep(); }
  }
  function reset() {
    cancel();
    session.reset();
    sweep.reset();
    saveFailed = false;
    effects.sync(session, sweep, false);
  }
  return { enter, exit, setModel, reset };
}
