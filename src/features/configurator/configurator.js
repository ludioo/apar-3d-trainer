import { pickFromNdc } from '../../core/picking.js';
import { emit, on } from '../../core/events.js';
import { track } from '../../core/analytics.js';
import { getLang, t } from '../../i18n/i18n.js';
import { initHotspots } from './hotspots.js';
import { initAppearance } from './appearance.js';
import { calculatePrice, getSpecs } from './pricing.js';
import { initSavedConfigs } from '../../ui/saved-configs.js';
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
  const defaultConfiguration = { agentId: 'powder_abc', capacityId: '6kg', colorId: 'red', bracketEnabled: false };
  const configuration = { ...defaultConfiguration };
  let trainingAppearance = false;
  const saved = initSavedConfigs({ product, getConfiguration: () => configuration,
    applyConfiguration(next) {
      Object.assign(configuration, next);
      syncOptions();
      ui.refreshTransform(product.options.capacity.find((item) => item.id === configuration.capacityId).scale);
    },
  });
  const priceBox = document.createElement('div');
  priceBox.className = 'config-price';
  priceBox.setAttribute('aria-live', 'polite');
  priceBox.setAttribute('aria-atomic', 'true');
  const priceLabel = document.createElement('p');
  const priceValue = document.createElement('p');
  priceValue.className = 'config-price__value';
  priceBox.append(priceLabel, priceValue);
  const variantFields = ['agent', 'capacity'].map((key) => {
    const field = document.createElement('fieldset');
    const title = document.createElement('legend');
    const choices = document.createElement('div');
    choices.className = `config-choices config-${key}`;
    const buttons = product.options[key].map((item) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'config-choice';
      button.dataset[key] = item.id;
      button.addEventListener('click', () => {
        const changed = configuration[`${key}Id`] !== item.id;
        configuration[`${key}Id`] = item.id;
        syncOptions();
        if (key === 'capacity' && changed) ui.refreshTransform(item.scale);
        if (changed) track('variant_change', { option: key, value: item.id });
      });
      choices.appendChild(button);
      return { button, item };
    });
    field.append(title, choices);
    return { key, field, title, buttons };
  });
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
      const changed = configuration.colorId !== option.id;
      configuration.colorId = option.id;
      syncOptions();
      if (changed) track('variant_change', { option: 'color', value: option.id });
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
    const changed = configuration.bracketEnabled !== bracketToggle.checked;
    configuration.bracketEnabled = bracketToggle.checked;
    syncOptions();
    if (changed) track('variant_change', { option: 'bracket', value: bracketToggle.checked });
  });
  const status = document.createElement('p');
  status.className = 'config-status';
  status.setAttribute('role', 'status');
  const table = document.createElement('table');
  table.className = 'config-specs';
  const caption = document.createElement('caption');
  table.appendChild(caption);
  const specRows = product.specTemplate.map((key) => {
    const row = table.insertRow();
    const heading = document.createElement('th');
    heading.scope = 'row';
    const value = document.createElement('td');
    value.dataset.spec = key;
    row.append(heading, value);
    return { key, heading, value };
  });
  const note = document.createElement('p');
  note.className = 'config-note';
  const source = document.createElement('a');
  source.href = product.sources.fireClasses;
  source.target = '_blank';
  source.rel = 'noopener noreferrer';
  source.className = 'config-source';
  const exportButton = document.createElement('button');
  exportButton.type = 'button';
  exportButton.className = 'saved-button';
  exportButton.dataset.pdf = 'spec';
  const exportStatus = document.createElement('p');
  exportStatus.className = 'config-status';
  exportStatus.setAttribute('role', 'status');
  options.append(priceBox, ...variantFields.map(({ field }) => field), colors, bracketLabel, saved.element, status, table, note, source, exportButton, exportStatus);
  let model = null;
  let down = null;
  let colorAvailable = false;
  let active = false;
  let exporting = false;
  let exportMessage = '';
  let exportRequest = 0;
  let specification;
  exportButton.addEventListener('click', async () => {
    if (!active || !model || exporting) return;
    const request = ++exportRequest;
    const isCurrent = () => active && request === exportRequest;
    exporting = true;
    exportMessage = '';
    syncOptions();
    try {
      await context.exportSpec(specification, isCurrent);
    } catch {
      if (isCurrent()) exportMessage = 'pdf.error';
    } finally {
      if (isCurrent()) { exporting = false; syncOptions(); }
    }
  });

  function syncOptions() {
    const lang = getLang();
    const number = new Intl.NumberFormat(lang === 'id' ? 'id-ID' : 'en-US');
    const currency = lang === 'id' ? 'IDR' : 'USD';
    const totals = calculatePrice(product, configuration);
    const specs = getSpecs(product, configuration);
    const agentLabel = t(`config.agent.${configuration.agentId}`);
    const capacityLabel = `${number.format(specs.capacity)} ${t('unit.kg')}`;
    priceLabel.textContent = t('price.illustrative');
    priceValue.textContent = new Intl.NumberFormat(lang === 'id' ? 'id-ID' : 'en-US', {
      style: 'currency', currency, currencyDisplay: 'code', maximumFractionDigits: 0,
    }).format(totals[currency]);
    for (const { key, field, title, buttons } of variantFields) {
      title.textContent = t(`config.${key}`);
      field.disabled = !model;
      for (const { button, item } of buttons) {
        button.textContent = key === 'agent' ? t(`config.agent.${item.id}`) : `${number.format(item.kg)} ${t('unit.kg')}`;
        button.setAttribute('aria-pressed', String(configuration[`${key}Id`] === item.id));
      }
    }
    legend.textContent = t('config.color');
    for (const button of colorButtons) {
      button.textContent = t(`config.color.${button.dataset.color}`);
      button.setAttribute('aria-pressed', String(button.dataset.color === configuration.colorId));
    }
    colors.disabled = !model || !colorAvailable;
    bracketToggle.disabled = !model;
    bracketToggle.checked = configuration.bracketEnabled;
    bracketText.textContent = t('config.bracket');
    status.hidden = !!model && colorAvailable;
    status.textContent = t(model ? 'config.colorUnavailable' : 'config.loading');
    caption.textContent = t('spec.illustrative');
    const values = {
      agent: agentLabel, capacity: capacityLabel, fireClasses: specs.fireClasses.join(' / '),
      dischargeTime: `${number.format(specs.dischargeTime)} ${t('unit.seconds')}`,
      range: `${number.format(specs.range)} ${t('unit.meters')}`,
      weight: `${number.format(specs.weight)} ${t('unit.kg')}`,
    };
    for (const { key, heading, value } of specRows) {
      heading.textContent = t(`spec.${key}`);
      value.textContent = values[key];
    }
    specification = { rows: [
      ...specRows.map(({ key, heading, value }) => [heading.textContent,
        key === 'agent' && configuration.agentId === 'co2' ? t('pdf.co2') : value.textContent]),
      [t('config.color'), t(`config.color.${configuration.colorId}`)],
      [t('config.bracket'), t(configuration.bracketEnabled ? 'saved.bracketOn' : 'saved.bracketOff')],
    ], price: priceValue.textContent, note: t('config.illustrativeNote'), specSource: product.sources.fireClasses };
    exportButton.disabled = !model || exporting;
    exportButton.textContent = t(exporting ? 'pdf.busy' : 'pdf.spec');
    exportButton.setAttribute('aria-busy', String(exporting));
    exportStatus.textContent = exportMessage ? t(exportMessage) : '';
    note.textContent = t('config.illustrativeNote');
    source.textContent = t('spec.source');
    const display = trainingAppearance ? defaultConfiguration : configuration;
    const displayCapacity = product.options.capacity.find((item) => item.id === display.capacityId);
    appearance.apply(display, {
      agent: t(`config.agent.${display.agentId}`),
      capacity: `${number.format(displayCapacity.kg)} ${t('unit.kg')}`,
    });
    saved.setReady(!!model);
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
    active = true;
    exportMessage = '';
    panelBody.appendChild(options);
    saved.enter();
    syncOptions();
    ui.enter();
    canvas.addEventListener('pointerdown', pointerDown);
    canvas.addEventListener('pointerup', pointerUp);
    canvas.addEventListener('pointercancel', cancel);
  }

  function exit() {
    active = false;
    exportRequest++;
    exporting = false;
    cancel();
    canvas.removeEventListener('pointerdown', pointerDown);
    canvas.removeEventListener('pointerup', pointerUp);
    canvas.removeEventListener('pointercancel', cancel);
    ui.exit();
    saved.exit();
    options.remove();
  }

  function setModel(next) {
    model = next;
    colorAvailable = appearance.setModel(next);
    syncOptions();
    ui.setModel(next);
    ui.refreshTransform(product.options.capacity.find((item) => item.id === configuration.capacityId).scale);
  }

  on('lang:change', syncOptions);
  function setTrainingAppearance(enabled) {
    trainingAppearance = enabled;
    syncOptions();
  }
  return { enter, exit, setModel, setTrainingAppearance };
}
