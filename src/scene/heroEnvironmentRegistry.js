import ferndaleStudioHdriUrl from "../../ferndale_studio_06_4k.exr?url";
import hdri2Url from "../../hdri_2.exr?url";
import hdri3Url from "../../hdri_3.exr?url";

function createHeroEnvironmentSpec({ key, label, sourceUrl = null, kind = "exr" }) {
  return {
    key,
    label,
    sourceUrl,
    kind,
  };
}

const runtimeHeroEnvironmentRegistry = {
  room: createHeroEnvironmentSpec({
    key: "room",
    label: "Studio Room",
    kind: "room",
  }),
};

export const heroEnvironmentRegistry = {
  ferndale: createHeroEnvironmentSpec({
    key: "ferndale",
    label: "Ferndale Studio 06",
    sourceUrl: ferndaleStudioHdriUrl,
  }),
  hdri2: createHeroEnvironmentSpec({
    key: "hdri2",
    label: "HDRI 2",
    sourceUrl: hdri2Url,
  }),
  hdri3: createHeroEnvironmentSpec({
    key: "hdri3",
    label: "HDRI 3",
    sourceUrl: hdri3Url,
  }),
};

export const curatedHeroEnvironmentKeys = ["ferndale", "hdri2", "hdri3"];
export const defaultHeroEnvironmentKey = "hdri3";

export function getHeroEnvironmentSpec(key = defaultHeroEnvironmentKey) {
  return heroEnvironmentRegistry[key] ?? heroEnvironmentRegistry[defaultHeroEnvironmentKey];
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
    return runtimeHeroEnvironmentRegistry.room;
  }

  return getHeroEnvironmentSpec(environmentKey);
}
