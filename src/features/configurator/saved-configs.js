import { read, set } from '../../core/storage.js';
import { calculatePrice } from './pricing.js';

export const MAX_CONFIGS = 10;
export const MAX_NAME_LENGTH = 60;
const SCHEMA_VERSION = 1;
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function validName(name) {
  return typeof name === 'string' && name.trim().length > 0 && name.length <= MAX_NAME_LENGTH;
}

function validConfiguration(product, configuration) {
  return object(configuration) && typeof configuration.bracketEnabled === 'boolean'
    && ['agent', 'capacity', 'color'].every((key) =>
      product.options[key].some((option) => option.id === configuration[`${key}Id`]));
}

function configurationOf(entry) {
  return { agentId: entry.agent, capacityId: entry.capacity, colorId: entry.color, bracketEnabled: entry.bracket };
}

function validEntry(product, entry) {
  if (!object(entry) || typeof entry.id !== 'string' || !entry.id.trim() || entry.id.length > 100
    || !validName(entry.name) || typeof entry.createdAt !== 'string') return false;
  const date = new Date(entry.createdAt);
  return Number.isFinite(date.getTime()) && date.toISOString() === entry.createdAt
    && validConfiguration(product, configurationOf(entry)) && object(entry.priceSnapshot)
    && ['IDR', 'USD'].every((currency) => Number.isFinite(entry.priceSnapshot[currency]) && entry.priceSnapshot[currency] >= 0);
}

export function listConfigs(product) {
  const result = read('configs');
  if (result.status === 'empty') return { status: 'ok', configs: [] };
  if (result.status !== 'ok') return result;
  const data = result.value;
  if (!object(data) || data.schemaVersion !== SCHEMA_VERSION || !Array.isArray(data.configs)
    || data.configs.length > MAX_CONFIGS || !data.configs.every((entry) => validEntry(product, entry))
    || new Set(data.configs.map((entry) => entry.id)).size !== data.configs.length) return { status: 'invalid' };
  return { status: 'ok', configs: [...data.configs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) };
}

function writeConfigs(configs) {
  // shortcut: read/modify/write is not transactional across tabs; use Web Locks if simultaneous writers are required.
  return set('configs', { schemaVersion: SCHEMA_VERSION, configs })
    ? { status: 'ok', configs } : { status: 'unavailable' };
}

export function saveConfig(product, name, configuration, expectedOldest = null) {
  if (typeof name !== 'string' || !validName(name.trim())) return { status: 'nameInvalid' };
  if (!validConfiguration(product, configuration)) return { status: 'invalid' };
  const result = listConfigs(product);
  if (result.status !== 'ok') return result;
  const oldest = result.configs.length === MAX_CONFIGS ? result.configs.at(-1) : null;
  if (!same(oldest, expectedOldest)) return { status: 'changed', configs: result.configs };
  const entry = {
    id: Array.from(crypto.getRandomValues(new Uint32Array(4)), (value) => value.toString(16).padStart(8, '0')).join(''),
    name: name.trim(), createdAt: new Date().toISOString(),
    agent: configuration.agentId, capacity: configuration.capacityId,
    color: configuration.colorId, bracket: configuration.bracketEnabled,
    priceSnapshot: calculatePrice(product, configuration),
  };
  const configs = oldest ? result.configs.slice(0, -1) : result.configs;
  return writeConfigs([entry, ...configs]);
}

export function loadConfig(product, id) {
  const result = listConfigs(product);
  if (result.status !== 'ok') return result;
  const entry = result.configs.find((item) => item.id === id);
  return entry ? { status: 'ok', configuration: configurationOf(entry) } : { status: 'changed', configs: result.configs };
}

export function deleteConfig(product, expectedEntry) {
  const result = listConfigs(product);
  if (result.status !== 'ok') return result;
  const current = result.configs.find((entry) => entry.id === expectedEntry.id);
  if (!same(current, expectedEntry)) return { status: 'changed', configs: result.configs };
  return writeConfigs(result.configs.filter((entry) => entry.id !== expectedEntry.id));
}
