import { pickFromNdc } from '../../core/picking.js';
import { emit, on } from '../../core/events.js';
import { t } from '../../i18n/i18n.js';
import { initHotspots } from './hotspots.js';
import { initAppearance } from './appearance.js';
import hotspots from '../../data/hotspots.json';
import product from '../../data/product.json';
import '../../ui/configurator.css';

const PICK_MAX_MOVE_PX = 5;

export function initConfigurator(context) {
  const { canvas, camera, panelBody, requestRender } = context;
  const ui = initHotspots(context);
  const appearance = initAppearance(product, requestRender);
  const options = document.createElement('div');
  options.className = 'config-options';
  const colors = document.createElement('fieldset');
  const legend = document.createElement('legend');
  const chips = document.createElement('div');
  chips.className = 'config-colors';
  const colorButtons = product.options.color.map((option) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'config-color';
    button.dataset.color = option.id;
    button.style.setProperty('--swatch', option.hex);
    button.addEventListener('click', () => {
      colorId = option.id;
      appearance.apply(colorId, bracketEnabled);
      syncOptions();
    });
    chips.appendChild(button);
    return button;
  });
  colors.append(legend, chips);
  const bracketLabel = document.createElement('label');
  bracketLabel.className = 'config-bracket';
  const bracketToggle = document.createElement('input');
  bracketToggle.type = 'checkbox';
  bracketToggle.setAttribute('role', 'switch');
  const bracketText = document.createElement('span');
  bracketLabel.append(bracketToggle, bracketText);
  bracketToggle.addEventListener('change', () => {
    bracketEnabled = bracketToggle.checked;
    appearance.apply(colorId, bracketEnabled);
  });
  const status = document.createElement('p');
  status.className = 'config-status';
  status.setAttribute('role', 'status');
  options.append(colors, bracketLabel, status);
  let model = null;
  let down = null;
  let colorId = 'red';
  let bracketEnabled = false;
  let colorAvailable = false;
  let offLang;

  function syncOptions() {
    legend.textContent = t('config.color');
    for (const button of colorButtons) {
      button.textContent = t(`config.color.${button.dataset.color}`);
      button.setAttribute('aria-pressed', String(button.dataset.color === colorId));
    }
    colors.disabled = !model || !colorAvailable;
    bracketToggle.disabled = !model;
    bracketToggle.checked = bracketEnabled;
    bracketText.textContent = t('config.bracket');
    status.hidden = !!model && colorAvailable;
    status.textContent = t(model ? 'config.colorUnavailable' : 'config.loading');
  }

  function pointerDown(event) {
    if (event.button === 0 && event.isPrimary) {
      down = { x: event.clientX, y: event.clientY, id: event.pointerId };
    } else down = null;
  }

  function pointerUp(event) {
    const start = down;
    down = null;
    if (!model || !start || event.pointerId !== start.id || event.button !== 0) return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > PICK_MAX_MOVE_PX) return;
    const rect = canvas.getBoundingClientRect();
    const result = pickFromNdc(
      (event.clientX - rect.left) / rect.width * 2 - 1,
      -(event.clientY - rect.top) / rect.height * 2 + 1,
      camera, model, hotspots,
    );
    emit('hotspot:pick', result);
    if (result.hotspot) ui.open(result.hotspot);
  }

  const cancel = () => { down = null; };
  function enter() {
    panelBody.appendChild(options);
    syncOptions();
    offLang = on('lang:change', syncOptions);
    ui.enter();
    canvas.addEventListener('pointerdown', pointerDown);
    canvas.addEventListener('pointerup', pointerUp);
    canvas.addEventListener('pointercancel', cancel);
  }

  function exit() {
    cancel();
    canvas.removeEventListener('pointerdown', pointerDown);
    canvas.removeEventListener('pointerup', pointerUp);
    canvas.removeEventListener('pointercancel', cancel);
    ui.exit();
    offLang?.();
    options.remove();
  }

  function setModel(next) {
    model = next;
    colorAvailable = appearance.setModel(next);
    appearance.apply(colorId, bracketEnabled);
    syncOptions();
    ui.setModel(next);
  }

  return { enter, exit, setModel };
}
