import { beforeEach, describe, expect, it, vi } from 'vitest';

const values = new Map();

beforeEach(() => {
  values.clear();
  vi.resetModules();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem(key) {
        return values.get(key) ?? null;
      },
      setItem(key, value) {
        values.set(key, value);
      },
      removeItem(key) {
        values.delete(key);
      },
    },
  });
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      title: '',
      documentElement: { lang: 'en' },
      querySelectorAll: () => [],
    },
  });
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { language: 'en-US' },
  });
  Object.defineProperty(globalThis, 'location', {
    configurable: true,
    value: { hostname: 'localhost' },
  });
});

describe('i18n lookup', () => {
  it('resolves known keys and falls back to the key string', async () => {
    const { t, setLang, getLang } = await import('../src/i18n/i18n.js');
    expect(t('app.title')).toBeTruthy();
    expect(t('app.title')).not.toBe('app.title');
    expect(t('__missing.key__')).toBe('__missing.key__');

    setLang('id');
    expect(getLang()).toBe('id');
    expect(t('app.title')).toBeTruthy();
    expect(values.get('apar3d:lang')).toBe('"id"');
  });
});
