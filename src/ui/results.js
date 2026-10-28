import { getLang, t } from '../i18n/i18n.js';
import { openModal, closeModal } from './modal.js';
import { renderHistory } from './results-chart.js';
import emergency from '../data/emergency.json';
import './results.css';

export function initResultsUi(product, actions) {
  function node(tag, parent, className = '') {
    const el = document.createElement(tag);
    el.className = className;
    parent?.append(el);
    return el;
  }
  const element = node('section', null, 'results');
  const heading = node('h3', element);
  heading.tabIndex = -1;
  const unsaved = node('p', element, 'results__error');
  const attemptStatus = node('p', element, 'results__muted');
  const train = node('button', element, 'results__button results__button--primary');
  train.type = 'button';
  train.dataset.route = 'train';
  train.addEventListener('click', () => { location.hash = 'train'; });
  const scoreCard = node('section', element, 'results__score-card');
  const ring = node('div', scoreCard, 'results__ring');
  const percentLabel = node('strong', ring);
  const scoreDetails = node('div', scoreCard, 'results__score-details');
  const score = node('p', scoreDetails, 'results__score');
  const passed = node('p', scoreDetails);
  const date = node('p', scoreDetails, 'results__muted');
  const duration = node('p', scoreDetails, 'results__muted');
  const historySection = node('section', element);
  const historyHeading = node('h3', historySection);
  const chart = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  chart.classList.add('results-chart');
  historySection.append(chart);
  const historyHint = node('p', historySection, 'results__muted');
  const table = node('table', element, 'results__answers');
  const caption = node('caption', table);
  const header = node('tr', node('thead', table));
  const headers = ['question', 'answer', 'outcome'].map(() => {
    const th = node('th', header);
    th.scope = 'col';
    return th;
  });
  const rows = node('tbody', table);
  const configsSection = node('section', element);
  const configsHeading = node('h3', configsSection);
  const configsStatus = node('p', configsSection, 'results__muted');
  const configsList = node('ul', configsSection, 'results__configs');
  const manage = node('button', configsSection, 'results__button');
  manage.type = 'button';
  manage.dataset.route = 'configure';
  manage.addEventListener('click', () => { location.hash = 'configure'; });
  const nameSection = node('section', element, 'results__name');
  const label = node('label', nameSection);
  label.htmlFor = 'participant-name';
  const input = node('input', nameSection);
  input.id = 'participant-name';
  input.type = 'text';
  input.maxLength = 60;
  input.autocomplete = 'name';
  input.setAttribute('aria-describedby', 'participant-hint participant-status participant-pdf-status');
  const nameHint = node('p', nameSection, 'results__muted');
  nameHint.id = 'participant-hint';
  const nameStatus = node('p', nameSection, 'results__muted');
  nameStatus.id = 'participant-status';
  nameStatus.setAttribute('role', 'status');
  input.addEventListener('input', () => {
    actions.editName();
    nameStatus.textContent = '';
    input.setAttribute('aria-invalid', 'false');
    exportStatus.textContent = '';
  });
  input.addEventListener('change', actions.saveName);
  input.addEventListener('blur', actions.saveName);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.isComposing) { event.preventDefault(); actions.saveName(); }
  });
  const exportReport = node('button', nameSection, 'results__button');
  exportReport.type = 'button';
  exportReport.dataset.pdf = 'report';
  nameSection.insertBefore(exportReport, nameStatus);
  exportReport.addEventListener('click', actions.exportReport);
  const exportStatus = node('p', nameSection, 'results__error');
  exportStatus.id = 'participant-pdf-status';
  exportStatus.setAttribute('role', 'status');
  const clear = node('button', element, 'results__button');
  clear.type = 'button';
  clear.dataset.results = 'clear';
  const clearStatus = node('p', element);
  clearStatus.setAttribute('role', 'status');
  const disclaimer = node('p', element, 'results__muted');
  const contacts = node('section', element, 'results__contacts');
  const emergencyHeading = node('h3', contacts);
  const fire = node('a', contacts);
  fire.href = `tel:${emergency.fire}`;
  const general = node('a', contacts);
  general.href = `tel:${emergency.general}`;
  const source = node('a', contacts);
  source.href = emergency.sourceUrl;
  source.target = '_blank';
  source.rel = 'noopener noreferrer';
  const dialog = node('dialog', null, 'modal results-dialog');
  const dialogBody = node('div', dialog, 'modal__body');
  const dialogHeading = node('h2', dialogBody, 'modal__title');
  dialogHeading.id = 'results-clear-title';
  dialog.setAttribute('aria-labelledby', dialogHeading.id);
  const explanation = node('p', dialogBody);
  explanation.id = 'results-clear-description';
  dialog.setAttribute('aria-describedby', explanation.id);
  const dialogActions = node('div', dialogBody, 'results__actions');
  const cancel = node('button', dialogActions, 'results__button');
  const confirm = node('button', dialogActions, 'results__button');
  cancel.type = confirm.type = 'button';
  cancel.dataset.results = 'cancel';
  confirm.dataset.results = 'confirm';
  let active = false;
  clear.addEventListener('click', () => {
    openModal(dialog, () => { if (active) clear.focus({ preventScroll: true }); });
    cancel.focus();
  });
  cancel.addEventListener('click', () => closeModal(dialog));
  confirm.addEventListener('click', actions.clear);

  function render(state) {
    const lang = getLang();
    const formatDate = (value) => new Intl.DateTimeFormat(lang, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
    const percent = new Intl.NumberFormat(lang, { style: 'percent', maximumFractionDigits: 1 });
    const latest = state.report.latest;
    heading.textContent = t('results.latest');
    unsaved.hidden = !state.unsaved;
    unsaved.textContent = t('results.unsaved');
    attemptStatus.hidden = !!latest;
    attemptStatus.className = state.attempts.status === 'ok' ? 'results__muted' : 'results__error';
    attemptStatus.textContent = t(state.attempts.status === 'ok' ? 'results.empty' : `results.${state.attempts.status}`);
    train.hidden = state.attempts.status !== 'ok' || !!latest;
    train.textContent = t('tabs.train');
    scoreCard.hidden = historySection.hidden = table.hidden = !latest;
    if (latest) {
      ring.style.setProperty('--score-angle', `${state.report.ratio * 360}deg`);
      percentLabel.textContent = percent.format(state.report.ratio);
      score.textContent = `${new Intl.NumberFormat(lang).format(latest.score)}/${new Intl.NumberFormat(lang).format(latest.total)}`;
      passed.textContent = t(latest.passed ? 'quiz.passed' : 'quiz.failed');
      date.textContent = formatDate(latest.finishedAt);
      duration.textContent = t('quiz.duration').replace('{seconds}', new Intl.NumberFormat(lang).format(latest.durationSec));
      historyHeading.textContent = t('results.history');
      historyHint.textContent = t('results.historyHint');
      renderHistory(chart, state.report.history, formatDate);
      caption.textContent = t('results.answers');
      headers.forEach((th, i) => { th.textContent = t(`results.${['question', 'answer', 'outcome'][i]}`); });
      rows.replaceChildren();
      for (const answer of state.report.rows) {
        const row = node('tr', rows);
        node('td', row).textContent = answer.question;
        node('td', row).textContent = answer.given;
        node('td', row, answer.correct ? 'results__correct' : 'results__error').textContent = t(answer.correct ? 'quiz.correct' : 'quiz.incorrect');
      }
    }
    configsHeading.textContent = t('saved.title');
    configsStatus.className = state.configs.status === 'ok' ? 'results__muted' : 'results__error';
    configsStatus.textContent = state.configs.status !== 'ok' ? t(`results.${state.configs.status}`)
      : state.configs.configs.length ? '' : t('saved.empty');
    configsList.replaceChildren();
    for (const entry of state.configs.configs ?? []) {
      const item = node('li', configsList);
      node('h4', item).textContent = entry.name;
      const capacity = product.options.capacity.find((option) => option.id === entry.capacity);
      node('p', item, 'results__muted').textContent = [t(`config.agent.${entry.agent}`),
        `${new Intl.NumberFormat(lang).format(capacity.kg)} ${t('unit.kg')}`, t(`config.color.${entry.color}`),
        t(entry.bracket ? 'saved.bracketOn' : 'saved.bracketOff')].join(' · ');
      const currency = lang === 'id' ? 'IDR' : 'USD';
      node('p', item).textContent = `${t('results.savedPrice')}: ${new Intl.NumberFormat(lang,
        { style: 'currency', currency, maximumFractionDigits: 0 }).format(entry.priceSnapshot[currency])}`;
    }
    manage.textContent = t('results.manage');
    label.textContent = t('results.name');
    nameHint.textContent = t('results.nameHint');
    nameStatus.textContent = state.nameStatus ? t(`results.${state.nameStatus}`) : '';
    exportReport.disabled = !latest || state.exporting;
    exportReport.textContent = t(state.exporting ? 'pdf.busy' : 'pdf.report');
    exportReport.setAttribute('aria-busy', String(!!state.exporting));
    exportStatus.textContent = state.exportStatus ? t(state.exportStatus) : '';
    nameStatus.className = state.nameStatus && state.nameStatus !== 'saved' ? 'results__error' : 'results__muted';
    input.setAttribute('aria-invalid', String(state.nameStatus === 'nameInvalid' || state.nameStatus === 'invalid' || state.exportStatus === 'pdf.nameUnsupported'));
    clear.textContent = dialogHeading.textContent = t('results.clear');
    explanation.textContent = t('results.clearConfirm');
    cancel.textContent = t('saved.cancel');
    confirm.textContent = t('results.confirm');
    clearStatus.textContent = state.clearStatus ? t(`results.clear.${state.clearStatus}`) : '';
    clearStatus.className = state.clearStatus && state.clearStatus !== 'ok' ? 'results__error' : 'results__muted';
    disclaimer.textContent = t('disclaimer');
    emergencyHeading.textContent = t('emergency.title');
    fire.textContent = t('emergency.fire');
    general.textContent = t('emergency.general');
    source.textContent = t('emergency.source');
  }
  return { element, input, render,
    enter() { active = true; document.body.append(dialog); },
    exit() { active = false; if (dialog.open) closeModal(dialog); dialog.remove(); },
    closeDialog() { closeModal(dialog); },
    focusHeading() { heading.focus({ preventScroll: true }); element.parentElement.scrollTop = 0; },
  };
}
