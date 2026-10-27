import { BoxGeometry, Color, Group, Mesh, MeshStandardMaterial, TorusGeometry } from 'three';

// shortcut: paint bounds and label UVs fit apar.glb; recalibrate when replacing the model.
const PAINT_FRAGMENT = `
  #include <map_fragment>
  #ifdef USE_MAP
    float redRatio = sampledDiffuseColor.r / max(max(sampledDiffuseColor.g, sampledDiffuseColor.b), 0.001);
    float paint = smoothstep(2.5, 4.0, redRatio) * (1.0 - step(0.548, vAparHeight));
    vec2 labelMin = vec2(200.0, 604.0) / 1024.0;
    vec2 labelMax = vec2(430.0, 686.0) / 1024.0;
    vec2 inLabel = step(labelMin, vMapUv) * step(vMapUv, labelMax);
    paint *= 1.0 - inLabel.x * inLabel.y;
    vec2 inNozzle = step(vec2(0.638, 0.198), vMapUv) * step(vMapUv, vec2(0.738, 0.309));
    float inStrap = (1.0 - step(0.031, vMapUv.x)) * step(0.195, vMapUv.y);
    paint *= (1.0 - inStrap) * (1.0 - inNozzle.x * inNozzle.y);
    vec2 inHose = step(vec2(0.542, 0.322), vMapUv) * step(vMapUv, vec2(0.637, 0.876));
    vec2 inHoseTop = step(vec2(0.462, 0.079), vMapUv) * step(vMapUv, vec2(0.595, 0.327));
    vec2 inHoseEnd = step(vec2(0.916, 0.0), vMapUv) * step(vMapUv, vec2(1.0, 0.22));
    paint *= (1.0 - inHose.x * inHose.y) * (1.0 - inHoseTop.x * inHoseTop.y) * (1.0 - inHoseEnd.x * inHoseEnd.y);
    float shade = min(1.0, max(sampledDiffuseColor.r, max(sampledDiffuseColor.g, sampledDiffuseColor.b)) * 1.8);
    diffuseColor.rgb = mix(diffuseColor.rgb, diffuse * aparTint * shade, paint * aparRecolor);
  #endif
`;

function createBracket() {
  const group = new Group();
  group.name = 'configurator-bracket';
  const material = new MeshStandardMaterial({ color: 0x343a43, metalness: 0.65, roughness: 0.5 });
  const parts = [
    [new BoxGeometry(0.065, 0.35, 0.012), [0, 0.32, -0.083]],
    [new BoxGeometry(0.12, 0.012, 0.12), [0, 0.13, -0.025]],
    [new TorusGeometry(0.098, 0.008, 6, 24, Math.PI), [0, 0.35, 0.03]],
  ];
  for (const [geometry, position] of parts) {
    const mesh = new Mesh(geometry, material);
    mesh.position.fromArray(position);
    mesh.userData.configuratorAccessory = true;
    mesh.raycast = () => {};
    mesh.castShadow = true;
    group.add(mesh);
  }
  group.children[2].rotation.x = -Math.PI / 2;
  group.visible = false;
  return group;
}

export function initAppearance(product, requestRender) {
  const uniforms = { aparTint: { value: new Color() }, aparRecolor: { value: 0 } };
  let material = null;
  let bracket = null;
  let originalCompile;
  let originalCacheKey;

  function detach() {
    if (material) {
      material.onBeforeCompile = originalCompile;
      material.customProgramCacheKey = originalCacheKey;
      material.needsUpdate = true;
      material = null;
    }
    if (bracket) {
      bracket.removeFromParent();
      bracket.children.forEach((mesh) => mesh.geometry.dispose());
      bracket.children[0].material.dispose();
      bracket = null;
    }
  }

  function setModel(model) {
    detach();
    if (!model) return false;
    model.traverse((object) => {
      if (!object.isMesh) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      material ??= materials.find((candidate) => candidate.name === product.bodyMaterialName && candidate.map) ?? null;
    });
    bracket = createBracket();
    model.add(bracket);
    if (!material) return false;
    originalCompile = material.onBeforeCompile;
    originalCacheKey = material.customProgramCacheKey;
    material.onBeforeCompile = (shader, renderer) => {
      originalCompile.call(material, shader, renderer);
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = `varying float vAparHeight;\n${shader.vertexShader}`
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvAparHeight = position.y;');
      shader.fragmentShader = `uniform vec3 aparTint;\nuniform float aparRecolor;\nvarying float vAparHeight;\n${shader.fragmentShader}`
        .replace('#include <map_fragment>', PAINT_FRAGMENT);
    };
    material.customProgramCacheKey = () => 'apar-selective-paint-v1';
    material.needsUpdate = true;
    return true;
  }

  function apply(colorId, bracketEnabled) {
    const option = product.options.color.find((color) => color.id === colorId);
    if (!option) return;
    uniforms.aparTint.value.set(option.hex);
    uniforms.aparRecolor.value = colorId === 'red' ? 0 : 1;
    if (bracket) bracket.visible = bracketEnabled;
    requestRender();
  }

  return { setModel, apply };
}
