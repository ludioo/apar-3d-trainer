const PREFIX = 'apar3d:';

export function read(key) {
  let raw;
  try {
    raw = localStorage.getItem(PREFIX + key);
  } catch {
    return { status: 'unavailable' };
  }
  if (raw === null) return { status: 'empty' };
  try {
    return { status: 'ok', value: JSON.parse(raw) };
  } catch {
    return { status: 'invalid' };
  }
}

export function get(key, fallback = null) {
  const result = read(key);
  return result.status === 'ok' ? result.value : fallback;
}

export function set(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
