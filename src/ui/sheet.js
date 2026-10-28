import { emit } from '../core/events.js';

const SNAP_NAMES = ['peek', 'half', 'full'];
const TAP_PX = 6;

export function sheetBounds(viewportHeight, availableHeight, minimumHeight) {
  return [0.25, 0.5, 0.75].map((fraction) =>
    Math.min(Math.max(viewportHeight * fraction, minimumHeight), availableHeight));
}

export function nearestSnap(visiblePx, snapsPx) {
  return snapsPx.reduce((a, b) => (Math.abs(b - visiblePx) < Math.abs(a - visiblePx) ? b : a));
}

export function initSheet(panel, handle) {
  const desktop = matchMedia('(min-width: 1024px)');
  const root = document.documentElement;
  let snap = 1;
  let pointerId = null;
  let startY = null;
  let startVisible = 0;
  let visible = 0;
  let tapPending = false;
  let distance = 0;

  const limits = () => {
    const style = getComputedStyle(panel);
    return sheetBounds(parseFloat(getComputedStyle(root).getPropertyValue('--sheet-viewport-h')),
      parseFloat(style.maxHeight), parseFloat(style.getPropertyValue('--sheet-min-h')));
  };
  const syncHandle = () => {
    if (desktop.matches) return;
    const heights = limits();
    const next = [1, 2].map((offset) => (snap + offset) % 3)
      .find((index) => heights[index] !== heights[snap]) ?? snap;
    const currentName = SNAP_NAMES[snap];
    const nextName = SNAP_NAMES[next];
    if (handle.dataset.current === currentName && handle.dataset.next === nextName) return;
    handle.dataset.current = currentName;
    handle.dataset.next = nextName;
    handle.setAttribute('aria-expanded', String(snap !== 0));
    emit('sheet:change');
  };
  const setSnap = (index) => {
    snap = index;
    panel.dataset.snap = SNAP_NAMES[snap];
    syncHandle();
  };
  const reset = () => {
    startY = null;
    panel.classList.remove('is-dragging');
    panel.style.height = '';
    pointerId = null;
  };
  const syncViewport = () => {
    tapPending = false;
    reset();
    const viewport = window.visualViewport;
    const height = viewport?.scale === 1 ? Math.min(innerHeight, viewport.height) : innerHeight;
    const bottom = viewport?.scale === 1 ? Math.max(0, innerHeight - viewport.height - viewport.offsetTop) : 0;
    root.style.setProperty('--sheet-viewport-h', `${height}px`);
    root.style.setProperty('--sheet-bottom', `${bottom}px`);
    syncHandle();
  };

  handle.addEventListener('pointerdown', (e) => {
    if (desktop.matches || !e.isPrimary || e.button !== 0) return;
    tapPending = false;
    pointerId = e.pointerId;
    handle.setPointerCapture(e.pointerId);
    startY = e.clientY;
    startVisible = panel.getBoundingClientRect().height;
    visible = startVisible;
    distance = 0;
    panel.classList.add('is-dragging');
  });

  handle.addEventListener('pointermove', (e) => {
    if (startY === null || e.pointerId !== pointerId) return;
    const [min, , max] = limits();
    distance = Math.max(distance, Math.abs(e.clientY - startY));
    visible = Math.min(max, Math.max(min, startVisible + startY - e.clientY));
    panel.style.height = `${visible}px`;
  });

  const release = (e) => {
    if (startY === null || e.pointerId !== pointerId) return;
    const moved = Math.max(distance, Math.abs(e.clientY - startY));
    reset();
    if (moved < TAP_PX) {
      // Keep the handle in place until click; moving it on pointerup can retarget a touch click to an answer underneath.
      tapPending = true;
      return;
    }
    const heights = limits();
    setSnap(heights.indexOf(nearestSnap(visible, heights)));
  };
  handle.addEventListener('pointerup', release);
  const cancel = () => {
    if (startY === null) return;
    tapPending = false;
    reset();
  };
  handle.addEventListener('pointercancel', cancel);
  handle.addEventListener('lostpointercapture', cancel);

  handle.addEventListener('click', (event) => {
    if (!desktop.matches && (event.detail === 0 || tapPending)) setSnap(SNAP_NAMES.indexOf(handle.dataset.next));
    tapPending = false;
  });

  desktop.addEventListener('change', syncViewport);
  window.addEventListener('resize', syncViewport);
  window.visualViewport?.addEventListener('resize', syncViewport);
  window.visualViewport?.addEventListener('scroll', syncViewport);
  new ResizeObserver(() => {
    if (desktop.matches) return;
    root.style.setProperty('--sheet-visible-h', `${panel.getBoundingClientRect().height}px`);
    syncHandle();
  }).observe(panel);
  panel.dataset.snap = SNAP_NAMES[snap];
  syncViewport();
}
