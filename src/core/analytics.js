const DOMAIN = 'trainer.barkahmauludi.com';
const websiteId = import.meta.env?.VITE_UMAMI_WEBSITE_ID;
let scheduled = false;
let ready = false;
const enabled = () => !!websiteId && globalThis.location?.hostname === DOMAIN;

export function initAnalytics() {
  if (!enabled() || scheduled) return;
  scheduled = true;
  const insert = () => {
    try {
      const script = document.createElement('script');
      script.src = 'https://cloud.umami.is/script.js';
      script.defer = true;
      script.dataset.websiteId = websiteId;
      script.dataset.domains = DOMAIN;
      script.addEventListener('load', () => { ready = true; }, { once: true });
      document.head.appendChild(script);
    } catch { /* Analytics must not interrupt the trainer. */ }
  };
  if (window.requestIdleCallback) window.requestIdleCallback(insert);
  else setTimeout(insert, 0);
}

export function track(name, data) {
  if (!enabled() || !ready) return;
  try {
    window.umami?.track?.(name, data)?.catch?.(() => {});
  } catch { /* A blocked or failing tracker must not interrupt user actions. */ }
}
