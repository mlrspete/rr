import * as THREE from "three";

export function createHeroMaterials(config) {
  const { palette, materials } = config;
  const membraneAppearance = config.membrane.appearance;
  const membraneActivation = config.membrane.activation;
  const coolSheen = new THREE.Color(palette.cool).lerp(new THREE.Color(palette.lightWarm), 0.22);
  const warmSpecular = new THREE.Color(palette.lightWarm).lerp(new THREE.Color(palette.warm), 0.18);
  const coolSpecular = new THREE.Color(palette.lightWarm).lerp(new THREE.Color(palette.cool), 0.12);

  return {
    membrane: new THREE.MeshPhysicalMaterial({
      color: membraneAppearance.bodyColor,
      emissive: membraneAppearance.emissive,
      emissiveIntensity: membraneAppearance.emissiveIntensity,
      metalness: membraneAppearance.metalness,
      roughness: membraneAppearance.roughness,
      transmission: membraneAppearance.transmission,
      thickness: membraneAppearance.thickness,
      ior: membraneAppearance.ior,
      attenuationColor: membraneAppearance.attenuationColor,
      attenuationDistance: membraneAppearance.attenuationDistance,
      clearcoat: membraneAppearance.clearcoat,
      clearcoatRoughness: membraneAppearance.clearcoatRoughness,
      iridescence: membraneAppearance.iridescence,
      iridescenceIOR: membraneAppearance.iridescenceIOR,
      iridescenceThicknessRange: membraneAppearance.iridescenceThicknessRange,
      specularIntensity: membraneAppearance.specularIntensity,
      specularColor: coolSpecular,
      sheen: 0.12,
      sheenColor: coolSheen,
      sheenRoughness: 0.28,
      transparent: true,
      opacity: membraneAppearance.opacity,
      envMapIntensity: membraneAppearance.envMapIntensity,
      side: THREE.DoubleSide,
    }),
    membraneEdge: new THREE.MeshPhysicalMaterial({
      color: membraneAppearance.rimColor,
      emissive: membraneAppearance.rimEmissive,
      emissiveIntensity: membraneAppearance.rimEmissiveIntensity,
      metalness: membraneAppearance.rimMetalness,
      roughness: membraneAppearance.rimRoughness,
      clearcoat: membraneAppearance.rimClearcoat,
      clearcoatRoughness: membraneAppearance.rimClearcoatRoughness,
      specularIntensity: 1,
      specularColor: warmSpecular,
      sheen: 0.08,
      sheenColor: warmSpecular,
      sheenRoughness: 0.3,
      transparent: true,
      opacity: membraneAppearance.rimOpacity,
      envMapIntensity: membraneAppearance.rimEnvMapIntensity,
    }),
    sweepBand: new THREE.MeshBasicMaterial({
      color: palette.lightWarm,
      transparent: true,
      opacity: membraneActivation.bandBaseOpacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    }),
    slotDistortion: new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(palette.cool) },
        uOpacity: { value: 0 },
        uIntensity: { value: 0 },
        uTime: { value: 0 },
      },
      vertexShader: `
        uniform float uIntensity;
        uniform float uTime;
        varying vec3 vWorldPosition;
        varying vec3 vWorldNormal;

        void main() {
          vec3 displaced = position;
          float bandWave =
            sin(position.y * 7.6 + uTime * 1.1 + position.x * 2.2) *
            0.5 +
            0.5;
          float shear =
            sin((position.x + position.z) * 5.8 - uTime * 0.9) *
            0.5 +
            0.5;
          float ripple = mix(bandWave, shear, 0.35);

          displaced += normal * ripple * uIntensity * 0.024;

          vec4 worldPosition = modelMatrix * vec4(displaced, 1.0);
          vWorldPosition = worldPosition.xyz;
          vWorldNormal = normalize(mat3(modelMatrix) * normal);

          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uIntensity;
        uniform float uTime;
        varying vec3 vWorldPosition;
        varying vec3 vWorldNormal;

        void main() {
          vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
          float fresnel = pow(1.0 - max(dot(normalize(vWorldNormal), viewDirection), 0.0), 3.1);
          float flow =
            sin(vWorldPosition.y * 5.8 + uTime * 1.3 + vWorldPosition.x * 1.5) *
            0.5 +
            0.5;
          float shimmer =
            sin((vWorldPosition.x - vWorldPosition.z) * 6.4 - uTime * 1.1) *
            0.5 +
            0.5;
          float band = mix(flow, shimmer, 0.32);

          float alpha =
            fresnel *
            mix(0.42, 0.9, band) *
            uOpacity *
            clamp(uIntensity, 0.0, 1.0);

          if (alpha <= 0.001) {
            discard;
          }

          vec3 color = mix(uColor, vec3(1.0), fresnel * 0.2 + band * 0.06);
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      toneMapped: false,
    }),
    backdrop: new THREE.MeshBasicMaterial({
      color: palette.plum,
      transparent: true,
      opacity: materials.backdropOpacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    }),
    dust: new THREE.PointsMaterial({
      color: palette.lightWarm,
      size: materials.dustSize,
      transparent: true,
      opacity: materials.dustOpacity,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    }),
  };
}

export function createHeroAssetMaterial(config, spec) {
  const tone = spec.materialTone ?? {};
  const { palette } = config;
  const isPremiumShape = spec.kind === "premium-shape";
  const defaultSpecularColor = new THREE.Color(
    tone.specularColor ?? (isPremiumShape ? "#efe6dc" : palette.lightWarm),
  );
  const defaultSheenColor = new THREE.Color(
    tone.sheenColor ?? (isPremiumShape ? "#f0e8de" : palette.lightWarm),
  );

  return new THREE.MeshPhysicalMaterial({
    color: tone.color ?? palette.metal,
    emissive: tone.emissive ?? palette.ember,
    emissiveIntensity: tone.emissiveIntensity ?? 0.025,
    metalness: tone.metalness ?? (isPremiumShape ? 0.42 : 0.62),
    roughness: tone.roughness ?? (isPremiumShape ? 0.2 : 0.26),
    clearcoat: tone.clearcoat ?? 0.92,
    clearcoatRoughness: tone.clearcoatRoughness ?? 0.08,
    sheen: tone.sheen ?? (isPremiumShape ? 0.46 : 0.22),
    sheenColor: defaultSheenColor,
    sheenRoughness: tone.sheenRoughness ?? (isPremiumShape ? 0.28 : 0.42),
    iridescence: tone.iridescence ?? (isPremiumShape ? 0.03 : 0.02),
    iridescenceIOR: tone.iridescenceIOR ?? 1.18,
    specularIntensity: tone.specularIntensity ?? 0.92,
    specularColor: defaultSpecularColor,
    ior: tone.ior ?? (isPremiumShape ? 1.42 : 1.36),
    transparent: true,
    opacity: 1,
    envMapIntensity: tone.envMapIntensity ?? (isPremiumShape ? 1.4 : 1.24),
    flatShading: tone.flatShading ?? false,
  });
}
