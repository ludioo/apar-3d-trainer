import { Vector3 } from 'three';
import { initCameraTween } from '../../core/cameraTween.js';
import { on } from '../../core/events.js';
import { getLang, t } from '../../i18n/i18n.js';
import { initHotspotPins } from '../../ui/hotspot-pins.js';
import hotspots from '../../data/hotspots.json';

export function initHotspots({ camera, controls, canvas, container, panelBody, highlight, requestRender }) {
  const tween = initCameraTween(camera, controls, requestRender);
  const panel = panelBody.closest('.panel');
  const desktop = matchMedia('(min-width: 1024px)');
  const content = document.createElement('div');
  content.className = 'hotspot-info';
  const hint = document.createElement('p');
  hint.className = 'hotspot-info__hint';
  const card = document.createElement('section');
  card.className = 'hotspot-info__card';
  card.hidden = true;
  card.setAttribute('aria-labelledby', 'hotspot-title');
  const header = document.createElement('div');
  header.className = 'hotspot-info__header';
  const heading = document.createElement('h3');
  heading.id = 'hotspot-title';
  const body = document.createElement('p');
  body.className = 'hotspot-info__body';
  body.tabIndex = 0;
  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'hotspot-info__close';
  header.append(heading, closeButton);
  card.append(header, body);
  content.append(hint, card);
  const pins = initHotspotPins({ container, camera, controls, hotspots, open });
  let model = null;
  let selected = null;
  let snapshot = null;
  let trigger = null;
  let active = false;
  let offLang;
  let optionsScrollTop = 0;

  function revealCard() {
    if (!selected) return;
    if (desktop.matches) header.scrollIntoView({ block: 'nearest' });
    else panelBody.scrollTop = 0;
  }

  function syncText() {
    const lang = getLang();
    hint.textContent = t('hotspot.hint');
    closeButton.textContent = t('modal.close');
    closeButton.setAttribute('aria-label', t('hotspot.close'));
    canvas.setAttribute('aria-label', t('hotspot.viewer'));
    if (selected) {
      heading.textContent = selected.title[lang];
      body.textContent = selected.body[lang];
    }
    pins.syncText(lang, selected);
    revealCard();
  }

  function open(hotspot, source = canvas) {
    if (!active || !model) return;
    if (!selected) optionsScrollTop = panelBody.scrollTop;
    if (selected?.id !== hotspot.id) body.scrollTop = 0;
    if (!snapshot) {
      snapshot = {
        position: camera.position.toArray(), target: controls.target.toArray(),
        minDistance: controls.minDistance, maxDistance: controls.maxDistance,
      };
    }
    controls.pauseAutoRotate();
    controls.enabled = true;
    controls.minDistance = 0.35;
    selected = hotspot;
    trigger = source;
    card.hidden = false;
    hint.hidden = true;
    panel.classList.add('is-reading-hotspot');
    syncText();
    highlight.show(model.localToWorld(new Vector3(...hotspot.pinPosition)));
    tween.moveTo(hotspot.cameraView);
    closeButton.focus({ preventScroll: true });
  }

  function finishRestore(returnFocus) {
    controls.minDistance = snapshot.minDistance;
    controls.maxDistance = snapshot.maxDistance;
    controls.enabled = true;
    snapshot = null;
    controls.resumeAutoRotate();
    if (returnFocus) {
      const target = trigger?.isConnected && !trigger.hidden ? trigger : canvas;
      target.focus({ preventScroll: true });
    }
  }

  function close(immediate = false, returnFocus = true) {
    const wasOpen = !!selected;
    selected = null;
    card.hidden = true;
    hint.hidden = false;
    panel.classList.remove('is-reading-hotspot');
    if (wasOpen) panelBody.scrollTop = optionsScrollTop;
    highlight.clear();
    syncText();
    if (!snapshot) return;
    controls.enabled = false;
    tween.moveTo(snapshot, { immediate, onComplete: () => finishRestore(returnFocus) });
  }

  const cancelFocus = () => tween.cancel();
  const escape = (event) => {
    if (event.key !== 'Escape' || document.querySelector('dialog[open]') || !selected) return;
    event.preventDefault();
    close();
  };
  closeButton.addEventListener('click', () => close());

  function enter() {
    active = true;
    panelBody.appendChild(content);
    canvas.tabIndex = 0;
    syncText();
    pins.enter();
    controls.addEventListener('start', cancelFocus);
    controls.addEventListener('change', highlight.update);
    document.addEventListener('keydown', escape);
    offLang = on('lang:change', syncText);
    desktop.addEventListener('change', revealCard);
    window.addEventListener('resize', revealCard);
  }

  function exit() {
    active = false;
    tween.cancel();
    close(true, false);
    pins.exit();
    content.remove();
    controls.removeEventListener('start', cancelFocus);
    controls.removeEventListener('change', highlight.update);
    document.removeEventListener('keydown', escape);
    offLang?.();
    desktop.removeEventListener('change', revealCard);
    window.removeEventListener('resize', revealCard);
    canvas.removeAttribute('tabindex');
    canvas.removeAttribute('aria-label');
  }

  function setModel(next) {
    model = next;
    pins.setModel(next);
  }

  return { enter, exit, open, setModel };
}
