import * as THREE from "three";
import { gsap } from "gsap";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

import { heroConfig } from "./config.js";
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
import { createHeroAssetMaterial, createHeroMaterials } from "./materials.js";

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

  const camera = new THREE.PerspectiveCamera(
    heroConfig.camera.desktop.fov,
    1,
    0.1,
    60,
  );

  let qualityProfile = getQualityProfile(container.clientWidth || window.innerWidth, reducedMotion);
  let layoutPreset = getCompositionPreset(container.clientWidth || window.innerWidth);
  renderer.setPixelRatio(getRendererPixelRatio(window.devicePixelRatio, qualityProfile));

  const materials = createHeroMaterials(heroConfig);
  const glowTexture = createGlowTexture();
  const clock = new THREE.Clock();
  const postprocessing = createPostProcessing({
    renderer,
    scene,
    camera,
    width: container.clientWidth || window.innerWidth,
    height: container.clientHeight || window.innerHeight,
    qualityProfile,
  });

  const introRig = new THREE.Group();
  const motionRig = new THREE.Group();
  const depthRig = new THREE.Group();
  const ribbonRig = new THREE.Group();
  const membraneRig = new THREE.Group();
  const membraneReactionRig = new THREE.Group();
  const panesRig = new THREE.Group();
  const spheresRig = new THREE.Group();
  const courierRig = new THREE.Group();
  const assetRig = new THREE.Group();
  const lightsRig = new THREE.Group();

  introRig.add(motionRig);
  motionRig.add(depthRig);
  motionRig.add(ribbonRig);
  motionRig.add(membraneRig);
  motionRig.add(panesRig);
  motionRig.add(spheresRig);
  motionRig.add(courierRig);
  motionRig.add(assetRig);
  scene.add(introRig);
  scene.add(lightsRig);

  membraneRig.add(membraneReactionRig);

  const floor = new THREE.Mesh(
    new THREE.CylinderGeometry(4.1, 5.1, 0.22, 96),
    materials.floor,
  );
  floor.position.set(0.3, -2.28, 0.16);
  motionRig.add(floor);

  const floorGlow = new THREE.Mesh(
    new THREE.CircleGeometry(5.8, 96),
    materials.floorGlow,
  );
  floorGlow.rotation.x = -Math.PI / 2;
  floorGlow.position.set(0.4, -2.15, 0.22);
  motionRig.add(floorGlow);

  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(14.5, 10.8),
    materials.backdrop,
  );
  backdrop.position.set(0.15, -0.1, -5.6);
  const backdropBasePosition = backdrop.position.clone();
  depthRig.add(backdrop);

  const coolZone = createGlowSprite(glowTexture, heroConfig.palette.cool, 0.3);
  coolZone.position.set(-2.55, 0.78, -2.8);
  coolZone.scale.set(8.2, 6.2, 1);
  const coolZoneBasePosition = coolZone.position.clone();
  depthRig.add(coolZone);

  const warmZone = createGlowSprite(glowTexture, heroConfig.palette.warm, 0.22);
  warmZone.position.set(2.4, -0.52, -2.3);
  warmZone.scale.set(6.8, 5.4, 1);
  const warmZoneBasePosition = warmZone.position.clone();
  depthRig.add(warmZone);

  const neutralZone = createGlowSprite(glowTexture, heroConfig.palette.lightWarm, 0.09);
  neutralZone.position.set(1.25, 0.34, -1.95);
  neutralZone.scale.set(4.6, 3.6, 1);
  const neutralZoneBasePosition = neutralZone.position.clone();
  depthRig.add(neutralZone);

  const ribbon = new THREE.Mesh(
    new THREE.TorusGeometry(
      2.28,
      0.115,
      qualityProfile.tubeSegments,
      qualityProfile.ringSegments,
    ),
    materials.ribbon,
  );
  ribbon.scale.set(1.58, 0.9, 0.42);
  ribbon.position.set(-1.12, -0.18, -0.12);
  ribbon.rotation.set(1.08, -0.22, 0.56);
  const ribbonBasePosition = ribbon.position.clone();
  const ribbonBaseRotation = ribbon.rotation.clone();
  ribbonRig.add(ribbon);

  const ribbonUndersideGlow = createGlowSprite(glowTexture, heroConfig.palette.warm, 0.14);
  ribbonUndersideGlow.position.set(-0.72, -0.58, -0.88);
  ribbonUndersideGlow.scale.set(4.8, 3.6, 1);
  const ribbonUndersideGlowBasePosition = ribbonUndersideGlow.position.clone();
  ribbonRig.add(ribbonUndersideGlow);

  const membraneGeometry = createEllipseSlabGeometry(1.02, 1.42, 0.16, 0.055, 0.04);
  const membrane = new THREE.Mesh(membraneGeometry, materials.membrane);
  membraneReactionRig.add(membrane);

  const membraneRim = new THREE.Mesh(
    createEllipseFrameGeometry(1.12, 1.52, 0.06, 0.022),
    materials.membraneEdge,
  );
  membraneRim.position.z = 0.012;
  membraneReactionRig.add(membraneRim);

  const membraneLineMaterial = new THREE.LineBasicMaterial({
    color: heroConfig.palette.lightWarm,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
    toneMapped: false,
  });

  const membraneEdge = new THREE.LineSegments(
    new THREE.EdgesGeometry(membraneGeometry, 28),
    membraneLineMaterial,
  );
  membraneReactionRig.add(membraneEdge);

  const membraneHalo = createGlowSprite(glowTexture, heroConfig.palette.cool, 0.11);
  membraneHalo.position.set(0.12, 0.08, -0.56);
  membraneHalo.scale.set(3.4, 4.8, 1);
  const membraneHaloBasePosition = membraneHalo.position.clone();
  membraneReactionRig.add(membraneHalo);

  membraneRig.position.set(1.52, 0.22, 0.36);
  membraneRig.rotation.set(0.13, -0.64, 0.14);
  const membraneBasePosition = membraneRig.position.clone();
  const membraneBaseRotation = membraneRig.rotation.clone();

  const panePrimary = new THREE.Mesh(
    createRoundedRectFrameGeometry(2.9, 4.04, 0.42, 0.085, 0.018),
    materials.paneOutline,
  );
  panePrimary.position.set(-1.86, 0.52, -1.62);
  const panePrimaryBasePosition = panePrimary.position.clone();
  panePrimary.rotation.set(0.04, 0.34, 0.18);
  const panePrimaryBaseRotation = panePrimary.rotation.clone();
  panesRig.add(panePrimary);

  const paneSecondary = new THREE.Mesh(
    createRoundedRectFrameGeometry(2.22, 3.16, 0.34, 0.068, 0.016),
    materials.paneOutline,
  );
  paneSecondary.position.set(1.82, 0.04, -1.34);
  const paneSecondaryBasePosition = paneSecondary.position.clone();
  paneSecondary.rotation.set(-0.02, -0.24, -0.14);
  const paneSecondaryBaseRotation = paneSecondary.rotation.clone();
  panesRig.add(paneSecondary);

  const chromeSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, qualityProfile.sphereSegments, qualityProfile.sphereSegments),
    materials.sphereChrome,
  );
  chromeSphere.position.set(-2.16, 1.02, 1.26);
  const chromeSphereBasePosition = chromeSphere.position.clone();
  spheresRig.add(chromeSphere);

  const glassSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, qualityProfile.sphereSegments, qualityProfile.sphereSegments),
    materials.sphereGlass,
  );
  glassSphere.position.set(2.54, 0.78, 0.92);
  const glassSphereBasePosition = glassSphere.position.clone();
  spheresRig.add(glassSphere);

  const pearlSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, qualityProfile.smallSphereSegments, qualityProfile.smallSphereSegments),
    materials.spherePearl,
  );
  pearlSphere.position.set(0.96, -0.74, -0.86);
  const pearlSphereBasePosition = pearlSphere.position.clone();
  spheresRig.add(pearlSphere);

  const courierSphere = new THREE.Mesh(
    new THREE.SphereGeometry(
      heroConfig.courier.radius,
      qualityProfile.heroSphereSegments,
      qualityProfile.heroSphereSegments,
    ),
    materials.courier,
  );
  courierSphere.renderOrder = 3;

  const courierGlow = createGlowSprite(glowTexture, heroConfig.palette.lightWarm, 0);
  courierGlow.scale.set(heroConfig.courier.glowScale, heroConfig.courier.glowScale, 1);
  courierGlow.renderOrder = 2;

  const courierGroup = new THREE.Group();
  courierGroup.visible = false;
  courierGroup.add(courierGlow);
  courierGroup.add(courierSphere);
  courierRig.add(courierGroup);

  const dust = createDustCloud(materials.dust, qualityProfile.dustCount);
  depthRig.add(dust);

  const ambientLight = new THREE.AmbientLight(heroConfig.palette.lightWarm, 0.22);
  scene.add(ambientLight);

  const hemisphereLight = new THREE.HemisphereLight(
    heroConfig.palette.cool,
    heroConfig.palette.ember,
    0.18,
  );
  scene.add(hemisphereLight);

  const coolKeyLight = new THREE.DirectionalLight(heroConfig.palette.cool, 0.82);
  coolKeyLight.position.set(-4.8, 4.8, 5.4);
  lightsRig.add(coolKeyLight);

  const warmFillLight = new THREE.PointLight(heroConfig.palette.warm, 10.5, 14, 2);
  warmFillLight.position.set(2.8, -1.3, 3.2);
  lightsRig.add(warmFillLight);

  const membraneAccentLight = new THREE.PointLight(heroConfig.palette.lightWarm, 4.2, 9, 2);
  membraneAccentLight.position.set(2.2, 1.6, 1.8);
  lightsRig.add(membraneAccentLight);

  const introState = { progress: reducedMotion ? 1 : 0 };
  const pointer = { x: 0, y: 0 };
  const targetPointer = { x: 0, y: 0 };
  const cameraBase = { ...heroConfig.camera.desktop.position };
  const membraneState = { pulse: 0, flash: 0 };
  const courierState = {
    opacity: 0,
    glow: 0,
    highlight: 0,
    scaleX: 1,
    scaleY: 1,
    scaleZ: 1,
  };

  let resizeObserver;
  let animationFrame = 0;
  let introTimeline = null;
  let sequenceTimeline = null;
  let resolveSequenceTimeline = null;
  let currentAsset = null;
  let currentAssetKey = getHeroAssetSpec(assetKey).key;
  let playbackToken = 0;
  let isDestroyed = false;
  let hasPresentedFirstFrame = false;

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
    const width = container.clientWidth || window.innerWidth;
    const preset =
      width <= heroConfig.quality.mobileBreakpoint
        ? heroConfig.camera.mobile
        : width <= heroConfig.quality.tabletBreakpoint
          ? heroConfig.camera.tablet
          : heroConfig.camera.desktop;

    camera.fov = preset.fov;
    cameraBase.x = preset.position.x;
    cameraBase.y = preset.position.y;
    cameraBase.z = preset.position.z;
    camera.updateProjectionMatrix();
  };

  const resize = () => {
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    qualityProfile = getQualityProfile(width, reducedMotion);
    layoutPreset = getCompositionPreset(width);
    const pixelRatio = getRendererPixelRatio(window.devicePixelRatio, qualityProfile);

    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    postprocessing.composer.setPixelRatio?.(pixelRatio);
    postprocessing.composer.setSize(width, height);
    postprocessing.bloomPass.setSize(width, height);
    postprocessing.bloomPass.strength = qualityProfile.bloomStrength;
    postprocessing.bloomPass.radius = qualityProfile.bloomRadius;
    postprocessing.bloomPass.threshold = qualityProfile.bloomThreshold;
    postprocessing.finishPass.uniforms.uRgbShift.value = qualityProfile.rgbShift;
    postprocessing.finishPass.uniforms.uVignette.value = qualityProfile.vignette;
    postprocessing.finishPass.uniforms.uGrain.value = qualityProfile.grain;

    setCameraPreset();
    applyCompositionPreset(layoutPreset);
    camera.aspect = width / height;
    camera.position.set(cameraBase.x, cameraBase.y, cameraBase.z);
    camera.lookAt(
      heroConfig.camera.lookAt.x,
      heroConfig.camera.lookAt.y,
      heroConfig.camera.lookAt.z,
    );
    camera.updateProjectionMatrix();
  };

  const render = () => {
    const elapsed = clock.getElapsedTime();
    const interactionStrength = qualityProfile.interactionStrength;
    const atmosphereStrength = qualityProfile.atmosphereStrength;
    const smoothFactor = reducedMotion ? 1 : 0.045 + interactionStrength * 0.012;

    pointer.x += (targetPointer.x - pointer.x) * smoothFactor;
    pointer.y += (targetPointer.y - pointer.y) * smoothFactor;

    const introProgress = introState.progress;
    const floatAmount = reducedMotion ? 0 : Math.sin(elapsed * heroConfig.motion.idleFloatSpeed);
    const orbitAmount = reducedMotion ? 0 : elapsed * heroConfig.motion.ringSpin;

    motionRig.position.y = floatAmount * heroConfig.motion.idleFloatAmplitude * introProgress;
    motionRig.rotation.y =
      pointer.x * heroConfig.motion.pointerRotationY * interactionStrength +
      Math.sin(elapsed * 0.18) * 0.02 * introProgress;
    motionRig.rotation.x = -pointer.y * heroConfig.motion.pointerRotationX * interactionStrength;
    motionRig.position.x = pointer.x * heroConfig.motion.pointerShiftX * interactionStrength;
    motionRig.position.z = pointer.y * heroConfig.motion.pointerShiftY * interactionStrength;

    depthRig.position.x = -pointer.x * heroConfig.motion.depthParallaxX * interactionStrength;
    depthRig.position.y =
      -pointer.y * heroConfig.motion.depthParallaxY * interactionStrength +
      Math.sin(elapsed * 0.12) * heroConfig.motion.atmosphereDrift * 0.5 * atmosphereStrength;

    backdrop.position.x = backdropBasePosition.x + pointer.x * 0.04 * interactionStrength;
    backdrop.position.y = backdropBasePosition.y - pointer.y * 0.03 * interactionStrength;

    coolZone.position.x =
      coolZoneBasePosition.x -
      pointer.x * heroConfig.motion.glowParallaxX * interactionStrength +
      Math.sin(elapsed * 0.16) * 0.09 * atmosphereStrength;
    coolZone.position.y =
      coolZoneBasePosition.y +
      Math.cos(elapsed * 0.14 + 0.8) * 0.07 * atmosphereStrength;

    warmZone.position.x =
      warmZoneBasePosition.x +
      pointer.x * heroConfig.motion.glowParallaxX * 0.8 * interactionStrength +
      Math.sin(elapsed * 0.12 + 1.7) * 0.06 * atmosphereStrength;
    warmZone.position.y =
      warmZoneBasePosition.y +
      Math.cos(elapsed * 0.18 + 2.2) * 0.05 * atmosphereStrength;

    neutralZone.position.x =
      neutralZoneBasePosition.x + Math.sin(elapsed * 0.1 + 0.3) * 0.04 * atmosphereStrength;
    neutralZone.position.y =
      neutralZoneBasePosition.y +
      Math.cos(elapsed * 0.13 + 0.9) * 0.035 * atmosphereStrength;

    ribbon.position.x = ribbonBasePosition.x - pointer.x * 0.05 * interactionStrength;
    ribbon.position.y =
      ribbonBasePosition.y +
      Math.sin(elapsed * 0.42) * heroConfig.motion.ringLift * introProgress * atmosphereStrength;
    ribbon.rotation.y =
      ribbonBaseRotation.y -
      pointer.x * 0.06 * interactionStrength +
      Math.sin(elapsed * 0.24) * 0.04;
    ribbon.rotation.x =
      ribbonBaseRotation.x + Math.sin(elapsed * 0.18 + 0.4) * 0.03 * introProgress;
    ribbon.rotation.z = ribbonBaseRotation.z + orbitAmount;

    ribbonUndersideGlow.position.y =
      ribbonUndersideGlowBasePosition.y +
      Math.sin(elapsed * 0.34 + 0.8) * 0.055 * atmosphereStrength;

    membraneRig.position.x = membraneBasePosition.x + pointer.x * 0.06 * interactionStrength;
    membraneRig.position.y =
      membraneBasePosition.y +
      Math.sin(elapsed * 0.26 + 1.2) * 0.035 * introProgress * atmosphereStrength;
    membraneRig.rotation.y =
      membraneBaseRotation.y -
      pointer.x * 0.045 * interactionStrength +
      Math.sin(elapsed * 0.2) * 0.03 * introProgress;
    membraneRig.rotation.x = membraneBaseRotation.x - pointer.y * 0.03 * interactionStrength;
    membraneRig.rotation.z =
      membraneBaseRotation.z + Math.sin(elapsed * 0.16 + 0.4) * 0.02 * introProgress;

    membraneReactionRig.scale.set(
      1 + membraneState.pulse * 0.05,
      1 - membraneState.pulse * 0.075,
      1 + membraneState.pulse * 0.09,
    );

    membrane.position.z = -membraneState.pulse * 0.045;
    membrane.scale.set(
      1 + membraneState.flash * 0.03,
      1 - membraneState.pulse * 0.06,
      1 + membraneState.pulse * 0.18,
    );
    membraneRim.position.z = 0.012 + membraneState.pulse * 0.014;
    membraneRim.scale.set(
      1 + membraneState.flash * 0.022,
      1 - membraneState.pulse * 0.035,
      1 + membraneState.flash * 0.022,
    );
    membraneEdge.scale.copy(membraneRim.scale);
    membraneHalo.position.x =
      membraneHaloBasePosition.x + Math.sin(elapsed * 0.24 + 0.5) * 0.04 * atmosphereStrength;
    membraneHalo.position.y =
      membraneHaloBasePosition.y + Math.cos(elapsed * 0.21 + 1.1) * 0.05 * atmosphereStrength;

    panePrimary.position.x =
      panePrimaryBasePosition.x - pointer.x * heroConfig.motion.paneParallaxX * interactionStrength;
    panePrimary.position.y =
      panePrimaryBasePosition.y -
      pointer.y * heroConfig.motion.paneParallaxY * interactionStrength +
      Math.sin(elapsed * 0.18 + 1.2) * 0.04 * atmosphereStrength;
    panePrimary.rotation.y = panePrimaryBaseRotation.y - pointer.x * 0.024 * interactionStrength;
    panePrimary.rotation.x = panePrimaryBaseRotation.x - pointer.y * 0.015 * interactionStrength;

    paneSecondary.position.x =
      paneSecondaryBasePosition.x +
      pointer.x * heroConfig.motion.paneParallaxX * interactionStrength;
    paneSecondary.position.y =
      paneSecondaryBasePosition.y -
      pointer.y * heroConfig.motion.paneParallaxY * 0.85 * interactionStrength +
      Math.sin(elapsed * 0.16 + 2.1) * 0.03 * atmosphereStrength;
    paneSecondary.rotation.y =
      paneSecondaryBaseRotation.y + pointer.x * 0.02 * interactionStrength;
    paneSecondary.rotation.x =
      paneSecondaryBaseRotation.x - pointer.y * 0.014 * interactionStrength;

    chromeSphere.position.y =
      chromeSphereBasePosition.y +
      Math.sin(elapsed * 0.54 + 0.8) * 0.045 * introProgress * atmosphereStrength;
    chromeSphere.position.x = chromeSphereBasePosition.x - pointer.x * 0.08 * interactionStrength;
    chromeSphere.position.z =
      chromeSphereBasePosition.z + Math.cos(elapsed * 0.32 + 0.4) * 0.09 * atmosphereStrength;

    glassSphere.position.y =
      glassSphereBasePosition.y +
      Math.sin(elapsed * 0.48 + 2.1) * 0.05 * introProgress * atmosphereStrength;
    glassSphere.position.x = glassSphereBasePosition.x + pointer.x * 0.1 * interactionStrength;
    glassSphere.position.z =
      glassSphereBasePosition.z + Math.sin(elapsed * 0.28 + 1.2) * 0.11 * atmosphereStrength;

    pearlSphere.position.y =
      pearlSphereBasePosition.y +
      Math.sin(elapsed * 0.42 + 3.1) * 0.035 * introProgress * atmosphereStrength;
    pearlSphere.position.x = pearlSphereBasePosition.x + pointer.x * 0.04 * interactionStrength;
    pearlSphere.position.z =
      pearlSphereBasePosition.z + Math.cos(elapsed * 0.25 + 0.2) * 0.05 * atmosphereStrength;

    assetRig.rotation.y = pointer.x * heroConfig.motion.assetRigRotationY * interactionStrength;
    assetRig.rotation.x = -pointer.y * heroConfig.motion.assetRigRotationX * interactionStrength;

    courierSphere.scale.set(
      courierState.scaleX,
      courierState.scaleY,
      courierState.scaleZ,
    );
    courierGroup.visible = courierState.opacity > 0.001;
    materials.courier.opacity = courierState.opacity;
    materials.courier.emissiveIntensity =
      0.03 +
      courierState.highlight * 0.16 +
      Math.sin(elapsed * 1.1 + 0.6) * 0.01 * introProgress;
    materials.courier.ior = 1.2 + courierState.highlight * 0.025;
    materials.courier.thickness = 3.2 + courierState.highlight * 0.55;
    materials.courier.envMapIntensity = 2.08 + courierState.highlight * 0.48;
    materials.courier.attenuationDistance = 1.55 - courierState.highlight * 0.18;

    if (courierGlow.material) {
      courierGlow.material.opacity = courierState.glow + membraneState.flash * 0.035;
    }

    const courierGlowScale =
      heroConfig.courier.glowScale * (1 + courierState.highlight * 0.12 + membraneState.flash * 0.08);
    courierGlow.scale.set(courierGlowScale, courierGlowScale, 1);

    dust.rotation.y = elapsed * 0.014;
    dust.rotation.x = Math.sin(elapsed * 0.1) * 0.03;
    dust.rotation.z = Math.cos(elapsed * 0.08 + 0.4) * 0.02;

    materials.ribbon.emissiveIntensity = 0.022 + Math.sin(elapsed * 0.8 + 0.2) * 0.008;
    materials.ribbon.envMapIntensity =
      1.82 + Math.sin(elapsed * 0.34 + 0.2) * 0.06 + membraneState.flash * 0.08;
    materials.floorGlow.opacity =
      0.07 + Math.sin(elapsed * 0.62 - 0.2) * 0.015 + membraneState.flash * 0.015;
    materials.backdrop.opacity = 0.14 + Math.sin(elapsed * 0.18 + 0.4) * 0.012;
    materials.membrane.emissiveIntensity =
      0.018 + membraneState.flash * 0.18 + Math.sin(elapsed * 0.54) * 0.008 * introProgress;
    materials.membrane.thickness = 2.4 + membraneState.pulse * 0.45;
    materials.membrane.ior = 1.19 + membraneState.flash * 0.026;
    materials.membrane.attenuationDistance = 1.9 - membraneState.flash * 0.16;
    materials.membrane.envMapIntensity = 1.72 + membraneState.flash * 0.22;
    materials.membraneEdge.opacity = 0.38 + membraneState.flash * 0.14;
    materials.membraneEdge.envMapIntensity = 1.82 + membraneState.flash * 0.24;
    membraneLineMaterial.opacity = 0.24 + membraneState.flash * 0.28;

    if (membraneHalo.material) {
      membraneHalo.material.opacity =
        0.11 + membraneState.flash * 0.18 + Math.sin(elapsed * 0.48 + 0.8) * 0.01 * introProgress;
    }

    membraneHalo.scale.set(
      3.4 + membraneState.pulse * 0.65,
      4.8 + membraneState.pulse * 0.92,
      1,
    );

    if (currentAsset) {
      const { displayRotation = { x: 0, y: 0, z: 0 }, wobbleAmount = 0, wobbleSpeed = 0.45 } =
        currentAsset.spec;

      currentAsset.group.visible = currentAsset.opacity > 0.002;
      currentAsset.group.rotation.x = displayRotation.x;
      currentAsset.group.rotation.y =
        displayRotation.y +
        currentAsset.rotationIntroOffset +
        Math.sin(elapsed * wobbleSpeed) * wobbleAmount * 0.48 * introProgress;
      currentAsset.group.rotation.z =
        displayRotation.z + Math.cos(elapsed * 0.24) * 0.01 * introProgress;

      if (currentAsset.material) {
        currentAsset.material.opacity = currentAsset.opacity;
        currentAsset.material.emissiveIntensity =
          currentAsset.baseEmissiveIntensity +
          currentAsset.emissiveBoost +
          Math.sin(elapsed * 0.9) * 0.01 * introProgress;
      }
    }

    warmFillLight.intensity =
      10.5 + Math.sin(elapsed * 0.7) * 0.35 * introProgress + membraneState.flash * 0.55;
    membraneAccentLight.intensity =
      4.2 + Math.sin(elapsed * 0.52 + 1.4) * 0.2 * introProgress + membraneState.flash * 0.7;

    camera.position.x = cameraBase.x + pointer.x * heroConfig.motion.cameraShiftX * interactionStrength;
    camera.position.y = cameraBase.y - pointer.y * heroConfig.motion.cameraShiftY * interactionStrength;
    camera.lookAt(
      heroConfig.camera.lookAt.x + pointer.x * 0.025 * interactionStrength,
      heroConfig.camera.lookAt.y + pointer.y * 0.03 * interactionStrength,
      heroConfig.camera.lookAt.z,
    );

    postprocessing.bloomPass.strength =
      qualityProfile.bloomStrength + membraneState.flash * heroConfig.postprocessing.bloom.flashBoost;
    postprocessing.finishPass.uniforms.uTime.value = elapsed;
    postprocessing.finishPass.uniforms.uRgbShift.value =
      qualityProfile.rgbShift + membraneState.flash * 0.00018;
    postprocessing.composer.render();

    if (!hasPresentedFirstFrame) {
      hasPresentedFirstFrame = true;
      container.dataset.ready = "true";
    }

    animationFrame = window.requestAnimationFrame(render);
  };

  const startIntro = () => {
    introRig.position.set(0, -0.24, 1.8);
    introRig.rotation.set(0.08, -0.18, -0.02);
    ribbon.scale.set(1.5, 0.86, 0.4);
    membraneRig.scale.setScalar(0.94);
    panesRig.scale.setScalar(0.97);
    spheresRig.scale.setScalar(0.94);
    courierRig.scale.setScalar(0.94);
    assetRig.scale.setScalar(0.92);

    if (reducedMotion) {
      introState.progress = 1;
      introRig.position.set(0, 0, 0);
      introRig.rotation.set(0, 0, 0);
      ribbon.scale.copy(new THREE.Vector3(1.58, 0.9, 0.42));
      membraneRig.scale.setScalar(1);
      panesRig.scale.setScalar(1);
      spheresRig.scale.setScalar(1);
      courierRig.scale.setScalar(1);
      assetRig.scale.setScalar(1);
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
      .to(introRig.position, { y: 0, z: 0 }, 0)
      .to(introRig.rotation, { x: 0, y: 0, z: 0 }, 0)
      .to(
        ribbon.scale,
        {
          x: 1.58,
          y: 0.9,
          z: 0.42,
          duration: 1.25,
        },
        0.1,
      )
      .to(membraneRig.scale, { x: 1, y: 1, z: 1, duration: 1.24 }, 0.16)
      .to(panesRig.scale, { x: 1, y: 1, z: 1, duration: 1.12 }, 0.22)
      .to(spheresRig.scale, { x: 1, y: 1, z: 1, duration: 1.15 }, 0.26)
      .to(courierRig.scale, { x: 1, y: 1, z: 1, duration: 1.14 }, 0.24)
      .to(assetRig.scale, { x: 1, y: 1, z: 1, duration: 1.15 }, 0.22);
  };

  function restartPlayback() {
    playbackToken += 1;

    if (sequenceTimeline) {
      sequenceTimeline.kill();
      sequenceTimeline = null;
    }

    if (resolveSequenceTimeline) {
      const resolve = resolveSequenceTimeline;
      resolveSequenceTimeline = null;
      resolve();
    }

    gsap.killTweensOf(courierState);
    gsap.killTweensOf(membraneState);
    gsap.killTweensOf(courierGroup.position);
    gsap.killTweensOf(courierSphere.scale);

    if (currentAsset) {
      gsap.killTweensOf(currentAsset);
      gsap.killTweensOf(currentAsset.group.position);
      gsap.killTweensOf(currentAsset.group.scale);
      disposeCurrentAsset();
    }

    membraneState.pulse = 0;
    membraneState.flash = 0;
    courierState.opacity = 0;
    courierState.glow = 0;
    courierState.highlight = 0;
    courierState.scaleX = 1;
    courierState.scaleY = 1;
    courierState.scaleZ = 1;
    courierGroup.visible = false;

    const entry = heroConfig.courier.path.entry;
    courierGroup.position.set(entry.x, entry.y, entry.z);

    return playbackToken;
  }

  function disposeCurrentAsset() {
    if (!currentAsset) {
      assetRig.clear();
      return;
    }

    disposeHeroAssetInstance(currentAsset);
    currentAsset = null;
    assetRig.clear();
  }

  async function loadSceneAsset(nextAssetKey, token) {
    const spec = getHeroAssetSpec(nextAssetKey);
    const nextAsset = await loadHeroAssetInstance(spec.key, {
      createMaterial: (entry) => createHeroAssetMaterial(heroConfig, entry),
    });

    if (isDestroyed || token !== playbackToken) {
      disposeHeroAssetInstance(nextAsset);
      return null;
    }

    return {
      ...nextAsset,
      opacity: 0,
      emissiveBoost: 0,
      rotationIntroOffset: 0,
      baseEmissiveIntensity: nextAsset.material?.emissiveIntensity ?? 0,
    };
  }

  function computeAssetPoses(asset) {
    const assetLayout = layoutPreset.asset ?? {};
    const presentationScale =
      assetLayout.presentationScale ?? heroConfig.heroAsset.presentationScale ?? 1;
    const sceneOffset = assetLayout.sceneOffset ?? heroConfig.heroAsset.sceneOffset ?? { x: 0, y: 0, z: 0 };
    const assetOffset = asset.spec.position ?? { x: 0, y: 0, z: 0 };
    const path = assetLayout.path ?? heroConfig.sequence.assetPath;
    const baseY =
      heroConfig.heroAsset.floorY +
      asset.bounds.halfHeight * presentationScale +
      (sceneOffset.y ?? 0) +
      (assetOffset.y ?? 0);

    return {
      presentationScale,
      startScale: presentationScale * 0.58,
      holdScale: presentationScale,
      driftScale: presentationScale * 1.015,
      fadeScale: presentationScale * 1.04,
      start: new THREE.Vector3(
        (sceneOffset.x ?? 0) + (assetOffset.x ?? 0) + path.start.x,
        baseY + path.start.y,
        (sceneOffset.z ?? 0) + (assetOffset.z ?? 0) + path.start.z,
      ),
      hold: new THREE.Vector3(
        (sceneOffset.x ?? 0) + (assetOffset.x ?? 0) + path.hold.x,
        baseY + path.hold.y,
        (sceneOffset.z ?? 0) + (assetOffset.z ?? 0) + path.hold.z,
      ),
      drift: new THREE.Vector3(
        (sceneOffset.x ?? 0) + (assetOffset.x ?? 0) + path.drift.x,
        baseY + path.drift.y,
        (sceneOffset.z ?? 0) + (assetOffset.z ?? 0) + path.drift.z,
      ),
      fade: new THREE.Vector3(
        (sceneOffset.x ?? 0) + (assetOffset.x ?? 0) + path.fade.x,
        baseY + path.fade.y,
        (sceneOffset.z ?? 0) + (assetOffset.z ?? 0) + path.fade.z,
      ),
    };
  }

  async function showStaticAsset(nextAssetKey, token) {
    const asset = await loadSceneAsset(nextAssetKey, token);

    if (!asset || isDestroyed || token !== playbackToken) {
      return null;
    }

    const poses = computeAssetPoses(asset);
    disposeCurrentAsset();

    currentAsset = asset;
    currentAssetKey = asset.key;
    currentAsset.opacity = 1;
    currentAsset.emissiveBoost = 0.02;
    currentAsset.rotationIntroOffset = 0;

    assetRig.add(currentAsset.group);
    currentAsset.group.scale.setScalar(poses.holdScale);
    currentAsset.group.position.copy(poses.hold);
    currentAsset.group.visible = true;

    return currentAsset;
  }

  async function playSequenceCycle(nextAssetKey, token) {
    const asset = await loadSceneAsset(nextAssetKey, token);

    if (!asset || isDestroyed || token !== playbackToken) {
      return;
    }

    const poses = computeAssetPoses(asset);
    const courierPath = heroConfig.courier.path;
    const sequence = heroConfig.sequence;
    const contactTime = sequence.approachDuration;
    const transferTime = contactTime + sequence.contactDuration * 0.18;
    const emergenceTime = transferTime + 0.12;
    const driftTime = emergenceTime + sequence.revealDuration;
    const fadeTime = driftTime + sequence.driftDuration;

    disposeCurrentAsset();
    currentAsset = asset;
    currentAssetKey = asset.key;
    currentAsset.opacity = 0;
    currentAsset.emissiveBoost = 0;
    currentAsset.rotationIntroOffset = -0.18;

    assetRig.add(currentAsset.group);
    currentAsset.group.visible = false;
    currentAsset.group.position.copy(poses.start);
    currentAsset.group.scale.setScalar(poses.startScale);

    courierGroup.visible = true;
    courierGroup.position.set(courierPath.entry.x, courierPath.entry.y, courierPath.entry.z);
    courierState.opacity = 0.98;
    courierState.glow = 0.12;
    courierState.highlight = 0.02;
    courierState.scaleX = 1;
    courierState.scaleY = 1;
    courierState.scaleZ = 1;
    membraneState.pulse = 0;
    membraneState.flash = 0;

    await new Promise((resolve) => {
      let settled = false;

      const finish = () => {
        if (settled) {
          return;
        }

        settled = true;

        if (sequenceTimeline) {
          sequenceTimeline = null;
        }

        if (resolveSequenceTimeline === finish) {
          resolveSequenceTimeline = null;
        }

        resolve();
      };

      resolveSequenceTimeline = finish;

      sequenceTimeline = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        onComplete: finish,
      });

      sequenceTimeline
        .to(
          courierGroup.position,
          {
            x: courierPath.near.x,
            y: courierPath.near.y,
            z: courierPath.near.z,
            duration: sequence.approachDuration * 0.78,
            ease: "power1.inOut",
          },
          0,
        )
        .to(
          courierGroup.position,
          {
            x: courierPath.contact.x,
            y: courierPath.contact.y,
            z: courierPath.contact.z,
            duration: sequence.approachDuration * 0.22,
            ease: "power3.in",
          },
          sequence.approachDuration * 0.78,
        )
        .to(
          courierState,
          {
            glow: 0.18,
            highlight: 0.08,
            duration: sequence.approachDuration * 0.62,
            ease: "sine.inOut",
          },
          0.16,
        )
        .to(
          courierState,
          {
            scaleX: 0.68,
            scaleY: 1.16,
            scaleZ: 1.14,
            highlight: 0.28,
            duration: sequence.contactDuration,
            ease: "power3.out",
          },
          contactTime,
        )
        .to(
          membraneState,
          {
            pulse: 1,
            flash: 1,
            duration: sequence.contactDuration * 0.72,
            ease: "power2.out",
          },
          contactTime,
        )
        .to(
          courierGroup.position,
          {
            x: courierPath.through.x,
            y: courierPath.through.y,
            z: courierPath.through.z,
            duration: sequence.transferDuration,
            ease: "power2.out",
          },
          transferTime,
        )
        .to(
          courierState,
          {
            opacity: 0.02,
            glow: 0.04,
            scaleX: 0.48,
            scaleY: 1.22,
            scaleZ: 1.18,
            highlight: 0.18,
            duration: sequence.transferDuration * 0.78,
            ease: "power2.in",
          },
          transferTime,
        )
        .to(
          courierGroup.position,
          {
            x: courierPath.fade.x,
            y: courierPath.fade.y,
            z: courierPath.fade.z,
            duration: sequence.transferDuration * 0.42,
            ease: "power1.out",
          },
          transferTime + sequence.transferDuration * 0.58,
        )
        .to(
          membraneState,
          {
            pulse: 0.18,
            flash: 0.4,
            duration: sequence.transferDuration * 0.56,
            ease: "power2.out",
          },
          transferTime + 0.08,
        )
        .to(
          membraneState,
          {
            pulse: 0,
            flash: 0,
            duration: sequence.revealDuration * 0.86,
            ease: "sine.out",
          },
          emergenceTime,
        )
        .set(currentAsset.group, { visible: true }, emergenceTime)
        .to(
          currentAsset,
          {
            opacity: 1,
            emissiveBoost: 0.16,
            rotationIntroOffset: 0,
            duration: sequence.revealDuration,
            ease: "power3.out",
          },
          emergenceTime,
        )
        .to(
          currentAsset.group.position,
          {
            x: poses.hold.x,
            y: poses.hold.y,
            z: poses.hold.z,
            duration: sequence.revealDuration,
            ease: "power3.out",
          },
          emergenceTime,
        )
        .to(
          currentAsset.group.scale,
          {
            x: poses.holdScale,
            y: poses.holdScale,
            z: poses.holdScale,
            duration: sequence.revealDuration,
            ease: "power3.out",
          },
          emergenceTime,
        )
        .to(
          currentAsset,
          {
            emissiveBoost: 0.02,
            duration: sequence.revealDuration * 1.06,
            ease: "power2.out",
          },
          emergenceTime + 0.08,
        )
        .to(
          courierState,
          {
            opacity: 0,
            glow: 0,
            highlight: 0,
            scaleX: 1,
            scaleY: 1,
            scaleZ: 1,
            duration: 0.42,
            ease: "power2.out",
          },
          emergenceTime + 0.16,
        )
        .to(
          currentAsset.group.position,
          {
            x: poses.drift.x,
            y: poses.drift.y,
            z: poses.drift.z,
            duration: sequence.driftDuration,
            ease: "sine.inOut",
          },
          driftTime,
        )
        .to(
          currentAsset.group.scale,
          {
            x: poses.driftScale,
            y: poses.driftScale,
            z: poses.driftScale,
            duration: sequence.driftDuration,
            ease: "sine.inOut",
          },
          driftTime,
        )
        .to(
          currentAsset,
          {
            emissiveBoost: 0,
            duration: sequence.driftDuration * 0.68,
            ease: "sine.out",
          },
          driftTime + 0.16,
        )
        .to(
          currentAsset,
          {
            opacity: 0,
            duration: sequence.fadeDuration,
            ease: "power1.inOut",
          },
          fadeTime,
        )
        .to(
          currentAsset.group.position,
          {
            x: poses.fade.x,
            y: poses.fade.y,
            z: poses.fade.z,
            duration: sequence.fadeDuration,
            ease: "power1.in",
          },
          fadeTime,
        )
        .to(
          currentAsset.group.scale,
          {
            x: poses.fadeScale,
            y: poses.fadeScale,
            z: poses.fadeScale,
            duration: sequence.fadeDuration,
            ease: "power1.in",
          },
          fadeTime,
        );
    });

    if (isDestroyed || token !== playbackToken) {
      return;
    }

    courierGroup.visible = false;
    disposeCurrentAsset();
  }

  async function runSequenceLoop(startKey, token) {
    let assetIndex = resolveSequenceAssetIndex(startKey);

    while (!isDestroyed && token === playbackToken) {
      const nextKey = curatedHeroAssetKeys[assetIndex];
      currentAssetKey = nextKey;

      try {
        await playSequenceCycle(nextKey, token);
      } catch (error) {
        if (token !== playbackToken || isDestroyed) {
          return;
        }

        console.error("REAL RUST hero courier sequence failed.", error);
      }

      if (isDestroyed || token !== playbackToken) {
        return;
      }

      if (heroConfig.sequence.gapDuration > 0) {
        await delay(heroConfig.sequence.gapDuration * 1000);
      }

      assetIndex = (assetIndex + 1) % curatedHeroAssetKeys.length;
    }
  }

  function setAsset(nextAssetKey = defaultHeroAssetKey) {
    const resolvedKey = getHeroAssetSpec(nextAssetKey).key;
    currentAssetKey = resolvedKey;
    const token = restartPlayback();

    if (reducedMotion) {
      showStaticAsset(resolvedKey, token).catch((error) => {
        console.error("REAL RUST hero asset failed to load.", error);
      });

      return Promise.resolve(resolvedKey);
    }

    runSequenceLoop(resolvedKey, token).catch((error) => {
      if (!isDestroyed && token === playbackToken) {
        console.error("REAL RUST hero sequence failed to start.", error);
      }
    });

    return Promise.resolve(resolvedKey);
  }

  function preloadAssets(keys) {
    if (isDestroyed) {
      return Promise.resolve([]);
    }

    return preloadHeroAssets(keys);
  }

  function applyCompositionPreset(preset) {
    applyVector3(ribbonBasePosition, preset.ribbon.position);
    applyEuler(ribbonBaseRotation, preset.ribbon.rotation);
    ribbon.position.copy(ribbonBasePosition);
    ribbon.rotation.copy(ribbonBaseRotation);
    ribbon.scale.set(preset.ribbon.scale.x, preset.ribbon.scale.y, preset.ribbon.scale.z);

    applyVector3(membraneBasePosition, preset.membrane.position);
    applyEuler(membraneBaseRotation, preset.membrane.rotation);
    membraneRig.position.copy(membraneBasePosition);
    membraneRig.rotation.copy(membraneBaseRotation);

    applyVector3(panePrimaryBasePosition, preset.panes.primary.position);
    applyEuler(panePrimaryBaseRotation, preset.panes.primary.rotation);
    panePrimary.position.copy(panePrimaryBasePosition);
    panePrimary.rotation.copy(panePrimaryBaseRotation);

    applyVector3(paneSecondaryBasePosition, preset.panes.secondary.position);
    applyEuler(paneSecondaryBaseRotation, preset.panes.secondary.rotation);
    paneSecondary.position.copy(paneSecondaryBasePosition);
    paneSecondary.rotation.copy(paneSecondaryBaseRotation);

    applyVector3(chromeSphereBasePosition, preset.spheres.chrome);
    chromeSphere.position.copy(chromeSphereBasePosition);
    applyVector3(glassSphereBasePosition, preset.spheres.glass);
    glassSphere.position.copy(glassSphereBasePosition);
    applyVector3(pearlSphereBasePosition, preset.spheres.pearl);
    pearlSphere.position.copy(pearlSphereBasePosition);
  }

  resize();
  startIntro();
  setAsset(assetKey);
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
      return currentAssetKey;
    },
    destroy() {
      isDestroyed = true;
      restartPlayback();
      window.cancelAnimationFrame(animationFrame);
      introTimeline?.kill();

      if (interactionTarget instanceof EventTarget) {
        interactionTarget.removeEventListener("pointermove", handlePointerMove);
        interactionTarget.removeEventListener("pointerleave", handlePointerLeave);
      }

      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener("resize", resize);
      }

      glowTexture.dispose();
      environmentTarget.dispose();
      environmentScene.dispose?.();
      pmremGenerator.dispose();
      postprocessing.composer.dispose?.();
      clearHeroAssetCache();

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

function createDustCloud(material, count = heroConfig.dust.count) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);

  for (let index = 0; index < count; index += 1) {
    const stride = index * 3;
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.pow(Math.random(), 0.9) * heroConfig.dust.radius;
    const height = (Math.random() - 0.5) * heroConfig.dust.height;

    positions[stride] = Math.cos(angle) * radius;
    positions[stride + 1] = height;
    positions[stride + 2] = Math.sin(angle) * radius - 1.6;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  return new THREE.Points(geometry, material);
}

function createEllipseSlabGeometry(radiusX, radiusY, depth, bevelSize, bevelThickness) {
  const shape = new THREE.Shape();
  shape.absellipse(0, 0, radiusX, radiusY, 0, Math.PI * 2, false, 0);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 8,
    steps: 1,
    curveSegments: 64,
    bevelSize,
    bevelThickness,
  });

  geometry.center();
  return geometry;
}

function createRoundedRectFrameGeometry(width, height, radius, frame, depth) {
  const shape = new THREE.Shape();
  const outerX = -width * 0.5;
  const outerY = -height * 0.5;
  addRoundedRectPath(shape, outerX, outerY, width, height, radius);

  const innerWidth = width - frame * 2;
  const innerHeight = height - frame * 2;
  const innerRadius = Math.max(radius - frame * 0.65, 0.02);
  const hole = new THREE.Path();

  addRoundedRectPath(
    hole,
    -innerWidth * 0.5,
    -innerHeight * 0.5,
    innerWidth,
    innerHeight,
    innerRadius,
  );

  shape.holes.push(hole);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    steps: 1,
    curveSegments: 40,
  });

  geometry.center();
  return geometry;
}

function createEllipseFrameGeometry(radiusX, radiusY, frame, depth) {
  const shape = new THREE.Shape();
  shape.absellipse(0, 0, radiusX, radiusY, 0, Math.PI * 2, false, 0);

  const hole = new THREE.Path();
  hole.absellipse(
    0,
    0,
    Math.max(radiusX - frame, 0.02),
    Math.max(radiusY - frame, 0.02),
    0,
    Math.PI * 2,
    false,
    0,
  );
  shape.holes.push(hole);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    steps: 1,
    curveSegments: 64,
  });

  geometry.center();
  return geometry;
}

function addRoundedRectPath(target, x, y, width, height, radius) {
  const clampedRadius = Math.min(radius, width * 0.5, height * 0.5);
  const maxX = x + width;
  const maxY = y + height;

  target.moveTo(x + clampedRadius, y);
  target.lineTo(maxX - clampedRadius, y);
  target.quadraticCurveTo(maxX, y, maxX, y + clampedRadius);
  target.lineTo(maxX, maxY - clampedRadius);
  target.quadraticCurveTo(maxX, maxY, maxX - clampedRadius, maxY);
  target.lineTo(x + clampedRadius, maxY);
  target.quadraticCurveTo(x, maxY, x, maxY - clampedRadius);
  target.lineTo(x, y + clampedRadius);
  target.quadraticCurveTo(x, y, x + clampedRadius, y);
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

function disposeMaterial(material) {
  if (Array.isArray(material)) {
    for (const entry of material) {
      disposeMaterial(entry);
    }

    return;
  }

  material.dispose();
}

function createPostProcessing({ renderer, scene, camera, width, height, qualityProfile }) {
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio?.(getRendererPixelRatio(window.devicePixelRatio, qualityProfile));
  composer.setSize(width, height);

  const renderPass = new RenderPass(scene, camera);
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(width, height),
    qualityProfile.bloomStrength,
    qualityProfile.bloomRadius,
    qualityProfile.bloomThreshold,
  );
  const finishPass = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      uTime: { value: 0 },
      uRgbShift: { value: qualityProfile.rgbShift },
      uVignette: { value: qualityProfile.vignette },
      uGrain: { value: qualityProfile.grain },
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
        vec2 shift = centered * uRgbShift;

        vec4 base = texture2D(tDiffuse, vUv);
        vec4 red = texture2D(tDiffuse, vUv + shift);
        vec4 blue = texture2D(tDiffuse, vUv - shift);

        vec3 color = vec3(red.r, base.g, blue.b);
        float vignette = smoothstep(0.06, 0.88, dot(centered, centered) * 3.2);
        float grain = random(vUv * vec2(921.47, 471.82) + uTime * 0.05) - 0.5;

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

function getQualityProfile(width, reducedMotion) {
  const { mobileBreakpoint, tabletBreakpoint } = heroConfig.quality;
  const isMobile = width <= mobileBreakpoint;
  const isTablet = width <= tabletBreakpoint;

  return {
    isMobile,
    isTablet,
    ringSegments: isMobile ? 220 : isTablet ? 280 : 320,
    tubeSegments: isMobile ? 30 : isTablet ? 38 : 44,
    heroSphereSegments: isMobile ? 48 : isTablet ? 56 : 72,
    sphereSegments: isMobile ? 36 : isTablet ? 44 : 52,
    smallSphereSegments: isMobile ? 28 : isTablet ? 34 : 40,
    dustCount: reducedMotion ? 24 : isMobile ? 52 : isTablet ? 72 : heroConfig.dust.count,
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
    interactionStrength: reducedMotion ? 0 : isMobile ? 0.52 : isTablet ? 0.72 : 1,
    atmosphereStrength: reducedMotion ? 0.12 : isMobile ? 0.6 : isTablet ? 0.82 : 1,
    pixelRatioCap: isMobile
      ? heroConfig.renderer.mobileMaxPixelRatio
      : isTablet
        ? heroConfig.renderer.tabletMaxPixelRatio
        : heroConfig.renderer.maxPixelRatio,
  };
}

function getCompositionPreset(width) {
  if (width <= heroConfig.quality.mobileBreakpoint) {
    return heroConfig.composition.mobile;
  }

  if (width <= heroConfig.quality.tabletBreakpoint) {
    return heroConfig.composition.tablet;
  }

  if (width <= heroConfig.quality.laptopBreakpoint) {
    return heroConfig.composition.laptop;
  }

  return heroConfig.composition.desktop;
}

function getRendererPixelRatio(devicePixelRatio, qualityProfile) {
  return Math.min(devicePixelRatio, qualityProfile.pixelRatioCap);
}

function applyVector3(target, source) {
  target.set(source.x, source.y, source.z);
}

function applyEuler(target, source) {
  target.set(source.x, source.y, source.z);
}

function resolveSequenceAssetIndex(key) {
  const assetIndex = curatedHeroAssetKeys.indexOf(getHeroAssetSpec(key).key);
  return assetIndex === -1 ? 0 : assetIndex;
}

function delay(duration) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });
}
