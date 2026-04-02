export const heroClusterPresets = [
  {
    id: "forge-localized",
    rustAssetKeys: ["furnace", "crate"],
    premiumShapeKeys: ["facetOblong", "capsuleBar"],
    slotVariations: {
      left: {
        slotA: {
          positionOffset: { x: -0.03, y: 0.06, z: 0.04 },
          rotationOffset: { x: 0.01, y: 0.05, z: 0.02 },
          scaleMultiplier: 1.02,
        },
        slotB: {
          positionOffset: { x: -0.02, y: -0.04, z: -0.02 },
          rotationOffset: { x: -0.02, y: 0.04, z: -0.03 },
          scaleMultiplier: 0.98,
        },
      },
      right: {
        slotA: {
          positionOffset: { x: 0.04, y: 0.03, z: 0.04 },
          rotationOffset: { x: 0.02, y: -0.04, z: -0.02 },
          scaleMultiplier: 1.01,
        },
        slotB: {
          positionOffset: { x: 0.03, y: -0.05, z: -0.03 },
          rotationOffset: { x: -0.01, y: -0.05, z: 0.03 },
          scaleMultiplier: 0.99,
        },
      },
    },
    calloutPools: {
      premiumToRust: [
        {
          tone: "cool",
          kicker: "RUST-NATIVE",
          title: "Wipe-localized industrial matter confirmed.",
        },
        {
          tone: "cool",
          kicker: "WORLD-FIT CONFIRMED",
          title: "Utility silhouette resolves without breaking fiction.",
        },
        {
          tone: "cool",
          kicker: "NATIVE PLACEMENT",
          title: "Hard-use form adapted for player-first read.",
        },
      ],
      rustToPremium: [
        {
          tone: "warm",
          kicker: "CAMPAIGN COMPLETE",
          title: "Result-side matter settles into authored delivery.",
        },
        {
          tone: "warm",
          kicker: "IMPACT VERIFIED",
          title: "Premium signal survives the world and lands cleanly.",
        },
        {
          tone: "warm",
          kicker: "DELIVERY CONFIRMED",
          title: "Campaign finish issued with endemic credibility.",
        },
      ],
    },
  },
  {
    id: "network-utility",
    rustAssetKeys: ["vending", "purifier"],
    premiumShapeKeys: ["capsuleBar", "facetOblong"],
    slotVariations: {
      left: {
        slotA: {
          positionOffset: { x: 0.02, y: 0.05, z: 0.02 },
          rotationOffset: { x: 0.01, y: 0.04, z: 0.01 },
          scaleMultiplier: 0.99,
        },
        slotB: {
          positionOffset: { x: -0.01, y: -0.02, z: -0.03 },
          rotationOffset: { x: -0.02, y: 0.02, z: -0.02 },
          scaleMultiplier: 1.01,
        },
      },
      right: {
        slotA: {
          positionOffset: { x: 0.02, y: 0.06, z: 0.03 },
          rotationOffset: { x: 0.01, y: -0.03, z: -0.02 },
          scaleMultiplier: 1.03,
        },
        slotB: {
          positionOffset: { x: -0.02, y: -0.03, z: -0.01 },
          rotationOffset: { x: -0.02, y: -0.02, z: 0.03 },
          scaleMultiplier: 0.98,
        },
      },
    },
    calloutPools: {
      premiumToRust: [
        {
          tone: "cool",
          kicker: "WIPE-LOCALIZED",
          title: "Utility cluster translated for native encounter logic.",
        },
        {
          tone: "cool",
          kicker: "FORMAT ADAPTED",
          title: "Functional matter preserves read through conversion.",
        },
        {
          tone: "cool",
          kicker: "RUST-NATIVE",
          title: "Player-facing utility remains crisp after translation.",
        },
      ],
      rustToPremium: [
        {
          tone: "warm",
          kicker: "REPORT ISSUED",
          title: "Campaign return delivered with proof-level clarity.",
        },
        {
          tone: "warm",
          kicker: "PLAYERS REACHED",
          title: "Result-side language resolves after world contact.",
        },
        {
          tone: "warm",
          kicker: "DELIVERY CONFIRMED",
          title: "Premium output lands without dashboard clutter.",
        },
      ],
    },
  },
  {
    id: "shelter-verified",
    rustAssetKeys: ["fridge", "helmet"],
    premiumShapeKeys: ["facetOblong", "capsuleBar"],
    slotVariations: {
      left: {
        slotA: {
          positionOffset: { x: -0.01, y: 0.04, z: 0.05 },
          rotationOffset: { x: 0.02, y: 0.03, z: 0.02 },
          scaleMultiplier: 1.01,
        },
        slotB: {
          positionOffset: { x: 0.01, y: -0.03, z: -0.02 },
          rotationOffset: { x: -0.01, y: 0.05, z: -0.04 },
          scaleMultiplier: 0.97,
        },
      },
      right: {
        slotA: {
          positionOffset: { x: 0.03, y: 0.03, z: 0.02 },
          rotationOffset: { x: 0.01, y: -0.04, z: -0.01 },
          scaleMultiplier: 1.02,
        },
        slotB: {
          positionOffset: { x: 0.01, y: -0.04, z: -0.02 },
          rotationOffset: { x: -0.02, y: -0.06, z: 0.03 },
          scaleMultiplier: 1,
        },
      },
    },
    calloutPools: {
      premiumToRust: [
        {
          tone: "cool",
          kicker: "WORLD-FIT CONFIRMED",
          title: "Survival-facing matter holds native tension after sweep.",
        },
        {
          tone: "cool",
          kicker: "NATIVE PLACEMENT",
          title: "Protective read localized to the active world state.",
        },
        {
          tone: "cool",
          kicker: "RUST-NATIVE",
          title: "Shelter-side utility resolves with endemic authority.",
        },
      ],
      rustToPremium: [
        {
          tone: "warm",
          kicker: "CAMPAIGN COMPLETE",
          title: "Result language returns sharpened by world contact.",
        },
        {
          tone: "warm",
          kicker: "IMPACT VERIFIED",
          title: "Endemic proof resolves into premium campaign matter.",
        },
        {
          tone: "warm",
          kicker: "DELIVERY CONFIRMED",
          title: "Outcome issued with authored conversion proof.",
        },
      ],
    },
  },
];

export function getHeroClusterPreset(index = 0) {
  if (!heroClusterPresets.length) {
    return null;
  }

  const normalizedIndex =
    ((index % heroClusterPresets.length) + heroClusterPresets.length) %
    heroClusterPresets.length;

  return heroClusterPresets[normalizedIndex];
}

export function findHeroClusterPresetIndexForAsset(assetKey = "") {
  const normalizedKey = `${assetKey}`.trim().toLowerCase();

  if (!normalizedKey) {
    return 0;
  }

  const index = heroClusterPresets.findIndex((preset) =>
    preset.rustAssetKeys.includes(normalizedKey),
  );

  return index === -1 ? 0 : index;
}

export function rotatePresetKeys(keys, preferredKey = "") {
  const normalizedKey = `${preferredKey}`.trim().toLowerCase();

  if (!normalizedKey || !keys.includes(normalizedKey)) {
    return [...keys];
  }

  const startIndex = keys.indexOf(normalizedKey);
  return [...keys.slice(startIndex), ...keys.slice(0, startIndex)];
}
