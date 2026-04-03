import * as THREE from "three";

export function createHeroMaterials(config) {
  const membraneAppearance = config.membrane.appearance;
  const membraneActivation = config.membrane.activation;

  return {
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
      specularIntensity: membraneAppearance.specularIntensity,
      specularColor: new THREE.Color(config.palette.coolEdge),
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
      specularColor: new THREE.Color(config.palette.coolEdge),
      transparent: true,
      opacity: membraneAppearance.rimOpacity,
      envMapIntensity: membraneAppearance.rimEnvMapIntensity,
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
      color: "#0b1118",
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
