export const HOLD_MS = 1000;
export const SWEEP_STROKES = 6;

export function holdProgress(start, now) {
  return Math.max(0, Math.min(1, (now - start) / HOLD_MS));
}

export function createTrainingSession(stepCount) {
  const session = {
    phase: 'intro', index: 0, status: Array(stepCount).fill(null),
    start() { session.phase = 'steps'; },
    complete(skipped = false) {
      if (session.phase === 'steps' && !session.status[session.index]) {
        session.status[session.index] = skipped ? 'skipped' : 'done';
      }
    },
    next() {
      if (session.phase !== 'steps' || !session.status[session.index]) return false;
      if (session.index === stepCount - 1) session.phase = 'complete';
      else session.index++;
      return true;
    },
    back() {
      if (session.phase === 'steps' && session.index > 0) session.index--;
    },
    restart() {
      session.index = 0;
      session.status.fill(null);
      session.phase = 'steps';
    },
  };
  return session;
}

export function createSweep() {
  let value = 0;
  let count = 0;
  return {
    get value() { return value; },
    get count() { return count; },
    get cycles() { return Math.floor(count / 2); },
    get target() { return count % 2 === 0 ? 'right' : 'left'; },
    update(next) {
      if (!Number.isFinite(next) || next < 0 || next > 100 || count >= SWEEP_STROKES) return count;
      value = next;
      if (count % 2 === 0 ? value >= 95 : value <= 5) count++;
      return count;
    },
    reset() { value = 0; count = 0; },
  };
}
