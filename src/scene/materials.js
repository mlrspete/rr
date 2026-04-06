import * as THREE from "three";

export function createHeroMaterials(config, { membraneConfig } = {}) {
  const membraneAppearance = membraneConfig?.appearance ?? config.membrane.appearance;
  const membraneActivation = membraneConfig?.activation ?? config.membrane.activation;
  const materials = {
    sphere: new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(config.palette.chrome).lerp(
        new THREE.Color(config.palette.silver),
        0.18,
      ),
      metalness: 1,
      roughness: 0.018,
      clearcoat: 0.08,
      clearcoatRoughness: 0.018,
      specularIntensity: 1,
      specularColor: new THREE.Color("#f3f7fc"),
      envMapIntensity: 2.9,
      transparent: true,
      opacity: 1,
    }),
    rustObject: createHeroAssetMaterial(config),
    membrane: new THREE.MeshPhysicalMaterial(),
    membraneEdge: new THREE.MeshPhysicalMaterial({
      depthWrite: false,
      transparent: true,
    }),
    sweepBand: new THREE.MeshBasicMaterial({
      color: new THREE.Color(config.palette.cool).lerp(
        new THREE.Color(config.palette.coolEdge),
        0.42,
      ),
      transparent: true,
      opacity: membraneActivation.bandBaseOpacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    }),
    conversionVeil: new THREE.MeshBasicMaterial({
      color: new THREE.Color(config.palette.background).lerp(
        new THREE.Color(config.palette.cool),
        0.22,
      ),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
    }),
    conversionPulse: new THREE.MeshBasicMaterial({
      color: new THREE.Color(config.palette.coolEdge).lerp(
        new THREE.Color(config.palette.chrome),
        0.18,
      ),
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    }),
  };

  applyHeroMembraneMaterials(materials, config, membraneConfig);

  materials.sweepBand.opacity = membraneActivation.bandBaseOpacity;

  return materials;
}

export function applyHeroMembraneMaterials(materials, config, membraneConfig) {
  const membraneAppearance = membraneConfig?.appearance ?? config.membrane.appearance;

  applyHeroMembraneBodyMaterial(materials.membrane, membraneAppearance, config.palette);
  applyHeroMembraneEdgeMaterial(materials.membraneEdge, membraneAppearance, config.palette);
}

export function createHeroAssetMaterial(config) {
  const tone = config.rustObject.material;

  return new THREE.MeshPhysicalMaterial({
    color: tone.color,
    emissive: tone.emissive,
    emissiveIntensity: tone.emissiveIntensity,
    metalness: tone.metalness,
    roughness: tone.roughness,
    clearcoat: tone.clearcoat,
    clearcoatRoughness: tone.clearcoatRoughness,
    sheen: tone.sheen,
    sheenColor: new THREE.Color(tone.sheenColor),
    sheenRoughness: tone.sheenRoughness,
    specularIntensity: tone.specularIntensity,
    specularColor: new THREE.Color(tone.specularColor),
    ior: tone.ior,
    transparent: true,
    opacity: 1,
    envMapIntensity: tone.envMapIntensity,
    side: tone.side === "double" ? THREE.DoubleSide : THREE.FrontSide,
  });
}

export function createHeroBlobMaterial(palette, blobFieldConfig) {
  const material = new THREE.MeshPhysicalMaterial();
  applyHeroBlobMaterial(material, palette, blobFieldConfig);
  return material;
}

export function applyHeroBlobMaterial(material, palette, blobFieldConfig) {
  const appearance = blobFieldConfig?.appearance ?? {};
  const transparent = (appearance.opacity ?? 1) < 0.999;

  material.color.set(appearance.bodyColor ?? palette.silver);
  material.emissive.set(appearance.emissive ?? palette.background);
  material.emissiveIntensity = appearance.emissiveIntensity ?? 0;
  material.metalness = appearance.metalness ?? 0.14;
  material.roughness = appearance.roughness ?? 0.28;
  material.clearcoat = appearance.clearcoat ?? 0.28;
  material.clearcoatRoughness = appearance.clearcoatRoughness ?? 0.16;
  material.specularIntensity = appearance.specularIntensity ?? 1;
  material.specularColor.set(appearance.specularColor ?? palette.coolEdge);
  material.ior = appearance.ior ?? 1.2;
  material.transparent = transparent;
  material.opacity = appearance.opacity ?? 1;
  material.envMapIntensity = appearance.envMapIntensity ?? 1.2;
  material.depthWrite = !transparent;
  material.side = THREE.FrontSide;
  material.needsUpdate = true;
}

function applyHeroMembraneBodyMaterial(material, appearance, palette) {
  const side = resolveMembraneSide(appearance.side);
  const transparent = appearance.opacity < 0.999 || appearance.transmission > 0.001;
  const flagsChanged =
    material.side !== side ||
    material.transparent !== transparent ||
    material.depthWrite !== true;

  material.color.set(appearance.bodyColor);
  material.emissive.set(appearance.emissive);
  material.emissiveIntensity = appearance.emissiveIntensity;
  material.metalness = appearance.metalness;
  material.roughness = appearance.roughness;
  material.transmission = appearance.transmission;
  material.thickness = appearance.thickness;
  material.ior = appearance.ior;
  material.attenuationColor.set(appearance.attenuationColor);
  material.attenuationDistance = appearance.attenuationDistance;
  material.clearcoat = appearance.clearcoat;
  material.clearcoatRoughness = appearance.clearcoatRoughness;
  material.specularIntensity = appearance.specularIntensity;
  material.specularColor.set(appearance.specularColor ?? palette.coolEdge);
  material.sheen = appearance.sheen ?? 0;
  material.sheenColor.set(appearance.sheenColor ?? appearance.bodyColor);
  material.sheenRoughness = appearance.sheenRoughness ?? 1;
  material.transparent = transparent;
  material.opacity = appearance.opacity;
  material.envMapIntensity = appearance.envMapIntensity;
  material.side = side;
  material.depthWrite = true;

  if (flagsChanged) {
    material.needsUpdate = true;
  }
}

function applyHeroMembraneEdgeMaterial(material, appearance, palette) {
  if (!material) {
    return;
  }

  const side = resolveMembraneSide(appearance.side);
  const flagsChanged =
    material.side !== side ||
    material.transparent !== true ||
    material.depthWrite !== false;

  material.color.set(appearance.rimColor ?? appearance.bodyColor);
  material.emissive.set(appearance.rimEmissive ?? appearance.emissive);
  material.emissiveIntensity =
    appearance.rimEmissiveIntensity ?? appearance.emissiveIntensity;
  material.metalness = appearance.rimMetalness ?? appearance.metalness;
  material.roughness = appearance.rimRoughness ?? appearance.roughness;
  material.transmission = appearance.rimTransmission ?? 0;
  material.thickness = appearance.rimThickness ?? 0;
  material.ior = appearance.rimIor ?? appearance.ior;
  material.attenuationColor.set(
    appearance.rimAttenuationColor ?? appearance.attenuationColor,
  );
  material.attenuationDistance =
    appearance.rimAttenuationDistance ?? appearance.attenuationDistance;
  material.clearcoat = appearance.rimClearcoat ?? appearance.clearcoat;
  material.clearcoatRoughness =
    appearance.rimClearcoatRoughness ?? appearance.clearcoatRoughness;
  material.specularIntensity =
    appearance.rimSpecularIntensity ?? appearance.specularIntensity;
  material.specularColor.set(
    appearance.rimSpecularColor ??
      appearance.specularColor ??
      appearance.rimColor ??
      palette.coolEdge,
  );
  material.sheen = appearance.rimSheen ?? 0;
  material.sheenColor.set(
    appearance.rimSheenColor ?? appearance.rimColor ?? appearance.bodyColor,
  );
  material.sheenRoughness = appearance.rimSheenRoughness ?? 1;
  material.transparent = true;
  material.opacity = appearance.rimOpacity ?? 0;
  material.envMapIntensity =
    appearance.rimEnvMapIntensity ?? appearance.envMapIntensity;
  material.side = side;
  material.depthWrite = false;

  if (flagsChanged) {
    material.needsUpdate = true;
  }
}

function resolveMembraneSide(side = "front") {
  return side === "double" ? THREE.DoubleSide : THREE.FrontSide;
}
