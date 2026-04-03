import bbqUrl from "../../rust obj items/bbq.obj?url";
import akBarrelUrl from "../../rust obj items/ak obj/rifle.ak_ak47_Barrel.obj?url";
import akBodyUrl from "../../rust obj items/ak obj/rifle.ak_ak47_Body.obj?url";
import akMagGripUrl from "../../rust obj items/ak obj/rifle.ak_ak47_MagGrip.obj?url";
import akStockUrl from "../../rust obj items/ak obj/rifle.ak_ak47_stock.obj?url";
import hoodieTorsoUrl from "../../rust obj items/hoodie obj/hoodie_player_urban_torso.obj?url";
import hoodieShirtUrl from "../../rust obj items/hoodie obj/hoodie_Tshirt.obj?url";

export const heroAssetArchiveRoot = "rust obj items";

function createRustHeroAssetSpec({
  key,
  label,
  archiveSources,
  sourceUrls,
  targetExtent,
  normalizeRotation = { x: 0, y: 0, z: 0 },
  displayRotation,
  position = { x: 0, y: 0, z: 0 },
  wobbleAmount = 0.018,
  wobbleSpeed = 0.42,
}) {
  return {
    key,
    kind: "rust-obj",
    label,
    archiveSources,
    sourceUrls,
    targetExtent,
    normalizeRotation,
    displayRotation,
    position,
    wobbleAmount,
    wobbleSpeed,
  };
}

export const heroAssetRegistry = {
  bbq: createRustHeroAssetSpec({
    key: "bbq",
    label: "Barbeque",
    archiveSources: [`${heroAssetArchiveRoot}/bbq.obj`],
    sourceUrls: [bbqUrl],
    targetExtent: 1.5,
    displayRotation: { x: 0.08, y: -0.62, z: 0.01 },
    position: { x: 0.02, y: -0.04, z: 0.03 },
    wobbleAmount: 0.014,
    wobbleSpeed: 0.38,
  }),
  ak: createRustHeroAssetSpec({
    key: "ak",
    label: "AK",
    archiveSources: [
      `${heroAssetArchiveRoot}/ak obj/rifle.ak_ak47_Body.obj`,
      `${heroAssetArchiveRoot}/ak obj/rifle.ak_ak47_Barrel.obj`,
      `${heroAssetArchiveRoot}/ak obj/rifle.ak_ak47_MagGrip.obj`,
      `${heroAssetArchiveRoot}/ak obj/rifle.ak_ak47_stock.obj`,
    ],
    sourceUrls: [akBodyUrl, akBarrelUrl, akMagGripUrl, akStockUrl],
    targetExtent: 1.82,
    normalizeRotation: { x: 0, y: Math.PI / 2, z: 0 },
    displayRotation: { x: -0.12, y: -0.92, z: 0.1 },
    position: { x: 0.02, y: 0.01, z: 0.03 },
    wobbleAmount: 0.008,
    wobbleSpeed: 0.3,
  }),
  hoodie: createRustHeroAssetSpec({
    key: "hoodie",
    label: "Hoodie",
    archiveSources: [
      `${heroAssetArchiveRoot}/hoodie obj/hoodie_player_urban_torso.obj`,
      `${heroAssetArchiveRoot}/hoodie obj/hoodie_Tshirt.obj`,
    ],
    sourceUrls: [hoodieTorsoUrl, hoodieShirtUrl],
    targetExtent: 1.58,
    displayRotation: { x: 0.12, y: -0.5, z: 0.02 },
    position: { x: 0.02, y: 0.02, z: 0.02 },
    wobbleAmount: 0.012,
    wobbleSpeed: 0.34,
  }),
};

export const curatedHeroAssetKeys = ["bbq", "ak", "hoodie"];
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
