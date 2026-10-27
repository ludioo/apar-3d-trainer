import {
  BufferAttribute, BufferGeometry, CanvasTexture, Color, Group, Line,
  LineBasicMaterial, Points, PointsMaterial, Vector3,
} from 'three';
import hotspots from '../../data/hotspots.json' with { type: 'json' };
import { SWEEP_STROKES } from './training-state.js';

export const FIRE_PARTICLES = 24;
export const SPRAY_PARTICLES = 72;
export const SPRAY_IDLE_MS = 180;
const FADE_MS = 250;
const nozzleHotspot = hotspots.find((hotspot) => hotspot.id === 'nozzle');

export function fireLevel(session, sweep) {
  if (session.phase !== 'steps' || session.index === 0 ||
    (session.index === 1 && !session.status[1]) || session.status[3] === 'skipped') return 0;
  return Math.max(0, 1 - sweep.count / SWEEP_STROKES);
}

function texture(flame, colors) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const gradient = flame ? ctx.createLinearGradient(0, 64, 0, 0) : ctx.createRadialGradient(32, 32, 2, 32, 32, 32);
  const white = new Color(colors.text).getHexString();
  const red = new Color(colors.red);
  gradient.addColorStop(0, flame ? colors.accent : colors.text);
  gradient.addColorStop(0.35, flame ? colors.accent : `#${white}b0`);
  gradient.addColorStop(0.7, flame ? new Color(colors.accent).lerp(red, 0.45).getStyle() : `#${white}40`);
  gradient.addColorStop(1, flame ? `#${red.getHexString()}90` : `#${white}00`);
  ctx.fillStyle = gradient;
  if (flame) {
    ctx.filter = 'blur(2px)';
    ctx.beginPath();
    ctx.moveTo(32, 1);
    ctx.bezierCurveTo(28, 23, 6, 33, 12, 49);
    ctx.bezierCurveTo(20, 67, 54, 64, 54, 44);
    ctx.bezierCurveTo(55, 28, 40, 25, 32, 1);
    ctx.fill();
  } else ctx.fillRect(0, 0, 64, 64);
  const map = new CanvasTexture(canvas);
  return map;
}

function particles(count, size, map) {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(count * 3), 3));
  const points = new Points(geometry, new PointsMaterial({
    size, map, transparent: true, opacity: 0.85, alphaTest: 0.01,
    depthWrite: false, toneMapped: false,
  }));
  points.frustumCulled = false;
  points.raycast = () => {};
  return points;
}

export function initEffects({ scene, requestRender }) {
  const style = getComputedStyle(document.documentElement);
  const colors = { accent: style.getPropertyValue('--accent').trim(),
    red: style.getPropertyValue('--brand-red').trim(), text: style.getPropertyValue('--text').trim() };
  const group = new Group();
  group.name = 'training-effects';
  group.visible = false;
  const fire = particles(FIRE_PARTICLES, 0.28, texture(true, colors));
  fire.name = 'training-fire';
  fire.material.vertexColors = true;
  fire.material.opacity = 0.65;
  fire.geometry.setAttribute('color', new BufferAttribute(new Float32Array(FIRE_PARTICLES * 3), 3));
  const spray = particles(SPRAY_PARTICLES, 0.055, texture(false, colors));
  spray.name = 'training-spray';
  const lineGeometry = new BufferGeometry();
  lineGeometry.setAttribute('position', new BufferAttribute(new Float32Array(6), 3));
  const line = new Line(lineGeometry, new LineBasicMaterial({
    color: new Color(colors.accent),
    transparent: true, opacity: 0.7, depthWrite: false, toneMapped: false,
  }));
  line.frustumCulled = false;
  line.raycast = () => {};
  group.add(fire, spray, line);
  scene.add(group);
  const nozzle = new Vector3();
  const base = new Vector3();
  const aim = new Vector3();
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const flameColor = new Color();
  const yellow = new Color(colors.accent);
  const red = new Color(colors.red);
  let model = null;
  let enabled = false;
  let paused = false;
  let raf = 0;
  let stopTimer = 0;
  let level = 0;
  let fromLevel = 0;
  let toLevel = 0;
  let fadeStart = 0;
  let value = 50;
  let spraying = false;
  let time = 0;
  let lastTick = 0;

  function draw() {
    group.visible = enabled && !!model;
    fire.visible = group.visible && level > 0;
    line.visible = group.visible && toLevel > 0;
    spray.visible = line.visible && spraying;
    fire.scale.setScalar(level);
    fire.material.size = 0.28 * level;
    aim.copy(base);
    aim.x += (value / 100 - 0.5) * 0.55;
    const linePositions = line.geometry.attributes.position;
    linePositions.setXYZ(0, nozzle.x, nozzle.y, nozzle.z);
    linePositions.setXYZ(1, aim.x, aim.y, aim.z);
    linePositions.needsUpdate = true;
    const flamePositions = fire.geometry.attributes.position;
    const flameColors = fire.geometry.attributes.color;
    for (let i = 0; i < FIRE_PARTICLES; i++) {
      const age = (i / FIRE_PARTICLES + time * 0.75) % 1;
      const angle = i * 2.4;
      const radius = 0.1 * (1 - age);
      flamePositions.setXYZ(i, Math.cos(angle + time) * radius,
        0.14 + age * 0.3, Math.sin(angle) * radius * 0.5);
      flameColor.copy(yellow).lerp(red, age * 0.75);
      flameColors.setXYZ(i, flameColor.r, flameColor.g, flameColor.b);
    }
    flamePositions.needsUpdate = true;
    flameColors.needsUpdate = true;
    const sprayPositions = spray.geometry.attributes.position;
    for (let i = 0; i < SPRAY_PARTICLES; i++) {
      const travel = (i / SPRAY_PARTICLES + time * 2.8) % 1;
      const spread = travel * 0.09;
      sprayPositions.setXYZ(i,
        nozzle.x + (aim.x - nozzle.x) * travel + Math.sin(i * 2.4) * spread,
        nozzle.y + (aim.y - nozzle.y) * travel + Math.cos(i * 2.4) * spread,
        nozzle.z + (aim.z - nozzle.z) * travel + Math.sin(i * 1.7) * spread);
    }
    sprayPositions.needsUpdate = true;
    requestRender();
  }
  function stopLoop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    lastTick = 0;
  }
  function tick(now) {
    raf = 0;
    if (!enabled || !model || paused || motion.matches) return;
    if (lastTick) time += Math.min(50, now - lastTick) / 1000;
    lastTick = now;
    const progress = Math.min(1, (now - fadeStart) / FADE_MS);
    level = fromLevel + (toLevel - fromLevel) * progress;
    draw();
    if (level > 0 || spraying) raf = requestAnimationFrame(tick);
    else lastTick = 0;
  }
  function animate() {
    if (!enabled || !model || paused || motion.matches) return;
    if (!raf && (level > 0 || toLevel > 0 || spraying)) raf = requestAnimationFrame(tick);
  }
  function stopSpray() {
    clearTimeout(stopTimer);
    stopTimer = 0;
    spraying = false;
    draw();
  }
  function setModel(next) {
    stopLoop();
    stopSpray();
    model = next;
    if (model) {
      model.updateWorldMatrix(true, false);
      nozzle.copy(model.localToWorld(new Vector3(...nozzleHotspot.pinPosition)));
      base.set(nozzle.x - 0.18, 0.02, nozzle.z + 0.8);
      fire.position.copy(base);
    }
    draw();
    animate();
  }
  function sync(session, sweep, active) {
    enabled = active;
    const next = fireLevel(session, sweep);
    value = session.index === 3 ? sweep.value : 50;
    if (next !== toLevel) {
      fromLevel = level;
      toLevel = next;
      fadeStart = performance.now();
      const immediate = motion.matches || next > level || !active || session.phase !== 'steps' ||
        session.index === 0 || session.status[3] === 'skipped';
      if (immediate) level = fromLevel = next;
    }
    if (!active || next === 0) stopSpray();
    if (!active) stopLoop();
    draw();
    animate();
  }
  function setSpray(active, burst = false) {
    clearTimeout(stopTimer);
    stopTimer = 0;
    spraying = active && enabled && !!model && !paused && toLevel > 0;
    if (spraying && burst) stopTimer = setTimeout(stopSpray, SPRAY_IDLE_MS);
    draw();
    animate();
  }
  function pause() {
    paused = true;
    stopLoop();
    stopSpray();
    level = fromLevel = toLevel;
    draw();
  }
  function resume() {
    paused = false;
    animate();
  }
  function motionChange() {
    stopLoop();
    level = fromLevel = toLevel;
    draw();
    animate();
  }
  motion.addEventListener('change', motionChange);
  return { setModel, sync, setSpray, pause, resume, base, nozzle,
    dispose() {
      enabled = false;
      stopLoop();
      clearTimeout(stopTimer);
      motion.removeEventListener('change', motionChange);
      group.removeFromParent();
      for (const object of [fire, spray, line]) {
        object.geometry.dispose();
        object.material.map?.dispose();
        object.material.dispose();
      }
    },
  };
}
