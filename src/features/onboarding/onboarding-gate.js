export const ONBOARDING_KEY = 'onboarding';

/** @param {unknown} flag */
export function shouldStartOnboarding(flag) {
  return flag !== true;
}
