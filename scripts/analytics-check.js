import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../src/core/analytics.js', import.meta.url), 'utf8');
function setup({ id = 'test-website', hostname = 'trainer.barkahmauludi.com', idle = true, appendFails = false } = {}) {
  const scripts = [], tasks = [], calls = [];
  const window = { umami: { track: (...args) => { calls.push(args); } } };
  if (idle) window.requestIdleCallback = (fn) => tasks.push(fn);
  const context = { window, location: { hostname }, setTimeout: (fn) => tasks.push(fn),
    document: { createElement: () => ({ dataset: {}, addEventListener(name, fn) { this[name] = fn; } }),
      head: { appendChild(script) { if (appendFails) throw Error('blocked'); scripts.push(script); } } } };
  runInNewContext(source.replace('import.meta.env', JSON.stringify({ VITE_UMAMI_WEBSITE_ID: id }))
    .replaceAll('export function', 'function') + '\nglobalThis.api = { initAnalytics, track };', context);
  return { ...context.api, window, scripts, tasks, calls };
}

for (const options of [{ id: '' }, { id: null }, { hostname: 'localhost' },
  { hostname: '127.0.0.1' }, { hostname: 'apar-3d-trainer.vercel.app' },
  { hostname: 'trainer.barkahmauludi.com.evil.example' }]) {
  const s = setup(options);
  s.initAnalytics(); s.track('training_start', {});
  assert.equal(s.tasks.length + s.scripts.length + s.calls.length, 0, 'disabled analytics is silent');
}
for (const idle of [true, false]) {
  const s = setup({ idle });
  s.track('training_start', {});
  s.initAnalytics(); s.initAnalytics();
  assert.equal(s.tasks.length, 1, 'Retry must not schedule another script');
  assert.equal(s.scripts.length, 0, 'script waits for idle/timer');
  s.tasks[0]();
  const script = s.scripts[0];
  assert.equal(script.src, 'https://cloud.umami.is/script.js');
  assert.equal(script.defer, true);
  assert.equal(script.dataset.websiteId, 'test-website');
  assert.equal(script.dataset.domains, 'trainer.barkahmauludi.com');
  s.track('training_start', {});
  assert.equal(s.calls.length, 0, 'no early calls, even with pre-existing umami');
  script.load();
  s.track('quiz_finish', { score: 6, total: 8, passed: true });
  assert.equal(s.calls.length, 1, 'early events are not replayed');
  assert.deepEqual(s.calls[0], ['quiz_finish', { score: 6, total: 8, passed: true }]);
  s.window.umami = undefined;
  assert.doesNotThrow(() => s.track('training_start', {}));
  s.window.umami = { track() { throw Error('tracker failure'); } };
  assert.doesNotThrow(() => s.track('training_start', {}));
  s.window.umami = { track: () => Promise.reject(Error('network failure')) };
  s.track('training_start', {});
  await new Promise((resolve) => setImmediate(resolve));
  s.initAnalytics();
  assert.equal(s.scripts.length, 1);
}
const blocked = setup({ appendFails: true });
blocked.initAnalytics();
assert.doesNotThrow(() => blocked.tasks[0]());
blocked.track('training_start', {});
assert.equal(blocked.calls.length, 0);
console.log('Analytics: domain/env gates, idle/timer, one script, no early replay, blocked/throw/rejection safety passed');
