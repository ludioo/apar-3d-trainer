const COLLAPSED = 0.3;
const TAP_PX = 6;

export function sheetBounds(viewportHeight, availableHeight, minimumHeight) {
  return [
    Math.min(Math.max(viewportHeight * COLLAPSED, minimumHeight), availableHeight),
    Math.min(viewportHeight * 0.8, availableHeight),
  ];
}

export function nearestSnap(visiblePx, snapsPx) {
  return snapsPx.reduce((a, b) => (Math.abs(b - visiblePx) < Math.abs(a - visiblePx) ? b : a));
}

export function initSheet(panel, handle) {
  const desktop = matchMedia('(min-width: 1024px)');
  let startY = null;
  let startVisible = 0;
  let visible = 0;

  const setExpanded = (on) => {
    panel.classList.toggle('is-expanded', on);
    handle.setAttribute('aria-expanded', String(on));
  };
  const limits = () => {
    const style = getComputedStyle(panel);
    return sheetBounds(innerHeight, parseFloat(style.maxHeight), parseFloat(style.getPropertyValue('--sheet-min-h')));
  };
  const reset = () => {
    startY = null;
    panel.classList.remove('is-dragging');
    panel.style.height = '';
  };

  handle.addEventListener('pointerdown', (e) => {
    if (desktop.matches) return;
    handle.setPointerCapture(e.pointerId);
    startY = e.clientY;
    startVisible = panel.getBoundingClientRect().height;
    visible = startVisible;
    panel.classList.add('is-dragging');
  });

  handle.addEventListener('pointermove', (e) => {
    if (startY === null) return;
    const [min, max] = limits();
    visible = Math.min(max, Math.max(min, startVisible + startY - e.clientY));
    panel.style.height = `${visible}px`;
  });

  const release = (e) => {
    if (startY === null) return;
    const moved = Math.abs(e.clientY - startY);
    reset();
    if (moved < TAP_PX) {
      setExpanded(!panel.classList.contains('is-expanded'));
      return;
    }
    const [min, max] = limits();
    setExpanded(nearestSnap(visible, [min, max]) === max);
  };
  handle.addEventListener('pointerup', release);
  handle.addEventListener('pointercancel', reset);
  handle.addEventListener('lostpointercapture', reset);

  handle.addEventListener('click', (event) => {
    if (event.detail === 0) setExpanded(!panel.classList.contains('is-expanded'));
  });

  desktop.addEventListener('change', reset);
  window.addEventListener('resize', reset);
}
