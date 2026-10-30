import { Box3, Vector3 } from 'three';
import { initCameraTween } from '../../core/cameraTween.js';
import { on } from '../../core/events.js';
import { track } from '../../core/analytics.js';
import { getLang, t } from '../../i18n/i18n.js';
import { initHotspotPins } from '../../ui/hotspot-pins.js';
import hotspots from '../../data/hotspots.json';
import product from '../../data/product.json';
import { overviewView } from './overview-view.js';

export function initHotspots({ camera, controls, canvas, container, panelBody, highlight, requestRender }) {
  const tween = initCameraTween(camera, controls, requestRender);
  const panel = panelBody.closest('.panel');
  const desktop = matchMedia('(min-width: 1024px)');
  const content = document.createElement('div');
  content.className = 'hotspot-info';
  const hint = document.createElement('p');
  hint.className = 'hotspot-info__hint';
  const parts = document.createElement('div');
  parts.className = 'hotspot-info__parts';
  parts.setAttribute('role', 'group');
  const partButtons = hotspots.map((hotspot, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.part = hotspot.id;
    button.addEventListener('click', () => open(hotspot, button));
    parts.appendChild(button);
    return { button, hotspot, index };
  });
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
  content.append(hint, parts, card);
  const pins = initHotspotPins({ container, camera, controls, hotspots, open, panel });
  let model = null;
  let selected = null;
  let snapshot = null;
  let trigger = null;
  let active = false;
  let offLang;
  let optionsScrollTop = 0;
  let capacityScale = 1;
  let referenceBounds = null;
  let manualView = false;
  let gesture = null;
  let offResize;
  let resizePending = false;
  let firstOverview = true;
  const initialDirection = camera.position.clone().sub(controls.target);

  function fitOverview() {
    if (!active || !referenceBounds || manualView || selected || snapshot || gesture) return;
    const rect = container.getBoundingClientRect();
    const margin = Math.min(16, rect.width / 4, rect.height / 4);
    const available = { left: margin, right: rect.width - margin,
      top: margin, bottom: rect.height - margin };
    if (desktop.matches) {
      available.right = panel.getBoundingClientRect().left - rect.left - margin;
      available.top = document.querySelector('.topbar').getBoundingClientRect().bottom - rect.top + margin;
    }
    const direction = firstOverview ? initialDirection : camera.position.clone().sub(controls.target);
    const view = overviewView(referenceBounds, camera, rect, available, direction,
      Math.max(...product.options.capacity.map((capacity) => capacity.scale)));
    if (view) {
      resizePending = false;
      firstOverview = false;
      controls.maxDistance = Math.max(8, new Vector3(...view.position).distanceTo(new Vector3(...view.target)) * 1.5);
      tween.moveTo(view, { immediate: true });
    }
  }
  const resizeOverview = () => { resizePending = true; fitOverview(); };

  function focusSelected() {
    controls.minDistance = 0.35 * capacityScale;
    highlight.show(model.localToWorld(new Vector3(...selected.pinPosition)));
    tween.moveTo({
      position: selected.cameraView.position.map((value) => value * capacityScale),
      target: selected.cameraView.target.map((value) => value * capacityScale),
    });
  }

  function refreshTransform(scale) {
    capacityScale = scale;
    if (model && !referenceBounds) {
      referenceBounds = new Box3().setFromObject(model);
      referenceBounds.min.divideScalar(scale);
      referenceBounds.max.divideScalar(scale);
      fitOverview();
    }
    pins.refresh();
    if (active && selected && model) focusSelected();
  }

  function revealCard() {
    if (!selected) return;
    if (desktop.matches) header.scrollIntoView({ block: 'nearest' });
    else panelBody.scrollTop = 0;
  }

  function syncText() {
    const lang = getLang();
    hint.textContent = t('hotspot.hint');
    parts.setAttribute('aria-label', t('hotspot.parts'));
    parts.hidden = !!selected;
    for (const { button, hotspot, index } of partButtons) {
      button.textContent = `${index + 1}. ${hotspot.title[lang]}`;
      button.disabled = !model;
    }
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
    selected = hotspot;
    trigger = source;
    card.hidden = false;
    hint.hidden = true;
    panel.classList.add('is-reading-hotspot');
    syncText();
    focusSelected();
    closeButton.focus({ preventScroll: true });
    track('hotspot_open', { id: hotspot.id });
  }

  function finishRestore(returnFocus) {
    controls.minDistance = snapshot.minDistance;
    controls.maxDistance = snapshot.maxDistance;
    controls.enabled = true;
    snapshot = null;
    fitOverview();
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

  function cancelFocus() {
    tween.cancel();
    if (!selected && !snapshot) gesture = {
      position: camera.position.clone(), target: controls.target.clone(), zoom: camera.zoom,
    };
  }
  function finishGesture() {
    if (gesture && (gesture.position.distanceToSquared(camera.position) > 1e-10 ||
        gesture.target.distanceToSquared(controls.target) > 1e-10 || gesture.zoom !== camera.zoom)) manualView = true;
    gesture = null;
    if (resizePending) fitOverview();
  }
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
    controls.addEventListener('end', finishGesture);
    controls.addEventListener('change', highlight.update);
    document.addEventListener('keydown', escape);
    offLang = on('lang:change', syncText);
    desktop.addEventListener('change', revealCard);
    window.addEventListener('resize', revealCard);
    offResize = on('scene:resize', resizeOverview);
    fitOverview();
  }

  function exit() {
    active = false;
    gesture = null;
    tween.cancel();
    close(true, false);
    pins.exit();
    content.remove();
    controls.removeEventListener('start', cancelFocus);
    controls.removeEventListener('end', finishGesture);
    controls.removeEventListener('change', highlight.update);
    document.removeEventListener('keydown', escape);
    offLang?.();
    offResize?.();
    desktop.removeEventListener('change', revealCard);
    window.removeEventListener('resize', revealCard);
    canvas.removeAttribute('tabindex');
    canvas.removeAttribute('aria-label');
  }

  function setModel(next) {
    model = next;
    referenceBounds = null;
    manualView = false;
    resizePending = false;
    firstOverview = true;
    pins.setModel(next);
    if (active) syncText();
  }

  return { enter, exit, open, setModel, refreshTransform };
}
