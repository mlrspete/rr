const assetBasePath = "../../rust obj items";

export const heroAssetRegistry = {
  furnace: {
    key: "furnace",
    label: "Furnace",
    source: `${assetBasePath}/furnace.obj`,
    targetExtent: 2.36,
    normalizeRotation: { x: 0, y: 0, z: 0 },
    displayRotation: { x: 0.03, y: -0.42, z: 0.01 },
    position: { x: -0.04, y: 0.02, z: 0.08 },
    wobbleAmount: 0.045,
    wobbleSpeed: 0.42,
    materialTone: {
      color: "#c9c2bb",
      emissive: "#8a5b46",
      emissiveIntensity: 0.1,
      metalness: 0.62,
      roughness: 0.24,
      clearcoat: 0.92,
      clearcoatRoughness: 0.1,
      sheen: 0.46,
    },
  },
  crate: {
    key: "crate",
    label: "Large Wood Box",
    source: `${assetBasePath}/box.wooden.large.obj`,
    targetExtent: 2.18,
    normalizeRotation: { x: 0, y: 0, z: 0 },
    displayRotation: { x: 0.04, y: -0.56, z: -0.02 },
    position: { x: 0.02, y: 0.02, z: 0.12 },
    wobbleAmount: 0.035,
    wobbleSpeed: 0.5,
    materialTone: {
      color: "#bcb4ad",
      emissive: "#6f4d3d",
      emissiveIntensity: 0.08,
      metalness: 0.36,
      roughness: 0.42,
      clearcoat: 0.78,
      clearcoatRoughness: 0.18,
      sheen: 0.34,
    },
  },
  vending: {
    key: "vending",
    label: "Vending Machine",
    source: `${assetBasePath}/vending.machine_vendingmachine.obj`,
    targetExtent: 2.48,
    normalizeRotation: { x: 0, y: 0, z: 0 },
    displayRotation: { x: 0.02, y: -0.34, z: 0.01 },
    position: { x: 0.02, y: 0.03, z: 0.04 },
    wobbleAmount: 0.03,
    wobbleSpeed: 0.32,
    materialTone: {
      color: "#d6d0c9",
      emissive: "#4f5f7c",
      emissiveIntensity: 0.09,
      metalness: 0.68,
      roughness: 0.2,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      sheen: 0.52,
    },
  },
  purifier: {
    key: "purifier",
    label: "Water Purifier",
    source: `${assetBasePath}/water.purifier.obj`,
    targetExtent: 2.3,
    normalizeRotation: { x: 0, y: 0, z: 0 },
    displayRotation: { x: 0.04, y: -0.58, z: 0.03 },
    position: { x: 0, y: 0.02, z: 0.08 },
    wobbleAmount: 0.05,
    wobbleSpeed: 0.48,
    materialTone: {
      color: "#d9d4ce",
      emissive: "#80665a",
      emissiveIntensity: 0.08,
      metalness: 0.54,
      roughness: 0.28,
      clearcoat: 0.9,
      clearcoatRoughness: 0.12,
      sheen: 0.48,
    },
  },
  fridge: {
    key: "fridge",
    label: "Fridge",
    source: `${assetBasePath}/fridge.obj`,
    targetExtent: 2.42,
    normalizeRotation: { x: 0, y: 0, z: 0 },
    displayRotation: { x: 0.03, y: -0.32, z: 0.01 },
    position: { x: 0.02, y: 0.02, z: 0.02 },
    wobbleAmount: 0.028,
    wobbleSpeed: 0.34,
    materialTone: {
      color: "#d0cbc5",
      emissive: "#58667f",
      emissiveIntensity: 0.08,
      metalness: 0.64,
      roughness: 0.24,
      clearcoat: 0.96,
      clearcoatRoughness: 0.1,
      sheen: 0.44,
    },
  },
  helmet: {
    key: "helmet",
    label: "Riot Helmet",
    source: `${assetBasePath}/riot.helmet.obj`,
    targetExtent: 2.06,
    normalizeRotation: { x: 0, y: 0, z: 0 },
    displayRotation: { x: 0.09, y: -0.62, z: -0.04 },
    position: { x: 0, y: 0.02, z: 0.18 },
    wobbleAmount: 0.055,
    wobbleSpeed: 0.58,
    materialTone: {
      color: "#b4b0ac",
      emissive: "#6a5360",
      emissiveIntensity: 0.07,
      metalness: 0.72,
      roughness: 0.22,
      clearcoat: 0.98,
      clearcoatRoughness: 0.08,
      sheen: 0.38,
    },
  },
};

export const curatedHeroAssetKeys = Object.keys(heroAssetRegistry);
export const defaultHeroAssetKey = "furnace";

export function getHeroAssetSpec(key = defaultHeroAssetKey) {
  return heroAssetRegistry[key] ?? heroAssetRegistry[defaultHeroAssetKey];
}

export function resolveHeroAssetKey(search = "") {
  const params = new URLSearchParams(search);
  const requestedKey = params.get("asset")?.trim().toLowerCase();

  if (!requestedKey) {
    return defaultHeroAssetKey;
  }

  return heroAssetRegistry[requestedKey] ? requestedKey : defaultHeroAssetKey;
}
