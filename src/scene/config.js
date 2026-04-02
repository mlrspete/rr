export const heroConfig = {
  renderer: {
    maxPixelRatio: 1.75,
    tabletMaxPixelRatio: 1.45,
    mobileMaxPixelRatio: 1.15,
    exposure: 1.06,
  },
  quality: {
    laptopBreakpoint: 1440,
    tabletBreakpoint: 980,
    mobileBreakpoint: 680,
  },
  composition: {
    desktop: {
      ribbon: {
        position: { x: -1.34, y: -0.46, z: -0.14 },
        rotation: { x: 1.04, y: -0.18, z: 0.52 },
        scale: { x: 1.46, y: 0.88, z: 0.4 },
      },
      membrane: {
        position: { x: 1.82, y: -0.06, z: 0.4 },
        rotation: { x: 0.12, y: -0.6, z: 0.14 },
      },
      panes: {
        primary: {
          position: { x: -1.78, y: 0.34, z: -1.64 },
          rotation: { x: 0.03, y: 0.3, z: 0.17 },
        },
        secondary: {
          position: { x: 1.96, y: -0.18, z: -1.3 },
          rotation: { x: -0.02, y: -0.22, z: -0.13 },
        },
      },
      spheres: {
        chrome: { x: -2.2, y: 0.88, z: 1.18 },
        glass: { x: 2.72, y: 0.56, z: 0.9 },
        pearl: { x: 1.04, y: -0.94, z: -0.82 },
      },
      asset: {
        presentationScale: 0.74,
        sceneOffset: { x: 0.08, y: -0.02, z: 0.02 },
        path: {
          start: { x: 1.78, y: -0.2, z: 0.26 },
          hold: { x: 2.18, y: 0.04, z: 0.08 },
          drift: { x: 2.54, y: 0.14, z: -0.04 },
          fade: { x: 2.82, y: 0.24, z: -0.1 },
        },
      },
    },
    laptop: {
      ribbon: {
        position: { x: -1.48, y: -0.68, z: -0.16 },
        rotation: { x: 1.01, y: -0.12, z: 0.48 },
        scale: { x: 1.18, y: 0.78, z: 0.36 },
      },
      membrane: {
        position: { x: 1.92, y: -0.32, z: 0.42 },
        rotation: { x: 0.1, y: -0.54, z: 0.12 },
      },
      panes: {
        primary: {
          position: { x: -1.64, y: 0.08, z: -1.62 },
          rotation: { x: 0.03, y: 0.24, z: 0.14 },
        },
        secondary: {
          position: { x: 1.94, y: -0.36, z: -1.24 },
          rotation: { x: -0.01, y: -0.18, z: -0.11 },
        },
      },
      spheres: {
        chrome: { x: -2.18, y: 0.68, z: 1.08 },
        glass: { x: 2.58, y: 0.2, z: 0.82 },
        pearl: { x: 1.04, y: -1.04, z: -0.76 },
      },
      asset: {
        presentationScale: 0.67,
        sceneOffset: { x: -0.08, y: -0.16, z: 0.02 },
        path: {
          start: { x: 1.46, y: -0.34, z: 0.18 },
          hold: { x: 1.8, y: -0.1, z: 0.04 },
          drift: { x: 2.06, y: 0, z: -0.02 },
          fade: { x: 2.28, y: 0.1, z: -0.08 },
        },
      },
    },
    tablet: {
      ribbon: {
        position: { x: -1.54, y: -0.88, z: -0.18 },
        rotation: { x: 1, y: -0.12, z: 0.48 },
        scale: { x: 1.04, y: 0.72, z: 0.34 },
      },
      membrane: {
        position: { x: 2.04, y: -0.54, z: 0.44 },
        rotation: { x: 0.08, y: -0.5, z: 0.1 },
      },
      panes: {
        primary: {
          position: { x: -1.28, y: -0.08, z: -1.54 },
          rotation: { x: 0.02, y: 0.2, z: 0.12 },
        },
        secondary: {
          position: { x: 1.68, y: -0.54, z: -1.18 },
          rotation: { x: -0.01, y: -0.14, z: -0.1 },
        },
      },
      spheres: {
        chrome: { x: -2.08, y: 0.48, z: 0.98 },
        glass: { x: 2.06, y: 0.06, z: 0.74 },
        pearl: { x: 0.86, y: -1.16, z: -0.72 },
      },
      asset: {
        presentationScale: 0.64,
        sceneOffset: { x: -0.1, y: -0.24, z: 0.02 },
        path: {
          start: { x: 1.28, y: -0.4, z: 0.16 },
          hold: { x: 1.54, y: -0.18, z: 0.04 },
          drift: { x: 1.78, y: -0.08, z: -0.02 },
          fade: { x: 1.98, y: 0.02, z: -0.08 },
        },
      },
    },
    mobile: {
      ribbon: {
        position: { x: -1.66, y: -1.08, z: -0.2 },
        rotation: { x: 0.98, y: -0.08, z: 0.42 },
        scale: { x: 0.92, y: 0.68, z: 0.32 },
      },
      membrane: {
        position: { x: 2.12, y: -0.7, z: 0.46 },
        rotation: { x: 0.08, y: -0.5, z: 0.1 },
      },
      panes: {
        primary: {
          position: { x: -1.02, y: -0.08, z: -1.52 },
          rotation: { x: 0.02, y: 0.2, z: 0.12 },
        },
        secondary: {
          position: { x: 1.34, y: -0.5, z: -1.12 },
          rotation: { x: -0.01, y: -0.16, z: -0.1 },
        },
      },
      spheres: {
        chrome: { x: -1.92, y: 0.46, z: 0.94 },
        glass: { x: 2.02, y: 0.02, z: 0.7 },
        pearl: { x: 0.78, y: -1.18, z: -0.68 },
      },
      asset: {
        presentationScale: 0.56,
        sceneOffset: { x: -0.24, y: -0.34, z: 0.02 },
        path: {
          start: { x: 0.94, y: -0.48, z: 0.16 },
          hold: { x: 1.14, y: -0.24, z: 0.03 },
          drift: { x: 1.3, y: -0.14, z: -0.02 },
          fade: { x: 1.46, y: -0.04, z: -0.06 },
        },
      },
    },
  },
  palette: {
    background: "#090507",
    fog: "#090507",
    plum: "#1a0b14",
    plumGlass: "#362232",
    charcoal: "#18121b",
    metal: "#b5afb7",
    warm: "#c98a66",
    cool: "#6682b8",
    lightWarm: "#f2e7dc",
    ember: "#6c3b28",
  },
  camera: {
    desktop: {
      fov: 37,
      position: { x: 0.08, y: 0.34, z: 8.85 },
    },
    tablet: {
      fov: 42,
      position: { x: 0.06, y: 0.28, z: 9.6 },
    },
    mobile: {
      fov: 49,
      position: { x: 0.04, y: 0.24, z: 10.7 },
    },
    lookAt: { x: 0.18, y: -0.08, z: 0 },
  },
  intro: {
    duration: 1.8,
    ease: "power3.out",
  },
  postprocessing: {
    bloom: {
      strength: 0.18,
      mobileStrength: 0.1,
      radius: 0.72,
      threshold: 0.84,
      flashBoost: 0.07,
    },
    finish: {
      rgbShift: 0.0008,
      mobileRgbShift: 0,
      vignette: 0.18,
      mobileVignette: 0.14,
      grain: 0.015,
      mobileGrain: 0.008,
    },
  },
  heroAsset: {
    floorY: -2.14,
    presentationScale: 0.74,
    sceneOffset: { x: 0.08, y: -0.02, z: 0.02 },
  },
  courier: {
    radius: 0.43,
    glowScale: 1.9,
    path: {
      entry: { x: -3.35, y: -0.68, z: 0.96 },
      near: { x: 0.72, y: 0.12, z: 0.62 },
      contact: { x: 1.38, y: 0.2, z: 0.44 },
      through: { x: 1.76, y: 0.18, z: 0.3 },
      fade: { x: 2.02, y: 0.2, z: 0.22 },
    },
  },
  sequence: {
    approachDuration: 2.65,
    contactDuration: 0.38,
    transferDuration: 0.82,
    revealDuration: 1.3,
    driftDuration: 2.5,
    fadeDuration: 0.92,
    gapDuration: 0.26,
    assetPath: {
      start: { x: 1.78, y: -0.2, z: 0.26 },
      hold: { x: 2.18, y: 0.04, z: 0.08 },
      drift: { x: 2.54, y: 0.14, z: -0.04 },
      fade: { x: 2.82, y: 0.24, z: -0.1 },
    },
  },
  fogDensity: 0.048,
  dust: {
    count: 96,
    radius: 4.4,
    height: 4.6,
  },
  motion: {
    pointerRotationX: 0.032,
    pointerRotationY: 0.082,
    pointerShiftX: 0.065,
    pointerShiftY: 0.04,
    cameraShiftX: 0.13,
    cameraShiftY: 0.085,
    depthParallaxX: 0.1,
    depthParallaxY: 0.06,
    paneParallaxX: 0.04,
    paneParallaxY: 0.025,
    glowParallaxX: 0.12,
    glowParallaxY: 0.06,
    idleFloatAmplitude: 0.045,
    idleFloatSpeed: 0.34,
    ringSpin: 0.055,
    ringLift: 0.052,
    atmosphereDrift: 0.055,
    assetRigRotationX: 0.035,
    assetRigRotationY: 0.08,
  },
};
