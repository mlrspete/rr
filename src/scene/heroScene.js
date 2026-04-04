import * as THREE from "three";
import { gsap } from "gsap";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js";

import { getHeroResponsiveProfile, heroConfig } from "./config.js";
import {
  clearHeroAssetCache,
  disposeHeroAssetInstance,
  loadHeroAssetInstance,
  preloadHeroAssets,
} from "./heroAssetLoader.js";
import {
  curatedHeroAssetKeys,
  defaultHeroAssetKey,
  getHeroAssetSpec,
} from "./heroAssetRegistry.js";
import {
  defaultHeroEnvironmentKey,
  getHeroEnvironmentSpec,
} from "./heroEnvironmentRegistry.js";
import { createHeroAssetMaterial, createHeroMaterials } from "./materials.js";
import { AmbientParticlesController } from "./controllers/AmbientParticlesController.js";
import { MembraneController } from "./controllers/MembraneController.js";
import { SphereStreamController } from "./controllers/SphereStreamController.js";

export function createHeroScene({
  container,
  interactionTarget = window,
  reducedMotion = false,
  assetKey = defaultHeroAssetKey,
  environmentKey = defaultHeroEnvironmentKey,
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

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(heroConfig.palette.fog, heroConfig.fogDensity);

  const camera = new THREE.PerspectiveCamera(heroConfig.camera.desktop.fov, 1, 0.1, 50);
  const clock = new THREE.Clock();
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const exrLoader = new EXRLoader();

  const introRig = new THREE.Group();
  const stageRig = new THREE.Group();
  const chamberRig = new THREE.Group();
  const objectRig = new THREE.Group();
  const lights = new THREE.Group();

  introRig.name = "heroIntro";
  stageRig.name = "translationStage";
  chamberRig.name = "translationChamber";
  objectRig.name = "translatedObjectRig";
  lights.name = "lights";

  introRig.add(stageRig);
  stageRig.add(chamberRig);
  chamberRig.add(objectRig);
  scene.add(introRig);
  scene.add(lights);

  const materials = createHeroMaterials(heroConfig);
  const glowTexture = createGlowTexture();
  const membraneController = new MembraneController({
    config: {
      ...heroConfig.membrane,
      palette: heroConfig.palette,
    },
    materials,
    glowTexture,
  });
  const sphereStreamController = new SphereStreamController({
    config: heroConfig.sphereStream,
    sphereConfig: heroConfig.sphere,
    baseMaterial: materials.sphere,
  });
  const ambientParticlesController = new AmbientParticlesController({
    config: heroConfig.ambientParticles,
    palette: heroConfig.palette,
    reducedMotion,
  });

  stageRig.add(ambientParticlesController.group);
  chamberRig.add(sphereStreamController.group);
  chamberRig.add(membraneController.group);
  createLights(lights, heroConfig.lights);

  const pointer = { x: 0, y: 0 };
  const targetPointer = { x: 0, y: 0 };
  const introState = { progress: reducedMotion ? 1 : 0 };
  const cycleState = createCycleState();
  const assetInstances = new Map();
  const assetLoadPromises = new Map();
  const pathMarkers = {
    sphereStart: 0.025,
    sphereNear: 0.36,
    sphereImpact: 0.5,
    sphereHidden: 0.59,
    objectHidden: 0.635,
    objectReveal: 0.8,
    objectDisplay: 0.88,
    objectDrift: 0.948,
    objectExit: 0.996,
  };

  let environmentTarget = null;
  let environmentFallbackScene = null;
  let currentAssetKey = getHeroAssetSpec(assetKey).key;
  let currentAssetIndex = curatedHeroAssetKeys.indexOf(currentAssetKey);
  let responsiveProfile = getHeroResponsiveProfile(
    container.clientWidth || window.innerWidth,
    reducedMotion,
  );
  let resizeObserver;
  let animationFrame = 0;
  let introTimeline = null;
  let cycleTimeline = null;
  let initialized = false;
  let isDestroyed = false;
  let hasStartedPresentation = false;
  let hasResolvedReady = false;
  let resolveReadyPromise = () => {};
  let assetActivationToken = 0;
  let translationCurve = createTranslationCurve(responsiveProfile.chamber);
  const activeEnvironmentSpec = getHeroEnvironmentSpec(environmentKey);
  const readyPromise = new Promise((resolve) => {
    resolveReadyPromise = resolve;
  });

  setCurrentAssetKey(currentAssetKey);

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

  function resolveReady(value = currentAssetKey) {
    if (hasResolvedReady) {
      return;
    }

    hasResolvedReady = true;
    resolveReadyPromise(value);
  }

  function getActiveAssetInstance() {
    return assetInstances.get(currentAssetKey) ?? null;
  }

  function setCurrentAssetKey(nextAssetKey) {
    currentAssetKey = getHeroAssetSpec(nextAssetKey).key;
    currentAssetIndex = curatedHeroAssetKeys.indexOf(currentAssetKey);

    if (currentAssetIndex === -1) {
      currentAssetIndex = 0;
      currentAssetKey = curatedHeroAssetKeys[0];
    }

    return currentAssetKey;
  }

  function applyEnvironment(environmentTexture) {
    const previousTarget = environmentTarget;
    const previousFallbackScene = environmentFallbackScene;

    environmentTarget = environmentTexture?.target ?? null;
    environmentFallbackScene = environmentTexture?.fallbackScene ?? null;
    scene.environment = environmentTexture?.texture ?? null;

    if (previousTarget && previousTarget !== environmentTarget) {
      previousTarget.dispose();
    }

    if (previousFallbackScene && previousFallbackScene !== environmentFallbackScene) {
      previousFallbackScene.dispose();
    }
  }

  function syncActiveAssetVisibility() {
    for (const [key, instance] of assetInstances) {
      const isActive = key === currentAssetKey;
      instance.group.visible = isActive;

      if (!isActive && instance.material) {
        instance.material.opacity = 0;
      }
    }
  }

  async function ensureAssetInstance(key) {
    const resolvedKey = getHeroAssetSpec(key).key;

    if (assetInstances.has(resolvedKey)) {
      return assetInstances.get(resolvedKey);
    }

    if (!assetLoadPromises.has(resolvedKey)) {
      let loadPromise;

      loadPromise = loadHeroAssetInstance(resolvedKey, {
        createMaterial: () => createHeroAssetMaterial(heroConfig),
      })
        .then((instance) => {
          if (isDestroyed) {
            disposeHeroAssetInstance(instance);
            return null;
          }

          instance.group.visible = false;
          instance.group.userData.phase = curatedHeroAssetKeys.indexOf(resolvedKey) * 0.9;
          objectRig.add(instance.group);
          assetInstances.set(resolvedKey, instance);
          syncActiveAssetVisibility();
          return instance;
        })
        .catch((error) => {
          console.error(`REAL RUST hero could not load asset "${resolvedKey}".`, error);
          return null;
        })
        .finally(() => {
          if (assetLoadPromises.get(resolvedKey) === loadPromise) {
            assetLoadPromises.delete(resolvedKey);
          }
        });

      assetLoadPromises.set(resolvedKey, loadPromise);
    }

    return assetLoadPromises.get(resolvedKey);
  }

  async function activateAsset(nextAssetKey, { restartCycle = false } = {}) {
    const resolvedKey = getHeroAssetSpec(nextAssetKey).key;
    const activationToken = ++assetActivationToken;
    const instance = await ensureAssetInstance(resolvedKey);

    if (!instance || isDestroyed || activationToken !== assetActivationToken) {
      return currentAssetKey;
    }

    setCurrentAssetKey(resolvedKey);
    syncActiveAssetVisibility();

    if (restartCycle) {
      cycleTimeline?.pause(0);
      resetCycleState(cycleState);

      if (hasStartedPresentation && (reducedMotion || introState.progress >= 1)) {
        cycleTimeline?.play(0);
      }
    }

    return currentAssetKey;
  }

  function applyCameraPreset() {
    const preset = responsiveProfile.camera;

    camera.fov = preset.fov;
    camera.aspect =
      (container.clientWidth || window.innerWidth) /
      (container.clientHeight || window.innerHeight);
    camera.position.set(preset.position.x, preset.position.y, preset.position.z);
    camera.lookAt(
      heroConfig.camera.lookAt.x,
      heroConfig.camera.lookAt.y,
      heroConfig.camera.lookAt.z,
    );
    camera.updateProjectionMatrix();
  }

  function applyLayout() {
    membraneController.setLayout(responsiveProfile.chamber.membrane);
    sphereStreamController.setLayout(responsiveProfile.chamber);
    ambientParticlesController.setLayout(responsiveProfile);
    translationCurve = createTranslationCurve(responsiveProfile.chamber);
    resetCycleState(cycleState);
  }

  function rebuildCycleTimeline() {
    const shouldPlay = cycleTimeline?.isActive?.() ?? false;
    cycleTimeline?.kill();

    const cycleScale = responsiveProfile.cycleScale;
    const timings = {
      leadDelay: heroConfig.cycle.leadDelay * cycleScale,
      approachDuration: heroConfig.cycle.approachDuration * cycleScale,
      accelerateDuration: heroConfig.cycle.accelerateDuration * cycleScale,
      translateDuration: heroConfig.cycle.translateDuration * cycleScale,
      emergeDuration: heroConfig.cycle.emergeDuration * cycleScale,
      displayDuration: heroConfig.cycle.displayDuration * cycleScale,
      settleDuration: heroConfig.cycle.settleDuration * cycleScale,
      fadeDuration: heroConfig.cycle.fadeDuration * cycleScale,
    };
    const cycleMotion = reducedMotion
      ? {
          approachActivation: 0.12,
          approachPhase: 0.08,
          impactActivation: 0.4,
          impactPhase: 0.24,
          translateActivation: 0.54,
          translatePhase: 0.42,
          emergeActivation: 0.34,
          emergePhase: 0.58,
          settleActivation: 0.08,
          settlePhase: 0.28,
          endActivation: 0.03,
          endPhase: 0.06,
          hiddenSphereOpacity: 0.22,
          hiddenObjectOpacity: 0.02,
          hiddenObjectScale: 0.96,
          impactScale: 1.02,
          exitScale: 1.02,
        }
      : {
          approachActivation: 0.22,
          approachPhase: 0.12,
          impactActivation: 0.82,
          impactPhase: 0.48,
          translateActivation: 1.08,
          translatePhase: 0.7,
          emergeActivation: 0.76,
          emergePhase: 1,
          settleActivation: 0.14,
          settlePhase: 0.84,
          endActivation: 0.04,
          endPhase: 0.08,
          hiddenSphereOpacity: 0.05,
          hiddenObjectOpacity: 0.03,
          hiddenObjectScale: 0.92,
          impactScale: 1.05,
          exitScale: 1.04,
        };
    const sphereApproachEase = reducedMotion ? "none" : "sine.in";
    const sphereImpactEase = "none";
    const sphereTranslateEase = reducedMotion ? "none" : "sine.out";

    cycleTimeline = gsap.timeline({
      paused: true,
      repeat: -1,
      repeatDelay: heroConfig.cycle.repeatDelay * cycleScale,
      onRepeat: () => {
        if (isDestroyed) {
          return;
        }

        sphereStreamController.advanceLeadLane();

        const nextAssetKey =
          curatedHeroAssetKeys[(currentAssetIndex + 1) % curatedHeroAssetKeys.length];

        if (nextAssetKey) {
          void activateAsset(nextAssetKey);
        }
      },
    });

    cycleTimeline
      .set(cycleState, getCycleResetState(), 0)
      .to(
        cycleState,
        {
          sphereProgress: pathMarkers.sphereNear,
          membraneActivation: cycleMotion.approachActivation,
          membranePhase: cycleMotion.approachPhase,
          duration: timings.approachDuration,
          ease: sphereApproachEase,
        },
        timings.leadDelay,
      )
      .to(
        cycleState,
        {
          sphereProgress: pathMarkers.sphereImpact,
          sphereScale: cycleMotion.impactScale,
          membraneActivation: cycleMotion.impactActivation,
          membranePhase: cycleMotion.impactPhase,
          duration: timings.accelerateDuration,
          ease: sphereImpactEase,
        },
        timings.leadDelay + timings.approachDuration,
      )
      .to(
        cycleState,
        {
          sphereProgress: pathMarkers.sphereHidden,
          sphereScale: 0.86,
          sphereOpacity: cycleMotion.hiddenSphereOpacity,
          objectProgress: pathMarkers.objectHidden,
          objectOpacity: cycleMotion.hiddenObjectOpacity,
          objectScale: cycleMotion.hiddenObjectScale,
          membraneActivation: cycleMotion.translateActivation,
          membranePhase: cycleMotion.translatePhase,
          duration: timings.translateDuration,
          ease: sphereTranslateEase,
        },
        timings.leadDelay + timings.approachDuration + timings.accelerateDuration,
      )
      .to(
        cycleState,
        {
          sphereOpacity: 0,
          objectOpacity: 1,
          objectScale: 1,
          objectProgress: pathMarkers.objectReveal,
          membraneActivation: cycleMotion.emergeActivation,
          membranePhase: cycleMotion.emergePhase,
          duration: timings.emergeDuration,
          ease: "power3.out",
        },
        timings.leadDelay + timings.approachDuration + timings.accelerateDuration - 0.04,
      )
      .to(
        cycleState,
        {
          objectProgress: pathMarkers.objectDisplay,
          membraneActivation: cycleMotion.settleActivation * 0.9,
          membranePhase: cycleMotion.settlePhase * 0.92,
          duration: timings.displayDuration,
          ease: "sine.out",
        },
        ">",
      )
      .to(
        cycleState,
        {
          objectProgress: pathMarkers.objectDrift,
          membraneActivation: cycleMotion.settleActivation,
          membranePhase: cycleMotion.settlePhase,
          duration: timings.settleDuration,
          ease: "sine.inOut",
        },
        ">",
      )
      .to(
        cycleState,
        {
          objectProgress: pathMarkers.objectExit,
          objectOpacity: 0,
          objectScale: cycleMotion.exitScale,
          membraneActivation: cycleMotion.endActivation,
          membranePhase: cycleMotion.endPhase,
          duration: timings.fadeDuration,
          ease: "power2.in",
        },
        ">",
      );

    if (shouldPlay || (hasStartedPresentation && (reducedMotion || introState.progress >= 1))) {
      cycleTimeline.play(0);
    }
  }

  function resize() {
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    responsiveProfile = getHeroResponsiveProfile(width, reducedMotion);
    renderer.setPixelRatio(getRendererPixelRatio(window.devicePixelRatio, responsiveProfile));
    renderer.setSize(width, height, false);

    applyCameraPreset();
    applyLayout();

    if (initialized) {
      rebuildCycleTimeline();
    }
  }

  function applyIntroStartingPose() {
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
    stageRig.scale.setScalar(heroConfig.intro.stageScale);

    if (reducedMotion) {
      introRig.position.set(0, 0, 0);
      introRig.rotation.set(0, 0, 0);
      stageRig.scale.setScalar(1);
      introState.progress = 1;
      return;
    }

    introState.progress = 0;
  }

  function startIntro() {
    applyIntroStartingPose();
    hasStartedPresentation = true;

    if (reducedMotion) {
      cycleTimeline?.play(0);
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
      .to(stageRig.scale, { x: 1, y: 1, z: 1, duration: 1.05 }, 0.08);

    introTimeline.eventCallback("onComplete", () => {
      cycleTimeline?.play(0);
    });
  }

  function updateSceneFrame(elapsed) {
    const motionScale = responsiveProfile.motionScale;
    const interactionStrength = responsiveProfile.interactionStrength;
    const smoothFactor = 0.04 + interactionStrength * 0.016;

    pointer.x += (targetPointer.x - pointer.x) * smoothFactor;
    pointer.y += (targetPointer.y - pointer.y) * smoothFactor;

    stageRig.position.y =
      Math.sin(elapsed * heroConfig.motion.stageFloatSpeed) *
      heroConfig.motion.stageFloatAmplitude *
      introState.progress *
      motionScale;
    stageRig.rotation.y =
      pointer.x * heroConfig.motion.pointerRotationY * interactionStrength * motionScale +
      Math.sin(elapsed * 0.16) * heroConfig.motion.stageYawDrift * introState.progress;
    stageRig.rotation.x =
      -pointer.y * heroConfig.motion.pointerRotationX * interactionStrength * motionScale;
    chamberRig.position.x =
      pointer.x * heroConfig.motion.pointerShiftX * interactionStrength * motionScale;
    chamberRig.position.y =
      pointer.y * heroConfig.motion.pointerShiftY * interactionStrength * motionScale;

    camera.position.x =
      responsiveProfile.camera.position.x +
      pointer.x * heroConfig.motion.cameraShiftX * interactionStrength * motionScale;
    camera.position.y =
      responsiveProfile.camera.position.y -
      pointer.y * heroConfig.motion.cameraShiftY * interactionStrength * motionScale;
    camera.lookAt(
      heroConfig.camera.lookAt.x,
      heroConfig.camera.lookAt.y,
      heroConfig.camera.lookAt.z,
    );

    sphereStreamController.update({
      elapsed,
      leadPathPhase: getLeadPathPhase(cycleState.sphereProgress, pathMarkers),
      leadOpacity: cycleState.sphereOpacity,
      leadScale: cycleState.sphereScale,
      motionScale,
    });
    ambientParticlesController.update({
      elapsed,
      pointer,
      introProgress: introState.progress,
      motionScale,
    });
    applyActiveAssetState(getActiveAssetInstance(), cycleState, translationCurve, elapsed);
    membraneController.update({
      elapsed,
      introProgress: introState.progress,
      pointer,
      interactionStrength,
      motionScale,
      activation: cycleState.membraneActivation,
      phase: cycleState.membranePhase,
    });
  }

  function renderFrame(elapsed = clock.getElapsedTime()) {
    updateSceneFrame(elapsed);
    renderer.render(scene, camera);
  }

  function revealScene() {
    if (isDestroyed) {
      return;
    }

    container.dataset.ready = "true";
    resolveReady(currentAssetKey);
  }

  function render() {
    if (isDestroyed) {
      return;
    }

    renderFrame();
    animationFrame = window.requestAnimationFrame(render);
  }

  async function preparePrimaryEnvironment() {
    try {
      return await loadEnvironmentTexture({
        pmremGenerator,
        exrLoader,
        environmentSpec: activeEnvironmentSpec,
      });
    } catch (error) {
      console.warn(
        `REAL RUST hero could not load ${activeEnvironmentSpec.label}. Using the fallback environment.`,
        error,
      );

      if (isDestroyed) {
        return null;
      }

      return createFallbackEnvironmentTexture({ pmremGenerator });
    }
  }

  async function precompileCriticalView() {
    try {
      if (typeof renderer.compileAsync === "function") {
        await renderer.compileAsync(scene, camera);
        return;
      }

      renderer.compile?.(scene, camera);
    } catch (error) {
      console.warn("REAL RUST hero could not precompile the first-view shaders.", error);
    }
  }

  async function prepareFirstView() {
    const [, environmentTexture] = await Promise.all([
      ensureAssetInstance(currentAssetKey),
      preparePrimaryEnvironment(),
    ]);

    if (!environmentTexture) {
      if (isDestroyed) {
        return;
      }

      throw new Error("REAL RUST hero could not prepare a scene environment.");
    }

    if (isDestroyed) {
      environmentTexture?.target?.dispose?.();
      environmentTexture?.fallbackScene?.dispose?.();
      return;
    }

    applyEnvironment(environmentTexture);
    applyIntroStartingPose();
    syncActiveAssetVisibility();
    updateSceneFrame(0);
    await precompileCriticalView();

    if (isDestroyed) {
      return;
    }

    renderFrame(0);
  }

  async function initialize() {
    try {
      resize();
      rebuildCycleTimeline();
      initialized = true;
      await prepareFirstView();

      if (isDestroyed) {
        return;
      }

      clock.start();
      startIntro();
      revealScene();
      render();
    } catch (error) {
      resolveReady(null);
      console.error("REAL RUST hero failed to initialize.", error);
    }
  }

  function setAsset(nextAssetKey = defaultHeroAssetKey) {
    if (!initialized) {
      setCurrentAssetKey(nextAssetKey);
      return Promise.resolve(currentAssetKey);
    }

    return activateAsset(nextAssetKey, { restartCycle: true });
  }

  function preloadAssets(keys = []) {
    if (isDestroyed) {
      return Promise.resolve([]);
    }

    return readyPromise.then((readyKey) => {
      if (!readyKey || isDestroyed) {
        return [];
      }

      return preloadHeroAssets(keys);
    });
  }

  initialize();

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
    whenReady() {
      return readyPromise;
    },
    getAssetKey() {
      return currentAssetKey;
    },
    destroy() {
      isDestroyed = true;
      resolveReady(null);
      window.cancelAnimationFrame(animationFrame);
      introTimeline?.kill();
      cycleTimeline?.kill();

      if (interactionTarget instanceof EventTarget) {
        interactionTarget.removeEventListener("pointermove", handlePointerMove);
        interactionTarget.removeEventListener("pointerleave", handlePointerLeave);
      }

      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener("resize", resize);
      }

      for (const instance of assetInstances.values()) {
        disposeHeroAssetInstance(instance);
      }

      membraneController.destroy();
      sphereStreamController.destroy();
      ambientParticlesController.destroy();
      glowTexture.dispose();
      environmentTarget?.dispose?.();
      environmentFallbackScene?.dispose?.();
      pmremGenerator.dispose();
      clearHeroAssetCache();

      materials.sphere.dispose();
      materials.rustObject.dispose();
      materials.membrane.dispose();
      materials.membraneEdge.dispose();
      materials.sweepBand.dispose();

      scene.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose();
        }
      });

      renderer.dispose();
      container.dataset.ready = "false";
      container.replaceChildren();
    },
  };
}

function createFallbackEnvironmentTexture({ pmremGenerator }) {
  const fallbackScene = new RoomEnvironment();
  const target = pmremGenerator.fromScene(fallbackScene, 0.04);

  return {
    texture: target.texture,
    target,
    fallbackScene,
  };
}

async function loadEnvironmentTexture({ pmremGenerator, exrLoader, environmentSpec }) {
  pmremGenerator.compileEquirectangularShader();

  const exrTexture = await exrLoader.loadAsync(environmentSpec.sourceUrl);
  exrTexture.mapping = THREE.EquirectangularReflectionMapping;

  const target = pmremGenerator.fromEquirectangular(exrTexture);
  exrTexture.dispose();

  return {
    texture: target.texture,
    target,
    fallbackScene: null,
  };
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

  const keyLight = new THREE.DirectionalLight(
    lightsConfig.key.color,
    lightsConfig.key.intensity,
  );
  keyLight.position.set(
    lightsConfig.key.position.x,
    lightsConfig.key.position.y,
    lightsConfig.key.position.z,
  );
  target.add(keyLight);

  const rimLight = new THREE.DirectionalLight(
    lightsConfig.rim.color,
    lightsConfig.rim.intensity,
  );
  rimLight.position.set(
    lightsConfig.rim.position.x,
    lightsConfig.rim.position.y,
    lightsConfig.rim.position.z,
  );
  target.add(rimLight);

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
  gradient.addColorStop(0.56, "rgba(255,255,255,0.08)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function applyActiveAssetState(instance, cycleState, translationCurve, elapsed) {
  if (!instance) {
    return;
  }

  const reveal = smoothstep(cycleState.objectOpacity);
  const progress = THREE.MathUtils.clamp(cycleState.objectProgress, 0, 1);
  const point = translationCurve.getPointAt(progress);
  const tangent = translationCurve.getTangentAt(progress);
  const wobblePhase = instance.group.userData.phase ?? 0;
  const idleLift =
    Math.sin(elapsed * instance.spec.wobbleSpeed + wobblePhase) *
    instance.spec.wobbleAmount *
    reveal;
  const pathYaw = THREE.MathUtils.clamp(Math.atan2(tangent.x, tangent.z) * 0.16, -0.14, 0.14);
  const pathPitch = THREE.MathUtils.clamp(
    -Math.atan2(tangent.y, Math.hypot(tangent.x, tangent.z)) * 0.32,
    -0.1,
    0.1,
  );

  instance.group.visible = cycleState.objectOpacity > 0.002;
  instance.group.position.set(
    point.x + (instance.spec.position?.x ?? 0),
    point.y + (instance.spec.position?.y ?? 0) + idleLift,
    point.z + (instance.spec.position?.z ?? 0),
  );
  instance.group.rotation.set(
    (instance.spec.displayRotation?.x ?? 0) + pathPitch - (1 - reveal) * 0.18,
    (instance.spec.displayRotation?.y ?? 0) + pathYaw - (1 - reveal) * 0.24,
    (instance.spec.displayRotation?.z ?? 0) +
      Math.sin(elapsed * 0.26 + wobblePhase) * 0.03 * reveal,
  );
  instance.group.scale.setScalar(cycleState.objectScale);

  if (instance.material) {
    instance.material.opacity = cycleState.objectOpacity;
    instance.material.transparent = cycleState.objectOpacity < 0.999;
  }
}

function createCycleState() {
  return {
    sphereProgress: 0.025,
    sphereScale: 1,
    sphereOpacity: 1,
    objectProgress: 0.61,
    objectScale: 0.82,
    objectOpacity: 0,
    membraneActivation: 0.04,
    membranePhase: 0,
  };
}

function getCycleResetState() {
  return {
    sphereProgress: 0.025,
    sphereScale: 1,
    sphereOpacity: 1,
    objectProgress: 0.61,
    objectScale: 0.82,
    objectOpacity: 0,
    membraneActivation: 0.04,
    membranePhase: 0,
  };
}

function resetCycleState(cycleState) {
  Object.assign(cycleState, getCycleResetState());
}

function getLeadPathPhase(progress, pathMarkers) {
  return THREE.MathUtils.clamp(
    THREE.MathUtils.inverseLerp(
      pathMarkers.sphereStart,
      pathMarkers.sphereHidden,
      progress,
    ),
    0,
    1,
  );
}

function smoothstep(value) {
  const clamped = THREE.MathUtils.clamp(value, 0, 1);
  return clamped * clamped * (3 - 2 * clamped);
}

function getRendererPixelRatio(devicePixelRatio, responsiveProfile) {
  return Math.min(devicePixelRatio || 1, responsiveProfile.pixelRatioCap);
}

function createTranslationCurve(chamberProfile) {
  const exitPoint = vectorFromCoords(
    chamberProfile.object.exitX,
    chamberProfile.object.exitY ?? chamberProfile.object.holdY - 0.16,
    chamberProfile.object.exitZ ?? chamberProfile.object.holdZ - 0.34,
  );
  const curve = new THREE.CatmullRomCurve3([
    vectorFromCoords(
      chamberProfile.sphere.startX,
      chamberProfile.sphere.startY,
      chamberProfile.sphere.startZ,
    ),
    vectorFromCoords(
      chamberProfile.sphere.nearX,
      chamberProfile.sphere.nearY,
      chamberProfile.sphere.nearZ,
    ),
    vectorFromCoords(
      chamberProfile.sphere.crossX,
      chamberProfile.sphere.crossY,
      chamberProfile.sphere.crossZ,
    ),
    vectorFromCoords(
      chamberProfile.sphere.hiddenX,
      chamberProfile.sphere.hiddenY,
      chamberProfile.sphere.hiddenZ,
    ),
    vectorFromCoords(
      chamberProfile.object.startX,
      chamberProfile.object.startY,
      chamberProfile.object.startZ,
    ),
    vectorFromCoords(
      chamberProfile.object.restX,
      chamberProfile.object.restY,
      chamberProfile.object.restZ,
    ),
    vectorFromCoords(
      chamberProfile.object.holdX,
      chamberProfile.object.holdY,
      chamberProfile.object.holdZ,
    ),
    exitPoint,
  ]);
  curve.curveType = "centripetal";
  curve.closed = false;
  return curve;
}

function vectorFromCoords(x, y, z) {
  return new THREE.Vector3(x, y, z);
}
