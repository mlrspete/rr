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
      pixelRatioCap: 1.35,
      antialias: true,
      rendererPrecision: "highp",
      environmentMode: "exr",
      sphereDetail: {
        widthSegments: 80,
        heightSegments: 60,
      },
    },
    laptop: {
      pixelRatioCap: 1.1,
      antialias: true,
      rendererPrecision: "highp",
      environmentMode: "exr",
      sphereDetail: {
        widthSegments: 64,
        heightSegments: 48,
      },
    },
    tablet: {
      pixelRatioCap: 0.9,
      antialias: false,
      rendererPrecision: "mediump",
      environmentMode: "room",
      sphereDetail: {
        widthSegments: 40,
        heightSegments: 32,
      },
    },
    mobile: {
      pixelRatioCap: 0.72,
      antialias: false,
      rendererPrecision: "mediump",
      environmentMode: "room",
      sphereDetail: {
        widthSegments: 28,
        heightSegments: 22,
      },
    },
  },
  loading: {
    lowMemoryThresholdGiB: 4,
    shaderWarmupProfiles: {
      desktop: {
        mode: "async",
      },
      laptop: {
        mode: "async",
      },
      tablet: {
        mode: "sync",
      },
      mobile: {
        mode: "none",
      },
    },
    assetPreloadProfiles: {
      desktop: {
        enabled: true,
        maxCount: 2,
        delayMs: 900,
        idleTimeout: 1600,
      },
      laptop: {
        enabled: true,
        maxCount: 1,
        delayMs: 1100,
        idleTimeout: 1800,
      },
      tablet: {
        enabled: true,
        maxCount: 1,
        delayMs: 1600,
        idleTimeout: 2200,
      },
      mobile: {
        enabled: false,
        maxCount: 0,
        delayMs: 0,
        idleTimeout: 0,
      },
    },
    constrainedDevice: {
      shaderWarmupMode: "none",
      assetPreload: {
        enabled: false,
        maxCount: 0,
        delayMs: 0,
        idleTimeout: 0,
      },
    },
    reducedMotion: {
      shaderWarmupMode: "sync",
      assetPreload: {
        maxCount: 1,
        delayMs: 1500,
        idleTimeout: 2200,
      },
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
    radius: 0.24,
    widthSegments: 80,
    heightSegments: 60,
    idleFloatAmplitude: 0.01,
    idleFloatSpeed: 0.56,
  },
  sphereStream: {
    initialLeadLane: "heroCore",
    leadLaneOrder: ["heroCore", "heroUpper", "heroCore", "heroLower"],
    ambientLaneOrder: ["upperFlow", "lowerFlow", "upperFar", "midGlide", "lowerFar"],
    lanes: {
      heroCore: {
        role: "hero",
        points: [
          { anchor: "start", offset: { x: -1.48, y: 0.16, z: 0.18 } },
          { anchor: "start", offset: { x: -0.46, y: 0.08, z: 0.12 } },
          { anchor: "near", offset: { x: -0.12, y: 0.03, z: 0.06 } },
          { anchor: "cross", offset: { x: -0.03, y: 0.01, z: 0.012 } },
          { anchor: "hidden", offset: { x: 0.01, y: -0.005, z: -0.01 } },
        ],
        scale: 1,
        driftPhase: 0.28,
        driftBias: 0,
        arcLift: 0.008,
      },
      heroUpper: {
        role: "hero",
        points: [
          { anchor: "start", offset: { x: -1.52, y: 0.26, z: 0.08 } },
          { anchor: "start", offset: { x: -0.5, y: 0.14, z: 0.04 } },
          { anchor: "near", offset: { x: -0.14, y: 0.08, z: -0.01 } },
          { anchor: "cross", offset: { x: -0.04, y: 0.05, z: -0.02 } },
          { anchor: "hidden", offset: { x: 0.02, y: 0.04, z: -0.03 } },
        ],
        scale: 0.985,
        driftPhase: 0.46,
        driftBias: 0.004,
        arcLift: 0.014,
      },
      heroLower: {
        role: "hero",
        points: [
          { anchor: "start", offset: { x: -1.44, y: -0.14, z: 0.24 } },
          { anchor: "start", offset: { x: -0.44, y: -0.08, z: 0.18 } },
          { anchor: "near", offset: { x: -0.12, y: -0.06, z: 0.1 } },
          { anchor: "cross", offset: { x: -0.02, y: -0.04, z: 0.04 } },
          { anchor: "hidden", offset: { x: 0.02, y: -0.045, z: 0.01 } },
        ],
        scale: 0.99,
        driftPhase: 0.74,
        driftBias: -0.004,
        arcLift: -0.012,
      },
      upperFlow: {
        role: "ambient",
        points: [
          { anchor: "start", offset: { x: -1.72, y: 0.74, z: -0.08 } },
          { anchor: "start", offset: { x: -0.64, y: 0.54, z: -0.06 } },
          { anchor: "near", offset: { x: -0.16, y: 0.34, z: -0.04 } },
          { anchor: "cross", offset: { x: 0.12, y: 0.32, z: -0.02 } },
          { anchor: "hidden", offset: { x: 0.52, y: 0.42, z: 0.02 } },
          { anchor: "hidden", offset: { x: 1.72, y: 0.34, z: 0.08 } },
        ],
        scale: 0.84,
        opacity: 0.22,
        durationScale: 1.04,
        driftPhase: 0.16,
        driftBias: 0.01,
        arcLift: 0.024,
      },
      lowerFlow: {
        role: "ambient",
        points: [
          { anchor: "start", offset: { x: -1.6, y: -0.78, z: 0.16 } },
          { anchor: "start", offset: { x: -0.56, y: -0.62, z: 0.14 } },
          { anchor: "near", offset: { x: -0.18, y: -0.34, z: 0.1 } },
          { anchor: "cross", offset: { x: 0.16, y: -0.3, z: 0.12 } },
          { anchor: "hidden", offset: { x: 0.58, y: -0.34, z: 0.16 } },
          { anchor: "hidden", offset: { x: 1.72, y: -0.28, z: 0.22 } },
        ],
        scale: 0.78,
        opacity: 0.2,
        durationScale: 1.08,
        driftPhase: 0.52,
        driftBias: -0.012,
        arcLift: -0.022,
      },
      upperFar: {
        role: "ambient",
        points: [
          { anchor: "start", offset: { x: -1.88, y: 1.04, z: -0.34 } },
          { anchor: "start", offset: { x: -0.8, y: 0.82, z: -0.28 } },
          { anchor: "near", offset: { x: -0.3, y: 0.56, z: -0.2 } },
          { anchor: "cross", offset: { x: 0.08, y: 0.48, z: -0.16 } },
          { anchor: "hidden", offset: { x: 0.6, y: 0.5, z: -0.12 } },
          { anchor: "hidden", offset: { x: 1.8, y: 0.42, z: -0.08 } },
        ],
        scale: 0.68,
        opacity: 0.13,
        durationScale: 1.16,
        driftPhase: 0.94,
        driftBias: 0.008,
        arcLift: 0.03,
      },
      midGlide: {
        role: "ambient",
        points: [
          { anchor: "start", offset: { x: -1.54, y: 0.26, z: -0.18 } },
          { anchor: "start", offset: { x: -0.5, y: 0.18, z: -0.14 } },
          { anchor: "near", offset: { x: -0.12, y: 0.14, z: -0.1 } },
          { anchor: "cross", offset: { x: 0.18, y: 0.18, z: -0.08 } },
          { anchor: "hidden", offset: { x: 0.66, y: 0.16, z: -0.04 } },
          { anchor: "hidden", offset: { x: 1.78, y: 0.12, z: 0.02 } },
        ],
        scale: 0.74,
        opacity: 0.16,
        durationScale: 0.98,
        driftPhase: 1.22,
        driftBias: 0.004,
        arcLift: 0.016,
      },
      lowerFar: {
        role: "ambient",
        points: [
          { anchor: "start", offset: { x: -1.84, y: -1.02, z: 0.3 } },
          { anchor: "start", offset: { x: -0.82, y: -0.76, z: 0.26 } },
          { anchor: "near", offset: { x: -0.32, y: -0.5, z: 0.2 } },
          { anchor: "cross", offset: { x: 0.08, y: -0.42, z: 0.18 } },
          { anchor: "hidden", offset: { x: 0.62, y: -0.46, z: 0.22 } },
          { anchor: "hidden", offset: { x: 1.82, y: -0.4, z: 0.26 } },
        ],
        scale: 0.66,
        opacity: 0.12,
        durationScale: 1.2,
        driftPhase: 1.56,
        driftBias: -0.01,
        arcLift: -0.026,
      },
    },
    motion: {
      heroDriftX: 0.012,
      heroDriftY: 0.007,
      heroDriftZ: 0.008,
      heroDriftSpeedX: 0.24,
      heroDriftSpeedY: 0.18,
      heroDriftSpeedZ: 0.16,
      heroTangentPull: 0.008,
      heroScalePulse: 0.0045,
      heroScalePulseSpeed: 0.18,
      heroDriftFade: 0.64,
      heroApproachOpacityFloor: 0.22,
      heroApproachRevealEnd: 0.34,
      heroEntryRevealStart: 0.12,
      heroEntryRevealLength: 0.18,
      supportDriftX: 0.02,
      supportDriftY: 0.015,
      supportDriftZ: 0.016,
      supportDriftSpeedX: 0.16,
      supportDriftSpeedY: 0.13,
      supportDriftSpeedZ: 0.11,
      supportTangentPull: 0.012,
      supportScalePulse: 0.004,
      supportScalePulseSpeed: 0.14,
      supportIdleFloatScale: 0.72,
      supportVisibleStart: 0.12,
      supportVisibleEnd: 0.92,
      supportFadeInLength: 0.16,
      supportFadeOutLength: 0.22,
      supportOpacityMin: 0.1,
      supportOpacityMax: 0.22,
      supportScaleMin: 0.68,
      supportScaleMax: 0.9,
    },
    cadence: {
      initialDelay: 0.12,
      seedSpacing: 0.72,
      spawnInterval: 1.12,
      spawnJitter: 0.18,
      maxCatchUpSpawns: 2,
      durationMin: 4.1,
      durationMax: 5,
    },
    qualityProfiles: {
      desktop: {
        quality: {
          poolSize: 5,
          maxActive: 4,
          seedCount: 2,
        },
      },
      laptop: {
        quality: {
          poolSize: 4,
          maxActive: 3,
          seedCount: 2,
        },
        cadence: {
          spawnInterval: 1.2,
          durationMin: 4,
          durationMax: 4.8,
        },
      },
      tablet: {
        quality: {
          poolSize: 3,
          maxActive: 2,
          seedCount: 1,
        },
        motion: {
          supportDriftX: 0.015,
          supportDriftY: 0.011,
          supportDriftZ: 0.012,
          supportOpacityMax: 0.18,
          supportScaleMax: 0.84,
        },
        cadence: {
          spawnInterval: 1.42,
          durationMin: 3.7,
          durationMax: 4.3,
        },
      },
      mobile: {
        quality: {
          poolSize: 2,
          maxActive: 1,
          seedCount: 1,
        },
        motion: {
          supportDriftX: 0.01,
          supportDriftY: 0.008,
          supportDriftZ: 0.009,
          supportTangentPull: 0.008,
          supportOpacityMin: 0.07,
          supportOpacityMax: 0.12,
          supportScaleMin: 0.6,
          supportScaleMax: 0.74,
        },
        cadence: {
          spawnInterval: 1.66,
          durationMin: 3.4,
          durationMax: 3.9,
        },
      },
    },
    reducedMotion: {
      quality: {
        poolSize: 2,
        maxActive: 1,
        seedCount: 1,
      },
      motion: {
        heroDriftX: 0.004,
        heroDriftY: 0.003,
        heroDriftZ: 0.003,
        heroScalePulse: 0.0015,
        supportDriftX: 0.006,
        supportDriftY: 0.005,
        supportDriftZ: 0.005,
        supportScalePulse: 0.0015,
        supportOpacityMax: 0.14,
      },
      cadence: {
        spawnInterval: 1.9,
        durationMin: 4.4,
        durationMax: 5.2,
      },
    },
  },
  rustObject: {
    idleFloatAmplitude: 0.025,
    idleFloatSpeed: 0.52,
    material: {
      color: "#56606a",
      emissive: "#11161d",
      emissiveIntensity: 0.014,
      metalness: 0.26,
      roughness: 0.33,
      clearcoat: 0.56,
      clearcoatRoughness: 0.16,
      sheen: 0.08,
      sheenColor: "#92a1b6",
      sheenRoughness: 0.42,
      specularIntensity: 0.96,
      specularColor: "#c4d1de",
      ior: 1.46,
      envMapIntensity: 1.42,
      side: "double",
    },
  },
  membrane: {
    geometry: {
      body: {
        width: 1.82,
        height: 2.88,
        depth: 0.36,
        cornerRadius: 0.22,
        cornerSegments: 16,
        bevelSize: 0.024,
        bevelThickness: 0.058,
        bevelSegments: 5,
      },
      sweepBand: {
        width: 0.42,
        height: 2.54,
        radius: 0.16,
      },
      halo: {
        offsetX: 0.04,
        offsetY: 0.02,
        offsetZ: -0.5,
        scaleX: 2.84,
        scaleY: 4.18,
      },
      conversionVeil: {
        width: 0.88,
        height: 2.34,
        radius: 0.18,
        offsetX: 0.1,
        offsetY: 0.02,
        offsetZ: 0.26,
        travelX: 0.05,
      },
      conversionPulse: {
        width: 0.76,
        height: 2.02,
        radius: 0.16,
        offsetX: 0.04,
        offsetY: 0.02,
        offsetZ: 0.32,
        travelX: 0.08,
      },
    },
    appearance: {
      side: "front",
      bodyColor: "#edf3fb",
      rimColor: "#f7fbff",
      emissive: "#0b1016",
      rimEmissive: "#0d1219",
      transmission: 0.82,
      thickness: 1.62,
      ior: 1.22,
      attenuationDistance: 1.78,
      attenuationColor: "#a8bbd1",
      metalness: 0,
      roughness: 0.24,
      clearcoat: 0.96,
      clearcoatRoughness: 0.1,
      specularIntensity: 1,
      specularColor: "#f3f8ff",
      opacity: 0.985,
      envMapIntensity: 1.24,
      emissiveIntensity: 0.00008,
      sheen: 0,
      sheenColor: "#edf3fb",
      sheenRoughness: 1,
      idleRoughnessDrift: 0.01,
      idleTransmissionDrift: 0.0045,
      idleAttenuationDrift: 0.06,
      idleClearcoatRoughnessDrift: 0.007,
      idleEnvDrift: 0.035,
      idleEmissivePulse: 0.00005,
      rimTransmission: 0.18,
      rimThickness: 0.42,
      rimIor: 1.26,
      rimMetalness: 0,
      rimRoughness: 0.13,
      rimClearcoat: 1,
      rimClearcoatRoughness: 0.075,
      rimOpacity: 0.16,
      rimEnvMapIntensity: 1.34,
      rimEmissiveIntensity: 0.00035,
      rimShellScale: 1.014,
      rimSheen: 0,
      rimSheenColor: "#f7fbff",
      rimSheenRoughness: 1,
    },
    frost: {
      enabled: true,
      seed: 7,
      textureSize: 96,
      repeatX: 2.2,
      repeatY: 3.1,
      octaves: 3,
      baseFrequency: 1.8,
      gain: 0.54,
      lacunarity: 2.1,
      directionalWarp: 0.18,
      heightStrength: 1.2,
      normalScale: {
        x: 0.11,
        y: 0.18,
      },
      clearcoatNormalScale: {
        x: 0.24,
        y: 0.34,
      },
    },
    motion: {
      pointerYaw: 0.012,
      pointerPitch: 0.01,
      phaseYaw: 0.016,
      verticalDrift: 0.008,
      verticalDriftSpeed: 0.24,
      secondaryVerticalDrift: 0.003,
      secondaryVerticalDriftSpeed: 0.12,
      lateralDriftX: 0.01,
      lateralDriftSpeed: 0.17,
      depthDriftZ: 0.007,
      depthDriftSpeed: 0.14,
      idlePitch: 0.012,
      idlePitchSpeed: 0.22,
      idleYaw: 0.016,
      idleYawSpeed: 0.16,
      idleRoll: 0.012,
      idleRollSpeed: 0.11,
      idleRollPhase: 0.6,
      idleScaleBreath: 0.0035,
      idleScaleSpeed: 0.21,
      bandTravelX: 0.06,
      bandBob: 0.003,
      haloDriftX: 0.012,
      haloDriftY: 0.016,
      haloPulseSpeed: 0.19,
    },
    activation: {
      bandBaseOpacity: 0.004,
      bandIdleOpacity: 0.0012,
      bandPulseOpacity: 0.024,
      bandWidthBoost: 0.032,
      bandHeightBoost: 0.018,
      bandDepthBoost: 0.016,
      haloBaseOpacity: 0.004,
      haloIdleOpacity: 0.0018,
      haloPulseOpacity: 0.012,
      haloScaleXBoost: 0.12,
      haloScaleYBoost: 0.18,
      bodyThicknessBoost: 0.18,
      bodyEnvBoost: 0.22,
      bodyEmissiveBoost: 0.00018,
      bodyScaleBoost: 0.01,
      bodyRoughnessShift: -0.048,
      bodyTransmissionBoost: 0.065,
      bodyClearcoatBoost: 0.06,
      bodyClearcoatRoughnessShift: -0.02,
      bodyAttenuationDistanceBoost: 0.28,
      bodyIorBoost: 0.022,
      veilOpacity: 0.09,
      veilScaleBoost: 0.038,
      pulseOpacity: 0.024,
      pulseScaleBoost: 0.05,
      rimOpacityBoost: 0.024,
      rimEnvBoost: 0.16,
      rimScaleBoost: 0.012,
      rimRoughnessShift: -0.024,
      rimEmissiveBoost: 0.00018,
    },
    qualityProfiles: {
      desktop: {
        appearance: {},
        frost: {
          textureSize: 128,
          repeatX: 2.3,
          repeatY: 3.3,
          normalScale: {
            x: 0.12,
            y: 0.19,
          },
          clearcoatNormalScale: {
            x: 0.26,
            y: 0.36,
          },
        },
        dynamics: {
          transmissionFloor: 0.72,
        },
      },
      laptop: {
        appearance: {
          transmission: 0.74,
          thickness: 1.28,
          ior: 1.19,
          attenuationDistance: 1.44,
          roughness: 0.28,
          clearcoat: 0.88,
          clearcoatRoughness: 0.12,
          envMapIntensity: 1.04,
          rimOpacity: 0.14,
          rimEnvMapIntensity: 1.14,
          rimTransmission: 0.12,
          rimThickness: 0.26,
          rimClearcoat: 0.9,
          rimClearcoatRoughness: 0.09,
          rimShellScale: 1.012,
        },
        frost: {
          textureSize: 96,
          repeatX: 2.1,
          repeatY: 2.9,
          normalScale: {
            x: 0.09,
            y: 0.15,
          },
          clearcoatNormalScale: {
            x: 0.2,
            y: 0.28,
          },
        },
        dynamics: {
          transmissionFloor: 0.62,
          idleTransmissionDriftScale: 0.82,
          bodyTransmissionBoostScale: 0.82,
          bodyRoughnessShiftScale: 0.8,
          bodyClearcoatBoostScale: 0.78,
          bodyClearcoatRoughnessShiftScale: 0.78,
          bodyThicknessBoostScale: 0.7,
          bodyAttenuationDistanceBoostScale: 0.82,
          bodyEnvBoostScale: 0.84,
          bodyEmissiveBoostScale: 0.54,
          bodyIorBoostScale: 0.74,
          rimEnvBoostScale: 0.8,
          rimOpacityBoostScale: 0.78,
          rimRoughnessShiftScale: 0.78,
          rimEmissiveBoostScale: 0.6,
        },
      },
      tablet: {
        appearance: {
          transmission: 0.32,
          thickness: 0.56,
          ior: 1.13,
          attenuationDistance: 0.98,
          roughness: 0.34,
          clearcoat: 0.56,
          clearcoatRoughness: 0.17,
          envMapIntensity: 0.66,
          opacity: 0.975,
          rimOpacity: 0.1,
          rimEnvMapIntensity: 0.8,
          rimTransmission: 0.05,
          rimThickness: 0.1,
          rimClearcoat: 0.58,
          rimClearcoatRoughness: 0.12,
          rimShellScale: 1.009,
        },
        frost: {
          textureSize: 64,
          repeatX: 1.8,
          repeatY: 2.5,
          directionalWarp: 0.12,
          normalScale: {
            x: 0.05,
            y: 0.08,
          },
          clearcoatNormalScale: {
            x: 0.12,
            y: 0.18,
          },
        },
        dynamics: {
          transmissionFloor: 0.2,
          idleTransmissionDriftScale: 0.34,
          bodyTransmissionBoostScale: 0.54,
          bodyRoughnessShiftScale: 0.5,
          bodyClearcoatBoostScale: 0.48,
          bodyClearcoatRoughnessShiftScale: 0.48,
          bodyThicknessBoostScale: 0.34,
          bodyAttenuationDistanceBoostScale: 0.38,
          bodyEnvBoostScale: 0.48,
          bodyEmissiveBoostScale: 0.4,
          bodyIorBoostScale: 0.3,
          rimEnvBoostScale: 0.52,
          rimOpacityBoostScale: 0.5,
          rimRoughnessShiftScale: 0.46,
          rimEmissiveBoostScale: 0.42,
        },
      },
      mobile: {
        appearance: {
          transmission: 0.04,
          thickness: 0.14,
          ior: 1.08,
          attenuationDistance: 0.74,
          roughness: 0.4,
          clearcoat: 0.34,
          clearcoatRoughness: 0.22,
          envMapIntensity: 0.36,
          opacity: 0.95,
          rimOpacity: 0.065,
          rimEnvMapIntensity: 0.46,
          rimTransmission: 0,
          rimThickness: 0.04,
          rimClearcoat: 0.34,
          rimClearcoatRoughness: 0.18,
          rimShellScale: 1.007,
        },
        frost: {
          enabled: false,
        },
        dynamics: {
          transmissionFloor: 0.02,
          idleTransmissionDriftScale: 0.08,
          bodyTransmissionBoostScale: 0.18,
          bodyRoughnessShiftScale: 0.22,
          bodyClearcoatBoostScale: 0.22,
          bodyClearcoatRoughnessShiftScale: 0.2,
          bodyThicknessBoostScale: 0.14,
          bodyAttenuationDistanceBoostScale: 0.16,
          bodyEnvBoostScale: 0.28,
          bodyEmissiveBoostScale: 0.28,
          bodyIorBoostScale: 0.12,
          rimEnvBoostScale: 0.3,
          rimOpacityBoostScale: 0.3,
          rimRoughnessShiftScale: 0.2,
          rimEmissiveBoostScale: 0.28,
        },
      },
    },
  },
  chamber: {
    desktop: {
      membrane: {
        position: { x: 0.24, y: -0.08, z: 0.19 },
        rotation: { x: 0.15, y: -0.22, z: 0.07 },
        scale: { x: 0.92, y: 0.92, z: 0.92 },
      },
      sphere: {
        startX: -3.72,
        startY: 0.14,
        startZ: 0.32,
        nearX: -1.1,
        nearY: 0.09,
        nearZ: 0.16,
        crossX: -0.1,
        crossY: 0,
        crossZ: -0.04,
        hiddenX: 0.12,
        hiddenY: -0.04,
        hiddenZ: -0.12,
      },
      object: {
        startX: 0.22,
        startY: -0.06,
        startZ: -0.12,
        restX: 1.76,
        restY: -0.02,
        restZ: 0.1,
        holdX: 2.22,
        holdY: 0.02,
        holdZ: 0.13,
        exitX: 2.72,
        exitY: -0.08,
        exitZ: -0.04,
      },
    },
    laptop: {
      membrane: {
        position: { x: 0.2, y: -0.1, z: 0.19 },
        rotation: { x: 0.15, y: -0.2, z: 0.07 },
        scale: { x: 0.88, y: 0.88, z: 0.88 },
      },
      sphere: {
        startX: -3.36,
        startY: 0.12,
        startZ: 0.3,
        nearX: -1,
        nearY: 0.08,
        nearZ: 0.15,
        crossX: -0.08,
        crossY: 0,
        crossZ: -0.04,
        hiddenX: 0.11,
        hiddenY: -0.04,
        hiddenZ: -0.12,
      },
      object: {
        startX: 0.19,
        startY: -0.06,
        startZ: -0.12,
        restX: 1.62,
        restY: -0.03,
        restZ: 0.08,
        holdX: 2.02,
        holdY: 0.01,
        holdZ: 0.11,
        exitX: 2.46,
        exitY: -0.09,
        exitZ: -0.05,
      },
    },
    tablet: {
      membrane: {
        position: { x: 0.16, y: -0.18, z: 0.2 },
        rotation: { x: 0.14, y: -0.18, z: 0.07 },
        scale: { x: 0.84, y: 0.84, z: 0.84 },
      },
      sphere: {
        startX: -2.86,
        startY: 0.08,
        startZ: 0.26,
        nearX: -0.88,
        nearY: 0.05,
        nearZ: 0.12,
        crossX: -0.06,
        crossY: -0.01,
        crossZ: -0.05,
        hiddenX: 0.1,
        hiddenY: -0.05,
        hiddenZ: -0.12,
      },
      object: {
        startX: 0.17,
        startY: -0.08,
        startZ: -0.1,
        restX: 1.38,
        restY: -0.08,
        restZ: 0.07,
        holdX: 1.78,
        holdY: -0.02,
        holdZ: 0.09,
        exitX: 2.16,
        exitY: -0.11,
        exitZ: -0.07,
      },
    },
    mobile: {
      membrane: {
        position: { x: 0.1, y: -0.3, z: 0.21 },
        rotation: { x: 0.13, y: -0.15, z: 0.07 },
        scale: { x: 0.79, y: 0.79, z: 0.79 },
      },
      sphere: {
        startX: -2.32,
        startY: 0.04,
        startZ: 0.22,
        nearX: -0.74,
        nearY: 0.03,
        nearZ: 0.1,
        crossX: -0.04,
        crossY: -0.01,
        crossZ: -0.05,
        hiddenX: 0.08,
        hiddenY: -0.05,
        hiddenZ: -0.11,
      },
      object: {
        startX: 0.14,
        startY: -0.12,
        startZ: -0.08,
        restX: 1.12,
        restY: -0.13,
        restZ: 0.05,
        holdX: 1.44,
        holdY: -0.08,
        holdZ: 0.07,
        exitX: 1.76,
        exitY: -0.14,
        exitZ: -0.08,
      },
    },
  },
  cycle: {
    leadDelay: 0.04,
    approachDuration: 0.88,
    accelerateDuration: 0.34,
    translateDuration: 0.28,
    emergeDuration: 0.92,
    displayDuration: 0.18,
    settleDuration: 0.92,
    fadeDuration: 0.62,
    repeatDelay: 0.24,
  },
  ambientParticles: {
    introOpacityFloor: 0.82,
    pointerInfluence: 0.026,
    reducedMotionDriftScale: 0.3,
    reducedMotionCountScale: 0.66,
    coolTintMix: 0.24,
    intensity: {
      min: 0.66,
      max: 0.9,
      farFade: 0.88,
      nearFade: 1.06,
    },
    placement: {
      horizontalEdgeBias: 0.22,
      verticalJitter: 0.08,
      depthExponent: 0.92,
      zones: [
        {
          centerX: 0.34,
          centerY: -0.03,
          radiusX: 0.94,
          radiusY: 1.12,
          strength: 0.72,
          padding: 0.08,
        },
        {
          centerX: 1.7,
          centerY: 0.02,
          radiusX: 0.72,
          radiusY: 0.62,
          strength: 0.42,
          padding: 0.06,
        },
      ],
    },
    drift: {
      minX: 0.01,
      maxX: 0.024,
      minY: 0.008,
      maxY: 0.02,
      minZ: 0.004,
      maxZ: 0.012,
      minSpeed: 0.018,
      maxSpeed: 0.046,
      parallaxX: 0.02,
      parallaxY: 0.013,
      farMotionScale: 0.54,
      nearMotionScale: 0.72,
    },
    layouts: {
      desktop: {
        count: 12,
        minX: -2.84,
        maxX: 2.74,
        minY: -1.92,
        maxY: 2,
        minZ: -1.78,
        maxZ: -0.08,
        size: 0.074,
        opacity: 0.094,
      },
      laptop: {
        count: 10,
        minX: -2.54,
        maxX: 2.48,
        minY: -1.84,
        maxY: 1.9,
        minZ: -1.62,
        maxZ: -0.08,
        size: 0.07,
        opacity: 0.088,
      },
      tablet: {
        count: 6,
        minX: -2.08,
        maxX: 1.92,
        minY: -1.58,
        maxY: 1.66,
        minZ: -1.34,
        maxZ: -0.04,
        size: 0.064,
        opacity: 0.078,
      },
      mobile: {
        count: 4,
        minX: -1.72,
        maxX: 1.48,
        minY: -1.32,
        maxY: 1.36,
        minZ: -1.12,
        maxZ: -0.02,
        size: 0.058,
        opacity: 0.07,
      },
    },
  },
  blobField: {
    introOpacityFloor: 0.78,
    quality: {
      enabled: true,
      count: 2,
      detail: 3,
    },
    placement: {
      depthShift: -1.92,
      scaleMin: 0.72,
      scaleMax: 1.08,
      anchors: [
        { x: -1.72, y: 0.58, z: -0.18, scale: 1.08, opacity: 1 },
        { x: 1.52, y: -0.66, z: -0.44, scale: 0.92, opacity: 0.9 },
        { x: 0.72, y: 0.96, z: -0.76, scale: 0.78, opacity: 0.74 },
        { x: -0.34, y: -1.02, z: -0.62, scale: 0.72, opacity: 0.66 },
      ],
    },
    appearance: {
      bodyColor: "#cfd7e3",
      edgeColor: "#abc4f4",
      warmColor: "#6c594b",
      emissive: "#090b10",
      emissiveIntensity: 0.006,
      metalness: 0.18,
      roughness: 0.28,
      clearcoat: 0.34,
      clearcoatRoughness: 0.16,
      specularIntensity: 0.92,
      specularColor: "#eef4ff",
      ior: 1.22,
      envMapIntensity: 1.24,
      opacity: 0.2,
      surfaceResponse: 0.18,
      edgeFresnelStrength: 0.22,
      warmLift: 0.018,
    },
    motion: {
      driftX: 0.16,
      driftY: 0.1,
      driftZ: 0.12,
      driftSpeedMin: 0.05,
      driftSpeedMax: 0.08,
      rotationDriftX: 0.08,
      rotationDriftY: 0.14,
      rotationDriftZ: 0.06,
      rotationSpeedMin: 0.04,
      rotationSpeedMax: 0.07,
      scaleBreath: 0.026,
      scaleBreathSpeedMin: 0.08,
      scaleBreathSpeedMax: 0.13,
      pointerParallaxX: 0.05,
      pointerParallaxY: 0.034,
      groupParallaxX: 0.05,
      groupParallaxY: 0.036,
      groupYaw: 0.032,
      groupPitch: 0.018,
    },
    deformation: {
      noiseStrength: 0.14,
      noiseFrequency: 1.18,
      secondaryNoiseStrength: 0.18,
      secondaryNoiseFrequency: 2.24,
      noiseSpeed: 0.12,
      twistAmount: 0.26,
      twistSpeed: 0.08,
      pulseStrength: 0.018,
      pulseSpeed: 0.11,
      surfaceShiftStrength: 0.18,
      surfaceShiftSpeed: 0.14,
    },
    qualityProfiles: {
      desktop: {
        quality: {
          enabled: true,
          count: 3,
          detail: 4,
        },
        placement: {
          depthShift: -1.96,
          scaleMin: 0.76,
          scaleMax: 1.12,
        },
        appearance: {
          opacity: 0.21,
          envMapIntensity: 1.34,
          surfaceResponse: 0.2,
          edgeFresnelStrength: 0.26,
        },
        deformation: {
          noiseStrength: 0.16,
          twistAmount: 0.3,
          surfaceShiftStrength: 0.2,
        },
      },
      laptop: {
        quality: {
          enabled: true,
          count: 2,
          detail: 3,
        },
        placement: {
          depthShift: -1.84,
          scaleMin: 0.72,
          scaleMax: 1.04,
        },
        appearance: {
          opacity: 0.18,
          envMapIntensity: 1.22,
          surfaceResponse: 0.16,
          edgeFresnelStrength: 0.22,
        },
        deformation: {
          noiseStrength: 0.13,
          twistAmount: 0.24,
        },
      },
      tablet: {
        quality: {
          enabled: true,
          count: 1,
          detail: 2,
        },
        placement: {
          depthShift: -1.6,
          scaleMin: 0.72,
          scaleMax: 0.88,
        },
        appearance: {
          opacity: 0.14,
          envMapIntensity: 0.94,
          surfaceResponse: 0.11,
          edgeFresnelStrength: 0.16,
          warmLift: 0.01,
        },
        motion: {
          driftX: 0.1,
          driftY: 0.06,
          driftZ: 0.08,
          pointerParallaxX: 0.03,
          pointerParallaxY: 0.022,
          groupParallaxX: 0.03,
          groupParallaxY: 0.02,
          groupYaw: 0.018,
          groupPitch: 0.01,
        },
        deformation: {
          noiseStrength: 0.09,
          secondaryNoiseStrength: 0.12,
          twistAmount: 0.18,
          pulseStrength: 0.01,
          surfaceShiftStrength: 0.1,
        },
      },
      mobile: {
        quality: {
          enabled: false,
          count: 0,
          detail: 1,
        },
        appearance: {
          opacity: 0,
        },
        motion: {
          driftX: 0.06,
          driftY: 0.04,
          driftZ: 0.05,
        },
        deformation: {
          noiseStrength: 0.06,
          twistAmount: 0.12,
          pulseStrength: 0.008,
          surfaceShiftStrength: 0.08,
        },
      },
    },
    reducedMotion: {
      quality: {
        count: 1,
      },
      appearance: {
        opacity: 0.12,
        surfaceResponse: 0.1,
        edgeFresnelStrength: 0.14,
      },
      motion: {
        driftX: 0.06,
        driftY: 0.04,
        driftZ: 0.04,
        driftSpeedMin: 0.03,
        driftSpeedMax: 0.05,
        rotationDriftX: 0.04,
        rotationDriftY: 0.06,
        rotationDriftZ: 0.03,
        rotationSpeedMin: 0.02,
        rotationSpeedMax: 0.04,
        scaleBreath: 0.012,
        pointerParallaxX: 0.02,
        pointerParallaxY: 0.016,
        groupParallaxX: 0.02,
        groupParallaxY: 0.016,
        groupYaw: 0.012,
        groupPitch: 0.008,
      },
      deformation: {
        noiseStrength: 0.08,
        secondaryNoiseStrength: 0.1,
        noiseSpeed: 0.05,
        twistAmount: 0.14,
        twistSpeed: 0.04,
        pulseStrength: 0.008,
        pulseSpeed: 0.07,
        surfaceShiftStrength: 0.08,
        surfaceShiftSpeed: 0.08,
      },
    },
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
      intensity: 0.18,
    },
    hemisphere: {
      skyColor: "#7b90bd",
      groundColor: "#1a1411",
      intensity: 0.18,
    },
    key: {
      color: "#dce8ff",
      intensity: 2.05,
      position: { x: -4.1, y: 3.1, z: 5.2 },
      target: {
        anchor: "membrane",
        offset: { x: 0.18, y: -0.02, z: 0.02 },
      },
    },
    fill: {
      color: "#a58b79",
      intensity: 0.46,
      position: { x: 2.9, y: -1.2, z: 3.8 },
      target: {
        anchor: "objectRest",
        offset: { x: 0.18, y: -0.02, z: 0.06 },
      },
    },
    rim: {
      color: "#8fa7df",
      intensity: 0.98,
      position: { x: 3.6, y: 2.0, z: -2.6 },
      target: {
        anchor: "membrane",
        offset: { x: 0.16, y: -0.02, z: -0.16 },
      },
    },
    chamberBack: {
      color: "#86a0e5",
      intensity: 1.15,
      distance: 6.4,
      decay: 2.1,
      position: {
        anchor: "membrane",
        offset: { x: 0.18, y: 0.04, z: -2.04 },
      },
    },
    membraneAccent: {
      color: "#d8e4ff",
      intensity: 0.88,
      distance: 4.8,
      decay: 2,
      position: {
        anchor: "membrane",
        offset: { x: 0.54, y: 0.18, z: 1.56 },
      },
    },
    objectReveal: {
      color: "#b49a87",
      intensity: 0.68,
      distance: 5,
      decay: 2.1,
      position: {
        anchor: "objectRest",
        offset: { x: 0.54, y: 0.18, z: 1.22 },
      },
    },
    motion: {
      membraneAccentDriftX: 0.08,
      membraneAccentDriftY: 0.05,
      membraneAccentDriftZ: 0.04,
      membraneAccentPointerX: 0.12,
      membraneAccentPointerY: 0.08,
      membraneAccentSpeedX: 0.32,
      membraneAccentSpeedY: 0.22,
      membraneAccentPulseSpeed: 0.26,
      membraneAccentActivationBoost: 0.42,
      chamberBackDriftX: 0.06,
      chamberBackDriftY: 0.04,
      chamberBackPulseSpeed: 0.16,
      chamberBackActivationBoost: 0.18,
      objectRevealDriftY: 0.04,
      objectRevealPulseSpeed: 0.21,
      objectRevealOpacityBoost: 0.72,
      objectRevealActivationBoost: 0.18,
      fillObjectBoost: 0.16,
      rimActivationBoost: 0.1,
      keyIntroBoost: 0.08,
    },
    qualityProfiles: {
      desktop: {},
      laptop: {
        key: {
          intensity: 1.92,
        },
        fill: {
          intensity: 0.42,
        },
        rim: {
          intensity: 0.92,
        },
        chamberBack: {
          intensity: 1.02,
          distance: 6,
        },
        membraneAccent: {
          intensity: 0.8,
        },
        objectReveal: {
          intensity: 0.62,
        },
      },
      tablet: {
        ambient: {
          intensity: 0.16,
        },
        hemisphere: {
          intensity: 0.14,
        },
        key: {
          intensity: 1.72,
        },
        fill: {
          intensity: 0.34,
        },
        rim: {
          intensity: 0.76,
        },
        chamberBack: {
          intensity: 0.8,
          distance: 5.4,
        },
        membraneAccent: {
          intensity: 0.62,
          distance: 4.2,
        },
        objectReveal: {
          intensity: 0.48,
          distance: 4.2,
        },
        motion: {
          membraneAccentDriftX: 0.05,
          membraneAccentDriftY: 0.03,
          membraneAccentDriftZ: 0.025,
          membraneAccentPointerX: 0.08,
          membraneAccentPointerY: 0.05,
          chamberBackDriftX: 0.03,
          chamberBackDriftY: 0.025,
          objectRevealDriftY: 0.02,
          fillObjectBoost: 0.12,
          rimActivationBoost: 0.08,
        },
      },
      mobile: {
        ambient: {
          intensity: 0.15,
        },
        hemisphere: {
          intensity: 0.12,
        },
        key: {
          intensity: 1.58,
        },
        fill: {
          intensity: 0.26,
        },
        rim: {
          intensity: 0.62,
        },
        chamberBack: {
          intensity: 0.58,
          distance: 4.8,
        },
        membraneAccent: {
          intensity: 0.44,
          distance: 3.8,
        },
        objectReveal: {
          intensity: 0.34,
          distance: 3.7,
        },
        motion: {
          membraneAccentDriftX: 0.03,
          membraneAccentDriftY: 0.02,
          membraneAccentDriftZ: 0.015,
          membraneAccentPointerX: 0.05,
          membraneAccentPointerY: 0.03,
          chamberBackDriftX: 0.02,
          chamberBackDriftY: 0.015,
          objectRevealDriftY: 0.012,
          membraneAccentActivationBoost: 0.26,
          chamberBackActivationBoost: 0.1,
          objectRevealOpacityBoost: 0.56,
          objectRevealActivationBoost: 0.12,
          fillObjectBoost: 0.08,
          rimActivationBoost: 0.05,
          keyIntroBoost: 0.04,
        },
      },
    },
    reducedMotion: {
      motion: {
        membraneAccentDriftX: 0.02,
        membraneAccentDriftY: 0.015,
        membraneAccentDriftZ: 0.01,
        membraneAccentPointerX: 0.03,
        membraneAccentPointerY: 0.02,
        chamberBackDriftX: 0.015,
        chamberBackDriftY: 0.01,
        objectRevealDriftY: 0.008,
        membraneAccentActivationBoost: 0.24,
        chamberBackActivationBoost: 0.08,
        objectRevealOpacityBoost: 0.48,
        objectRevealActivationBoost: 0.08,
        fillObjectBoost: 0.08,
        rimActivationBoost: 0.05,
        keyIntroBoost: 0.03,
      },
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

export function resolveHeroMembraneConfig(viewportKey = "desktop") {
  const qualityProfile =
    heroConfig.membrane.qualityProfiles[viewportKey] ??
    heroConfig.membrane.qualityProfiles.desktop;
  const baseFrost = heroConfig.membrane.frost;
  const frostProfile = qualityProfile.frost ?? {};

  return {
    ...heroConfig.membrane,
    appearance: {
      ...heroConfig.membrane.appearance,
      ...qualityProfile.appearance,
    },
    frost: {
      ...baseFrost,
      ...frostProfile,
      normalScale: {
        ...baseFrost.normalScale,
        ...(frostProfile.normalScale ?? {}),
      },
      clearcoatNormalScale: {
        ...baseFrost.clearcoatNormalScale,
        ...(frostProfile.clearcoatNormalScale ?? {}),
      },
    },
    quality: {
      transmissionFloor: 0.72,
      idleTransmissionDriftScale: 1,
      bodyTransmissionBoostScale: 1,
      bodyRoughnessShiftScale: 1,
      bodyClearcoatBoostScale: 1,
      bodyClearcoatRoughnessShiftScale: 1,
      bodyThicknessBoostScale: 1,
      bodyAttenuationDistanceBoostScale: 1,
      bodyEnvBoostScale: 1,
      bodyEmissiveBoostScale: 1,
      bodyIorBoostScale: 1,
      rimEnvBoostScale: 1,
      rimOpacityBoostScale: 1,
      rimRoughnessShiftScale: 1,
      rimEmissiveBoostScale: 1,
      ...qualityProfile.dynamics,
    },
  };
}

export function resolveHeroSphereStreamConfig(viewportKey = "desktop", reducedMotion = false) {
  const qualityProfile =
    heroConfig.sphereStream.qualityProfiles[viewportKey] ??
    heroConfig.sphereStream.qualityProfiles.desktop;
  const reducedMotionProfile = reducedMotion ? heroConfig.sphereStream.reducedMotion ?? {} : {};

  return {
    ...heroConfig.sphereStream,
    motion: {
      ...heroConfig.sphereStream.motion,
      ...qualityProfile.motion,
      ...reducedMotionProfile.motion,
    },
    cadence: {
      ...heroConfig.sphereStream.cadence,
      ...qualityProfile.cadence,
      ...reducedMotionProfile.cadence,
    },
    quality: {
      poolSize: 5,
      maxActive: 4,
      seedCount: 2,
      ...qualityProfile.quality,
      ...reducedMotionProfile.quality,
    },
  };
}

export function resolveHeroBlobFieldConfig(viewportKey = "desktop", reducedMotion = false) {
  const qualityProfile =
    heroConfig.blobField.qualityProfiles[viewportKey] ??
    heroConfig.blobField.qualityProfiles.desktop;
  const reducedMotionProfile = reducedMotion ? heroConfig.blobField.reducedMotion ?? {} : {};

  return {
    ...heroConfig.blobField,
    quality: {
      ...heroConfig.blobField.quality,
      ...qualityProfile.quality,
      ...reducedMotionProfile.quality,
    },
    placement: {
      ...heroConfig.blobField.placement,
      ...qualityProfile.placement,
      ...reducedMotionProfile.placement,
    },
    appearance: {
      ...heroConfig.blobField.appearance,
      ...qualityProfile.appearance,
      ...reducedMotionProfile.appearance,
    },
    motion: {
      ...heroConfig.blobField.motion,
      ...qualityProfile.motion,
      ...reducedMotionProfile.motion,
    },
    deformation: {
      ...heroConfig.blobField.deformation,
      ...qualityProfile.deformation,
      ...reducedMotionProfile.deformation,
    },
  };
}

export function resolveHeroLightingConfig(viewportKey = "desktop", reducedMotion = false) {
  const qualityProfile =
    heroConfig.lights.qualityProfiles[viewportKey] ?? heroConfig.lights.qualityProfiles.desktop;
  const reducedMotionProfile = reducedMotion ? heroConfig.lights.reducedMotion ?? {} : {};

  return {
    ...heroConfig.lights,
    ambient: {
      ...heroConfig.lights.ambient,
      ...qualityProfile.ambient,
      ...reducedMotionProfile.ambient,
    },
    hemisphere: {
      ...heroConfig.lights.hemisphere,
      ...qualityProfile.hemisphere,
      ...reducedMotionProfile.hemisphere,
    },
    key: {
      ...heroConfig.lights.key,
      ...qualityProfile.key,
      ...reducedMotionProfile.key,
      target: {
        ...(heroConfig.lights.key.target ?? {}),
        ...(qualityProfile.key?.target ?? {}),
        ...(reducedMotionProfile.key?.target ?? {}),
      },
    },
    fill: {
      ...heroConfig.lights.fill,
      ...qualityProfile.fill,
      ...reducedMotionProfile.fill,
      target: {
        ...(heroConfig.lights.fill.target ?? {}),
        ...(qualityProfile.fill?.target ?? {}),
        ...(reducedMotionProfile.fill?.target ?? {}),
      },
    },
    rim: {
      ...heroConfig.lights.rim,
      ...qualityProfile.rim,
      ...reducedMotionProfile.rim,
      target: {
        ...(heroConfig.lights.rim.target ?? {}),
        ...(qualityProfile.rim?.target ?? {}),
        ...(reducedMotionProfile.rim?.target ?? {}),
      },
    },
    chamberBack: {
      ...heroConfig.lights.chamberBack,
      ...qualityProfile.chamberBack,
      ...reducedMotionProfile.chamberBack,
      position: {
        ...(heroConfig.lights.chamberBack.position ?? {}),
        ...(qualityProfile.chamberBack?.position ?? {}),
        ...(reducedMotionProfile.chamberBack?.position ?? {}),
      },
    },
    membraneAccent: {
      ...heroConfig.lights.membraneAccent,
      ...qualityProfile.membraneAccent,
      ...reducedMotionProfile.membraneAccent,
      position: {
        ...(heroConfig.lights.membraneAccent.position ?? {}),
        ...(qualityProfile.membraneAccent?.position ?? {}),
        ...(reducedMotionProfile.membraneAccent?.position ?? {}),
      },
    },
    objectReveal: {
      ...heroConfig.lights.objectReveal,
      ...qualityProfile.objectReveal,
      ...reducedMotionProfile.objectReveal,
      position: {
        ...(heroConfig.lights.objectReveal.position ?? {}),
        ...(qualityProfile.objectReveal?.position ?? {}),
        ...(reducedMotionProfile.objectReveal?.position ?? {}),
      },
    },
    motion: {
      ...heroConfig.lights.motion,
      ...qualityProfile.motion,
      ...reducedMotionProfile.motion,
    },
  };
}

export function resolveHeroShaderWarmupMode(
  viewportKey = "desktop",
  reducedMotion = false,
  runtimeHints = {},
) {
  const profile =
    heroConfig.loading.shaderWarmupProfiles[viewportKey] ??
    heroConfig.loading.shaderWarmupProfiles.desktop;

  if (isHeroRuntimeConstrained(runtimeHints)) {
    return heroConfig.loading.constrainedDevice?.shaderWarmupMode ?? "none";
  }

  if (reducedMotion) {
    return heroConfig.loading.reducedMotion?.shaderWarmupMode ?? profile.mode ?? "async";
  }

  return profile.mode ?? "async";
}

export function resolveHeroAssetPreloadConfig(
  viewportKey = "desktop",
  reducedMotion = false,
  runtimeHints = {},
) {
  const profile =
    heroConfig.loading.assetPreloadProfiles[viewportKey] ??
    heroConfig.loading.assetPreloadProfiles.desktop;
  const reducedMotionProfile = reducedMotion
    ? heroConfig.loading.reducedMotion?.assetPreload ?? {}
    : {};
  const constrainedProfile = isHeroRuntimeConstrained(runtimeHints)
    ? heroConfig.loading.constrainedDevice?.assetPreload ?? {}
    : {};
  const resolvedProfile = {
    enabled: true,
    maxCount: 0,
    delayMs: 1200,
    idleTimeout: 1800,
    ...profile,
    ...reducedMotionProfile,
    ...constrainedProfile,
  };

  if (!resolvedProfile.enabled || resolvedProfile.maxCount <= 0) {
    return {
      ...resolvedProfile,
      enabled: false,
      maxCount: 0,
    };
  }

  return resolvedProfile;
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
    antialias: responsive.antialias,
    rendererPrecision: responsive.rendererPrecision,
    environmentMode: responsive.environmentMode,
    sphereDetail: {
      widthSegments: responsive.sphereDetail.widthSegments,
      heightSegments: responsive.sphereDetail.heightSegments,
    },
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

export function isHeroRuntimeConstrained(runtimeHints = {}) {
  const saveData = Boolean(runtimeHints.saveData);
  const deviceMemory = Number(runtimeHints.deviceMemory ?? 0);
  const hasDeviceMemory = Number.isFinite(deviceMemory) && deviceMemory > 0;

  if (saveData) {
    return true;
  }

  return (
    hasDeviceMemory &&
    deviceMemory <= Math.max(1, heroConfig.loading.lowMemoryThresholdGiB ?? 4)
  );
}
