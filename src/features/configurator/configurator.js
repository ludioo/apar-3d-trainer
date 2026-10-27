import { pickFromNdc } from '../../core/picking.js';
import { emit } from '../../core/events.js';
import { initHotspots } from './hotspots.js';
import hotspots from '../../data/hotspots.json';

const PICK_MAX_MOVE_PX = 5;

export function initConfigurator(context) {
  const { canvas, camera } = context;
  const ui = initHotspots(context);
  let model = null;
  let down = null;

  function pointerDown(event) {
    if (event.button === 0 && event.isPrimary) {
      down = { x: event.clientX, y: event.clientY, id: event.pointerId };
    } else down = null;
  }

  function pointerUp(event) {
    const start = down;
    down = null;
    if (!model || !start || event.pointerId !== start.id || event.button !== 0) return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > PICK_MAX_MOVE_PX) return;
    const rect = canvas.getBoundingClientRect();
    const result = pickFromNdc(
      (event.clientX - rect.left) / rect.width * 2 - 1,
      -(event.clientY - rect.top) / rect.height * 2 + 1,
      camera, model, hotspots,
    );
    emit('hotspot:pick', result);
    if (result.hotspot) ui.open(result.hotspot);
  }

  const cancel = () => { down = null; };
  function enter() {
    ui.enter();
    canvas.addEventListener('pointerdown', pointerDown);
    canvas.addEventListener('pointerup', pointerUp);
    canvas.addEventListener('pointercancel', cancel);
  }

  function exit() {
    cancel();
    canvas.removeEventListener('pointerdown', pointerDown);
    canvas.removeEventListener('pointerup', pointerUp);
    canvas.removeEventListener('pointercancel', cancel);
    ui.exit();
  }

  function setModel(next) {
    model = next;
    ui.setModel(next);
  }

  return { enter, exit, setModel };
}
