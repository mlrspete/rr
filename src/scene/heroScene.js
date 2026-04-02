import * as THREE from "three";
import { gsap } from "gsap";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

import {
  getHeroLayoutPreset,
  getHeroResponsiveProfile,
  heroConfig,
} from "./config.js";
import { clearHeroAssetCache, preloadHeroAssets } from "./heroAssetLoader.js";
import {
  curatedHeroAssetKeys,
  defaultHeroAssetKey,
  getHeroAssetSpec,
} from "./heroAssetRegistry.js";
import {
  clearPremiumShapeCache,
  preloadPremiumShapes,
} from "./premiumShapeLibrary.js";
import {
  findHeroClusterPresetIndexForAsset,
  getHeroClusterPreset,
  heroClusterPresets,
  rotatePresetKeys,
} from "./heroClusterPresets.js";
import { HeroLoopController } from "./controllers/HeroLoopController.js";
import { MembraneController } from "./controllers/MembraneController.js";
import { SlotController } from "./controllers/SlotController.js";
import { createHeroAssetMaterial, createHeroMaterials } from "./materials.js";
import { createCalloutOverlay } from "../ui/calloutOverlay.js";

export function createHeroScene({
  container,
  interactionTarget = window,
  reducedMotion = false,
  assetKey = defaultHeroAssetKey,
} = {}) {
  if (!container) {
    return null;
  }

  container.dataset.ready = "false";

  let renderer;

  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
  } catch {
    return null;
  }

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = heroConfig.renderer.exposure;
  renderer.setClearColor(heroConfig.palette.background, 0);
  renderer.domElement.className = "hero-webgl";
  container.replaceChildren(renderer.domElement);

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const environmentScene = new RoomEnvironment();
  const environmentTarget = pmremGenerator.fromScene(environmentScene, 0.06);

  const scene = new THREE.Scene();
  scene.environment = environmentTarget.texture;
  scene.fog = new THREE.FogExp2(heroConfig.palette.fog, heroConfig.fogDensity);

  const camera = new THREE.PerspectiveCamera(heroConfig.camera.desktop.fov, 1, 0.1, 60);
  const clock = new THREE.Clock();

  let currentLeadAssetKey = getHeroAssetSpec(assetKey).key;
  let currentPresetIndex = findHeroClusterPresetIndexForAsset(currentLeadAssetKey);
  let currentClusterPreset = getHeroClusterPreset(currentPresetIndex);
  let responsiveProfile = getHeroResponsiveProfile(container.clientWidth || window.innerWidth, reducedMotion);
  let layoutPreset = getHeroLayoutPreset(container.clientWidth || window.innerWidth);
  renderer.setPixelRatio(getRendererPixelRatio(window.devicePixelRatio, responsiveProfile));

  const materials = createHeroMaterials(heroConfig);
  const glowTexture = createGlowTexture();
  const postprocessing = createPostProcessing({
    renderer,
    scene,
    camera,
    width: container.clientWidth || window.innerWidth,
    height: container.clientHeight || window.innerHeight,
    responsiveProfile,
  });

  const calloutContainer =
    container.closest(".site-shell")?.querySelector("[data-callout-layer]") ??
    (interactionTarget instanceof HTMLElement
      ? interactionTarget
      : container.parentElement ?? container);
  const calloutOverlay = createCalloutOverlay({
    container: calloutContainer,
    maxPerSide: heroConfig.callouts.maxPerSide,
    duration: heroConfig.callouts.duration,
    sideOffsetX: heroConfig.callouts.sideOffsetX,
    sideOffsetY: heroConfig.callouts.sideOffsetY,
    fadeDuration: heroConfig.callouts.fadeDuration,
    safeInsetX: heroConfig.callouts.safeInsetX,
    safeInsetTop: heroConfig.callouts.safeInsetTop,
    safeInsetBottom: heroConfig.callouts.safeInsetBottom,
  });

  const introRig = new THREE.Group();
  const motionRig = new THREE.Group();
  const atmosphereRig = new THREE.Group();
  const leftCluster = new THREE.Group();
  const rightCluster = new THREE.Group();
  const particleField = new THREE.Group();
  const lights = new THREE.Group();

  introRig.name = "heroIntro";
  motionRig.name = "heroMotion";
  atmosphereRig.name = "atmosphere";
  leftCluster.name = "leftCluster";
  rightCluster.name = "rightCluster";
  particleField.name = "particleField";
  lights.name = "lights";

  introRig.add(motionRig);
  motionRig.add(atmosphereRig);
  motionRig.add(leftCluster);
  motionRig.add(rightCluster);
  motionRig.add(particleField);
  scene.add(introRig);
  scene.add(lights);

  const atmosphere = createAtmosphere({ glowTexture, materials });
  atmosphereRig.add(atmosphere.backdrop);
  atmosphereRig.add(atmosphere.coolZone);
  atmosphereRig.add(atmosphere.warmZone);
  atmosphereRig.add(atmosphere.neutralZone);

  let particleSystem = createDustField({
    material: materials.dust,
    responsiveProfile,
    particlesConfig: heroConfig.particles,
  });
  particleField.add(particleSystem.group);

  createLights(lights, heroConfig.lights);

  const membraneController = new MembraneController({
    config: {
      ...heroConfig.membrane,
      palette: heroConfig.palette,
    },
    materials,
    glowTexture,
  });
  motionRig.add(membraneController.group);

  const materialFactory = (spec) => createHeroAssetMaterial(heroConfig, spec);
  const slotControllerMap = createSlotControllerMap({
    layoutPreset,
    clusterPreset: currentClusterPreset,
    leadAssetKey: currentLeadAssetKey,
    slotConfig: heroConfig.slot,
    materials,
    createMaterial: materialFactory,
  });
  const slotControllers = slotControllerMap.all;

  for (const slot of slotControllerMap.left) {
    leftCluster.add(slot.group);
  }

  for (const slot of slotControllerMap.right) {
    rightCluster.add(slot.group);
  }

  const heroLoopController = new HeroLoopController({
    membraneConfig: heroConfig.membrane.sweep,
    calloutConfig: heroConfig.callouts,
    calloutOverlay,
    slotControllers,
    onCycleBoundary: () => {
      void cycleClusterPreset();
    },
  });

  const introState = { progress: reducedMotion ? 1 : 0 };
  const pointer = { x: 0, y: 0 };
  const targetPointer = { x: 0, y: 0 };
  const cameraBase = { ...heroConfig.camera.desktop.position };
  const clusterBase = {
    left: {
      position: new THREE.Vector3(),
      rotation: new THREE.Euler(),
    },
    right: {
      position: new THREE.Vector3(),
      rotation: new THREE.Euler(),
    },
  };
  const membraneWorldInverse = new THREE.Matrix4();

  let resizeObserver;
  let animationFrame = 0;
  let introTimeline = null;
  let loopRebuildHandle = 0;
  let isDestroyed = false;
  let hasPresentedFirstFrame = false;
  let slotsInitialized = false;
  let introComplete = reducedMotion;
  let presetCycleCount = 0;
  let activePresetRequest = Promise.resolve();

  const updatePointer = (nextX, nextY) => {
    targetPointer.x = THREE.MathUtils.clamp(nextX, -1, 1);
    targetPointer.y = THREE.MathUtils.clamp(nextY, -1, 1);
  };

  const handlePointerMove = (event) => {
    const bounds =
      interactionTarget instanceof HTMLElement
        ? interactionTarget.getBoundingClientRect()
        : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };

    const nextX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const nextY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    updatePointer(nextX, nextY);
  };

  const handlePointerLeave = () => {
    updatePointer(0, 0);
  };

  const setCameraPreset = () => {
    const preset =
      responsiveProfile.viewportKey === "mobile"
        ? heroConfig.camera.mobile
        : responsiveProfile.viewportKey === "tablet"
          ? heroConfig.camera.tablet
          : heroConfig.camera.desktop;

    camera.fov = preset.fov;
    cameraBase.x = preset.position.x;
    cameraBase.y = preset.position.y;
    cameraBase.z = preset.position.z;
    camera.updateProjectionMatrix();
  };

  const scheduleLoopRebuild = () => {
    if (!slotsInitialized) {
      return;
    }

    if (loopRebuildHandle) {
      window.clearTimeout(loopRebuildHandle);
    }

    loopRebuildHandle = window.setTimeout(() => {
      loopRebuildHandle = 0;
      heroLoopController.rebuild();
    }, heroConfig.loop.rebuildDebounceMs);
  };

  const applySceneLayout = () => {
    applyLayoutPreset({
      layoutPreset,
      responsiveProfile,
      membraneController,
      atmosphere,
      clusters: { leftCluster, rightCluster },
      clusterBase,
      slotControllerMap,
      heroLoopController,
      clusterPreset: currentClusterPreset,
    });
  };

  const resize = () => {
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const previousViewportKey = responsiveProfile.viewportKey;
    const previousDustCount = responsiveProfile.dustCount;

    responsiveProfile = getHeroResponsiveProfile(width, reducedMotion);
    layoutPreset = getHeroLayoutPreset(width);

    const pixelRatio = getRendererPixelRatio(window.devicePixelRatio, responsiveProfile);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    postprocessing.composer.setPixelRatio?.(pixelRatio);
    postprocessing.composer.setSize(width, height);
    postprocessing.bloomPass.setSize(width, height);
    postprocessing.bloomPass.strength = responsiveProfile.bloomStrength;
    postprocessing.bloomPass.radius = responsiveProfile.bloomRadius;
    postprocessing.bloomPass.threshold = responsiveProfile.bloomThreshold;
    postprocessing.finishPass.uniforms.uRgbShift.value = responsiveProfile.rgbShift;
    postprocessing.finishPass.uniforms.uVignette.value = responsiveProfile.vignette;
    postprocessing.finishPass.uniforms.uGrain.value = responsiveProfile.grain;

    if (
      previousViewportKey !== responsiveProfile.viewportKey ||
      previousDustCount !== responsiveProfile.dustCount
    ) {
      particleField.remove(particleSystem.group);
      particleSystem.destroy();
      particleSystem = createDustField({
        material: materials.dust,
        responsiveProfile,
        particlesConfig: heroConfig.particles,
      });
      particleField.add(particleSystem.group);
    }

    setCameraPreset();
    applySceneLayout();

    camera.aspect = width / height;
    camera.position.set(cameraBase.x, cameraBase.y, cameraBase.z);
    camera.lookAt(
      heroConfig.camera.lookAt.x,
      heroConfig.camera.lookAt.y,
      heroConfig.camera.lookAt.z,
    );
    camera.updateProjectionMatrix();

    scheduleLoopRebuild();
  };

  const render = () => {
    const elapsed = clock.getElapsedTime();
    const interactionStrength = responsiveProfile.interactionStrength;
    const atmosphereStrength = responsiveProfile.atmosphereStrength;
    const motionScale = responsiveProfile.motionScale;
    const smoothFactor = 0.035 + interactionStrength * 0.012;

    pointer.x += (targetPointer.x - pointer.x) * smoothFactor;
    pointer.y += (targetPointer.y - pointer.y) * smoothFactor;

    const introProgress = introState.progress;
    const loopState = heroLoopController.getState();
    const basePulse =
      (Math.sin(elapsed * 0.46 + 0.3) * 0.5 + 0.5) *
      responsiveProfile.pulseAmplitude *
      introProgress;
    const baseFlash =
      (Math.sin(elapsed * 0.34 - 0.6) * 0.5 + 0.5) *
      responsiveProfile.flashAmplitude *
      0.28 *
      introProgress;
    const membranePulse = basePulse + loopState.pulse;
    const membraneFlash = baseFlash + loopState.flash;
    const idleFloat =
      Math.sin(elapsed * heroConfig.motion.idleFloatSpeed) *
      heroConfig.motion.idleFloatAmplitude *
      motionScale;

    motionRig.position.y = idleFloat * introProgress;
    motionRig.rotation.y =
      pointer.x * heroConfig.motion.pointerRotationY * interactionStrength * motionScale +
      Math.sin(elapsed * 0.16) * 0.012 * introProgress * motionScale;
    motionRig.rotation.x =
      -pointer.y * heroConfig.motion.pointerRotationX * interactionStrength * motionScale;
    motionRig.position.x =
      pointer.x * heroConfig.motion.pointerShiftX * interactionStrength * motionScale;
    motionRig.position.z =
      pointer.y * heroConfig.motion.pointerShiftY * interactionStrength * motionScale;

    atmosphereRig.position.x =
      -pointer.x * heroConfig.motion.depthParallaxX * interactionStrength * motionScale;
    atmosphereRig.position.y =
      -pointer.y * heroConfig.motion.depthParallaxY * interactionStrength * motionScale +
      Math.sin(elapsed * 0.12) *
        heroConfig.motion.atmosphereDrift *
        0.5 *
        atmosphereStrength *
        motionScale;

    updateAtmosphere(atmosphere, {
      elapsed,
      pointer,
      interactionStrength,
      atmosphereStrength,
      motionScale,
    });

    updateClusterGroup(leftCluster, clusterBase.left, {
      elapsed,
      pointer,
      interactionStrength,
      atmosphereStrength,
      parallaxDirection: -1,
      motionScale,
    });
    updateClusterGroup(rightCluster, clusterBase.right, {
      elapsed,
      pointer,
      interactionStrength,
      atmosphereStrength,
      parallaxDirection: 1,
      motionScale,
    });

    membraneController.update({
      elapsed,
      introProgress,
      pointer,
      interactionStrength,
      atmosphereStrength,
      motionScale,
      activationScale: responsiveProfile.membraneActivationScale,
      sweepWorldX: loopState.sweepX,
      pulse: membranePulse,
      flash: membraneFlash,
      direction: loopState.direction,
      clusterTargets: [leftCluster.position.x, rightCluster.position.x],
    });
    membraneController.group.updateMatrixWorld(true);
    membraneWorldInverse.copy(membraneController.group.matrixWorld).invert();

    for (const slot of slotControllers) {
      slot.update({
        elapsed,
        introProgress,
        direction: loopState.direction,
        membraneWorldInverse,
        motionScale: responsiveProfile.slotMotionScale,
        fxScale: responsiveProfile.conversionFxScale,
      });
    }

    updateDustField(particleSystem, {
      elapsed,
      pointer,
      interactionStrength,
      atmosphereStrength,
      motionScale,
    });

    materials.backdrop.opacity =
      heroConfig.materials.backdropOpacity +
      Math.sin(elapsed * 0.18 + 0.4) * heroConfig.materials.backdropPulse +
      membraneFlash * 0.02;

    camera.position.x =
      cameraBase.x + pointer.x * heroConfig.motion.cameraShiftX * interactionStrength * motionScale;
    camera.position.y =
      cameraBase.y - pointer.y * heroConfig.motion.cameraShiftY * interactionStrength * motionScale;
    camera.position.z = cameraBase.z;
    camera.lookAt(
      heroConfig.camera.lookAt.x + pointer.x * 0.02 * interactionStrength * motionScale,
      heroConfig.camera.lookAt.y + pointer.y * 0.024 * interactionStrength * motionScale,
      heroConfig.camera.lookAt.z,
    );

    postprocessing.bloomPass.strength =
      responsiveProfile.bloomStrength + membraneFlash * heroConfig.postprocessing.bloom.flashBoost;
    postprocessing.finishPass.uniforms.uTime.value = elapsed;
    postprocessing.finishPass.uniforms.uRgbShift.value =
      responsiveProfile.rgbShift + membraneFlash * 0.00004;
    postprocessing.composer.render();

    const calloutWidth = calloutContainer?.clientWidth || container.clientWidth || window.innerWidth;
    const calloutHeight = calloutContainer?.clientHeight || container.clientHeight || window.innerHeight;
    calloutOverlay.update({
      camera,
      width: calloutWidth,
      height: calloutHeight,
    });

    if (!hasPresentedFirstFrame) {
      hasPresentedFirstFrame = true;
      container.dataset.ready = "true";
    }

    animationFrame = window.requestAnimationFrame(render);
  };

  const startIntro = () => {
    introRig.position.set(
      heroConfig.intro.startPosition.x,
      heroConfig.intro.startPosition.y,
      heroConfig.intro.startPosition.z,
    );
    introRig.rotation.set(
      heroConfig.intro.startRotation.x,
      heroConfig.intro.startRotation.y,
      heroConfig.intro.startRotation.z,
    );
    leftCluster.scale.setScalar(heroConfig.intro.stageScale);
    rightCluster.scale.setScalar(heroConfig.intro.stageScale);
    membraneController.group.scale.multiplyScalar(0.92);

    if (reducedMotion) {
      introState.progress = 1;
      introComplete = true;
      introRig.position.set(0, 0, 0);
      introRig.rotation.set(0, 0, 0);
      leftCluster.scale.setScalar(1);
      rightCluster.scale.setScalar(1);
      membraneController.setLayout(layoutPreset.membrane.transform);
      return;
    }

    introTimeline = gsap
      .timeline({
        defaults: {
          duration: heroConfig.intro.duration,
          ease: heroConfig.intro.ease,
        },
      })
      .to(introState, { progress: 1 }, 0)
      .to(introRig.position, { x: 0, y: 0, z: 0 }, 0)
      .to(introRig.rotation, { x: 0, y: 0, z: 0 }, 0)
      .to(leftCluster.scale, { x: 1, y: 1, z: 1, duration: 1.12 }, 0.16)
      .to(rightCluster.scale, { x: 1, y: 1, z: 1, duration: 1.12 }, 0.18)
      .to(
        membraneController.group.scale,
        {
          x: membraneController.baseScale.x,
          y: membraneController.baseScale.y,
          z: membraneController.baseScale.z,
          duration: 1.18,
        },
        0.12,
      );

    introTimeline.eventCallback("onComplete", () => {
      introComplete = true;

      if (slotsInitialized && !isDestroyed) {
        heroLoopController.start();
      }
    });
  };

  async function initializeSlots() {
    try {
      await Promise.all(slotControllers.map((slot) => slot.initialize()));

      if (isDestroyed) {
        return;
      }

      slotsInitialized = true;
      await applyClusterPreset(currentPresetIndex, {
        preferredRustKey: currentLeadAssetKey,
        restartLoop: false,
      });
      preloadAssets(curatedHeroAssetKeys);

      heroLoopController.rebuild();

      if (introComplete) {
        heroLoopController.start();
      }
    } catch (error) {
      console.error("REAL RUST hero slots failed to initialize.", error);
    }
  }

  function applyClusterPreset(
    presetIndex,
    {
      preferredRustKey = "",
      restartLoop = false,
    } = {},
  ) {
    activePresetRequest = activePresetRequest.then(async () => {
      const nextPreset = getHeroClusterPreset(presetIndex);

      if (!nextPreset || isDestroyed) {
        return currentLeadAssetKey;
      }

      const normalizedIndex = heroClusterPresets.findIndex(
        (preset) => preset.id === nextPreset.id,
      );
      const nextPresetIndex = normalizedIndex === -1 ? 0 : normalizedIndex;
      const rustKeys = rotatePresetKeys(
        nextPreset.rustAssetKeys,
        preferredRustKey || currentLeadAssetKey,
      );
      const premiumKeys = [...nextPreset.premiumShapeKeys];
      const presetSeed = nextPresetIndex * 11 + presetCycleCount * 7;

      currentPresetIndex = nextPresetIndex;
      currentClusterPreset = nextPreset;
      currentLeadAssetKey = rustKeys[0] ?? currentLeadAssetKey;

      applySceneLayout();

      const assignments = [];
      const applyToSide = (slots) => {
        slots.forEach((slot, index) => {
          slot.setPremiumShapeKey(premiumKeys[index % premiumKeys.length]);
          slot.setCalloutPreset({
            calloutPools: nextPreset.calloutPools,
            presetSeed,
          });
          assignments.push(slot.setRustAssetKey(rustKeys[index % rustKeys.length]));
        });
      };

      applyToSide(slotControllerMap.left);
      applyToSide(slotControllerMap.right);

      await Promise.all(assignments);

      if (isDestroyed) {
        return currentLeadAssetKey;
      }

      applySceneLayout();

      if (restartLoop && slotsInitialized) {
        heroLoopController.rebuild();

        if (introComplete) {
          heroLoopController.start();
        }
      }

      return currentLeadAssetKey;
    });

    return activePresetRequest;
  }

  function cycleClusterPreset() {
    if (heroClusterPresets.length <= 1) {
      return Promise.resolve(currentLeadAssetKey);
    }

    presetCycleCount += 1;
    return applyClusterPreset((currentPresetIndex + 1) % heroClusterPresets.length, {
      restartLoop: false,
    });
  }

  function setAsset(nextAssetKey = defaultHeroAssetKey) {
    const resolvedKey = getHeroAssetSpec(nextAssetKey).key;
    currentLeadAssetKey = resolvedKey;
    currentPresetIndex = findHeroClusterPresetIndexForAsset(resolvedKey);
    currentClusterPreset = getHeroClusterPreset(currentPresetIndex);

    if (!slotsInitialized) {
      return Promise.resolve(currentLeadAssetKey);
    }

    return applyClusterPreset(currentPresetIndex, {
      preferredRustKey: resolvedKey,
      restartLoop: true,
    });
  }

  function preloadAssets(keys = []) {
    if (isDestroyed) {
      return Promise.resolve([]);
    }

    return Promise.all([preloadHeroAssets(keys), preloadPremiumShapes()]);
  }

  resize();
  startIntro();
  initializeSlots();
  render();

  if (interactionTarget instanceof EventTarget) {
    interactionTarget.addEventListener("pointermove", handlePointerMove);
    interactionTarget.addEventListener("pointerleave", handlePointerLeave);
  }

  if ("ResizeObserver" in window) {
    resizeObserver = new ResizeObserver(() => {
      resize();
    });
    resizeObserver.observe(container);
  } else {
    window.addEventListener("resize", resize);
  }

  return {
    setAsset,
    preloadAssets,
    getAssetKey() {
      return currentLeadAssetKey;
    },
    destroy() {
      isDestroyed = true;
      window.cancelAnimationFrame(animationFrame);
      introTimeline?.kill();
      if (loopRebuildHandle) {
        window.clearTimeout(loopRebuildHandle);
        loopRebuildHandle = 0;
      }
      heroLoopController.destroy();
      membraneController.destroy();
      calloutOverlay.destroy();

      if (interactionTarget instanceof EventTarget) {
        interactionTarget.removeEventListener("pointermove", handlePointerMove);
        interactionTarget.removeEventListener("pointerleave", handlePointerLeave);
      }

      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener("resize", resize);
      }

      for (const slot of slotControllers) {
        slot.destroy();
      }

      particleSystem.destroy();
      glowTexture.dispose();
      environmentTarget.dispose();
      environmentScene.dispose?.();
      pmremGenerator.dispose();
      postprocessing.composer.dispose?.();
      clearHeroAssetCache();
      clearPremiumShapeCache();

      scene.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose();
        }

        if (object.material) {
          disposeMaterial(object.material);
        }
      });

      renderer.dispose();
      container.dataset.ready = "false";
      container.replaceChildren();
    },
  };
}

function createSlotControllerMap({
  layoutPreset,
  clusterPreset,
  leadAssetKey,
  slotConfig,
  materials,
  createMaterial,
}) {
  const rustKeys = rotatePresetKeys(
    clusterPreset?.rustAssetKeys ?? curatedHeroAssetKeys.slice(0, 2),
    leadAssetKey,
  );
  const premiumKeys = clusterPreset?.premiumShapeKeys ?? ["facetOblong", "capsuleBar"];
  const leftLayouts = layoutPreset.clusters.left.slots;
  const rightLayouts = layoutPreset.clusters.right.slots;

  const left = leftLayouts.map(
    (layout, index) =>
      new SlotController({
        name: layout.name,
        side: "left",
        orderIndex: index,
        premiumShapeKey: premiumKeys[index % premiumKeys.length] ?? layout.premiumShapeKey,
        rustAssetKey: rustKeys[index % rustKeys.length],
        config: slotConfig,
        materials,
        createMaterial,
      }),
  );

  const right = rightLayouts.map(
    (layout, index) =>
      new SlotController({
        name: layout.name,
        side: "right",
        orderIndex: index + leftLayouts.length,
        premiumShapeKey: premiumKeys[index % premiumKeys.length] ?? layout.premiumShapeKey,
        rustAssetKey: rustKeys[index % rustKeys.length],
        config: slotConfig,
        materials,
        createMaterial,
      }),
  );

  return {
    left,
    right,
    all: [...left, ...right],
  };
}

function applyLayoutPreset({
  layoutPreset,
  responsiveProfile,
  membraneController,
  atmosphere,
  clusters,
  clusterBase,
  slotControllerMap,
  heroLoopController,
  clusterPreset,
}) {
  membraneController.setLayout(layoutPreset.membrane.transform);
  applyAtmospherePreset(atmosphere, layoutPreset.atmosphere);

  applyClusterLayout(clusters.leftCluster, clusterBase.left, layoutPreset.clusters.left);
  applyClusterLayout(clusters.rightCluster, clusterBase.right, layoutPreset.clusters.right);

  for (const [index, slot] of slotControllerMap.left.entries()) {
    slot.setLayout(
      layoutPreset.clusters.left.slots[index],
      index < responsiveProfile.slotsPerSide,
      getPresetSlotVariation(clusterPreset, "left", layoutPreset.clusters.left.slots[index]?.name),
    );
  }

  for (const [index, slot] of slotControllerMap.right.entries()) {
    slot.setLayout(
      layoutPreset.clusters.right.slots[index],
      index < responsiveProfile.slotsPerSide,
      getPresetSlotVariation(clusterPreset, "right", layoutPreset.clusters.right.slots[index]?.name),
    );
  }

  heroLoopController.configure({
    membraneBaseX: layoutPreset.membrane.transform.position.x,
    passDuration: responsiveProfile.passDuration,
    holdDuration: responsiveProfile.holdDuration,
    calloutsEnabled: responsiveProfile.calloutsEnabled,
    travelX: responsiveProfile.travelX,
  });
}

function applyClusterLayout(group, baseStore, layout) {
  baseStore.position.set(layout.position.x, layout.position.y, layout.position.z);
  baseStore.rotation.set(layout.rotation.x, layout.rotation.y, layout.rotation.z);
  group.position.copy(baseStore.position);
  group.rotation.copy(baseStore.rotation);
}

function getPresetSlotVariation(preset, side, slotName) {
  return preset?.slotVariations?.[side]?.[slotName] ?? null;
}

function updateClusterGroup(group, baseStore, {
  elapsed,
  pointer,
  interactionStrength,
  atmosphereStrength,
  parallaxDirection,
  motionScale = 1,
}) {
  group.position.x =
    baseStore.position.x +
    pointer.x *
      heroConfig.motion.clusterParallaxX *
      interactionStrength *
      parallaxDirection *
      motionScale;
  group.position.y =
    baseStore.position.y -
    pointer.y * heroConfig.motion.clusterParallaxY * interactionStrength * motionScale +
    Math.sin(elapsed * 0.14 + parallaxDirection) * 0.03 * atmosphereStrength * motionScale;
  group.position.z = baseStore.position.z;
  group.rotation.x = baseStore.rotation.x;
  group.rotation.y =
    baseStore.rotation.y + pointer.x * 0.02 * interactionStrength * parallaxDirection * motionScale;
  group.rotation.z = baseStore.rotation.z;
}

function createAtmosphere({ glowTexture, materials }) {
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(15.2, 11.1), materials.backdrop);
  const coolZone = createGlowSprite(glowTexture, heroConfig.palette.cool, 0.24);
  const warmZone = createGlowSprite(glowTexture, heroConfig.palette.warm, 0.18);
  const neutralZone = createGlowSprite(glowTexture, heroConfig.palette.lightWarm, 0.07);

  return {
    backdrop,
    coolZone,
    warmZone,
    neutralZone,
    base: {
      backdropPosition: new THREE.Vector3(),
      backdropScale: new THREE.Vector3(1, 1, 1),
      coolPosition: new THREE.Vector3(),
      coolScale: new THREE.Vector3(1, 1, 1),
      warmPosition: new THREE.Vector3(),
      warmScale: new THREE.Vector3(1, 1, 1),
      neutralPosition: new THREE.Vector3(),
      neutralScale: new THREE.Vector3(1, 1, 1),
    },
  };
}

function applyAtmospherePreset(atmosphere, preset) {
  atmosphere.base.backdropPosition.set(
    preset.backdrop.position.x,
    preset.backdrop.position.y,
    preset.backdrop.position.z,
  );
  atmosphere.base.backdropScale.set(
    preset.backdrop.scale.x,
    preset.backdrop.scale.y,
    preset.backdrop.scale.z,
  );
  atmosphere.backdrop.position.copy(atmosphere.base.backdropPosition);
  atmosphere.backdrop.scale.copy(atmosphere.base.backdropScale);

  atmosphere.base.coolPosition.set(preset.cool.position.x, preset.cool.position.y, preset.cool.position.z);
  atmosphere.base.coolScale.set(preset.cool.scale.x, preset.cool.scale.y, preset.cool.scale.z);
  atmosphere.coolZone.position.copy(atmosphere.base.coolPosition);
  atmosphere.coolZone.scale.copy(atmosphere.base.coolScale);

  atmosphere.base.warmPosition.set(preset.warm.position.x, preset.warm.position.y, preset.warm.position.z);
  atmosphere.base.warmScale.set(preset.warm.scale.x, preset.warm.scale.y, preset.warm.scale.z);
  atmosphere.warmZone.position.copy(atmosphere.base.warmPosition);
  atmosphere.warmZone.scale.copy(atmosphere.base.warmScale);

  atmosphere.base.neutralPosition.set(
    preset.neutral.position.x,
    preset.neutral.position.y,
    preset.neutral.position.z,
  );
  atmosphere.base.neutralScale.set(preset.neutral.scale.x, preset.neutral.scale.y, preset.neutral.scale.z);
  atmosphere.neutralZone.position.copy(atmosphere.base.neutralPosition);
  atmosphere.neutralZone.scale.copy(atmosphere.base.neutralScale);
}

function updateAtmosphere(atmosphere, {
  elapsed,
  pointer,
  interactionStrength,
  atmosphereStrength,
  motionScale = 1,
}) {
  atmosphere.backdrop.position.x =
    atmosphere.base.backdropPosition.x + pointer.x * 0.035 * interactionStrength * motionScale;
  atmosphere.backdrop.position.y =
    atmosphere.base.backdropPosition.y - pointer.y * 0.025 * interactionStrength * motionScale;
  atmosphere.backdrop.scale.x =
    atmosphere.base.backdropScale.x * (1 + Math.sin(elapsed * 0.09 + 0.4) * 0.01 * atmosphereStrength);
  atmosphere.backdrop.scale.y =
    atmosphere.base.backdropScale.y * (1 + Math.cos(elapsed * 0.11 + 0.8) * 0.014 * atmosphereStrength);

  atmosphere.coolZone.position.x =
    atmosphere.base.coolPosition.x -
    pointer.x * heroConfig.motion.glowParallaxX * interactionStrength * motionScale +
    Math.sin(elapsed * 0.16) * 0.09 * atmosphereStrength;
  atmosphere.coolZone.position.y =
    atmosphere.base.coolPosition.y + Math.cos(elapsed * 0.14 + 0.8) * 0.07 * atmosphereStrength;

  atmosphere.warmZone.position.x =
    atmosphere.base.warmPosition.x +
    pointer.x * heroConfig.motion.glowParallaxX * 0.82 * interactionStrength * motionScale +
    Math.sin(elapsed * 0.12 + 1.7) * 0.06 * atmosphereStrength;
  atmosphere.warmZone.position.y =
    atmosphere.base.warmPosition.y + Math.cos(elapsed * 0.18 + 2.2) * 0.05 * atmosphereStrength;

  atmosphere.neutralZone.position.x =
    atmosphere.base.neutralPosition.x + Math.sin(elapsed * 0.1 + 0.3) * 0.04 * atmosphereStrength;
  atmosphere.neutralZone.position.y =
    atmosphere.base.neutralPosition.y + Math.cos(elapsed * 0.13 + 0.9) * 0.035 * atmosphereStrength;
}

function createLights(target, lightsConfig) {
  const ambientLight = new THREE.AmbientLight(
    lightsConfig.ambient.color,
    lightsConfig.ambient.intensity,
  );
  target.add(ambientLight);

  const hemisphereLight = new THREE.HemisphereLight(
    lightsConfig.hemisphere.skyColor,
    lightsConfig.hemisphere.groundColor,
    lightsConfig.hemisphere.intensity,
  );
  target.add(hemisphereLight);

  const coolKeyLight = new THREE.DirectionalLight(
    lightsConfig.coolKey.color,
    lightsConfig.coolKey.intensity,
  );
  coolKeyLight.position.set(
    lightsConfig.coolKey.position.x,
    lightsConfig.coolKey.position.y,
    lightsConfig.coolKey.position.z,
  );
  target.add(coolKeyLight);

  const membraneAccentLight = new THREE.PointLight(
    lightsConfig.membraneAccent.color,
    lightsConfig.membraneAccent.intensity,
    lightsConfig.membraneAccent.distance,
    lightsConfig.membraneAccent.decay,
  );
  membraneAccentLight.position.set(
    lightsConfig.membraneAccent.position.x,
    lightsConfig.membraneAccent.position.y,
    lightsConfig.membraneAccent.position.z,
  );
  target.add(membraneAccentLight);
}

function createDustField({
  material,
  responsiveProfile,
  particlesConfig,
}) {
  const group = new THREE.Group();
  group.name = "conversionDust";

  const layers = (particlesConfig.layers ?? []).map((layerConfig, index) =>
    createDustLayer({
      baseMaterial: material,
      count: Math.max(4, Math.round(responsiveProfile.dustCount * layerConfig.density)),
      layerConfig,
      layerIndex: index,
    }),
  );

  for (const layer of layers) {
    group.add(layer.points);
  }

  return {
    group,
    layers,
    viewportKey: responsiveProfile.viewportKey,
    count: responsiveProfile.dustCount,
    destroy() {
      for (const layer of layers) {
        layer.points.geometry?.dispose();
        layer.points.material?.dispose?.();
      }

      group.removeFromParent();
    },
  };
}

function createDustLayer({
  baseMaterial,
  count,
  layerConfig,
  layerIndex,
}) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const random = createSeededRandom((layerConfig.seed ?? layerIndex + 1) * 97);

  for (let index = 0; index < count; index += 1) {
    const stride = index * 3;
    const angle = random() * Math.PI * 2;
    const radius = Math.pow(random(), 1.2) * layerConfig.radius;
    const height = (random() - 0.5) * layerConfig.height;
    const depth = layerConfig.depthOffset + (random() - 0.5) * layerConfig.depthSpread;

    positions[stride] = Math.cos(angle) * radius;
    positions[stride + 1] = height;
    positions[stride + 2] = Math.sin(angle) * radius + depth;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const pointsMaterial = baseMaterial.clone();
  pointsMaterial.size *= layerConfig.sizeScale;
  pointsMaterial.opacity *= layerConfig.opacityScale;

  const points = new THREE.Points(geometry, pointsMaterial);
  points.renderOrder = 0;

  return {
    points,
    config: layerConfig,
    phase: random() * Math.PI * 2,
  };
}

function updateDustField(field, {
  elapsed,
  pointer,
  interactionStrength,
  atmosphereStrength,
  motionScale = 1,
}) {
  field.group.rotation.y = elapsed * heroConfig.particles.rotationYSpeed * motionScale;
  field.group.rotation.x =
    Math.sin(elapsed * 0.1) * heroConfig.particles.rotationXSwing * motionScale;
  field.group.rotation.z =
    Math.cos(elapsed * 0.08 + 0.4) * heroConfig.particles.rotationZSwing * motionScale;

  for (const layer of field.layers) {
    layer.points.rotation.y = elapsed * layer.config.rotationYSpeed * motionScale;
    layer.points.position.x =
      -pointer.x * layer.config.pointerParallax * interactionStrength * motionScale +
      Math.sin(elapsed * layer.config.driftSpeed + layer.phase) *
        layer.config.driftX *
        atmosphereStrength *
        motionScale;
    layer.points.position.y =
      Math.cos(elapsed * layer.config.bobSpeed + layer.phase) *
      layer.config.driftY *
      atmosphereStrength *
      motionScale;
  }
}

function createGlowTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");

  if (!context) {
    return new THREE.Texture();
  }

  const gradient = context.createRadialGradient(
    size * 0.5,
    size * 0.5,
    0,
    size * 0.5,
    size * 0.5,
    size * 0.5,
  );

  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.22, "rgba(255,255,255,0.42)");
  gradient.addColorStop(0.55, "rgba(255,255,255,0.08)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");

  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createGlowSprite(texture, color, opacity) {
  const material = new THREE.SpriteMaterial({
    map: texture,
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });

  return new THREE.Sprite(material);
}

function createPostProcessing({ renderer, scene, camera, width, height, responsiveProfile }) {
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio?.(getRendererPixelRatio(window.devicePixelRatio, responsiveProfile));
  composer.setSize(width, height);

  const renderPass = new RenderPass(scene, camera);
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(width, height),
    responsiveProfile.bloomStrength,
    responsiveProfile.bloomRadius,
    responsiveProfile.bloomThreshold,
  );
  const finishPass = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      uTime: { value: 0 },
      uRgbShift: { value: responsiveProfile.rgbShift },
      uVignette: { value: responsiveProfile.vignette },
      uGrain: { value: responsiveProfile.grain },
    },
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float uTime;
      uniform float uRgbShift;
      uniform float uVignette;
      uniform float uGrain;
      varying vec2 vUv;

      float random(vec2 seed) {
        return fract(sin(dot(seed, vec2(12.9898, 78.233))) * 43758.5453123);
      }

      void main() {
        vec2 centered = vUv - 0.5;
        float edgeBias = smoothstep(0.12, 0.82, length(centered) * 1.55);
        vec2 shift = centered * uRgbShift * edgeBias;

        vec4 base = texture2D(tDiffuse, vUv);
        vec4 red = texture2D(tDiffuse, vUv + shift);
        vec4 blue = texture2D(tDiffuse, vUv - shift);

        vec3 color = vec3(red.r, base.g, blue.b);
        float vignette = smoothstep(0.06, 0.88, dot(centered, centered) * 3.2);
        float grain = (random(vUv * vec2(921.47, 471.82) + uTime * 0.05) - 0.5) * (0.55 + vignette * 0.45);

        color *= 1.0 - vignette * uVignette;
        color += grain * uGrain;

        gl_FragColor = vec4(color, base.a);
      }
    `,
  });
  const outputPass = new OutputPass();

  composer.addPass(renderPass);
  composer.addPass(bloomPass);
  composer.addPass(finishPass);
  composer.addPass(outputPass);

  return {
    composer,
    bloomPass,
    finishPass,
  };
}

function getRendererPixelRatio(devicePixelRatio, responsiveProfile) {
  return Math.min(devicePixelRatio, responsiveProfile.pixelRatioCap);
}

function createSeededRandom(seed) {
  let value = seed >>> 0;

  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function disposeMaterial(material) {
  if (Array.isArray(material)) {
    for (const entry of material) {
      disposeMaterial(entry);
    }

    return;
  }

  material.dispose();
}
