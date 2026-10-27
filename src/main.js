import './styles/tokens.css';
import './styles/base.css';
import { CylinderGeometry, Mesh, MeshStandardMaterial } from 'three';
import { initScene, requestRender } from './core/scene.js';
import { initControls } from './core/controls.js';

const CYLINDER_HEIGHT = 1.2;
const CYLINDER_RADIUS = 0.28;

const root = document.getElementById('canvas-root');
const { scene, camera, renderer } = initScene(root);
const controls = initControls(camera, renderer.domElement, requestRender);
controls.target.set(0, CYLINDER_HEIGHT / 2, 0);
controls.update();

const brandRed = getComputedStyle(document.documentElement)
  .getPropertyValue('--brand-red')
  .trim();

const cylinder = new Mesh(
  new CylinderGeometry(CYLINDER_RADIUS, CYLINDER_RADIUS, CYLINDER_HEIGHT, 32),
  new MeshStandardMaterial({ color: brandRed, metalness: 0.2, roughness: 0.45 }),
);
cylinder.position.y = CYLINDER_HEIGHT / 2;
cylinder.castShadow = true;
scene.add(cylinder);

requestRender();
