export const heroConfig = {
  renderer: {
    exposure: 1.01,
  },
  quality: {
    laptopBreakpoint: 1440,
    tabletBreakpoint: 980,
    mobileBreakpoint: 680,
  },
  responsive: {
    desktop: {
      pixelRatioCap: 1.7,
    },
    laptop: {
      pixelRatioCap: 1.55,
    },
    tablet: {
      pixelRatioCap: 1.3,
    },
    mobile: {
      pixelRatioCap: 1,
    },
  },
  palette: {
    background: "#050507",
    fog: "#07080b",
    chrome: "#eef2f7",
    silver: "#d8dee7",
    cool: "#6d85b3",
    coolEdge: "#b8d1ff",
    graphite: "#4c555f",
    graphiteSpecular: "#b8c4d2",
    graphiteEmissive: "#181d24",
    warm: "#8f7460",
  },
  camera: {
    desktop: {
      fov: 35,
      position: { x: 0.06, y: 0.08, z: 7.15 },
    },
    laptop: {
      fov: 38,
      position: { x: 0.05, y: 0.08, z: 7.65 },
    },
    tablet: {
      fov: 42,
      position: { x: 0.04, y: 0.08, z: 8.35 },
    },
    mobile: {
      fov: 47,
      position: { x: 0.02, y: 0.06, z: 9.1 },
    },
    lookAt: { x: 0.1, y: -0.18, z: 0.05 },
  },
  intro: {
    duration: 1.5,
    ease: "power3.out",
    startPosition: { x: 0, y: -0.14, z: 0.9 },
    startRotation: { x: 0.05, y: -0.08, z: -0.01 },
    stageScale: 0.97,
  },
  sphere: {
    radius: 0.58,
    widthSegments: 192,
    heightSegments: 144,
    idleFloatAmplitude: 0.03,
    idleFloatSpeed: 0.7,
  },
  rustObject: {
    idleFloatAmplitude: 0.025,
    idleFloatSpeed: 0.52,
    material: {
      color: "#4c555f",
      emissive: "#181d24",
      emissiveIntensity: 0.02,
      metalness: 0.22,
      roughness: 0.38,
      clearcoat: 0.46,
      clearcoatRoughness: 0.2,
      sheen: 0.06,
      sheenColor: "#8f9db0",
      sheenRoughness: 0.46,
      specularIntensity: 0.88,
      specularColor: "#b8c4d2",
      ior: 1.42,
      envMapIntensity: 1.28,
      side: "double",
    },
  },
  membrane: {
    geometry: {
      body: {
        radiusX: 1.14,
        radiusY: 1.84,
        depth: 0.34,
        bevelSize: 0.05,
        bevelThickness: 0.08,
        exponent: 3.08,
        shoulderPinch: 0.08,
        points: 88,
      },
      rim: {
        radiusX: 1.24,
        radiusY: 1.96,
        frame: 0.08,
        depth: 0.08,
        exponent: 3.06,
        shoulderPinch: 0.068,
        points: 88,
      },
      sweepBand: {
        width: 0.56,
        height: 2.96,
        radius: 0.28,
      },
      halo: {
        offsetX: 0.04,
        offsetY: 0.02,
        offsetZ: -0.72,
        scaleX: 4.1,
        scaleY: 5.9,
      },
      conversionVeil: {
        width: 0.92,
        height: 2.56,
        radius: 0.34,
        offsetX: 0.18,
        offsetY: 0.01,
        offsetZ: 0.26,
        travelX: 0.08,
      },
      conversionPulse: {
        width: 0.74,
        height: 2.18,
        radius: 0.3,
        offsetX: 0.08,
        offsetY: 0.01,
        offsetZ: 0.34,
        travelX: 0.12,
      },
    },
    appearance: {
      bodyColor: "#b9c6da",
      rimColor: "#c7d5ea",
      emissive: "#4f678f",
      rimEmissive: "#5e7fb3",
      transmission: 0.92,
      thickness: 2.6,
      ior: 1.32,
      attenuationDistance: 0.82,
      attenuationColor: "#131923",
      metalness: 0.08,
      roughness: 0.18,
      clearcoat: 1,
      clearcoatRoughness: 0.14,
      specularIntensity: 1,
      opacity: 0.94,
      envMapIntensity: 1.28,
      emissiveIntensity: 0.008,
      rimMetalness: 0.34,
      rimRoughness: 0.2,
      rimClearcoat: 1,
      rimClearcoatRoughness: 0.14,
      rimOpacity: 0.42,
      rimEnvMapIntensity: 1.34,
      rimEmissiveIntensity: 0.014,
    },
    motion: {
      pointerYaw: 0.018,
      pointerPitch: 0.014,
      phaseYaw: 0.02,
      verticalDrift: 0.01,
      bandTravelX: 0.08,
      bandBob: 0.004,
      haloDriftX: 0.014,
      haloDriftY: 0.018,
    },
    activation: {
      bandBaseOpacity: 0.018,
      bandPulseOpacity: 0.075,
      bandWidthBoost: 0.08,
      bandHeightBoost: 0.04,
      bandDepthBoost: 0.018,
      haloBaseOpacity: 0.014,
      haloPulseOpacity: 0.038,
      haloScaleXBoost: 0.34,
      haloScaleYBoost: 0.56,
      bodyThicknessBoost: 0.62,
      bodyEnvBoost: 0.12,
      bodyEmissiveBoost: 0.018,
      bodyScaleBoost: 0.038,
      veilOpacity: 0.28,
      veilScaleBoost: 0.12,
      pulseOpacity: 0.08,
      pulseScaleBoost: 0.14,
      rimOpacityBoost: 0.1,
      rimEnvBoost: 0.1,
      rimScaleBoost: 0.04,
    },
  },
  chamber: {
    desktop: {
      membrane: {
        position: { x: 0.26, y: -0.08, z: 0.2 },
        rotation: { x: 0.16, y: -0.36, z: 0.08 },
        scale: { x: 1.07, y: 1.07, z: 1.07 },
      },
      sphere: {
        startX: -3.25,
        startY: 0.16,
        startZ: 0.34,
        nearX: -1.08,
        nearY: 0.12,
        nearZ: 0.18,
        crossX: -0.08,
        crossY: 0.04,
        crossZ: -0.08,
        hiddenX: 0.16,
        hiddenY: 0.02,
        hiddenZ: -0.2,
      },
      object: {
        startX: 0.2,
        startY: 0,
        startZ: -0.16,
        restX: 1.68,
        restY: -0.06,
        restZ: 0.04,
        holdX: 2.12,
        holdY: -0.02,
        holdZ: -0.02,
        exitX: 2.58,
        exitY: -0.2,
        exitZ: -0.38,
      },
    },
    laptop: {
      membrane: {
        position: { x: 0.22, y: -0.1, z: 0.2 },
        rotation: { x: 0.16, y: -0.34, z: 0.08 },
        scale: { x: 1.02, y: 1.02, z: 1.02 },
      },
      sphere: {
        startX: -2.95,
        startY: 0.14,
        startZ: 0.32,
        nearX: -0.98,
        nearY: 0.1,
        nearZ: 0.16,
        crossX: -0.06,
        crossY: 0.04,
        crossZ: -0.08,
        hiddenX: 0.14,
        hiddenY: 0.02,
        hiddenZ: -0.2,
      },
      object: {
        startX: 0.18,
        startY: -0.01,
        startZ: -0.16,
        restX: 1.56,
        restY: -0.06,
        restZ: 0.04,
        holdX: 1.94,
        holdY: -0.02,
        holdZ: -0.02,
        exitX: 2.34,
        exitY: -0.18,
        exitZ: -0.34,
      },
    },
    tablet: {
      membrane: {
        position: { x: 0.16, y: -0.18, z: 0.2 },
        rotation: { x: 0.15, y: -0.32, z: 0.08 },
        scale: { x: 0.97, y: 0.97, z: 0.97 },
      },
      sphere: {
        startX: -2.52,
        startY: 0.1,
        startZ: 0.28,
        nearX: -0.86,
        nearY: 0.08,
        nearZ: 0.14,
        crossX: -0.04,
        crossY: 0.03,
        crossZ: -0.08,
        hiddenX: 0.12,
        hiddenY: 0.02,
        hiddenZ: -0.18,
      },
      object: {
        startX: 0.16,
        startY: -0.04,
        startZ: -0.14,
        restX: 1.34,
        restY: -0.1,
        restZ: 0.04,
        holdX: 1.68,
        holdY: -0.06,
        holdZ: -0.02,
        exitX: 2.04,
        exitY: -0.2,
        exitZ: -0.3,
      },
    },
    mobile: {
      membrane: {
        position: { x: 0.1, y: -0.3, z: 0.22 },
        rotation: { x: 0.14, y: -0.28, z: 0.08 },
        scale: { x: 0.9, y: 0.9, z: 0.9 },
      },
      sphere: {
        startX: -2.04,
        startY: 0.04,
        startZ: 0.24,
        nearX: -0.72,
        nearY: 0.04,
        nearZ: 0.12,
        crossX: -0.02,
        crossY: 0.02,
        crossZ: -0.08,
        hiddenX: 0.1,
        hiddenY: 0.01,
        hiddenZ: -0.16,
      },
      object: {
        startX: 0.12,
        startY: -0.1,
        startZ: -0.12,
        restX: 1.08,
        restY: -0.16,
        restZ: 0.02,
        holdX: 1.34,
        holdY: -0.12,
        holdZ: -0.02,
        exitX: 1.68,
        exitY: -0.24,
        exitZ: -0.26,
      },
    },
  },
  cycle: {
    leadDelay: 0.76,
    approachDuration: 1.2,
    accelerateDuration: 0.42,
    translateDuration: 0.32,
    emergeDuration: 0.96,
    settleDuration: 1.06,
    fadeDuration: 0.74,
    repeatDelay: 0.84,
  },
  motion: {
    stageFloatAmplitude: 0.022,
    stageFloatSpeed: 0.24,
    stageYawDrift: 0.014,
    pointerRotationX: 0.03,
    pointerRotationY: 0.06,
    pointerShiftX: 0.1,
    pointerShiftY: 0.06,
    cameraShiftX: 0.14,
    cameraShiftY: 0.1,
  },
  lights: {
    ambient: {
      color: "#eef2f7",
      intensity: 0.3,
    },
    hemisphere: {
      skyColor: "#7d92bb",
      groundColor: "#16110f",
      intensity: 0.24,
    },
    key: {
      color: "#d6e4ff",
      intensity: 1.7,
      position: { x: -3.6, y: 2.9, z: 4.8 },
    },
    rim: {
      color: "#93a8d8",
      intensity: 0.8,
      position: { x: 3.4, y: 1.8, z: 3.4 },
    },
    membraneAccent: {
      color: "#a9c2ff",
      intensity: 1.1,
      distance: 5.2,
      decay: 2,
      position: { x: 0.38, y: 0.12, z: 1.84 },
    },
  },
  reducedMotion: {
    interactionStrength: 0.06,
    motionScale: 0.24,
    cycleScale: 1.7,
  },
  fogDensity: 0.034,
};

export function getHeroViewportKey(width) {
  if (width <= heroConfig.quality.mobileBreakpoint) {
    return "mobile";
  }

  if (width <= heroConfig.quality.tabletBreakpoint) {
    return "tablet";
  }

  if (width <= heroConfig.quality.laptopBreakpoint) {
    return "laptop";
  }

  return "desktop";
}

export function getHeroResponsiveProfile(width, reducedMotion = false) {
  const viewportKey = getHeroViewportKey(width);
  const responsive = heroConfig.responsive[viewportKey];
  const isMobile = viewportKey === "mobile";
  const isTablet = viewportKey === "tablet";

  return {
    viewportKey,
    isMobile,
    isTablet,
    pixelRatioCap: responsive.pixelRatioCap,
    interactionStrength: reducedMotion
      ? heroConfig.reducedMotion.interactionStrength
      : isMobile
        ? 0.42
        : isTablet
          ? 0.7
          : 1,
    motionScale: reducedMotion
      ? heroConfig.reducedMotion.motionScale
      : isMobile
        ? 0.7
        : isTablet
          ? 0.86
          : 1,
    cycleScale: reducedMotion ? heroConfig.reducedMotion.cycleScale : 1,
    camera: heroConfig.camera[viewportKey],
    chamber: heroConfig.chamber[viewportKey],
  };
}
