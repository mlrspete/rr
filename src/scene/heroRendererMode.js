export const HERO_RENDERER_QUERY_PARAM = "renderer";
export const defaultHeroRendererMode = "webgl";
export const experimentalHeroRendererMode = "webgpu";

export function resolveHeroRendererMode(search = "") {
  const requestedMode = new URLSearchParams(search)
    .get(HERO_RENDERER_QUERY_PARAM)
    ?.trim()
    .toLowerCase();

  if (requestedMode === experimentalHeroRendererMode) {
    return experimentalHeroRendererMode;
  }

  return defaultHeroRendererMode;
}
