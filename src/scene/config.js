export const heroConfig = {
  renderer: {
    exposure: 0.99,
  },
  quality: {
    laptopBreakpoint: 1440,
    tabletBreakpoint: 980,
    mobileBreakpoint: 680,
  },
  responsive: {
    desktop: {
      slotsPerSide: 2,
      pixelRatioCap: 1.65,
    },
    laptop: {
      slotsPerSide: 2,
      pixelRatioCap: 1.55,
    },
    tablet: {
      slotsPerSide: 2,
      pixelRatioCap: 1.3,
    },
    mobile: {
      slotsPerSide: 1,
      pixelRatioCap: 1,
    },
  },
  palette: {
    background: "#090507",
    fog: "#090507",
    plum: "#1a0b14",
    metal: "#b5afb7",
    warm: "#c98a66",
    cool: "#6682b8",
    lightWarm: "#f2e7dc",
    ember: "#6c3b28",
  },
  camera: {
    desktop: {
      fov: 37,
      position: { x: 0.04, y: 0.18, z: 8.9 },
    },
    tablet: {
      fov: 42,
      position: { x: 0.03, y: 0.16, z: 9.7 },
    },
    mobile: {
      fov: 48,
      position: { x: 0.02, y: 0.14, z: 10.6 },
    },
    lookAt: { x: 0.06, y: -0.16, z: 0.08 },
  },
  intro: {
    duration: 1.7,
    ease: "power3.out",
    startPosition: { x: 0, y: -0.18, z: 1.3 },
    startRotation: { x: 0.04, y: -0.08, z: -0.01 },
    stageScale: 0.97,
  },
  membrane: {
    geometry: {
      body: {
        radiusX: 1.22,
        radiusY: 1.94,
        depth: 0.3,
        bevelSize: 0.055,
        bevelThickness: 0.082,
        exponent: 3.2,
        shoulderPinch: 0.09,
        points: 84,
      },
      rim: {
        radiusX: 1.33,
        radiusY: 2.06,
        frame: 0.1,
        depth: 0.07,
        exponent: 3.18,
        shoulderPinch: 0.075,
        points: 84,
      },
      sweepBand: {
        width: 0.66,
        height: 3.74,
        radius: 0.24,
      },
      halo: {
        offsetX: 0.16,
        offsetY: 0.04,
        offsetZ: -0.82,
        scaleX: 4.6,
        scaleY: 6.5,
      },
    },
    appearance: {
      bodyColor: "#f0e8e0",
      rimColor: "#d7cfc7",
      emissive: "#58667f",
      rimEmissive: "#5f4336",
      transmission: 0.96,
      thickness: 3.92,
      ior: 1.24,
      attenuationDistance: 1.34,
      attenuationColor: "#261b24",
      metalness: 0.02,
      roughness: 0.038,
      clearcoat: 1,
      clearcoatRoughness: 0.018,
      iridescence: 0.05,
      iridescenceIOR: 1.17,
      iridescenceThicknessRange: [160, 420],
      specularIntensity: 1,
      opacity: 0.97,
      envMapIntensity: 1.58,
      emissiveIntensity: 0.006,
      rimMetalness: 0.78,
      rimRoughness: 0.14,
      rimClearcoat: 1,
      rimClearcoatRoughness: 0.04,
      rimOpacity: 0.44,
      rimEnvMapIntensity: 1.58,
      rimEmissiveIntensity: 0.012,
    },
    motion: {
      pointerYaw: 0.012,
      pointerPitch: 0.009,
      sweepYaw: 0.062,
      sweepPitch: 0.018,
      sweepRoll: 0.024,
      verticalDrift: 0.018,
      depthDrift: 0.03,
      bandTravelX: 0.13,
      bandTravelY: 0.032,
      bandBob: 0.018,
      haloDriftX: 0.028,
      haloDriftY: 0.034,
    },
    activation: {
      clusterApproachRadius: 1.58,
      bandBaseOpacity: 0.085,
      bandApproachOpacity: 0.06,
      bandPulseOpacity: 0.18,
      bandWidthBoost: 0.1,
      bandHeightBoost: 0.05,
      bandDepthBoost: 0.018,
      haloBaseOpacity: 0.042,
      haloApproachOpacity: 0.016,
      haloPulseOpacity: 0.05,
      haloScaleXBoost: 0.46,
      haloScaleYBoost: 0.78,
      bodyThicknessBoost: 0.22,
      bodyEnvBoost: 0.1,
      bodyEmissiveBoost: 0.028,
      bodyScaleBoost: 0.05,
      rimOpacityBoost: 0.1,
      rimEnvBoost: 0.12,
      rimScaleBoost: 0.05,
      travelBias: 0.032,
      faceFlashScale: 0.08,
      rimFlashScale: 0.07,
      bandCoreSlide: 0.028,
      approachTiltBoost: 0.01,
      approachDepthBoost: 0.026,
      auraWarmMix: 0.18,
    },
    sweep: {
      travelX: 4.04,
      passDuration: 4.12,
      holdDuration: 0.36,
      pulseAmplitude: 0.1,
      flashAmplitude: 0.07,
    },
  },
  clusters: {
    desktop: {
      left: {
        position: { x: -2.38, y: -0.04, z: 0.42 },
        rotation: { x: 0.03, y: 0.2, z: -0.04 },
        slots: [
          {
            name: "slotA",
            position: { x: -0.34, y: 0.92, z: 0.38 },
            rotation: { x: 0.08, y: 0.18, z: 0.05 },
            scale: 0.94,
            premiumShapeKey: "facetOblong",
            callout: {
              kicker: "Brand Matter",
              title: "Premium form tuned for endemic fit",
            },
          },
          {
            name: "slotB",
            position: { x: -0.08, y: -0.86, z: -0.06 },
            rotation: { x: -0.04, y: 0.14, z: -0.18 },
            scale: 0.92,
            premiumShapeKey: "capsuleBar",
            callout: {
              kicker: "Campaign Form",
              title: "Branded signal resolves inside the world",
            },
          },
        ],
      },
      right: {
        position: { x: 2.38, y: -0.02, z: 0.36 },
        rotation: { x: -0.02, y: -0.22, z: 0.05 },
        slots: [
          {
            name: "slotA",
            position: { x: 0.2, y: 0.84, z: 0.3 },
            rotation: { x: 0.06, y: -0.2, z: -0.03 },
            scale: 0.96,
            premiumShapeKey: "capsuleBar",
            callout: {
              kicker: "Rust Native",
              title: "Utility read lands at first glance",
            },
          },
          {
            name: "slotB",
            position: { x: 0.02, y: -0.88, z: -0.12 },
            rotation: { x: -0.08, y: -0.18, z: 0.14 },
            scale: 0.94,
            premiumShapeKey: "facetOblong",
            callout: {
              kicker: "World Proof",
              title: "Conversion settles into native matter",
            },
          },
        ],
      },
    },
    laptop: {
      left: {
        position: { x: -2.18, y: -0.08, z: 0.4 },
        rotation: { x: 0.03, y: 0.18, z: -0.04 },
        slots: [
          {
            name: "slotA",
            position: { x: -0.28, y: 0.82, z: 0.34 },
            rotation: { x: 0.06, y: 0.16, z: 0.05 },
            scale: 0.9,
            premiumShapeKey: "facetOblong",
            callout: {
              kicker: "Brand Matter",
              title: "Premium form tuned for endemic fit",
            },
          },
          {
            name: "slotB",
            position: { x: -0.06, y: -0.8, z: -0.06 },
            rotation: { x: -0.04, y: 0.12, z: -0.16 },
            scale: 0.88,
            premiumShapeKey: "capsuleBar",
            callout: {
              kicker: "Campaign Form",
              title: "Branded signal resolves inside the world",
            },
          },
        ],
      },
      right: {
        position: { x: 2.18, y: -0.06, z: 0.34 },
        rotation: { x: -0.02, y: -0.2, z: 0.05 },
        slots: [
          {
            name: "slotA",
            position: { x: 0.18, y: 0.76, z: 0.24 },
            rotation: { x: 0.05, y: -0.18, z: -0.03 },
            scale: 0.92,
            premiumShapeKey: "capsuleBar",
            callout: {
              kicker: "Rust Native",
              title: "Utility read lands at first glance",
            },
          },
          {
            name: "slotB",
            position: { x: 0.02, y: -0.82, z: -0.14 },
            rotation: { x: -0.07, y: -0.16, z: 0.13 },
            scale: 0.9,
            premiumShapeKey: "facetOblong",
            callout: {
              kicker: "World Proof",
              title: "Conversion settles into native matter",
            },
          },
        ],
      },
    },
    tablet: {
      left: {
        position: { x: -1.92, y: -0.1, z: 0.36 },
        rotation: { x: 0.03, y: 0.14, z: -0.04 },
        slots: [
          {
            name: "slotA",
            position: { x: -0.14, y: 0.72, z: 0.26 },
            rotation: { x: 0.05, y: 0.14, z: 0.04 },
            scale: 0.84,
            premiumShapeKey: "facetOblong",
            callout: {
              kicker: "Brand Matter",
              title: "Premium form tuned for endemic fit",
            },
          },
          {
            name: "slotB",
            position: { x: -0.02, y: -0.72, z: -0.08 },
            rotation: { x: -0.04, y: 0.1, z: -0.14 },
            scale: 0.82,
            premiumShapeKey: "capsuleBar",
            callout: {
              kicker: "Campaign Form",
              title: "Branded signal resolves inside the world",
            },
          },
        ],
      },
      right: {
        position: { x: 1.92, y: -0.08, z: 0.3 },
        rotation: { x: -0.02, y: -0.16, z: 0.04 },
        slots: [
          {
            name: "slotA",
            position: { x: 0.1, y: 0.7, z: 0.18 },
            rotation: { x: 0.04, y: -0.16, z: -0.02 },
            scale: 0.86,
            premiumShapeKey: "capsuleBar",
            callout: {
              kicker: "Rust Native",
              title: "Utility read lands at first glance",
            },
          },
          {
            name: "slotB",
            position: { x: 0.02, y: -0.76, z: -0.1 },
            rotation: { x: -0.06, y: -0.14, z: 0.12 },
            scale: 0.84,
            premiumShapeKey: "facetOblong",
            callout: {
              kicker: "World Proof",
              title: "Conversion settles into native matter",
            },
          },
        ],
      },
    },
    mobile: {
      left: {
        position: { x: -1.32, y: -0.18, z: 0.28 },
        rotation: { x: 0.02, y: 0.08, z: -0.03 },
        slots: [
          {
            name: "slotA",
            position: { x: 0, y: 0.54, z: 0.14 },
            rotation: { x: 0.04, y: 0.1, z: 0.04 },
            scale: 0.74,
            premiumShapeKey: "facetOblong",
            callout: {
              kicker: "Brand Matter",
              title: "Premium form tuned for endemic fit",
            },
          },
          {
            name: "slotB",
            position: { x: 0.02, y: -0.56, z: -0.08 },
            rotation: { x: -0.03, y: 0.08, z: -0.12 },
            scale: 0.72,
            premiumShapeKey: "capsuleBar",
            callout: {
              kicker: "Campaign Form",
              title: "Branded signal resolves inside the world",
            },
          },
        ],
      },
      right: {
        position: { x: 1.32, y: -0.16, z: 0.24 },
        rotation: { x: -0.02, y: -0.1, z: 0.03 },
        slots: [
          {
            name: "slotA",
            position: { x: 0, y: 0.5, z: 0.12 },
            rotation: { x: 0.03, y: -0.1, z: -0.02 },
            scale: 0.76,
            premiumShapeKey: "capsuleBar",
            callout: {
              kicker: "Rust Native",
              title: "Utility read lands at first glance",
            },
          },
          {
            name: "slotB",
            position: { x: 0.02, y: -0.58, z: -0.08 },
            rotation: { x: -0.05, y: -0.08, z: 0.1 },
            scale: 0.74,
            premiumShapeKey: "facetOblong",
            callout: {
              kicker: "World Proof",
              title: "Conversion settles into native matter",
            },
          },
        ],
      },
    },
  },
  atmosphere: {
    desktop: {
      backdrop: {
        position: { x: 0.04, y: -0.14, z: -5.75 },
        scale: { x: 1, y: 1, z: 1 },
      },
      cool: {
        position: { x: -2.74, y: 0.28, z: -2.86 },
        scale: { x: 8.2, y: 6.1, z: 1 },
      },
      warm: {
        position: { x: 2.76, y: -0.02, z: -2.58 },
        scale: { x: 7.2, y: 5.3, z: 1 },
      },
      neutral: {
        position: { x: 0.3, y: -0.12, z: -2.12 },
        scale: { x: 4.5, y: 3.4, z: 1 },
      },
    },
    laptop: {
      backdrop: {
        position: { x: 0.02, y: -0.2, z: -5.7 },
        scale: { x: 0.98, y: 0.98, z: 1 },
      },
      cool: {
        position: { x: -2.48, y: 0.16, z: -2.8 },
        scale: { x: 7.4, y: 5.6, z: 1 },
      },
      warm: {
        position: { x: 2.46, y: -0.14, z: -2.5 },
        scale: { x: 6.6, y: 4.9, z: 1 },
      },
      neutral: {
        position: { x: 0.24, y: -0.2, z: -2.06 },
        scale: { x: 4.2, y: 3.1, z: 1 },
      },
    },
    tablet: {
      backdrop: {
        position: { x: 0.02, y: -0.28, z: -5.66 },
        scale: { x: 0.95, y: 0.95, z: 1 },
      },
      cool: {
        position: { x: -2.12, y: 0.08, z: -2.72 },
        scale: { x: 6.8, y: 5.2, z: 1 },
      },
      warm: {
        position: { x: 2.08, y: -0.22, z: -2.42 },
        scale: { x: 6.1, y: 4.6, z: 1 },
      },
      neutral: {
        position: { x: 0.18, y: -0.26, z: -2 },
        scale: { x: 3.9, y: 2.9, z: 1 },
      },
    },
    mobile: {
      backdrop: {
        position: { x: 0, y: -0.34, z: -5.6 },
        scale: { x: 0.9, y: 0.9, z: 1 },
      },
      cool: {
        position: { x: -1.68, y: 0.02, z: -2.64 },
        scale: { x: 5.8, y: 4.5, z: 1 },
      },
      warm: {
        position: { x: 1.72, y: -0.28, z: -2.34 },
        scale: { x: 5.3, y: 4.1, z: 1 },
      },
      neutral: {
        position: { x: 0.08, y: -0.32, z: -1.96 },
        scale: { x: 3.5, y: 2.6, z: 1 },
      },
    },
  },
  slot: {
    shell: {
      radius: 0.86,
      detail: 2,
      baseOpacity: 0.028,
      peakOpacity: 0.18,
      scaleBoost: 0.14,
    },
    depth: {
      premiumZ: 0.24,
      rustZ: -0.03,
      calloutZ: 0.12,
    },
    reveal: {
      leadDistance: 0.86,
      trailDistance: 0.72,
      overlapInner: 0.06,
      overlapOuter: 0.24,
      softnessOuter: 0.46,
      premiumHiddenOpacity: 0.06,
      rustHiddenOpacity: 0.02,
      softOpacityPenalty: 0.12,
      positionShift: 0.13,
      liftShift: 0.08,
      rotationShift: 0.065,
      scaleIn: 0.95,
      scaleOut: 1.01,
    },
    idle: {
      floatAmplitude: 0.04,
      floatSpeed: 0.42,
      yawAmplitude: 0.045,
      yawSpeed: 0.26,
    },
    calloutAnchor: {
      x: 0.72,
      y: 0.68,
      z: 0.12,
    },
  },
  callouts: {
    duration: 1.35,
    maxPerSide: 2,
    sideOffsetX: 38,
    sideOffsetY: -10,
    fadeDuration: 0.28,
    safeInsetX: 34,
    safeInsetTop: 92,
    safeInsetBottom: 126,
  },
  loop: {
    rebuildDebounceMs: 120,
  },
  particles: {
    count: 52,
    radius: 4.6,
    height: 4.2,
    rotationYSpeed: 0.0035,
    rotationXSwing: 0.008,
    rotationZSwing: 0.006,
    layers: [
      {
        density: 0.38,
        radius: 4.9,
        height: 4.8,
        depthOffset: -2.3,
        depthSpread: 1.6,
        sizeScale: 0.76,
        opacityScale: 0.42,
        driftX: 0.04,
        driftY: 0.045,
        driftSpeed: 0.06,
        bobSpeed: 0.08,
        rotationYSpeed: 0.0022,
        pointerParallax: 0.02,
        seed: 11,
      },
      {
        density: 0.36,
        radius: 4.1,
        height: 4.2,
        depthOffset: -1.4,
        depthSpread: 1.1,
        sizeScale: 1,
        opacityScale: 0.54,
        driftX: 0.03,
        driftY: 0.036,
        driftSpeed: 0.05,
        bobSpeed: 0.07,
        rotationYSpeed: 0.003,
        pointerParallax: 0.03,
        seed: 23,
      },
      {
        density: 0.26,
        radius: 3.2,
        height: 3.1,
        depthOffset: -0.4,
        depthSpread: 0.7,
        sizeScale: 1.22,
        opacityScale: 0.36,
        driftX: 0.02,
        driftY: 0.028,
        driftSpeed: 0.04,
        bobSpeed: 0.06,
        rotationYSpeed: 0.0038,
        pointerParallax: 0.04,
        seed: 37,
      },
    ],
  },
  lights: {
    ambient: {
      color: "#f2e7dc",
      intensity: 0.18,
    },
    hemisphere: {
      skyColor: "#6682b8",
      groundColor: "#6c3b28",
      intensity: 0.12,
    },
    coolKey: {
      color: "#7f99c9",
      intensity: 0.52,
      position: { x: -4.2, y: 4.4, z: 5 },
    },
    membraneAccent: {
      color: "#ecd7c2",
      intensity: 2.4,
      distance: 7.1,
      decay: 2,
      position: { x: 1.08, y: 1.16, z: 2.16 },
    },
  },
  materials: {
    backdropOpacity: 0.1,
    backdropPulse: 0.014,
    dustOpacity: 0.14,
    dustSize: 0.018,
  },
  motion: {
    pointerRotationX: 0.018,
    pointerRotationY: 0.042,
    pointerShiftX: 0.03,
    pointerShiftY: 0.018,
    cameraShiftX: 0.06,
    cameraShiftY: 0.04,
    depthParallaxX: 0.06,
    depthParallaxY: 0.032,
    glowParallaxX: 0.08,
    clusterParallaxX: 0.07,
    clusterParallaxY: 0.038,
    idleFloatAmplitude: 0.018,
    idleFloatSpeed: 0.24,
    atmosphereDrift: 0.032,
  },
  postprocessing: {
    bloom: {
      strength: 0.09,
      mobileStrength: 0.05,
      radius: 0.52,
      threshold: 0.9,
      flashBoost: 0.028,
    },
    finish: {
      rgbShift: 0.00022,
      mobileRgbShift: 0,
      vignette: 0.14,
      mobileVignette: 0.1,
      grain: 0.008,
      mobileGrain: 0.005,
    },
  },
  reducedMotion: {
    passDuration: 4.4,
    holdDuration: 0.28,
    pointerInteractionScale: 0.12,
    flashAmplitude: 0.03,
    pulseAmplitude: 0.04,
    calloutsEnabled: false,
    travelScale: 0.78,
    conversionFxScale: 0.45,
    membraneActivationScale: 0.55,
    motionScale: 0.4,
  },
  fogDensity: 0.05,
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

export function getHeroLayoutPreset(width) {
  const viewportKey = getHeroViewportKey(width);

  return {
    viewportKey,
    atmosphere: heroConfig.atmosphere[viewportKey],
    clusters: heroConfig.clusters[viewportKey],
    membrane: {
      transform: getMembraneTransformPreset(viewportKey),
      sweep: heroConfig.membrane.sweep,
    },
  };
}

export function getHeroResponsiveProfile(width, reducedMotion = false) {
  const viewportKey = getHeroViewportKey(width);
  const responsive = heroConfig.responsive[viewportKey];
  const isMobile = viewportKey === "mobile";
  const isTablet = viewportKey === "tablet";
  const isLaptop = viewportKey === "laptop";
  const travelScale = reducedMotion
    ? heroConfig.reducedMotion.travelScale
    : isMobile
      ? 0.72
      : isTablet
        ? 0.82
        : isLaptop
          ? 0.92
          : 1;

  return {
    viewportKey,
    isMobile,
    isTablet,
    slotsPerSide: responsive.slotsPerSide,
    pixelRatioCap: responsive.pixelRatioCap,
    dustCount: reducedMotion ? 18 : isMobile ? 24 : isTablet ? 38 : heroConfig.particles.count,
    bloomStrength: isMobile
      ? heroConfig.postprocessing.bloom.mobileStrength
      : heroConfig.postprocessing.bloom.strength,
    bloomRadius: heroConfig.postprocessing.bloom.radius,
    bloomThreshold: heroConfig.postprocessing.bloom.threshold,
    rgbShift: reducedMotion
      ? 0
      : isMobile
        ? heroConfig.postprocessing.finish.mobileRgbShift
        : heroConfig.postprocessing.finish.rgbShift,
    vignette: isMobile
      ? heroConfig.postprocessing.finish.mobileVignette
      : heroConfig.postprocessing.finish.vignette,
    grain: reducedMotion
      ? heroConfig.postprocessing.finish.mobileGrain
      : isMobile
        ? heroConfig.postprocessing.finish.mobileGrain
        : heroConfig.postprocessing.finish.grain,
    interactionStrength: reducedMotion
      ? heroConfig.reducedMotion.pointerInteractionScale
      : isMobile
        ? 0.48
        : isTablet
          ? 0.7
          : 1,
    motionScale: reducedMotion ? heroConfig.reducedMotion.motionScale : isMobile ? 0.72 : isTablet ? 0.86 : 1,
    slotMotionScale: reducedMotion ? 0.32 : isMobile ? 0.56 : isTablet ? 0.76 : 1,
    conversionFxScale: reducedMotion
      ? heroConfig.reducedMotion.conversionFxScale
      : isMobile
        ? 0.62
        : isTablet
          ? 0.82
          : 1,
    membraneActivationScale: reducedMotion
      ? heroConfig.reducedMotion.membraneActivationScale
      : isMobile
        ? 0.7
        : isTablet
          ? 0.86
          : 1,
    atmosphereStrength: reducedMotion ? 0.16 : isMobile ? 0.48 : isTablet ? 0.72 : 1,
    passDuration: reducedMotion ? heroConfig.reducedMotion.passDuration : heroConfig.membrane.sweep.passDuration,
    holdDuration: reducedMotion ? heroConfig.reducedMotion.holdDuration : heroConfig.membrane.sweep.holdDuration,
    travelX: heroConfig.membrane.sweep.travelX * travelScale,
    pulseAmplitude: reducedMotion
      ? heroConfig.reducedMotion.pulseAmplitude
      : heroConfig.membrane.sweep.pulseAmplitude,
    flashAmplitude: reducedMotion
      ? heroConfig.reducedMotion.flashAmplitude
      : heroConfig.membrane.sweep.flashAmplitude,
    calloutsEnabled: reducedMotion
      ? heroConfig.reducedMotion.calloutsEnabled
      : !isMobile,
  };
}

function getMembraneTransformPreset(viewportKey) {
  switch (viewportKey) {
    case "mobile":
      return {
        position: { x: 0.12, y: -0.4, z: 0.48 },
        rotation: { x: 0.13, y: -0.34, z: 0.09 },
        scale: { x: 0.92, y: 0.92, z: 0.92 },
      };
    case "tablet":
      return {
        position: { x: 0.16, y: -0.28, z: 0.46 },
        rotation: { x: 0.14, y: -0.38, z: 0.1 },
        scale: { x: 1, y: 1, z: 1 },
      };
    case "laptop":
      return {
        position: { x: 0.2, y: -0.18, z: 0.44 },
        rotation: { x: 0.15, y: -0.4, z: 0.11 },
        scale: { x: 1.08, y: 1.08, z: 1.08 },
      };
    case "desktop":
    default:
      return {
        position: { x: 0.22, y: -0.1, z: 0.42 },
        rotation: { x: 0.16, y: -0.42, z: 0.12 },
        scale: { x: 1.14, y: 1.14, z: 1.14 },
      };
  }
}
