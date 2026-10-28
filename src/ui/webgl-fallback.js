import { on } from '../core/events.js';
import { t } from '../i18n/i18n.js';

export function showWebglFallback() {
  document.body.classList.add('has-webgl-fallback');
  for (const selector of ['#canvas-root', '#panel', '#splash', '.tabs', '.viewer-tools']) {
    document.querySelector(selector).hidden = true;
  }
  const fallback = document.getElementById('webgl-fallback');
  const image = fallback.querySelector('img');
  image.src = '/images/apar-fallback.webp';
  const sync = () => { image.alt = t('fallback.image'); };
  sync();
  on('lang:change', sync);
  fallback.hidden = false;
}
