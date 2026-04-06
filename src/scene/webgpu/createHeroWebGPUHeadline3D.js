import * as THREE from "three/webgpu";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import helvetikerRegular from "three/examples/fonts/helvetiker_regular.typeface.json";

import { heroWebGPUPostProcessingConfig } from "./heroWebGPUPostProcessingConfig.js";

const fontLoader = new FontLoader();
const headlineFont = fontLoader.parse(helvetikerRegular);

export function createHeroWebGPUHeadline3D({
  viewportKey = "desktop",
  reducedMotion = false,
} = {}) {
  const config = heroWebGPUPostProcessingConfig.headline3D;
  let activeViewportKey = viewportKey;
  let quality = resolveHeadlineQuality(activeViewportKey, reducedMotion);

  const basePosition = new THREE.Vector3(
    config.placement.position.x,
    config.placement.position.y,
    config.placement.position.z,
  );
  const baseRotation = new THREE.Euler(
    config.placement.rotation.x,
    config.placement.rotation.y,
    config.placement.rotation.z,
  );
  const coolBaseColor = new THREE.Color(config.material.color);
  const coolLiftColor = new THREE.Color(config.material.coolLift);
  const warmBaseColor = new THREE.Color(config.material.color);
  const warmLiftColor = new THREE.Color(config.material.warmLift);

  const group = new THREE.Group();
  group.name = "webgpuHeadline3D";
  group.position.copy(basePosition);
  group.rotation.copy(baseRotation);

  const materials = [
    createHeadlineMaterial(coolBaseColor),
    createHeadlineMaterial(warmBaseColor),
  ];
  const lines = config.lines.map((line, index) => {
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), materials[index]);
    mesh.name = `webgpuHeadline3DLine${index + 1}`;
    mesh.position.y = line.y;
    mesh.position.z = -index * 0.025;
    group.add(mesh);

    return {
      ...line,
      mesh,
      baseMaterialColor: index === 0 ? coolBaseColor : warmBaseColor,
      accentColor: index === 0 ? coolLiftColor : warmLiftColor,
    };
  });

  rebuildGeometries();
  applyQuality();

  return {
    group,
    update({
      elapsed = 0,
      pointer = { x: 0, y: 0 },
      membraneEnergy = 0,
      objectEnergy = 0,
      viewportKey: nextViewportKey = activeViewportKey,
    } = {}) {
      if (nextViewportKey !== activeViewportKey) {
        activeViewportKey = nextViewportKey;
        quality = resolveHeadlineQuality(activeViewportKey, reducedMotion);
        rebuildGeometries();
        applyQuality();
      }

      if (!quality.enabled) {
        group.visible = false;
        return;
      }

      const membraneSignal = THREE.MathUtils.clamp(membraneEnergy, 0, 1);
      const objectSignal = THREE.MathUtils.clamp(objectEnergy, 0, 1);
      const motionScale = quality.motionScale ?? 1;
      const accentStrength = THREE.MathUtils.clamp(
        membraneSignal * config.motion.membraneBoost + objectSignal * config.motion.objectBoost,
        0,
        0.18,
      );

      group.visible = true;
      group.position.set(
        basePosition.x +
          pointer.x * config.motion.parallaxX +
          Math.sin(elapsed * 0.22) * config.motion.floatX * motionScale,
        basePosition.y -
          pointer.y * config.motion.parallaxY +
          Math.sin(elapsed * 0.18 + 0.3) * config.motion.floatY * motionScale,
        basePosition.z,
      );
      group.rotation.set(
        baseRotation.x - pointer.y * 0.025,
        baseRotation.y +
          pointer.x * config.motion.rotateY +
          Math.sin(elapsed * 0.12 + 0.6) * 0.04 * motionScale,
        baseRotation.z,
      );

      for (const line of lines) {
        line.mesh.material.opacity =
          config.material.opacity *
          (quality.opacityScale ?? 1) *
          (1 + accentStrength * 1.2);
        line.mesh.material.envMapIntensity = config.material.envMapIntensity + accentStrength * 0.34;
        line.mesh.material.color.copy(line.baseMaterialColor).lerp(line.accentColor, accentStrength);
      }
    },
    dispose() {
      for (const line of lines) {
        line.mesh.geometry.dispose();
        line.mesh.material.dispose();
      }
    },
  };

  function applyQuality() {
    group.visible = quality.enabled;
    group.scale.setScalar(quality.scale ?? 1);

    for (const line of lines) {
      line.mesh.position.y = line.y;
      line.mesh.material.opacity =
        config.material.opacity * (quality.opacityScale ?? 1);
    }
  }

  function rebuildGeometries() {
    for (const line of lines) {
      line.mesh.geometry.dispose();
      line.mesh.geometry = createCenteredTextGeometry(line.text, quality);
    }
  }
}

function createHeadlineMaterial(color) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: heroWebGPUPostProcessingConfig.headline3D.material.metalness,
    roughness: heroWebGPUPostProcessingConfig.headline3D.material.roughness,
    clearcoat: heroWebGPUPostProcessingConfig.headline3D.material.clearcoat,
    clearcoatRoughness: heroWebGPUPostProcessingConfig.headline3D.material.clearcoatRoughness,
    envMapIntensity: heroWebGPUPostProcessingConfig.headline3D.material.envMapIntensity,
    transparent: true,
    opacity: heroWebGPUPostProcessingConfig.headline3D.material.opacity,
    depthWrite: true,
    side: THREE.DoubleSide,
  });
}

function createCenteredTextGeometry(text, quality) {
  const geometry = new TextGeometry(text, {
    font: headlineFont,
    size: quality.size,
    depth: quality.depth,
    curveSegments: quality.curveSegments,
    bevelEnabled: quality.bevelEnabled,
    bevelThickness: quality.bevelThickness,
    bevelSize: quality.bevelSize,
    bevelSegments: quality.bevelSegments,
  });

  geometry.computeBoundingBox();

  if (geometry.boundingBox) {
    const centerX = (geometry.boundingBox.min.x + geometry.boundingBox.max.x) * 0.5;
    geometry.translate(-centerX, -geometry.boundingBox.min.y, 0);
  }

  return geometry;
}

function resolveHeadlineQuality(viewportKey, reducedMotion) {
  const config = heroWebGPUPostProcessingConfig.headline3D;
  const qualityProfile = config.qualityProfiles[viewportKey] ?? config.qualityProfiles.desktop;
  const reducedMotionProfile = reducedMotion ? config.reducedMotion ?? {} : {};

  return {
    ...qualityProfile,
    ...reducedMotionProfile,
    opacityScale: (qualityProfile.opacityScale ?? 1) * (reducedMotionProfile.opacityScale ?? 1),
    motionScale: reducedMotionProfile.motionScale ?? 1,
  };
}
