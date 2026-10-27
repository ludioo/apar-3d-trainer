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
import steps from '../../data/pass-steps.json';
import hotspots from '../../data/hotspots.json';

export function initTraining(context) {
  const { camera, controls, canvas, container, panelBody, highlight, requestRender, setTrainingAppearance } = context;
  const session = createTrainingSession(steps.length);
  const sweep = createSweep();
  const tween = initCameraTween(camera, controls, requestRender);
  const target = initTrainingTarget({ container, camera, controls, panelBody });
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
  });
  let model = null;
  let active = false;
  let saveFailed = false;
  let snapshot = null;
  let gestures = null;
  let down = null;
  let offLang;
  let offAbout;
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
  }
  function focusStep() {
    if (!active || !model || session.phase !== 'steps') return;
    gestures?.cancel();
    controls.minDistance = 0.35;
    const hotspot = currentHotspot();
    if (!session.status[session.index]) highlight.show(model.localToWorld(new Vector3(...hotspot.pinPosition)));
    tween.moveTo(hotspot.cameraView);
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
  }
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
    panelBody.closest('.panel').classList.add('is-training');
    panelBody.appendChild(ui.element);
    ui.enter();
    canvas.tabIndex = 0;
    target.enter();
    gestures = initTrainingGestures({ target: target.button, sweepInput: ui.sweepInput, sweep,
      canHold: () => canInteract() && currentStep().interaction === 'hold',
      canSweep: () => canInteract() && currentStep().interaction === 'drag',
      progress: target.progress, held: () => complete(),
      swept(count) { if (count >= SWEEP_STROKES) complete(); else sync(); },
    });
    target.button.addEventListener('click', targetClick);
    canvas.addEventListener('pointerdown', pointerDown);
    canvas.addEventListener('pointerup', pointerUp);
    canvas.addEventListener('pointercancel', cancel);
    controls.addEventListener('start', stopFocus);
    controls.addEventListener('change', highlight.update);
    window.addEventListener('blur', cancel);
    document.addEventListener('visibilitychange', cancel);
    offAbout = on('about:open', cancel);
    offLang = on('lang:change', sync);
    sync();
    focusStep();
  }
  function exit() {
    active = false;
    cancel();
    gestures?.destroy();
    gestures = null;
    target.exit();
    target.button.removeEventListener('click', targetClick);
    canvas.removeEventListener('pointerdown', pointerDown);
    canvas.removeEventListener('pointerup', pointerUp);
    canvas.removeEventListener('pointercancel', cancel);
    controls.removeEventListener('start', stopFocus);
    controls.removeEventListener('change', highlight.update);
    window.removeEventListener('blur', cancel);
    document.removeEventListener('visibilitychange', cancel);
    offAbout?.();
    offLang?.();
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
    target.setModel(next);
    if (active) { sync(); focusStep(); }
  }
  return { enter, exit, setModel };
}
