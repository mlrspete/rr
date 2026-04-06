import * as THREE from "three/webgpu";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

import { getHeroResponsiveProfile, heroConfig } from "../config.js";
import {
  defaultHeroAssetKey,
  getHeroAssetSpec,
} from "../heroAssetRegistry.js";
import { createHeroWebGPUHeadline3D } from "./createHeroWebGPUHeadline3D.js";
import { createHeroWebGPUPostProcessing } from "./createHeroWebGPUPostProcessing.js";
import { resolveHeroWebGPUSceneConfig } from "./heroWebGPUSceneConfig.js";
import { createHeroWebGPUVolumetricLighting } from "./createHeroWebGPUVolumetricLighting.js";

const DEFAULT_LOOK_AT = new THREE.Vector3(0.1, -0.16, 0.02);
const MEMBRANE_POSITION = new THREE.Vector3(0.08, -0.04, 0.02);
const HERO_SPHERE_START = new THREE.Vector3(-2.08, 0.16, 0.24);
const HERO_SPHERE_END = new THREE.Vector3(0.04, -0.02, -0.08);
const OBJECT_START = new THREE.Vector3(0.16, -0.08, -0.18);
const OBJECT_END = new THREE.Vector3(1.08, -0.08, 0.05);

export async function createHeroSceneWebGPU({
  container,
  interactionTarget = window,
  reducedMotion = false,
  assetKey = defaultHeroAssetKey,
  runtimeHints = {},
} = {}) {
  if (!container) {
    return null;
  }

  container.dataset.ready = "false";

  let responsiveProfile = getHeroResponsiveProfile(
    container.clientWidth || window.innerWidth,
    reducedMotion,
  );
  let sceneQualityConfig = resolveHeroWebGPUSceneConfig(
    responsiveProfile.viewportKey,
    reducedMotion,
    runtimeHints,
  );
  let renderer = null;
  let resizeObserver = null;
  let animationFrame = 0;
  let isDestroyed = false;
  let hasResolvedReady = false;
  let resolveReadyPromise = () => {};
  let currentAssetKey = getHeroAssetSpec(assetKey).key;

  const readyPromise = new Promise((resolve) => {
    resolveReadyPromise = resolve;
  });

  try {
    renderer = new THREE.WebGPURenderer({
      antialias: sceneQualityConfig.renderer.antialias,
      alpha: true,
      powerPreference: "high-performance",
    });
    await renderer.init();
  } catch {
    renderer?.dispose?.();
    return null;
  }

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = heroConfig.renderer.exposure;
  renderer.setClearColor(heroConfig.palette.background, 0);
  renderer.domElement.className = "hero-webgl";
  renderer.domElement.dataset.renderer = "webgpu";
  container.replaceChildren(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(heroConfig.palette.fog, heroConfig.fogDensity * 0.86);

  const camera = new THREE.PerspectiveCamera(
    Math.max(32, responsiveProfile.camera.fov - 1),
    1,
    0.1,
    50,
  );
  const clock = new THREE.Clock();
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const environmentScene = new RoomEnvironment();
  const environmentTarget = pmremGenerator.fromScene(environmentScene, 0.035);
  scene.environment = environmentTarget.texture;
  const volumetricLighting = sceneQualityConfig.features.volumetricLighting
    ? createHeroWebGPUVolumetricLighting(camera, {
        viewportKey: responsiveProfile.viewportKey,
        reducedMotion,
      })
    : null;
  const headline3D = sceneQualityConfig.features.headline3D
    ? createHeroWebGPUHeadline3D({
        viewportKey: responsiveProfile.viewportKey,
        reducedMotion,
      })
    : null;

  const introRig = new THREE.Group();
  const chamberRig = new THREE.Group();
  const rearRig = new THREE.Group();
  const objectRig = new THREE.Group();
  const lights = new THREE.Group();

  introRig.name = "webgpuHeroIntro";
  chamberRig.name = "webgpuHeroChamber";
  rearRig.name = "webgpuHeroRear";
  objectRig.name = "webgpuHeroObject";
  lights.name = "webgpuHeroLights";

  introRig.add(chamberRig);
  chamberRig.add(rearRig);
  chamberRig.add(objectRig);
  scene.add(introRig);
  scene.add(lights);

  const membraneBody = new THREE.Mesh(
    new RoundedBoxGeometry(1.84, 2.86, 0.18, 8, 0.22),
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#edf3fb"),
      transmission: 0.9,
      thickness: 1.8,
      ior: 1.24,
      roughness: 0.18,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      attenuationColor: new THREE.Color("#afc0d4"),
      attenuationDistance: 1.55,
      envMapIntensity: 1.34,
      transparent: true,
      opacity: 0.96,
      side: THREE.DoubleSide,
    }),
  );
  membraneBody.name = "webgpuMembraneBody";
  membraneBody.position.copy(MEMBRANE_POSITION);

  const membraneRim = new THREE.Mesh(
    new RoundedBoxGeometry(1.9, 2.92, 0.08, 6, 0.24),
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#f7fbff"),
      metalness: 0,
      roughness: 0.12,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      envMapIntensity: 1.58,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
    }),
  );
  membraneRim.name = "webgpuMembraneRim";
  membraneRim.position.copy(MEMBRANE_POSITION);
  membraneRim.scale.setScalar(1.012);

  const rearPanel = new THREE.Mesh(
    new THREE.CircleGeometry(1.96, 64),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color("#0a1017"),
      metalness: 0.42,
      roughness: 0.62,
      envMapIntensity: 0.3,
      transparent: true,
      opacity: 0.88,
    }),
  );
  rearPanel.name = "webgpuRearPanel";
  rearPanel.position.set(0.18, -0.02, -1.56);
  rearPanel.scale.set(1.3, 1.08, 1);

  const rearHalo = new THREE.Mesh(
    new THREE.TorusGeometry(1.16, 0.024, 18, 96),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(heroConfig.palette.coolEdge),
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  rearHalo.name = "webgpuRearHalo";
  rearHalo.position.set(0.12, -0.02, -0.92);
  rearHalo.rotation.z = 0.06;

  const membraneGlow = new THREE.Mesh(
    new THREE.CircleGeometry(0.84, 48),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(heroConfig.palette.coolEdge),
      transparent: true,
      opacity: 0.05,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  membraneGlow.name = "webgpuMembraneGlow";
  membraneGlow.position.set(0.1, -0.04, -0.34);
  membraneGlow.scale.set(1.28, 1.86, 1);

  const sphereMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(heroConfig.palette.chrome).lerp(
      new THREE.Color(heroConfig.palette.silver),
      0.16,
    ),
    metalness: 1,
    roughness: 0.028,
    clearcoat: 0.14,
    clearcoatRoughness: 0.02,
    envMapIntensity: 2.85,
  });
  const heroSphere = new THREE.Mesh(
    createHeroSphereGeometry(sceneQualityConfig.sphere),
    sphereMaterial,
  );
  heroSphere.name = "webgpuHeroSphere";
  let currentSphereGeometryKey = getSphereGeometryKey(sceneQualityConfig.sphere);

  const placeholderMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#738191"),
    emissive: new THREE.Color("#0f151d"),
    emissiveIntensity: 0.02,
    metalness: 0.26,
    roughness: 0.28,
    clearcoat: 0.54,
    clearcoatRoughness: 0.16,
    envMapIntensity: 1.5,
    transparent: true,
    opacity: 1,
  });
  const placeholderGroups = createPlaceholderAssetGroups(placeholderMaterial);
  const activePlaceholder = new THREE.Group();
  activePlaceholder.name = "webgpuActivePlaceholder";

  for (const group of placeholderGroups.values()) {
    group.visible = false;
    activePlaceholder.add(group);
  }

  objectRig.add(activePlaceholder);
  rearRig.add(rearPanel);
  rearRig.add(rearHalo);
  if (headline3D) {
    rearRig.add(headline3D.group);
  }
  chamberRig.add(membraneGlow);
  chamberRig.add(membraneBody);
  chamberRig.add(membraneRim);
  chamberRig.add(heroSphere);

  const ambientLight = new THREE.AmbientLight("#edf3fb", 0.22);
  const hemisphereLight = new THREE.HemisphereLight("#94abda", "#150f0c", 0.24);
  const keyLight = new THREE.DirectionalLight("#d9e8ff", 2.6);
  keyLight.position.set(-4.2, 3.1, 5.4);
  const fillLight = new THREE.DirectionalLight("#c79e7d", 0.48);
  fillLight.position.set(3.6, 1.2, 3.2);
  const rimLight = new THREE.DirectionalLight("#b6ceff", 1.18);
  rimLight.position.set(2.8, 2.4, -2.2);
  const backPointLight = new THREE.PointLight("#8aaeff", 1.4, 7.2, 2);
  backPointLight.position.set(-1.4, 0.8, -1.6);

  lights.add(ambientLight);
  lights.add(hemisphereLight);
  lights.add(keyLight);
  lights.add(fillLight);
  lights.add(rimLight);
  if (volumetricLighting) {
    lights.add(volumetricLighting.mainLightRig);
  }
  lights.add(backPointLight);

  const { postProcessing, chromaticAberration } = createHeroWebGPUPostProcessing(
    renderer,
    scene,
    camera,
    { reducedMotion, volumetricLighting },
  );
  const pointer = { x: 0, y: 0 };
  const targetPointer = { x: 0, y: 0 };

  function resolveReady(value = currentAssetKey) {
    if (hasResolvedReady) {
      return;
    }

    hasResolvedReady = true;
    resolveReadyPromise(value);
  }

  function syncActivePlaceholder() {
    for (const [key, group] of placeholderGroups) {
      group.visible = key === currentAssetKey;
    }
  }

  function setCurrentAssetKey(nextAssetKey) {
    currentAssetKey = getHeroAssetSpec(nextAssetKey).key;
    syncActivePlaceholder();
    return currentAssetKey;
  }

  function applyCameraPreset() {
    camera.fov = Math.max(32, responsiveProfile.camera.fov - 1);
    camera.aspect =
      (container.clientWidth || window.innerWidth) /
      (container.clientHeight || window.innerHeight);
    camera.position.set(
      responsiveProfile.camera.position.x,
      responsiveProfile.camera.position.y,
      responsiveProfile.camera.position.z,
    );
    camera.lookAt(DEFAULT_LOOK_AT);
    camera.updateProjectionMatrix();
  }

  function applyLayout() {
    syncSceneQualityProfile();
    renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio || 1,
        responsiveProfile.pixelRatioCap * sceneQualityConfig.renderer.pixelRatioScale,
      ),
    );
    renderer.setSize(
      container.clientWidth || window.innerWidth,
      container.clientHeight || window.innerHeight,
      false,
    );
    applyCameraPreset();
  }

  function updatePointer(nextX, nextY) {
    targetPointer.x = THREE.MathUtils.clamp(nextX, -1, 1);
    targetPointer.y = THREE.MathUtils.clamp(nextY, -1, 1);
  }

  function handlePointerMove(event) {
    const bounds =
      interactionTarget instanceof HTMLElement
        ? interactionTarget.getBoundingClientRect()
        : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
    const nextX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const nextY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;

    updatePointer(nextX, nextY);
  }

  function handlePointerLeave() {
    updatePointer(0, 0);
  }

  function resize() {
    responsiveProfile = getHeroResponsiveProfile(
      container.clientWidth || window.innerWidth,
      reducedMotion,
    );
    sceneQualityConfig = resolveHeroWebGPUSceneConfig(
      responsiveProfile.viewportKey,
      reducedMotion,
      runtimeHints,
    );
    applyLayout();
  }

  function syncSceneQualityProfile() {
    const nextGeometryKey = getSphereGeometryKey(sceneQualityConfig.sphere);

    if (nextGeometryKey !== currentSphereGeometryKey) {
      heroSphere.geometry.dispose();
      heroSphere.geometry = createHeroSphereGeometry(sceneQualityConfig.sphere);
      currentSphereGeometryKey = nextGeometryKey;
    }
  }

  function updateScene(elapsed) {
    const interactionStrength = responsiveProfile.interactionStrength;
    const motionScale = reducedMotion ? 0.18 : responsiveProfile.motionScale;
    const smoothing = 0.04 + interactionStrength * 0.018;
    const cycleDuration = reducedMotion ? 14 : 8.2;
    const cycle = reducedMotion ? 0.58 : (elapsed / cycleDuration) % 1;
    const sphereProgress = smootherstep(THREE.MathUtils.clamp(cycle / 0.54, 0, 1));
    const spherePresence =
      1 -
      smoothstep(THREE.MathUtils.clamp((cycle - 0.48) / 0.08, 0, 1));
    const objectReveal = reducedMotion
      ? 0.84
      : smoothstep(THREE.MathUtils.clamp((cycle - 0.4) / 0.18, 0, 1)) *
        (1 - smoothstep(THREE.MathUtils.clamp((cycle - 0.92) / 0.06, 0, 1)));
    const membraneActivation = smoothstep(THREE.MathUtils.clamp((cycle - 0.28) / 0.22, 0, 1));
    const impactWindow =
      smoothstep(THREE.MathUtils.clamp((sphereProgress - 0.68) / 0.16, 0, 1)) *
      (1 - smoothstep(THREE.MathUtils.clamp((sphereProgress - 0.98) / 0.1, 0, 1))) *
      spherePresence;
    const membraneStress = THREE.MathUtils.clamp(
      membraneActivation * 0.18 + impactWindow * 0.96,
      0,
      1,
    );
    const emergenceAccent = THREE.MathUtils.clamp(
      objectReveal * (0.12 + (1 - spherePresence) * 0.34),
      0,
      1,
    );

    pointer.x += (targetPointer.x - pointer.x) * smoothing;
    pointer.y += (targetPointer.y - pointer.y) * smoothing;

    introRig.position.y =
      Math.sin(elapsed * 0.18) * 0.045 * motionScale;
    introRig.rotation.y =
      pointer.x * 0.08 * interactionStrength +
      Math.sin(elapsed * 0.12) * 0.024 * motionScale;
    introRig.rotation.x = -pointer.y * 0.032 * interactionStrength;
    chamberRig.position.x = pointer.x * 0.12 * interactionStrength;
    chamberRig.position.y = pointer.y * 0.06 * interactionStrength;

    camera.position.x =
      responsiveProfile.camera.position.x +
      pointer.x * 0.16 * interactionStrength;
    camera.position.y =
      responsiveProfile.camera.position.y -
      pointer.y * 0.12 * interactionStrength;
    camera.lookAt(DEFAULT_LOOK_AT);

    heroSphere.position.lerpVectors(HERO_SPHERE_START, HERO_SPHERE_END, sphereProgress);
    heroSphere.position.x += Math.sin(elapsed * 0.44 + 0.4) * 0.06 * motionScale;
    heroSphere.position.y +=
      Math.sin(elapsed * 0.34 + 0.8) * 0.024 * motionScale +
      Math.sin(sphereProgress * Math.PI) * 0.028;
    heroSphere.position.z += Math.cos(elapsed * 0.3 + 1.2) * 0.018 * motionScale;
    heroSphere.scale.setScalar(
      1 + Math.sin(elapsed * 0.62 + sphereProgress * Math.PI) * 0.025 * motionScale,
    );
    heroSphere.visible = spherePresence > 0.01;
    sphereMaterial.opacity = spherePresence;
    sphereMaterial.transparent = spherePresence < 0.999;

    objectRig.position.lerpVectors(OBJECT_START, OBJECT_END, objectReveal);
    objectRig.position.y += Math.sin(elapsed * 0.42 + 0.7) * 0.026 * objectReveal;
    objectRig.rotation.x = 0.08 + Math.sin(elapsed * 0.24) * 0.06 * objectReveal;
    objectRig.rotation.y = -0.72 + Math.sin(elapsed * 0.18 + 0.6) * 0.12 * objectReveal;
    objectRig.rotation.z = Math.sin(elapsed * 0.32 + 0.3) * 0.05 * objectReveal;
    objectRig.scale.setScalar(0.82 + objectReveal * 0.22);
    activePlaceholder.visible = objectReveal > 0.01;
    placeholderMaterial.opacity =
      (0.08 + objectReveal * 0.92) * sceneQualityConfig.scene.placeholderOpacityScale;

    membraneBody.material.roughness = 0.18 - membraneActivation * 0.04;
    membraneBody.material.envMapIntensity = 1.34 + membraneActivation * 0.18;
    membraneBody.material.thickness = 1.8 + membraneActivation * 0.18;
    membraneRim.material.opacity = 0.12 + membraneActivation * 0.08;
    membraneGlow.material.opacity =
      (0.04 + membraneActivation * 0.06 + objectReveal * 0.04) *
      sceneQualityConfig.scene.membraneGlowOpacityScale;
    membraneGlow.scale.set(
      1.28 + membraneActivation * 0.1,
      1.86 + membraneActivation * 0.14,
      1,
    );
    rearHalo.material.opacity =
      (0.08 + objectReveal * 0.08) * sceneQualityConfig.scene.rearHaloOpacityScale;
    rearHalo.rotation.z = 0.06 + Math.sin(elapsed * 0.1) * 0.08;
    rearHalo.scale.setScalar(1 + Math.sin(elapsed * 0.12 + 0.5) * 0.028 * motionScale);

    backPointLight.intensity =
      (1.1 + membraneActivation * 0.6) * sceneQualityConfig.scene.backPointIntensityScale;
    volumetricLighting?.update({
      elapsed,
      pointer,
      viewportKey: responsiveProfile.viewportKey,
      membraneEnergy: membraneStress,
      objectEnergy: emergenceAccent,
    });
    headline3D?.update({
      elapsed,
      pointer,
      viewportKey: responsiveProfile.viewportKey,
      membraneEnergy: membraneStress,
      objectEnergy: emergenceAccent,
    });

    chromaticAberration.update({
      elapsed,
      pointer,
      viewportKey: responsiveProfile.viewportKey,
      membraneEnergy: membraneStress,
      objectEnergy: emergenceAccent,
      objectReveal,
    });
  }

  function renderFrame(elapsed = clock.getElapsedTime()) {
    updateScene(elapsed);
    postProcessing.render();
  }

  function render() {
    if (isDestroyed) {
      return;
    }

    renderFrame();
    animationFrame = window.requestAnimationFrame(render);
  }

  async function prepareFirstFrame() {
    resize();
    setCurrentAssetKey(currentAssetKey);
    updateScene(0);

    if (typeof renderer.compileAsync === "function") {
      try {
        await renderer.compileAsync(scene, camera);
        if (volumetricLighting?.volumetricScene) {
          await renderer.compileAsync(volumetricLighting.volumetricScene, camera);
        }
      } catch {}
    }

    if (isDestroyed) {
      return;
    }

    renderFrame(0);
    container.dataset.ready = "true";
    resolveReady(currentAssetKey);
  }

  function disposeSceneGraph(root) {
    const geometries = new Set();
    const materials = new Set();

    root.traverse((object) => {
      if (object.geometry) {
        geometries.add(object.geometry);
      }

      if (Array.isArray(object.material)) {
        for (const material of object.material) {
          if (material) {
            materials.add(material);
          }
        }
      } else if (object.material) {
        materials.add(object.material);
      }
    });

    for (const geometry of geometries) {
      geometry.dispose();
    }

    for (const material of materials) {
      material.dispose();
    }
  }

  setCurrentAssetKey(currentAssetKey);

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

  try {
    await prepareFirstFrame();
  } catch {
    if (interactionTarget instanceof EventTarget) {
      interactionTarget.removeEventListener("pointermove", handlePointerMove);
      interactionTarget.removeEventListener("pointerleave", handlePointerLeave);
    }

    if (resizeObserver) {
      resizeObserver.disconnect();
    } else {
      window.removeEventListener("resize", resize);
    }

    disposeSceneGraph(scene);
    if (volumetricLighting?.volumetricScene) {
      disposeSceneGraph(volumetricLighting.volumetricScene);
    }
    volumetricLighting?.dispose();
    disposeSceneGraph(environmentScene);
    environmentTarget.dispose();
    pmremGenerator.dispose();
    renderer.dispose();
    container.dataset.ready = "false";
    container.replaceChildren();
    return null;
  }

  clock.start();
  render();

  return {
    setAsset(nextAssetKey = defaultHeroAssetKey) {
      return Promise.resolve(setCurrentAssetKey(nextAssetKey));
    },
    preloadAssets() {
      return readyPromise.then(() => []);
    },
    whenReady() {
      return readyPromise;
    },
    getAssetKey() {
      return currentAssetKey;
    },
    getRendererMode() {
      return "webgpu";
    },
    destroy() {
      isDestroyed = true;
      resolveReady(null);
      window.cancelAnimationFrame(animationFrame);

      if (interactionTarget instanceof EventTarget) {
        interactionTarget.removeEventListener("pointermove", handlePointerMove);
        interactionTarget.removeEventListener("pointerleave", handlePointerLeave);
      }

      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener("resize", resize);
      }

      disposeSceneGraph(scene);
      if (volumetricLighting?.volumetricScene) {
        disposeSceneGraph(volumetricLighting.volumetricScene);
      }
      volumetricLighting?.dispose();
      disposeSceneGraph(environmentScene);
      environmentTarget.dispose();
      pmremGenerator.dispose();
      renderer.dispose();
      container.dataset.ready = "false";
      container.replaceChildren();
    },
  };
}

function createHeroSphereGeometry(detail = {}) {
  return new THREE.SphereGeometry(
    0.24,
    detail.widthSegments ?? 72,
    detail.heightSegments ?? 54,
  );
}

function getSphereGeometryKey(detail = {}) {
  return `${detail.widthSegments ?? 72}x${detail.heightSegments ?? 54}`;
}

function createPlaceholderAssetGroups(baseMaterial) {
  return new Map([
    ["bbq", createBbqPlaceholder(baseMaterial)],
    ["ak", createAkPlaceholder(baseMaterial)],
    ["hoodie", createHoodiePlaceholder(baseMaterial)],
  ]);
}

function createBbqPlaceholder(baseMaterial) {
  const group = new THREE.Group();
  group.name = "webgpuPlaceholderBbq";

  const body = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.28, 0.1, 128, 18),
    baseMaterial,
  );
  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.28, 0.22, 32, 1, true),
    baseMaterial,
  );

  cap.position.y = -0.28;
  cap.rotation.z = 0.4;
  group.add(body);
  group.add(cap);
  return group;
}

function createAkPlaceholder(baseMaterial) {
  const group = new THREE.Group();
  group.name = "webgpuPlaceholderAk";

  const receiver = new THREE.Mesh(
    new RoundedBoxGeometry(0.82, 0.18, 0.14, 4, 0.04),
    baseMaterial,
  );
  const barrel = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.04, 0.7, 6, 16),
    baseMaterial,
  );
  const stock = new THREE.Mesh(
    new RoundedBoxGeometry(0.32, 0.14, 0.12, 4, 0.035),
    baseMaterial,
  );
  const grip = new THREE.Mesh(
    new RoundedBoxGeometry(0.12, 0.22, 0.1, 4, 0.03),
    baseMaterial,
  );

  barrel.rotation.z = Math.PI * 0.5;
  barrel.position.x = 0.62;
  stock.rotation.z = -0.28;
  stock.position.x = -0.5;
  stock.position.y = 0.03;
  grip.rotation.z = -0.42;
  grip.position.x = -0.1;
  grip.position.y = -0.22;

  group.add(receiver);
  group.add(barrel);
  group.add(stock);
  group.add(grip);
  group.rotation.z = 0.12;
  return group;
}

function createHoodiePlaceholder(baseMaterial) {
  const group = new THREE.Group();
  group.name = "webgpuPlaceholderHoodie";

  const torso = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.34, 2),
    baseMaterial,
  );
  const hood = new THREE.Mesh(
    new THREE.TorusGeometry(0.18, 0.055, 18, 48, Math.PI),
    baseMaterial,
  );
  const shoulder = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 28, 20),
    baseMaterial,
  );

  torso.scale.set(1.1, 1.28, 0.88);
  hood.position.set(0, 0.24, 0.1);
  hood.rotation.x = 0.9;
  shoulder.position.set(0, 0.14, 0.04);
  shoulder.scale.set(1.4, 0.72, 0.74);

  group.add(torso);
  group.add(hood);
  group.add(shoulder);
  return group;
}

function smoothstep(value) {
  const clamped = THREE.MathUtils.clamp(value, 0, 1);
  return clamped * clamped * (3 - 2 * clamped);
}

function smootherstep(value) {
  const clamped = THREE.MathUtils.clamp(value, 0, 1);
  return clamped * clamped * clamped * (clamped * (clamped * 6 - 15) + 10);
}
