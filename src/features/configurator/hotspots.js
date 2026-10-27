import { Vector3 } from 'three';
import { initCameraTween } from '../../core/cameraTween.js';
import { on } from '../../core/events.js';
import { getLang, t } from '../../i18n/i18n.js';
import { initHotspotPins } from '../../ui/hotspot-pins.js';
import hotspots from '../../data/hotspots.json';

export function initHotspots({ camera, controls, canvas, container, panelBody, highlight, requestRender }) {
  const tween = initCameraTween(camera, controls, requestRender);
  const content = document.createElement('div');
  content.className = 'hotspot-info';
  const hint = document.createElement('p');
  hint.className = 'hotspot-info__hint';
  const card = document.createElement('section');
  card.className = 'hotspot-info__card';
  card.hidden = true;
  card.setAttribute('aria-labelledby', 'hotspot-title');
  const heading = document.createElement('h3');
  heading.id = 'hotspot-title';
  const body = document.createElement('p');
  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'hotspot-info__close';
  card.append(heading, body, closeButton);
  content.append(hint, card);
  const pins = initHotspotPins({ container, camera, controls, hotspots, open });
  let model = null;
  let selected = null;
  let snapshot = null;
  let trigger = null;
  let active = false;
  let offLang;

  function syncText() {
    const lang = getLang();
    hint.textContent = t('hotspot.hint');
    closeButton.textContent = t('hotspot.close');
    canvas.setAttribute('aria-label', t('hotspot.viewer'));
    if (selected) {
      heading.textContent = selected.title[lang];
      body.textContent = selected.body[lang];
    }
    pins.syncText(lang, selected);
  }

  function open(hotspot, source = canvas) {
    if (!active || !model) return;
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
    selected = null;
    card.hidden = true;
    hint.hidden = false;
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
    canvas.removeAttribute('tabindex');
    canvas.removeAttribute('aria-label');
  }

  function setModel(next) {
    model = next;
    pins.setModel(next);
  }

  return { enter, exit, open, setModel };
}
