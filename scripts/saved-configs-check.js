import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { get, read, set } from '../src/core/storage.js';
import { listConfigs, saveConfig, loadConfig, deleteConfig } from '../src/features/configurator/saved-configs.js';

const product = JSON.parse(readFileSync(new URL('../src/data/product.json', import.meta.url), 'utf8'));
const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
const values = new Map();
let failRead = false;
let failWrite = false;
let writes = 0;
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
  getItem(key) { if (failRead) throw new Error('Blocked'); return values.get(key) ?? null; },
  setItem(key, value) { if (failWrite) throw new Error('Quota'); writes++; values.set(key, value); },
} });
const configuration = { agentId: 'co2', capacityId: '9kg', colorId: 'silver', bracketEnabled: true };
const raw = () => values.get('apar3d:configs');
try {
  assert.deepEqual(read('configs'), { status: 'empty' });
  assert.deepEqual(listConfigs(product), { status: 'ok', configs: [] });
  assert.equal(set('lang', 'id'), true);
  assert.equal(values.get('apar3d:lang'), '"id"');
  assert.equal(get('lang'), 'id');
  values.set('apar3d:broken', '{');
  assert.equal(read('broken').status, 'invalid');
  assert.equal(get('broken', 'fallback'), 'fallback');
  const first = saveConfig(product, '  <img src=x onerror=alert(1)>  ', configuration);
  assert.equal(first.status, 'ok');
  const entry = first.configs[0];
  assert.equal(entry.name, '<img src=x onerror=alert(1)>');
  assert.equal(entry.id.length, 32);
  assert.deepEqual(entry.priceSnapshot, { IDR: 1100000, USD: 71 });
  assert.deepEqual(loadConfig(product, entry.id), { status: 'ok', configuration });
  const changedCatalog = structuredClone(product);
  changedCatalog.basePrice.IDR += 100;
  assert.deepEqual(loadConfig(changedCatalog, entry.id), { status: 'ok', configuration });
  assert.equal(listConfigs(changedCatalog).configs[0].priceSnapshot.IDR, 1100000);
  assert.equal(JSON.parse(raw()).schemaVersion, 1);
  assert.equal(saveConfig(product, entry.name, configuration).configs.length, 2, 'duplicate names remain separate');
  assert.equal(new Set(listConfigs(product).configs.map((item) => item.id)).size, 2);
  assert.equal(saveConfig(product, '', configuration).status, 'nameInvalid');
  assert.equal(saveConfig(product, '   ', configuration).status, 'nameInvalid');
  assert.equal(saveConfig(product, 'a'.repeat(61), configuration).status, 'nameInvalid');
  assert.equal(saveConfig(product, 'a'.repeat(60), configuration).status, 'ok');
  assert.equal(saveConfig(product, 'Invalid', { ...configuration, capacityId: 'invalid' }).status, 'invalid');
  assert.equal(saveConfig(product, 'Invalid', { ...configuration, bracketEnabled: 1 }).status, 'invalid');
  for (let i = 3; i < 10; i++) assert.equal(saveConfig(product, `Config ${i}`, configuration).status, 'ok');
  const full = raw();
  const oldest = listConfigs(product).configs.at(-1);
  assert.equal(oldest.id, entry.id);
  assert.equal(saveConfig(product, '11th', configuration).status, 'changed');
  assert.equal(raw(), full, 'full list requires confirmation');
  failWrite = true;
  assert.equal(saveConfig(product, '11th', configuration, oldest).status, 'unavailable');
  assert.equal(raw(), full, 'failed replacement preserves all ten entries');
  assert.equal(deleteConfig(product, oldest).status, 'unavailable');
  assert.equal(raw(), full, 'failed delete preserves all entries');
  failWrite = false;
  const beforeReplace = writes;
  assert.equal(saveConfig(product, '11th', configuration, oldest).status, 'ok');
  assert.equal(writes, beforeReplace + 1, 'replacement is one atomic storage write');
  assert.equal(listConfigs(product).configs.length, 10);
  assert.equal(loadConfig(product, oldest.id).status, 'changed');
  assert.equal(deleteConfig(product, oldest).status, 'changed');
  const stale = listConfigs(product).configs[0];
  const edited = JSON.parse(raw());
  edited.configs[0].name = 'Changed in another tab';
  values.set('apar3d:configs', JSON.stringify(edited));
  const editedRaw = raw();
  assert.equal(deleteConfig(product, stale).status, 'changed');
  assert.equal(raw(), editedRaw);
  const latest = listConfigs(product).configs[0];
  assert.equal(deleteConfig(product, latest).status, 'ok');
  assert.equal(listConfigs(product).configs.length, 9);
  assert.equal(saveConfig(product, 'Changed full target', configuration, oldest).status, 'changed');
  const valid = raw();
  const badValues = ['{', 'null', '[]', JSON.stringify({ schemaVersion: 2, configs: [] })];
  for (const mutate of [
    (data) => { data.configs[0].capacity = 'invalid'; },
    (data) => { data.configs[0].bracket = 'true'; },
    (data) => { data.configs[0].priceSnapshot.IDR = -1; },
    (data) => { data.configs[0].priceSnapshot.USD = '71'; },
    (data) => { data.configs[0].createdAt = 'yesterday'; },
    (data) => { data.configs[0].name = ' '; },
    (data) => { data.configs[0].name = 'a'.repeat(61); },
    (data) => { data.configs[0] = null; },
    (data) => { data.configs[0].id = ''; },
    (data) => { data.configs[1].id = data.configs[0].id; },
    (data) => { data.configs = Array(11).fill(data.configs[0]); },
  ]) {
    const data = JSON.parse(valid);
    mutate(data);
    badValues.push(JSON.stringify(data));
  }
  for (const bad of badValues) {
    values.set('apar3d:configs', bad);
    assert.equal(listConfigs(product).status, 'invalid');
    assert.equal(saveConfig(product, 'Keep existing', configuration).status, 'invalid');
    assert.equal(loadConfig(product, latest.id).status, 'invalid');
    assert.equal(deleteConfig(product, latest).status, 'invalid');
    assert.equal(raw(), bad, 'invalid data must not be overwritten');
  }
  values.set('apar3d:configs', valid);
  failRead = true;
  assert.equal(read('configs').status, 'unavailable');
  assert.equal(get('lang', 'en'), 'en');
  assert.equal(listConfigs(product).status, 'unavailable');
  assert.equal(saveConfig(product, 'Blocked', configuration).status, 'unavailable');
  assert.equal(raw(), valid);
  failRead = false;
  while (listConfigs(product).configs.length) {
    assert.equal(deleteConfig(product, listConfigs(product).configs[0]).status, 'ok');
  }
  assert.deepEqual(listConfigs(product), { status: 'ok', configs: [] });
  assert.equal(get('lang'), 'id', 'config changes leave language storage unchanged');
  let combinations = 0;
  for (const agent of product.options.agent) for (const capacity of product.options.capacity) {
    for (const color of product.options.color) for (const bracketEnabled of [false, true]) {
      const variant = { agentId: agent.id, capacityId: capacity.id, colorId: color.id, bracketEnabled };
      const saved = saveConfig(product, 'Variant', variant);
      assert.equal(saved.status, 'ok');
      assert.deepEqual(loadConfig(product, saved.configs[0].id).configuration, variant);
      assert.equal(deleteConfig(product, saved.configs[0]).status, 'ok');
      combinations++;
    }
  }
  assert.equal(combinations, 96);
  console.log('Saved configurations: persistence, validation, 10-item limit, stale confirmation and storage failures PASS');
} finally {
  if (original) Object.defineProperty(globalThis, 'localStorage', original);
  else delete globalThis.localStorage;
}
