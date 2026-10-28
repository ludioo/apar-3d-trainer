import { holdProgress } from './training-state.js';

export function initTrainingGestures({ targets, sweepInput, sweep, canHold, canSweep, progress, held, swept }) {
  let hold = null;
  let sweepInterrupted = false;
  let raf = 0;
  const listeners = [];
  function listen(element, type, handler) {
    element.addEventListener(type, handler);
    listeners.push(() => element.removeEventListener(type, handler));
  }
  function cancelHold() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    hold = null;
    progress(0);
  }
  function cancel() {
    cancelHold();
    sweepInterrupted = true;
    if (document.activeElement === sweepInput) sweepInput.blur();
  }
  function tick(now) {
    raf = 0;
    if (!hold) return;
    const value = holdProgress(hold.start, now);
    progress(value);
    if (value === 1) {
      hold = null;
      held();
    } else raf = requestAnimationFrame(tick);
  }
  function beginHold(source) {
    if (!canHold() || hold) return;
    hold = { source, start: performance.now() };
    progress(0);
    raf = requestAnimationFrame(tick);
  }
  for (const target of targets) {
    listen(target, 'pointerdown', (event) => {
      if (event.button !== 0 || !event.isPrimary || !canHold()) return;
      event.preventDefault();
      target.focus({ preventScroll: true });
      target.setPointerCapture(event.pointerId);
      beginHold(event.pointerId);
    });
    listen(target, 'pointerup', (event) => {
      if (hold?.source === event.pointerId) cancelHold();
    });
    listen(target, 'pointercancel', cancelHold);
    listen(target, 'lostpointercapture', () => { if (typeof hold?.source === 'number') cancelHold(); });
    listen(target, 'keydown', (event) => {
      if (![' ', 'Enter'].includes(event.key) || !canHold()) return;
      event.preventDefault();
      if (!event.repeat) beginHold(event.key);
    });
    listen(target, 'keyup', (event) => {
      if ([' ', 'Enter'].includes(event.key)) event.preventDefault();
      if (hold?.source === event.key) cancelHold();
    });
    listen(target, 'blur', cancelHold);
  }
  const resumeSweep = () => { if (canSweep()) sweepInterrupted = false; };
  listen(sweepInput, 'focus', resumeSweep);
  listen(sweepInput, 'pointerdown', resumeSweep);
  listen(sweepInput, 'keydown', resumeSweep);
  listen(sweepInput, 'blur', () => { sweepInterrupted = true; });
  listen(sweepInput, 'input', () => {
    if (sweepInterrupted || !canSweep()) {
      sweepInput.value = String(sweep.value);
      return;
    }
    swept(sweep.update(sweepInput.valueAsNumber));
  });
  return { cancel, destroy() { cancel(); listeners.forEach((remove) => remove()); } };
}
