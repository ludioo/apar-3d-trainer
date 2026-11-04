import { get, set } from '../../core/storage.js';
import { t } from '../../i18n/i18n.js';
import { ONBOARDING_KEY, shouldStartOnboarding } from './onboarding-gate.js';

export { ONBOARDING_KEY, shouldStartOnboarding };

export function markOnboardingSeen() {
  return set(ONBOARDING_KEY, true);
}

function prefersReducedMotion() {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
}

function isAboutOpen() {
  return document.getElementById('about')?.open === true;
}

function canStartTour() {
  if (!shouldStartOnboarding(get(ONBOARDING_KEY, false))) return false;
  if (document.documentElement.classList.contains('has-webgl-fallback')) return false;
  if (isAboutOpen()) return false;
  return true;
}

/**
 * Lazy-start first-visit tour. No-op when already seen, About open, or WebGL fallback.
 * @param {{ enabled?: boolean }} [opts]
 */
export async function maybeStartOnboarding(opts = {}) {
  if (opts.enabled === false) return { started: false, reason: 'disabled' };
  if (!canStartTour()) {
    return { started: false, reason: 'blocked' };
  }

  let driverMod;
  try {
    [driverMod] = await Promise.all([
      import('driver.js'),
      import('driver.js/dist/driver.css'),
      import('../../ui/onboarding.css'),
    ]);
  } catch {
    return { started: false, reason: 'import-failed' };
  }

  if (!canStartTour()) {
    return { started: false, reason: 'blocked' };
  }

  const reduced = prefersReducedMotion();
  const { driver } = driverMod;
  document.documentElement.classList.add('is-onboarding');

  const finish = () => {
    markOnboardingSeen();
    document.documentElement.classList.remove('is-onboarding');
  };

  try {
    const driverObj = driver({
      animate: !reduced,
      overlayOpacity: 0.55,
      overlayColor: '#111111',
      stagePadding: 8,
      stageRadius: 8,
      allowClose: true,
      overlayClickBehavior: 'close',
      skipMissingElement: true,
      showProgress: true,
      progressText: '{{current}} / {{total}}',
      nextBtnText: t('tour.next'),
      doneBtnText: t('tour.done'),
      closeBtnLabel: t('tour.skip'),
      popoverClass: 'firedrill-tour',
      steps: [
        {
          element: '#panel',
          popover: {
            title: t('tour.configure.title'),
            description: t('tour.configure.body'),
            side: 'left',
            align: 'start',
            showButtons: ['next', 'close'],
          },
        },
        {
          element: '.hotspot-pin[data-hotspot="handle"]',
          popover: {
            title: t('tour.hotspot.title'),
            description: t('tour.hotspot.body'),
            side: 'bottom',
            align: 'start',
            showButtons: ['next', 'close'],
          },
        },
        {
          element: '.tab[href="#train"]',
          popover: {
            title: t('tour.train.title'),
            description: t('tour.train.body'),
            side: 'bottom',
            align: 'start',
            showButtons: ['next', 'close'],
          },
        },
        {
          element: '.tab[href="#results"]',
          popover: {
            title: t('tour.results.title'),
            description: t('tour.results.body'),
            side: 'bottom',
            align: 'end',
            showButtons: ['next', 'close'],
          },
        },
      ],
      onDestroyed: () => finish(),
    });

    driverObj.drive();
    return { started: true, reduced };
  } catch (error) {
    document.documentElement.classList.remove('is-onboarding');
    console.error('Onboarding tour failed', error);
    return { started: false, reason: 'drive-failed' };
  }
}
