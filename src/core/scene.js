import {
  ACESFilmicToneMapping,
  DirectionalLight,
  EquirectangularReflectionMapping,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShadowMaterial,
  WebGLRenderer,
  Mesh,
} from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';

let renderer;
let scene;
let camera;
let renderQueued = false;

export function requestRender() {
  if (renderQueued || !renderer) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    renderer.render(scene, camera);
  });
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

  new HDRLoader().load(
    '/hdri/studio_1k.hdr',
    (hdr) => {
      hdr.mapping = EquirectangularReflectionMapping;
      scene.environment = hdr;
      requestRender();
    },
    undefined,
    (err) => {
      console.warn('HDRI load failed; continuing with directional light only', err);
    },
  );

  const resizeObserver = new ResizeObserver((entries) => {
    const entry = entries[0];
    if (!entry) return;
    const { width: w, height: h } = entry.contentRect;
    if (w === 0 || h === 0) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    requestRender();
  });
  resizeObserver.observe(container);

  requestRender();

  return { renderer, scene, camera };
}
