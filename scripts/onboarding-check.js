import assert from 'node:assert/strict';
import { ONBOARDING_KEY, shouldStartOnboarding } from '../src/features/onboarding/onboarding-gate.js';
import { get, set } from '../src/core/storage.js';

assert.equal(ONBOARDING_KEY, 'onboarding');
assert.equal(shouldStartOnboarding(undefined), true);
assert.equal(shouldStartOnboarding(null), true);
assert.equal(shouldStartOnboarding(false), true);
assert.equal(shouldStartOnboarding(true), false);
assert.equal(shouldStartOnboarding('yes'), true, 'only boolean true counts as seen');

const mem = new Map();
const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key) => (mem.has(key) ? mem.get(key) : null),
    setItem: (key, value) => {
      mem.set(key, String(value));
    },
    removeItem: (key) => {
      mem.delete(key);
    },
  },
});
try {
  assert.equal(get(ONBOARDING_KEY, false), false);
  assert.equal(set(ONBOARDING_KEY, true), true);
  assert.equal(get(ONBOARDING_KEY, false), true);
  assert.equal(shouldStartOnboarding(get(ONBOARDING_KEY, false)), false);
  set(ONBOARDING_KEY, false);
  assert.equal(shouldStartOnboarding(get(ONBOARDING_KEY, false)), true);
} finally {
  if (original) Object.defineProperty(globalThis, 'localStorage', original);
  else delete globalThis.localStorage;
}

console.log('onboarding-check: ok');
