import { emit } from './events.js';

const DEFAULT_MODE = 'configure';
const OVERLAY = 'about';

let modes = {};
let current = null;

export function parseHash(hash, registry) {
  const name = (hash || '').replace(/^#/, '');
  if (name === OVERLAY) return OVERLAY;
  return Object.hasOwn(registry, name) ? name : DEFAULT_MODE;
}

function activate(next) {
  if (next === current) return;
  const prev = current;
  if (prev) modes[prev].exit?.();
  current = next;
  modes[next].enter?.();
  emit('route:change', { mode: next, prev });
}

function sync() {
  const next = parseHash(location.hash, modes);
  if (next === OVERLAY) {
    activate(current ?? DEFAULT_MODE);
    emit('about:open');
    return;
  }
  if (location.hash !== `#${next}`) history.replaceState(null, '', `#${next}`);
  activate(next);
}

export function initRouter(registry) {
  modes = registry;
  addEventListener('hashchange', sync);
  sync();
}

export function closeOverlay() {
  if (location.hash === `#${OVERLAY}`) history.replaceState(null, '', `#${current}`);
}

export function getMode() {
  return current;
}
