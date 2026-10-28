import { on } from '../../core/events.js';
import { clearUserData } from '../../core/storage.js';
import { getLang } from '../../i18n/i18n.js';
import { initResultsUi } from '../../ui/results.js';
import { buildResults, readParticipantName, saveParticipantName } from './results-data.js';
import questions from '../../data/quiz.json';
import hotspots from '../../data/hotspots.json';

export function initResults({ panelBody, product, getAttempts, getConfigs, hasUnsavedResult, resetSessions }) {
  let active = false;
  let offLang;
  let attempts;
  let configs;
  let nameStatus;
  let clearStatus = '';
  let dirty = false;
  const ui = initResultsUi(product, {
    editName() { dirty = true; nameStatus = ''; },
    saveName,
    clear() {
      dirty = false;
      ui.input.value = '';
      const result = clearUserData();
      resetSessions();
      clearStatus = result.status;
      refresh();
      ui.closeDialog();
    },
  });
  function render() {
    ui.render({ attempts, configs, report: buildResults(attempts.attempts ?? [], questions, hotspots, getLang()),
      nameStatus, clearStatus, unsaved: hasUnsavedResult() });
  }
  function refresh() {
    attempts = getAttempts();
    configs = getConfigs();
    const name = readParticipantName();
    if (!dirty) {
      ui.input.value = name.name ?? '';
      nameStatus = name.status === 'ok' ? '' : name.status;
    }
    render();
  }
  function saveName() {
    if (!dirty) return;
    const result = saveParticipantName(ui.input.value);
    nameStatus = result.status === 'ok' ? 'saved' : result.status;
    if (result.status === 'ok') { ui.input.value = result.name; dirty = false; }
    render();
  }
  return {
    enter() {
      active = true;
      clearStatus = '';
      panelBody.append(ui.element);
      ui.enter();
      refresh();
      offLang = on('lang:change', render);
      ui.focusHeading();
    },
    exit() {
      if (!active) return;
      saveName();
      active = false;
      offLang?.();
      ui.exit();
      ui.element.remove();
    },
  };
}
