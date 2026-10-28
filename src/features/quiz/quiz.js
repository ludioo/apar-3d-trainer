import { Box3, Vector3 } from 'three';
import { on, emit } from '../../core/events.js';
import { initCameraTween } from '../../core/cameraTween.js';
import { getLang, t } from '../../i18n/i18n.js';
import { initHotspotPins } from '../../ui/hotspot-pins.js';
import { initQuizUi } from '../../ui/quiz.js';
import { createQuizSession } from './quiz-state.js';
import { saveAttempt } from './attempts.js';
import questions from '../../data/quiz.json';
import hotspots from '../../data/hotspots.json';

export function initQuiz(context) {
  const { camera, controls, canvas, container, panelBody, requestRender, setTrainingAppearance } = context;
  const panel = panelBody.closest('.panel');
  const session = createQuizSession();
  const tween = initCameraTween(camera, controls, requestRender);
  const pins = initHotspotPins({ container, camera, controls, hotspots, panel,
    open: (hotspot) => answer(hotspot.id),
    label: (_, index) => t('quiz.part').replace('{n}', index + 1),
  });
  const ui = initQuizUi(questions, {
    answer,
    next() {
      if (!canInteract() || !session.next()) return;
      sync();
      if (session.phase === 'question' && questions[session.index].type === 'pick-hotspot') resetView();
      ui.focusHeading();
    },
    restart() { if (canInteract() && model) start(); },
    resetView,
    training() { if (canInteract()) emit('quiz:training'); },
    results() { if (canInteract()) location.hash = 'results'; },
  });
  let model = null;
  let active = false;
  let pinsActive = false;
  let saveFailed = false;
  let suspended = false;
  let snapshot;
  let offLang;
  let offResize;
  let offAbout;
  const canInteract = () => active && !suspended && !document.hidden && !document.querySelector('dialog[open]');

  function answer(given) {
    if (!canInteract() || !model || !session.answer(given)) return;
    if (session.attempt) saveFailed = saveAttempt(session.attempt).status !== 'ok';
    sync();
    ui.focusFeedback();
  }
  function sync() {
    ui.render({ session, ready: !!model, saveFailed });
    const showPins = !!model && session.phase !== 'summary' && questions[session.index].type === 'pick-hotspot';
    if (showPins !== pinsActive) {
      pinsActive = showPins;
      if (showPins) pins.enter(); else pins.exit();
    }
    pins.syncText(getLang(), hotspots.find((hotspot) => hotspot.id === session.answers[session.index]?.given));
    pins.setDisabled(session.phase !== 'question' || !canInteract());
    canvas.setAttribute('aria-label', t('quiz.viewer'));
  }
  function resetView() {
    if (!active || !model) return;
    const box = new Box3().setFromObject(model);
    const center = box.getCenter(new Vector3());
    const rect = container.getBoundingClientRect();
    const desktop = matchMedia('(min-width: 1024px)').matches;
    const ratio = desktop ? Math.max(0.1, (panel.getBoundingClientRect().left - rect.left - 16) / rect.width) : 1;
    const tanY = Math.tan(camera.fov * Math.PI / 360);
    const tanX = tanY * camera.aspect;
    const angle = Math.min(Math.atan(tanX * ratio), Math.atan(tanY));
    const distance = Math.max(1.5, box.getSize(new Vector3()).length() / 2 / Math.sin(angle * 0.82));
    const direction = new Vector3(0.15, 0.2, 1).normalize();
    const right = new Vector3().crossVectors(camera.up, direction).normalize();
    center.addScaledVector(right, (1 - ratio) * distance * tanX);
    tween.moveTo({ target: center.toArray(), position: center.clone().addScaledVector(direction, distance).toArray() });
  }
  function start() {
    session.start();
    saveFailed = false;
    if (active) { sync(); resetView(); ui.focusHeading(); }
  }
  const cancelTween = () => tween.cancel();
  function interrupt() { suspended = true; tween.cancel(); if (active) sync(); }
  function resume() {
    if (document.hasFocus() && !document.hidden && !document.querySelector('dialog[open]')) suspended = false;
    if (active) sync();
  }
  function visibility() { if (document.hidden) interrupt(); else resume(); }
  function enter() {
    active = true;
    suspended = false;
    snapshot = { position: camera.position.toArray(), target: controls.target.toArray(),
      minDistance: controls.minDistance, maxDistance: controls.maxDistance, enabled: controls.enabled };
    controls.pauseAutoRotate();
    setTrainingAppearance(true);
    panel.classList.add('is-quiz');
    panelBody.appendChild(ui.element);
    ui.enter();
    canvas.tabIndex = 0;
    controls.addEventListener('start', cancelTween);
    window.addEventListener('blur', interrupt);
    window.addEventListener('focus', resume);
    document.addEventListener('visibilitychange', visibility);
    document.addEventListener('close', resume, true);
    offAbout = on('about:open', interrupt);
    offLang = on('lang:change', sync);
    offResize = on('scene:resize', resetView);
    sync();
    resetView();
    ui.focusHeading();
  }
  function exit() {
    active = false;
    pins.exit();
    pinsActive = false;
    tween.cancel();
    controls.removeEventListener('start', cancelTween);
    window.removeEventListener('blur', interrupt);
    window.removeEventListener('focus', resume);
    document.removeEventListener('visibilitychange', visibility);
    document.removeEventListener('close', resume, true);
    offAbout?.();
    offLang?.();
    offResize?.();
    ui.exit();
    ui.element.remove();
    panel.classList.remove('is-quiz');
    if (snapshot) {
      controls.minDistance = snapshot.minDistance;
      controls.maxDistance = snapshot.maxDistance;
      tween.moveTo(snapshot, { immediate: true });
      controls.enabled = snapshot.enabled;
      snapshot = null;
    }
    setTrainingAppearance(false);
    controls.resumeAutoRotate();
    canvas.removeAttribute('tabindex');
    canvas.removeAttribute('aria-label');
  }
  function setModel(next) {
    model = next;
    pins.setModel(next);
    if (active) { sync(); resetView(); }
  }
  function reset() { session.reset(); saveFailed = false; suspended = false; }
  return { start, enter, exit, setModel, reset,
    hasUnsavedResult: () => !!session.attempt && saveFailed,
  };
}
