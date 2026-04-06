import { isHeroRuntimeConstrained } from "../config.js";

export const heroWebGPUSceneConfig = {
  renderer: {
    antialiasProfiles: {
      desktop: true,
      laptop: true,
      tablet: false,
      mobile: false,
    },
    pixelRatioScaleProfiles: {
      desktop: 1,
      laptop: 0.96,
      tablet: 0.9,
      mobile: 0.8,
    },
    constrainedPixelRatioScale: 0.76,
  },
  sphere: {
    detailProfiles: {
      desktop: {
        widthSegments: 72,
        heightSegments: 54,
      },
      laptop: {
        widthSegments: 64,
        heightSegments: 48,
      },
      tablet: {
        widthSegments: 46,
        heightSegments: 34,
      },
      mobile: {
        widthSegments: 32,
        heightSegments: 24,
      },
    },
    constrainedDetail: {
      widthSegments: 40,
      heightSegments: 30,
    },
  },
  scene: {
    membraneGlowOpacityScaleProfiles: {
      desktop: 1,
      laptop: 0.94,
      tablet: 0.82,
      mobile: 0.68,
    },
    rearHaloOpacityScaleProfiles: {
      desktop: 1,
      laptop: 0.92,
      tablet: 0.78,
      mobile: 0.64,
    },
    backPointIntensityScaleProfiles: {
      desktop: 1,
      laptop: 0.94,
      tablet: 0.8,
      mobile: 0.68,
    },
    placeholderOpacityScaleProfiles: {
      desktop: 1,
      laptop: 0.96,
      tablet: 0.9,
      mobile: 0.84,
    },
    constrainedScales: {
      membraneGlowOpacity: 0.74,
      rearHaloOpacity: 0.72,
      backPointIntensity: 0.7,
      placeholderOpacity: 0.86,
    },
  },
  features: {
    disableOnConstrainedDevices: {
      volumetricLighting: true,
      headline3D: true,
    },
  },
};

export function resolveHeroWebGPUSceneConfig(
  viewportKey = "desktop",
  reducedMotion = false,
  runtimeHints = {},
) {
  const constrained = isHeroRuntimeConstrained(runtimeHints);
  const rendererScale =
    heroWebGPUSceneConfig.renderer.pixelRatioScaleProfiles[viewportKey] ??
    heroWebGPUSceneConfig.renderer.pixelRatioScaleProfiles.desktop;
  const sphereDetail =
    heroWebGPUSceneConfig.sphere.detailProfiles[viewportKey] ??
    heroWebGPUSceneConfig.sphere.detailProfiles.desktop;
  const membraneGlowOpacityScale =
    heroWebGPUSceneConfig.scene.membraneGlowOpacityScaleProfiles[viewportKey] ??
    heroWebGPUSceneConfig.scene.membraneGlowOpacityScaleProfiles.desktop;
  const rearHaloOpacityScale =
    heroWebGPUSceneConfig.scene.rearHaloOpacityScaleProfiles[viewportKey] ??
    heroWebGPUSceneConfig.scene.rearHaloOpacityScaleProfiles.desktop;
  const backPointIntensityScale =
    heroWebGPUSceneConfig.scene.backPointIntensityScaleProfiles[viewportKey] ??
    heroWebGPUSceneConfig.scene.backPointIntensityScaleProfiles.desktop;
  const placeholderOpacityScale =
    heroWebGPUSceneConfig.scene.placeholderOpacityScaleProfiles[viewportKey] ??
    heroWebGPUSceneConfig.scene.placeholderOpacityScaleProfiles.desktop;
  const reducedMotionOpacityScale = reducedMotion ? 0.9 : 1;
  const reducedMotionIntensityScale = reducedMotion ? 0.92 : 1;

  return {
    runtimeConstrained: constrained,
    renderer: {
      antialias:
        !constrained &&
        (heroWebGPUSceneConfig.renderer.antialiasProfiles[viewportKey] ??
          heroWebGPUSceneConfig.renderer.antialiasProfiles.desktop),
      pixelRatioScale: constrained
        ? heroWebGPUSceneConfig.renderer.constrainedPixelRatioScale
        : rendererScale,
    },
    sphere: constrained
      ? { ...heroWebGPUSceneConfig.sphere.constrainedDetail }
      : { ...sphereDetail },
    scene: {
      membraneGlowOpacityScale:
        (constrained
          ? heroWebGPUSceneConfig.scene.constrainedScales.membraneGlowOpacity
          : membraneGlowOpacityScale) * reducedMotionOpacityScale,
      rearHaloOpacityScale:
        (constrained
          ? heroWebGPUSceneConfig.scene.constrainedScales.rearHaloOpacity
          : rearHaloOpacityScale) * reducedMotionOpacityScale,
      backPointIntensityScale:
        (constrained
          ? heroWebGPUSceneConfig.scene.constrainedScales.backPointIntensity
          : backPointIntensityScale) * reducedMotionIntensityScale,
      placeholderOpacityScale:
        constrained
          ? heroWebGPUSceneConfig.scene.constrainedScales.placeholderOpacity
          : placeholderOpacityScale,
    },
    features: {
      volumetricLighting:
        !constrained ||
        !heroWebGPUSceneConfig.features.disableOnConstrainedDevices.volumetricLighting,
      headline3D:
        !constrained ||
        !heroWebGPUSceneConfig.features.disableOnConstrainedDevices.headline3D,
    },
  };
}
