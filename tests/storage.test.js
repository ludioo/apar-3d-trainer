import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { get, read, set } from '../src/core/storage.js';

function mockLocalStorage() {
  const values = new Map();
  let failRead = false;
  let failWrite = false;
  const api = {
    getItem(key) {
      if (failRead) throw new Error('Blocked');
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      if (failWrite) throw new Error('Quota');
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    },
    _values: values,
    setFailRead(v) {
      failRead = v;
    },
    setFailWrite(v) {
      failWrite = v;
    },
  };
  return api;
}

describe('storage', () => {
  let store;
  let original;

  beforeEach(() => {
    store = mockLocalStorage();
    original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: store,
    });
  });

  afterEach(() => {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else delete globalThis.localStorage;
  });

  it('reads empty, ok, and invalid states with prefix', () => {
    expect(read('configs')).toEqual({ status: 'empty' });
    expect(set('lang', 'id')).toBe(true);
    expect(store._values.get('apar3d:lang')).toBe('"id"');
    expect(get('lang')).toBe('id');
    store._values.set('apar3d:broken', '{');
    expect(read('broken').status).toBe('invalid');
    expect(get('broken', 'fallback')).toBe('fallback');
  });

  it('returns unavailable / false when localStorage throws', () => {
    store.setFailRead(true);
    expect(read('lang')).toEqual({ status: 'unavailable' });
    expect(get('lang', 'en')).toBe('en');
    store.setFailRead(false);
    store.setFailWrite(true);
    expect(set('lang', 'en')).toBe(false);
  });
});
