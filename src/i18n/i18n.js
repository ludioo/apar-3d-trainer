import en from './en.json';
import id from './id.json';
import { get, set } from '../core/storage.js';
import { emit } from '../core/events.js';
import { track } from '../core/analytics.js';

const dict = { en, id };
let lang = 'en';

export function t(key) {
  return dict[lang][key] ?? dict.en[key] ?? key;
}

export function getLang() {
  return lang;
}

export function applyDom(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.title = t('app.title');
  document.documentElement.lang = lang;
}

export function setLang(next) {
  if (!Object.hasOwn(dict, next)) return;
  const changed = lang !== next;
  lang = next;
  set('lang', lang);
  applyDom();
  emit('lang:change', lang);
  if (changed) track('lang_change', { lang });
}

export function initLang() {
  const saved = get('lang');
  const browser = (navigator.language || '').toLowerCase().startsWith('id') ? 'id' : 'en';
  lang = Object.hasOwn(dict, saved ?? '') ? saved : browser;
  applyDom();
}
