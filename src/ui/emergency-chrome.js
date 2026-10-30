import emergency from '../data/emergency.json';

export function initEmergencyChrome(root) {
  root.querySelector('[data-emergency="fire"]').href = `tel:${emergency.fire}`;
  root.querySelector('[data-emergency="general"]').href = `tel:${emergency.general}`;
  root.querySelector('[data-emergency="source"]').href = emergency.sourceUrl;
}
