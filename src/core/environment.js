import { PMREMGenerator } from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';

export async function loadEnvironment(renderer, scene, requestRender) {
  const loader = new HDRLoader();
  const generator = new PMREMGenerator(renderer);
  let hdr;
  try {
    generator.compileEquirectangularShader();
    if (typeof DecompressionStream !== 'undefined') {
      try {
        const response = await fetch('/hdri/studio_1k.hdr.gz');
        if (!response.ok) throw new Error(`HDRI HTTP ${response.status}`);
        const buffer = await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
        hdr = loader.createDataTexture(buffer);
      } catch (error) {
        console.warn('Compressed HDRI unavailable; loading original', error);
      }
    }
    hdr ??= await loader.loadAsync('/hdri/studio_1k.hdr');
    const environment = generator.fromEquirectangular(hdr);
    scene.environment = environment.texture;
    performance.mark('apar:environment-ready');
    requestRender();
    return true;
  } catch (error) {
    console.warn('HDRI load failed; continuing with directional light only', error);
    performance.mark('apar:environment-failed');
    return false;
  } finally {
    hdr?.dispose();
    generator.dispose();
  }
}
