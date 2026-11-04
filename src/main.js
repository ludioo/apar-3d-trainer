import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './ui/components.css';
import { on } from './core/events.js';
import { initLang, getLang, setLang, t } from './i18n/i18n.js';
import { closeOverlay } from './core/router.js';
import { openModal, closeModal } from './ui/modal.js';
import { initSheet } from './ui/sheet.js';
import { initAbout } from './ui/about.js';
import { initEmergencyChrome } from './ui/emergency-chrome.js';

const langToggle = document.querySelector('.lang-toggle');
const langButtons = langToggle.querySelectorAll('[data-lang]');
function syncLangToggle() {
  langToggle.setAttribute('aria-label', t('lang.label'));
  langButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === getLang())));
}
langButtons.forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
on('lang:change', syncLangToggle);
initLang();
syncLangToggle();
initEmergencyChrome(document.querySelector('.emergency-chrome'));

const tabs = document.querySelector('.tabs');
const tabLinks = tabs.querySelectorAll('.tab');
const panel = document.getElementById('panel');
const panelTitle = document.getElementById('panel-title');
const sheetHandle = panel.querySelector('.panel__handle');
const about = document.getElementById('about');
initAbout(about);
let mode;

function syncChrome() {
  tabs.setAttribute('aria-label', t('nav.label'));
  const { current = 'half', next = 'full' } = sheetHandle.dataset;
  sheetHandle.setAttribute('aria-label', current === next ? t('sheet.fixed')
    : t('sheet.toggle').replace('{current}', t(`sheet.${current}`)).replace('{next}', t(`sheet.${next}`)));
  if (mode) panelTitle.textContent = t(`tabs.${mode}`);
}
on('lang:change', syncChrome);
on('sheet:change', syncChrome);
on('route:change', (route) => {
  mode = route.mode;
  tabLinks.forEach((a) => {
    if (a.hash === `#${mode}`) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  syncChrome();
  if (route.prev && location.hash !== '#about' && !document.body.classList.contains('has-webgl-fallback')) {
    const heading = panel.querySelector('.training h3, .quiz h3') ?? panelTitle;
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }
});
on('about:open', () => {
  openModal(about, () => {
    closeOverlay();
    document.querySelector('.topbar__about').focus({ preventScroll: true });
  });
  document.getElementById('about-title').focus();
});
on('about:close', () => { if (about.open) closeModal(about); });
about.querySelector('.modal__close').addEventListener('click', () => closeModal(about));
initSheet(panel, sheetHandle);
syncChrome();
new ResizeObserver(([entry]) => {
  document.documentElement.style.setProperty('--topbar-h', `${entry.target.getBoundingClientRect().height}px`);
}).observe(document.querySelector('.topbar'));

const root = document.getElementById('canvas-root');
// Paint shell/splash first; three.js lives in viewer.js and must not block LCP render delay.
function bootViewer() {
  import('./viewer.js')
    .then(({ startViewer }) => startViewer(root))
    .catch((error) => {
      console.error('Viewer failed to load', error);
      const splash = document.getElementById('splash');
      if (!splash) return;
      splash.querySelectorAll('.splash__text, .splash__bar, .splash__percent').forEach((el) => { el.hidden = true; });
      const slow = splash.querySelector('.splash__slow');
      const err = splash.querySelector('.splash__error');
      const retry = splash.querySelector('.splash__retry');
      if (slow) slow.hidden = true;
      if (err) err.hidden = false;
      if (retry) {
        retry.hidden = false;
        retry.focus();
        retry.addEventListener('click', () => location.reload(), { once: true });
      }
    });
}
requestAnimationFrame(() => {
  // Yield so the static splash (inline CSS + FireDrill text) can commit as LCP before three.js eval.
  requestAnimationFrame(() => {
    setTimeout(bootViewer, 100);
  });
});
