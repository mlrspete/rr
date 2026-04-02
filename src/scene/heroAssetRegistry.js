export const heroAssetArchiveRoot = "rust obj items";
export const heroAssetRuntimeRoot = "hero-assets";
export const normalizedRustHeroExtent = 1.9;

function createRustHeroAssetSpec({
  key,
  label,
  file,
  displayRotation,
  position = { x: 0, y: 0, z: 0 },
  wobbleAmount,
  wobbleSpeed,
  materialTone,
}) {
  return {
    key,
    kind: "rust-obj",
    label,
    archiveSource: `${heroAssetArchiveRoot}/${file}`,
    runtimePath: `${heroAssetRuntimeRoot}/${file}`,
    targetExtent: normalizedRustHeroExtent,
    normalizeRotation: { x: 0, y: 0, z: 0 },
    displayRotation,
    position,
    wobbleAmount,
    wobbleSpeed,
    materialTone,
  };
}

export const heroAssetRegistry = {
  furnace: createRustHeroAssetSpec({
    key: "furnace",
    label: "Furnace",
    file: "furnace.obj",
    displayRotation: { x: 0.04, y: -0.56, z: 0.02 },
    position: { x: 0, y: 0.01, z: 0.03 },
    wobbleAmount: 0.022,
    wobbleSpeed: 0.36,
    materialTone: {
      color: "#c7c1ba",
      emissive: "#6f584d",
      emissiveIntensity: 0.04,
      metalness: 0.58,
      roughness: 0.28,
      clearcoat: 0.84,
      clearcoatRoughness: 0.12,
      sheen: 0.2,
      envMapIntensity: 1.2,
    },
  }),
  crate: createRustHeroAssetSpec({
    key: "crate",
    label: "Large Wood Box",
    file: "box.wooden.large.obj",
    displayRotation: { x: 0.06, y: -0.7, z: -0.02 },
    position: { x: 0, y: 0.01, z: 0.05 },
    wobbleAmount: 0.018,
    wobbleSpeed: 0.42,
    materialTone: {
      color: "#bcb4ad",
      emissive: "#675246",
      emissiveIntensity: 0.026,
      metalness: 0.34,
      roughness: 0.4,
      clearcoat: 0.72,
      clearcoatRoughness: 0.18,
      sheen: 0.16,
      envMapIntensity: 1.08,
    },
  }),
  vending: createRustHeroAssetSpec({
    key: "vending",
    label: "Vending Machine",
    file: "vending.machine_vendingmachine.obj",
    displayRotation: { x: 0.02, y: -0.46, z: 0.01 },
    position: { x: 0, y: 0.01, z: 0.01 },
    wobbleAmount: 0.016,
    wobbleSpeed: 0.3,
    materialTone: {
      color: "#d5d0c9",
      emissive: "#4f6177",
      emissiveIntensity: 0.036,
      metalness: 0.7,
      roughness: 0.24,
      clearcoat: 0.96,
      clearcoatRoughness: 0.09,
      sheen: 0.18,
      envMapIntensity: 1.28,
    },
  }),
  purifier: createRustHeroAssetSpec({
    key: "purifier",
    label: "Water Purifier",
    file: "water.purifier.obj",
    displayRotation: { x: 0.08, y: -0.72, z: 0.04 },
    position: { x: 0, y: 0.01, z: 0.04 },
    wobbleAmount: 0.02,
    wobbleSpeed: 0.38,
    materialTone: {
      color: "#d7d2cb",
      emissive: "#766056",
      emissiveIntensity: 0.032,
      metalness: 0.56,
      roughness: 0.3,
      clearcoat: 0.86,
      clearcoatRoughness: 0.12,
      sheen: 0.18,
      envMapIntensity: 1.18,
    },
  }),
  fridge: createRustHeroAssetSpec({
    key: "fridge",
    label: "Fridge",
    file: "fridge.obj",
    displayRotation: { x: 0.04, y: -0.52, z: 0.01 },
    position: { x: 0, y: 0.02, z: 0.01 },
    wobbleAmount: 0.014,
    wobbleSpeed: 0.26,
    materialTone: {
      color: "#d6d0c9",
      emissive: "#536278",
      emissiveIntensity: 0.034,
      metalness: 0.72,
      roughness: 0.22,
      clearcoat: 0.96,
      clearcoatRoughness: 0.08,
      sheen: 0.16,
      envMapIntensity: 1.28,
    },
  }),
  helmet: createRustHeroAssetSpec({
    key: "helmet",
    label: "Riot Helmet",
    file: "riot.helmet.obj",
    displayRotation: { x: 0.16, y: -0.82, z: -0.06 },
    position: { x: 0, y: 0.01, z: 0.08 },
    wobbleAmount: 0.028,
    wobbleSpeed: 0.54,
    materialTone: {
      color: "#9b9ca1",
      emissive: "#5f5765",
      emissiveIntensity: 0.024,
      metalness: 0.84,
      roughness: 0.24,
      clearcoat: 0.94,
      clearcoatRoughness: 0.1,
      sheen: 0.12,
      specularColor: "#d9dde3",
      envMapIntensity: 1.34,
    },
  }),
};

export const curatedHeroAssetKeys = [
  "furnace",
  "crate",
  "vending",
  "purifier",
  "fridge",
  "helmet",
];

export const curatedHeroAssets = curatedHeroAssetKeys.map((key) => heroAssetRegistry[key]);
export const defaultHeroAssetKey = curatedHeroAssetKeys[0];

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
