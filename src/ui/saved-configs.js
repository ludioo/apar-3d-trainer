import { listConfigs, saveConfig, loadConfig, deleteConfig, MAX_CONFIGS, MAX_NAME_LENGTH } from '../features/configurator/saved-configs.js';
import { t } from '../i18n/i18n.js';
import { on } from '../core/events.js';
import { openModal, closeModal } from './modal.js';
import { showToast } from './toast.js';
import './saved-configs.css';

export function initSavedConfigs({ product, getConfiguration, applyConfiguration }) {
  const element = document.createElement('section');
  element.className = 'saved-configs';
  element.setAttribute('aria-labelledby', 'saved-configs-title');
  const save = document.createElement('button');
  save.type = 'button';
  save.className = 'saved-button saved-button--primary';
  save.dataset.action = 'save';
  const title = document.createElement('h3');
  title.id = 'saved-configs-title';
  const status = document.createElement('p');
  status.className = 'saved-status';
  status.setAttribute('role', 'status');
  const list = document.createElement('ul');
  list.className = 'saved-list';
  element.append(save, title, status, list);

  const dialog = document.createElement('dialog');
  dialog.className = 'modal saved-dialog';
  dialog.setAttribute('aria-labelledby', 'saved-dialog-title');
  const form = document.createElement('form');
  form.className = 'modal__body';
  form.noValidate = true;
  const heading = document.createElement('h2');
  heading.id = 'saved-dialog-title';
  heading.className = 'modal__title';
  const label = document.createElement('label');
  label.htmlFor = 'saved-name';
  const input = document.createElement('input');
  input.id = 'saved-name';
  input.name = 'name';
  input.type = 'text';
  input.required = true;
  input.maxLength = MAX_NAME_LENGTH;
  const explanation = document.createElement('p');
  explanation.id = 'saved-dialog-explanation';
  dialog.setAttribute('aria-describedby', explanation.id);
  const error = document.createElement('p');
  error.id = 'saved-dialog-error';
  error.className = 'saved-error';
  error.setAttribute('role', 'alert');
  input.setAttribute('aria-describedby', `${explanation.id} ${error.id}`);
  const actions = document.createElement('div');
  actions.className = 'saved-actions';
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'saved-button';
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'saved-button saved-button--primary';
  actions.append(cancel, submit);
  form.append(heading, label, input, explanation, error, actions);
  dialog.append(form);
  let ready = false;
  let result = { status: 'ok', configs: [] };
  let pending = null;
  let trigger = null;
  let errorKey = null;
  let active = false;

  const message = (key, name) => t(key).replace('{name}', () => name);
  function syncDialog() {
    if (!pending) return;
    const saving = pending.type === 'save';
    heading.textContent = t(saving ? 'saved.save' : 'saved.delete');
    label.textContent = t('saved.name');
    label.hidden = input.hidden = !saving;
    input.disabled = !saving;
    cancel.textContent = t('saved.cancel');
    submit.textContent = t(saving ? (pending.oldest ? 'saved.replace' : 'saved.save') : 'saved.delete');
    explanation.textContent = saving
      ? (pending.oldest ? message('saved.full', pending.oldest.name) : t('saved.nameHint'))
      : message('saved.deleteConfirm', pending.entry.name);
    error.textContent = errorKey ? t(errorKey) : '';
    input.setAttribute('aria-invalid', String(errorKey === 'saved.nameInvalid'));
  }

  function render() {
    const focused = element.contains(document.activeElement) ? { ...document.activeElement.dataset } : null;
    save.textContent = t('saved.save');
    title.textContent = t('saved.title');
    save.disabled = !ready || result.status !== 'ok';
    status.textContent = result.status !== 'ok' ? t(`saved.${result.status}`)
      : result.configs.length ? '' : t('saved.empty');
    list.replaceChildren();
    if (result.status !== 'ok') return;
    for (const entry of result.configs) {
      const row = document.createElement('li');
      const name = document.createElement('h4');
      name.textContent = entry.name;
      const summary = document.createElement('p');
      summary.className = 'saved-summary';
      const capacity = product.options.capacity.find((option) => option.id === entry.capacity);
      summary.textContent = [t(`config.agent.${entry.agent}`), `${capacity.kg} ${t('unit.kg')}`,
        t(`config.color.${entry.color}`), t(entry.bracket ? 'saved.bracketOn' : 'saved.bracketOff')].join(' · ');
      const buttons = document.createElement('div');
      buttons.className = 'saved-actions';
      for (const action of ['load', 'delete']) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'saved-button';
        button.dataset.action = action;
        button.dataset.id = entry.id;
        button.textContent = t(`saved.${action}`);
        button.setAttribute('aria-label', message(`saved.${action}Label`, entry.name));
        button.disabled = action === 'load' && !ready;
        button.addEventListener('click', () => action === 'load' ? load(entry.id) : open('delete', button, entry));
        buttons.append(button);
      }
      row.append(name, summary, buttons);
      list.append(row);
    }
    if (focused?.action) {
      const target = [...element.querySelectorAll('button')].find((button) =>
        button.dataset.action === focused.action && button.dataset.id === focused.id);
      (target ?? save).focus({ preventScroll: true });
    }
  }

  function refresh() {
    result = listConfigs(product);
    render();
  }

  function open(type, source, entry) {
    refresh();
    if (result.status !== 'ok') return;
    pending = { type, entry, oldest: result.configs.length === MAX_CONFIGS ? result.configs.at(-1) : null,
      configuration: { ...getConfiguration() } };
    trigger = source;
    errorKey = null;
    if (type === 'save') input.value = t('saved.defaultName').replace('{n}', result.configs.length + 1);
    syncDialog();
    openModal(dialog, () => {
      pending = null;
      if (!active) return;
      const target = trigger?.isConnected ? trigger : [...list.querySelectorAll('button')].find((button) =>
        button.dataset.action === trigger?.dataset.action && button.dataset.id === trigger?.dataset.id) ?? save;
      target.focus();
    });
    if (type === 'save') { input.focus(); input.select(); }
    else cancel.focus();
  }

  function load(id) {
    const loaded = loadConfig(product, id);
    if (loaded.status === 'ok') {
      applyConfiguration(loaded.configuration);
      showToast(t('saved.loaded'));
    } else {
      refresh();
      save.focus();
      showToast(t(`saved.${loaded.status}`));
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!pending) return;
    if (pending.type === 'save' && !input.value.trim()) {
      errorKey = 'saved.nameInvalid';
      syncDialog();
      input.focus();
      return;
    }
    const saving = pending.type === 'save';
    const next = saving ? saveConfig(product, input.value, pending.configuration, pending.oldest)
      : deleteConfig(product, pending.entry);
    if (next.status === 'ok') {
      result = next;
      render();
      closeModal(dialog);
      showToast(t(saving ? 'saved.saved' : 'saved.deleted'));
    } else if (next.status === 'changed') {
      result = { status: 'ok', configs: next.configs };
      render();
      if (saving) pending.oldest = next.configs.length === MAX_CONFIGS ? next.configs.at(-1) : null;
      else pending.entry = next.configs.find((entry) => entry.id === pending.entry.id);
      if (!saving && !pending.entry) {
        closeModal(dialog);
        showToast(t('saved.changed'));
        return;
      }
      errorKey = 'saved.changed';
      syncDialog();
      cancel.focus();
    } else {
      errorKey = `saved.${next.status}`;
      refresh();
      syncDialog();
      showToast(t(errorKey));
    }
  });
  save.addEventListener('click', () => open('save', save));
  cancel.addEventListener('click', () => closeModal(dialog));
  on('lang:change', () => { render(); syncDialog(); });
  return {
    element,
    enter() { active = true; document.body.append(dialog); refresh(); },
    exit() { active = false; if (dialog.open) closeModal(dialog); pending = null; dialog.remove(); },
    setReady(value) { if (ready !== value) { ready = value; render(); } },
  };
}
