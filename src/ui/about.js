import emergency from '../data/emergency.json';

export function initAbout(dialog) {
  dialog.querySelector('[data-emergency="fire"]').href = `tel:${emergency.fire}`;
  dialog.querySelector('[data-emergency="general"]').href = `tel:${emergency.general}`;
  dialog.querySelector('[data-emergency="source"]').href = emergency.sourceUrl;
}
