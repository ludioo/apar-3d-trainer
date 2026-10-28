import {
  ACESFilmicToneMapping,
  Box3,
  Color,
  DirectionalLight,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  Sphere,
  Vector2,
  Vector3,
  ShadowMaterial,
  WebGLRenderer,
  Mesh,
} from 'three';
import { loadEnvironment } from './environment.js';
import { emit } from './events.js';

let renderer;
let scene;
let camera;
let renderQueued = false;
let environmentReady;

export function requestRender() {
  if (renderQueued || !renderer) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    renderer.render(scene, camera);
    emit('scene:rendered');
  });
}

export async function prepareModel(model) {
  model.visible = false;
  const hasEnvironment = await environmentReady;
  try {
    await renderer.compileAsync(model, camera, scene);
  } finally {
    model.visible = true;
  }
  return hasEnvironment;
}

export function captureModel(model, excluded = []) {
  if (!model || renderer.getContext().isContextLost()) throw new Error('Capture unavailable');
  const size = renderer.getSize(new Vector2());
  const pixelRatio = renderer.getPixelRatio();
  const background = scene.background;
  const hidden = new Map();
  model.traverse((object) => { if (object.userData.debugMarker) excluded.push(object); });
  for (const object of excluded) hidden.set(object, object.visible);
  try {
    for (const object of hidden.keys()) object.visible = false;
    const bounds = new Box3().setFromObject(model).getBoundingSphere(new Sphere());
    const captureCamera = camera.clone();
    captureCamera.aspect = 4 / 3;
    const angle = captureCamera.fov * Math.PI / 360;
    const distance = bounds.radius / Math.sin(angle) * 1.15;
    captureCamera.position.copy(bounds.center).addScaledVector(new Vector3(0.25, 0.12, 1).normalize(), distance);
    captureCamera.lookAt(bounds.center);
    captureCamera.updateProjectionMatrix();
    scene.background = new Color(getComputedStyle(document.documentElement).getPropertyValue('--bg').trim());
    renderer.setPixelRatio(1);
    renderer.setSize(1200, 900, false);
    renderer.render(scene, captureCamera);
    const image = renderer.domElement.toDataURL('image/jpeg', 0.9);
    if (!image.startsWith('data:image/jpeg;base64,') || renderer.getContext().isContextLost()) throw new Error('Capture failed');
    return image;
  } finally {
    for (const [object, visible] of hidden) object.visible = visible;
    scene.background = background;
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(size.x, size.y, false);
    if (!renderer.getContext().isContextLost()) renderer.render(scene, camera);
  }
}

export function initScene(container) {
  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;
  const isMobile = matchMedia('(pointer: coarse)').matches;

  scene = new Scene();

  camera = new PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(2.5, 1.8, 3.5);

  renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.setSize(width, height, false);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  const light = new DirectionalLight(0xffffff, 1.2);
  light.position.set(3, 6, 2);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  light.shadow.radius = 4;
  light.shadow.normalBias = 0.02;
  light.shadow.camera.left = -2;
  light.shadow.camera.right = 2;
  light.shadow.camera.top = 2;
  light.shadow.camera.bottom = -2;
  light.shadow.camera.near = 0.5;
  light.shadow.camera.far = 20;
  scene.add(light);

  const ground = new Mesh(
    new PlaneGeometry(20, 20),
    new ShadowMaterial({ opacity: 0.3 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;
  scene.add(ground);

  environmentReady = loadEnvironment(renderer, scene, requestRender);

  const resizeObserver = new ResizeObserver((entries) => {
    const entry = entries[0];
    if (!entry) return;
    const { width: w, height: h } = entry.contentRect;
    if (w === 0 || h === 0) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    emit('scene:resize');
    requestRender();
  });
  resizeObserver.observe(container);

  requestRender();

  return { renderer, scene, camera };
}
