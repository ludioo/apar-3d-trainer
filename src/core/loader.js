import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { emit } from './events.js';

const MODEL_URL = '/models/apar.glb';

let gltfLoader;

function getLoader(renderer) {
  if (gltfLoader) return gltfLoader;
  const draco = new DRACOLoader().setDecoderPath('/decoders/draco/');
  const ktx2 = new KTX2Loader().setTranscoderPath('/decoders/basis/').detectSupport(renderer);
  gltfLoader = new GLTFLoader().setDRACOLoader(draco).setKTX2Loader(ktx2);
  return gltfLoader;
}

export function loadModel(renderer) {
  getLoader(renderer).load(
    MODEL_URL,
    (gltf) => emit('load:done', gltf),
    (e) => emit('load:progress', e.lengthComputable ? Math.round((e.loaded / e.total) * 100) : null),
    (err) => emit('load:error', err),
  );
}
