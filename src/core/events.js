const bus = new EventTarget();

export function on(name, fn) {
  const handler = (e) => fn(e.detail);
  bus.addEventListener(name, handler);
  return () => bus.removeEventListener(name, handler);
}

export function emit(name, detail) {
  bus.dispatchEvent(new CustomEvent(name, { detail }));
}
