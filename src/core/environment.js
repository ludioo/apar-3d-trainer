import { PMREMGenerator } from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export async function loadEnvironment(renderer, scene, requestRender) {
  let generator;
  let room;
  let hdr;
  try {
    generator = new PMREMGenerator(renderer);
    let environment;
    if (new URLSearchParams(location.search).get('hdri') === '1') {
      generator.compileEquirectangularShader();
      const { HDRLoader } = await import('three/addons/loaders/HDRLoader.js');
      const loader = new HDRLoader();
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
      environment = generator.fromEquirectangular(hdr);
    } else {
      room = new RoomEnvironment();
      const size = matchMedia('(pointer: coarse)').matches ? 128 : 256;
      environment = generator.fromScene(room, 0, 0.1, 100, { size });
    }
    scene.environment = environment.texture;
    performance.mark('apar:environment-ready');
    requestRender();
    return true;
  } catch (error) {
    console.warn('Environment setup failed; continuing with directional light only', error);
    performance.mark('apar:environment-failed');
    return false;
  } finally {
    hdr?.dispose();
    room?.dispose();
    generator?.dispose();
  }
}
