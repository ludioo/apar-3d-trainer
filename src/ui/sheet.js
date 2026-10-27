const COLLAPSED = 0.3;
const TAP_PX = 6;

export function nearestSnap(visiblePx, snapsPx) {
  return snapsPx.reduce((a, b) => (Math.abs(b - visiblePx) < Math.abs(a - visiblePx) ? b : a));
}

export function initSheet(panel, handle) {
  const desktop = matchMedia('(min-width: 1024px)');
  let startY = null;
  let startVisible = 0;
  let visible = 0;
  let dragged = false;

  const setExpanded = (on) => {
    panel.classList.toggle('is-expanded', on);
    handle.setAttribute('aria-expanded', String(on));
  };
  const limits = () => [innerHeight * COLLAPSED, panel.offsetHeight];
  const reset = () => {
    startY = null;
    panel.classList.remove('is-dragging');
    panel.style.transform = '';
  };

  handle.addEventListener('pointerdown', (e) => {
    if (desktop.matches) return;
    handle.setPointerCapture(e.pointerId);
    dragged = false;
    startY = e.clientY;
    startVisible = innerHeight - panel.getBoundingClientRect().top;
    visible = startVisible;
    panel.classList.add('is-dragging');
  });

  handle.addEventListener('pointermove', (e) => {
    if (startY === null) return;
    const [min, max] = limits();
    visible = Math.min(max, Math.max(min, startVisible + startY - e.clientY));
    panel.style.transform = `translateY(${max - visible}px)`;
  });

  const release = (e) => {
    if (startY === null) return;
    const moved = Math.abs(e.clientY - startY);
    reset();
    if (moved < TAP_PX) return;
    dragged = true;
    const [min, max] = limits();
    setExpanded(nearestSnap(visible, [min, max]) === max);
  };
  handle.addEventListener('pointerup', release);
  handle.addEventListener('pointercancel', release);

  handle.addEventListener('click', () => {
    if (dragged) {
      dragged = false;
      return;
    }
    setExpanded(!panel.classList.contains('is-expanded'));
  });

  desktop.addEventListener('change', reset);
}
