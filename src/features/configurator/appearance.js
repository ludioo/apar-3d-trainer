import { BoxGeometry, CanvasTexture, Color, Group, Mesh, MeshStandardMaterial, SRGBColorSpace, TorusGeometry } from 'three';

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
    vec2 agentUv = vec2(fract(atan(vAparPosition.x, vAparPosition.z - 0.03) / 6.2831853 + 0.15), (vAparHeight - 0.25) / 0.06);
    float cylinder = 1.0 - step(0.105, length(vAparPosition.xz - vec2(0.0, 0.03)));
    float band = step(0.0, agentUv.y) * step(agentUv.y, 1.0) * cylinder;
    band *= (1.0 - inHose.x * inHose.y) * (1.0 - inHoseTop.x * inHoseTop.y) * (1.0 - inHoseEnd.x * inHoseEnd.y);
    band *= (1.0 - inNozzle.x * inNozzle.y) * (1.0 - inStrap);
    diffuseColor.rgb = mix(diffuseColor.rgb, diffuse * texture2D(aparLabel, agentUv).rgb * shade, band);
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
  const uniforms = { aparTint: { value: new Color() }, aparRecolor: { value: 0 }, aparLabel: { value: null } };
  let model = null;
  let baseline = null;
  let material = null;
  let bracket = null;
  let originalCompile;
  let originalCacheKey;
  let labelKey = '';

  function updateLabel(agent, labels) {
    const texture = uniforms.aparLabel.value;
    const key = `${agent.id}:${labels.agent}:${labels.capacity}`;
    if (!texture || labelKey === key) return;
    labelKey = key;
    const ctx = texture.image.getContext('2d');
    ctx.fillStyle = agent.visual.strip;
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = agent.visual.ink;
    ctx.fillRect(0, 0, 512, 4);
    ctx.fillRect(0, 124, 512, 4);
    ctx.textAlign = 'center';
    for (const x of [128, 384]) {
      ctx.font = '600 26px system-ui';
      ctx.fillText(labels.agent, x, 54, 210);
      ctx.font = '600 24px monospace';
      ctx.fillText(labels.capacity, x, 94, 230);
    }
    texture.needsUpdate = true;
  }

  function detach() {
    if (model && baseline) {
      model.scale.copy(baseline.scale);
      model.position.copy(baseline.position);
      model.updateWorldMatrix(true, true);
    }
    model = null;
    baseline = null;
    uniforms.aparLabel.value?.dispose();
    uniforms.aparLabel.value = null;
    labelKey = '';
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

  function setModel(next) {
    detach();
    model = next;
    if (!model) return false;
    baseline = { scale: model.scale.clone(), position: model.position.clone() };
    model.traverse((object) => {
      if (!object.isMesh) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      material ??= materials.find((candidate) => candidate.name === product.bodyMaterialName && candidate.map) ?? null;
    });
    bracket = createBracket();
    model.add(bracket);
    if (!material) return false;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    uniforms.aparLabel.value = new CanvasTexture(canvas);
    uniforms.aparLabel.value.colorSpace = SRGBColorSpace;
    originalCompile = material.onBeforeCompile;
    originalCacheKey = material.customProgramCacheKey;
    material.onBeforeCompile = (shader, renderer) => {
      originalCompile.call(material, shader, renderer);
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = `varying float vAparHeight;\nvarying vec3 vAparPosition;\n${shader.vertexShader}`
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvAparHeight = position.y;\nvAparPosition = position;');
      shader.fragmentShader = `uniform vec3 aparTint;\nuniform float aparRecolor;\nuniform sampler2D aparLabel;\nvarying float vAparHeight;\nvarying vec3 vAparPosition;\n${shader.fragmentShader}`
        .replace('#include <map_fragment>', PAINT_FRAGMENT);
    };
    material.customProgramCacheKey = () => 'apar-selective-paint-label-v2';
    material.needsUpdate = true;
    return true;
  }

  function apply({ agentId, capacityId, colorId, bracketEnabled }, labels) {
    const option = product.options.color.find((color) => color.id === colorId);
    const agent = product.options.agent.find((item) => item.id === agentId);
    const capacity = product.options.capacity.find((item) => item.id === capacityId);
    if (!option || !agent || !capacity) return;
    if (model) {
      model.scale.copy(baseline.scale).multiplyScalar(capacity.scale);
      model.position.copy(baseline.position).multiplyScalar(capacity.scale);
      model.updateWorldMatrix(true, true);
    }
    uniforms.aparTint.value.set(option.hex);
    uniforms.aparRecolor.value = colorId === 'red' ? 0 : 1;
    updateLabel(agent, labels);
    if (bracket) bracket.visible = bracketEnabled;
    requestRender();
  }

  return { setModel, apply };
}
