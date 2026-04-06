function createHeroEnvironmentSpec({
  key,
  label,
  sourceUrl = null,
  loadSourceUrl = null,
  kind = "exr",
}) {
  return {
    key,
    label,
    sourceUrl,
    loadSourceUrl,
    kind,
  };
}

export const heroRoomEnvironmentSpec = createHeroEnvironmentSpec({
  key: "room",
  label: "Studio Room",
  kind: "room",
});

export const heroEnvironmentRegistry = {
  ferndale: createHeroEnvironmentSpec({
    key: "ferndale",
    label: "Ferndale Studio 06",
    loadSourceUrl: () =>
      import("../../ferndale_studio_06_4k.exr?url").then((module) => module.default),
  }),
  hdri2: createHeroEnvironmentSpec({
    key: "hdri2",
    label: "HDRI 2",
    loadSourceUrl: () => import("../../hdri_2.exr?url").then((module) => module.default),
  }),
  hdri3: createHeroEnvironmentSpec({
    key: "hdri3",
    label: "HDRI 3",
    loadSourceUrl: () => import("../../hdri_3.exr?url").then((module) => module.default),
  }),
};

export const curatedHeroEnvironmentKeys = ["ferndale", "hdri2", "hdri3"];
export const defaultHeroEnvironmentKey = "hdri3";

export function getHeroEnvironmentSpec(key = defaultHeroEnvironmentKey) {
  return (
    heroEnvironmentRegistry[key] ??
    (key === heroRoomEnvironmentSpec.key ? heroRoomEnvironmentSpec : null) ??
    heroEnvironmentRegistry[defaultHeroEnvironmentKey]
  );
}

export function resolveHeroEnvironmentKey(search = "") {
  const params = new URLSearchParams(search);
  const requestedKey = params.get("env")?.trim().toLowerCase();

  if (!requestedKey) {
    return defaultHeroEnvironmentKey;
  }

  return heroEnvironmentRegistry[requestedKey]
    ? requestedKey
    : defaultHeroEnvironmentKey;
}

export function hasExplicitHeroEnvironmentSelection(search = "") {
  return new URLSearchParams(search).has("env");
}

export function resolveHeroEnvironmentSpecForViewport({
  environmentKey = defaultHeroEnvironmentKey,
  viewportKey = "desktop",
  forceEnvironment = false,
} = {}) {
  if (!forceEnvironment && (viewportKey === "tablet" || viewportKey === "mobile")) {
    return heroRoomEnvironmentSpec;
  }

  return getHeroEnvironmentSpec(environmentKey);
}

export async function loadHeroEnvironmentSourceUrl(environmentSpec) {
  if (!environmentSpec || environmentSpec.kind !== "exr") {
    return null;
  }

  if (environmentSpec.sourceUrl) {
    return environmentSpec.sourceUrl;
  }

  if (typeof environmentSpec.loadSourceUrl !== "function") {
    return null;
  }

  const sourceUrl = await environmentSpec.loadSourceUrl();
  environmentSpec.sourceUrl = sourceUrl;
  return sourceUrl;
}
