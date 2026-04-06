import * as THREE from "three/webgpu";
import {
  Fn,
  abs,
  clamp,
  float,
  length,
  screenUV,
  smoothstep,
  texture3D,
  time,
  uniform,
  vec2,
  vec3,
} from "three/tsl";
import { ImprovedNoise } from "three/examples/jsm/math/ImprovedNoise.js";
import { RectAreaLightTexturesLib } from "three/examples/jsm/lights/RectAreaLightTexturesLib.js";

import { heroGaussianBlur } from "./HeroGaussianBlurNode.js";
import { heroWebGPUPostProcessingConfig } from "./heroWebGPUPostProcessingConfig.js";

const NOISE_TEXTURE_CACHE = new Map();
const _renderSize = new THREE.Vector2();
const _lightTarget = new THREE.Vector3();
let hasInitializedRectAreaLTC = false;

export function createHeroWebGPUVolumetricLighting(
  camera,
  { viewportKey = "desktop", reducedMotion = false } = {},
) {
  initializeRectAreaLightLTC();

  const config = heroWebGPUPostProcessingConfig.volumetricLighting;
  let activeViewportKey = viewportKey;
  let quality = resolveVolumetricQualityConfig(activeViewportKey, reducedMotion);

  const volumetricScene = new THREE.Scene();
  volumetricScene.name = "webgpuVolumetricScene";

  const mainLightRig = new THREE.Group();
  mainLightRig.name = "webgpuVolumetricMainLightRig";

  const volumetricLightRig = new THREE.Group();
  volumetricLightRig.name = "webgpuVolumetricLightRig";
  volumetricScene.add(volumetricLightRig);

  const noiseTexture = getNoiseTexture3D(quality.textureSize, config.field.noise);
  const smokeAmount = uniform(config.field.smoke.idle);
  const blurAmount = uniform(quality.blurAmount);
  const volumetricIntensity = uniform(0);
  const volumeMaterial = new THREE.VolumeNodeMaterial();
  volumeMaterial.steps = quality.steps;
  volumeMaterial.scatteringNode = createScatteringNode(noiseTexture, config, smokeAmount);

  const volumeMesh = new THREE.Mesh(
    new THREE.BoxGeometry(config.field.size.x, config.field.size.y, config.field.size.z),
    volumeMaterial,
  );
  volumeMesh.name = "webgpuVolumetricField";
  volumeMesh.position.set(
    config.field.position.x,
    config.field.position.y,
    config.field.position.z,
  );
  volumeMesh.visible = quality.enabled;
  volumetricScene.add(volumeMesh);

  const lightPairs = [
    createRectAreaLightPair("cool", config.lights.cool),
    createRectAreaLightPair("warm", config.lights.warm),
  ];

  for (const pair of lightPairs) {
    mainLightRig.add(pair.main);
    volumetricLightRig.add(pair.volumetric);
  }

  let volumetricPass = null;
  let blurredVolumetricPass = null;

  applyQuality();

  return {
    volumetricScene,
    mainLightRig,
    createCompositeNode(scenePass) {
      volumeMaterial.depthNode = scenePass.getTextureNode("depth").sample(screenUV);

      if (!volumetricPass) {
        volumetricPass = new ScaledPassNode(volumetricScene, camera, {
          depthBuffer: false,
          resolutionScale: quality.resolutionScale,
        });
      }

      if (!blurredVolumetricPass) {
        blurredVolumetricPass = heroGaussianBlur(volumetricPass, blurAmount);
      }

      volumetricPass.setResolutionScale(quality.resolutionScale);
      return scenePass.add(blurredVolumetricPass.mul(volumetricIntensity));
    },
    update({
      elapsed = 0,
      pointer = { x: 0, y: 0 },
      membraneEnergy = 0,
      objectEnergy = 0,
      viewportKey: nextViewportKey = activeViewportKey,
    } = {}) {
      if (nextViewportKey !== activeViewportKey) {
        activeViewportKey = nextViewportKey;
        applyQuality();
      }

      const membraneSignal = THREE.MathUtils.clamp(membraneEnergy, 0, 1);
      const objectSignal = THREE.MathUtils.clamp(objectEnergy, 0, 1);
      const mainLightScale = 0.72 + (quality.volumeIntensityScale ?? 1) * 0.28;
      const motionScale = quality.motionScale ?? 1;
      const volumeSignal = quality.enabled ? 1 : 0;

      volumeMesh.visible = volumeSignal > 0;
      blurAmount.value = quality.blurAmount;
      volumetricIntensity.value = volumeSignal
        ? Math.min(
            config.field.intensity.max,
            (config.field.intensity.idle +
              membraneSignal * config.field.intensity.membraneBoost +
              objectSignal * config.field.intensity.objectBoost) *
              (quality.volumeIntensityScale ?? 1),
          )
        : 0;
      smokeAmount.value = volumeSignal
        ? Math.min(
            config.field.smoke.max,
            (config.field.smoke.idle +
              membraneSignal * config.field.smoke.membraneBoost +
              objectSignal * config.field.smoke.objectBoost) *
              (quality.smokeScale ?? 1),
          )
        : 0;

      if (volumetricPass) {
        volumetricPass.setResolutionScale(quality.resolutionScale);
      }

      for (const pair of lightPairs) {
        syncLightPair(pair, {
          elapsed,
          pointer,
          membraneSignal,
          objectSignal,
          motionScale,
          mainLightScale,
          volumeIntensityScale: quality.volumeIntensityScale ?? 1,
        });
      }
    },
    dispose() {
      volumetricPass?.dispose?.();
      blurredVolumetricPass?.dispose?.();
    },
  };

  function applyQuality() {
    quality = resolveVolumetricQualityConfig(activeViewportKey, reducedMotion);
    volumeMaterial.steps = quality.steps;
    volumeMaterial.needsUpdate = true;
    volumeMesh.visible = quality.enabled;
    blurAmount.value = quality.blurAmount;

    if (volumetricPass) {
      volumetricPass.setResolutionScale(quality.resolutionScale);
    }
  }
}

class ScaledPassNode extends THREE.PassNode {
  constructor(scene, camera, { resolutionScale = 1, ...options } = {}) {
    super(THREE.PassNode.COLOR, scene, camera, options);

    this.resolutionScale = resolutionScale;
  }

  setResolutionScale(value = 1) {
    this.resolutionScale = value;
    return this;
  }

  updateBefore(frame) {
    const { renderer } = frame;

    this._pixelRatio = renderer.getPixelRatio() * this.resolutionScale;

    const size = renderer.getSize(_renderSize);
    this.setSize(size.width, size.height);

    const currentRenderTarget = renderer.getRenderTarget();
    const currentMRT = renderer.getMRT();

    this._cameraNear.value = this.camera.near;
    this._cameraFar.value = this.camera.far;

    for (const name in this._previousTextures) {
      this.toggleTexture(name);
    }

    renderer.setRenderTarget(this.renderTarget);
    renderer.setMRT(this._mrt);
    renderer.render(this.scene, this.camera);
    renderer.setRenderTarget(currentRenderTarget);
    renderer.setMRT(currentMRT);
  }
}

function initializeRectAreaLightLTC() {
  if (hasInitializedRectAreaLTC) {
    return;
  }

  THREE.RectAreaLightNode.setLTC(RectAreaLightTexturesLib.init());
  hasInitializedRectAreaLTC = true;
}

function createRectAreaLightPair(key, lightConfig) {
  const main = new THREE.RectAreaLight(
    lightConfig.color,
    lightConfig.intensity,
    lightConfig.width,
    lightConfig.height,
  );
  main.name = `webgpu${capitalize(key)}RectAreaLight`;

  const volumetric = new THREE.RectAreaLight(
    lightConfig.color,
    lightConfig.volumetricIntensity,
    lightConfig.width,
    lightConfig.height,
  );
  volumetric.name = `webgpu${capitalize(key)}RectAreaLightVolume`;

  return {
    key,
    config: lightConfig,
    main,
    volumetric,
  };
}

function syncLightPair(
  pair,
  {
    elapsed,
    pointer,
    membraneSignal,
    objectSignal,
    motionScale,
    mainLightScale,
    volumeIntensityScale,
  },
) {
  const { config, main, volumetric } = pair;
  const orbit = config.orbitAmount;
  const response = config.response;
  const motion = config.motion;
  const angle = elapsed * motion.speed * motionScale + motion.phase;
  const x =
    config.orbitCenter.x +
    Math.cos(angle) * orbit.x +
    pointer.x * (response.pointerX ?? 0);
  const y =
    config.orbitCenter.y +
    Math.sin(angle * 0.7 + motion.verticalPhase) * orbit.y -
    pointer.y * (response.pointerY ?? 0);
  const z = config.orbitCenter.z + Math.sin(angle) * orbit.z;
  const targetDrift = Math.sin(elapsed * 0.14 + motion.phase) * motion.targetDrift;
  const mainIntensity =
    config.intensity *
    mainLightScale *
    (1 +
      membraneSignal * (response.membraneBoost ?? 0) +
      objectSignal * (response.objectBoost ?? 0));
  const volumetricLightIntensity =
    config.volumetricIntensity *
    volumeIntensityScale *
    (1 +
      membraneSignal * (response.membraneBoost ?? 0.2) +
      objectSignal * (response.objectBoost ?? 0.12));

  main.position.set(x, y, z);
  volumetric.position.copy(main.position);

  _lightTarget.set(
    config.lookAt.x + pointer.x * 0.06 + targetDrift,
    config.lookAt.y - pointer.y * 0.04,
    config.lookAt.z,
  );

  main.lookAt(_lightTarget);
  volumetric.lookAt(_lightTarget);
  main.intensity = mainIntensity;
  volumetric.intensity = volumetricLightIntensity;
  volumetric.visible = volumetricLightIntensity > 0.001;
}

function resolveVolumetricQualityConfig(viewportKey, reducedMotion) {
  const config = heroWebGPUPostProcessingConfig.volumetricLighting;
  const qualityProfile = config.qualityProfiles[viewportKey] ?? config.qualityProfiles.desktop;
  const reducedMotionProfile = reducedMotion ? config.reducedMotion ?? {} : {};

  return {
    ...qualityProfile,
    ...reducedMotionProfile,
    volumeIntensityScale:
      (qualityProfile.volumeIntensityScale ?? 1) * (reducedMotionProfile.volumeIntensityScale ?? 1),
    smokeScale: (qualityProfile.smokeScale ?? 1) * (reducedMotionProfile.smokeScale ?? 1),
    motionScale: (qualityProfile.motionScale ?? 1) * (reducedMotionProfile.motionScale ?? 1),
    blurAmount: reducedMotionProfile.blurAmount ?? qualityProfile.blurAmount,
  };
}

function createScatteringNode(noiseTexture, config, smokeAmount) {
  const { field } = config;
  const size = field.size;
  const widthScale = 2 / size.x;
  const heightScale = 2 / size.y;
  const depthScale = 2 / size.z;
  const { noise } = field;

  return Fn(({ positionRay }) => {
    const drift = vec3(time.mul(noise.driftX), 0, time.mul(noise.driftZ));
    const secondaryDrift = vec3(time.mul(-noise.driftSecondaryZ), 0, time.mul(noise.driftX));
    const normalizedPosition = vec3(
      positionRay.x.mul(widthScale),
      positionRay.y.mul(heightScale),
      positionRay.z.mul(depthScale),
    );
    const sampleNoise = (scale, timeOffset) =>
      texture3D(noiseTexture, positionRay.add(timeOffset).mul(scale).mod(1), 0).r.add(0.5);

    let density = sampleNoise(noise.coarseScale, drift);
    density = density.mul(sampleNoise(noise.mediumScale, drift.mul(0.72)));
    density = density.mul(sampleNoise(noise.fineScale, secondaryDrift.mul(1.4)));

    const radialMask = float(1).sub(
      smoothstep(
        0.62,
        1.18,
        length(vec2(normalizedPosition.x.mul(0.9), normalizedPosition.y.mul(1.05))),
      ),
    );
    const depthMask = float(1).sub(
      smoothstep(0.2, 1.02, abs(normalizedPosition.z).mul(1.18)),
    );
    const shapedDensity = clamp(density.mul(radialMask).mul(depthMask), 0, 1);

    return smokeAmount.mix(1, shapedDensity);
  });
}

function getNoiseTexture3D(size, noiseConfig) {
  const cacheKey = `${size}:${noiseConfig.scale}:${noiseConfig.repeat}`;
  const cachedTexture = NOISE_TEXTURE_CACHE.get(cacheKey);

  if (cachedTexture) {
    return cachedTexture;
  }

  let index = 0;
  const data = new Uint8Array(size * size * size);
  const perlin = new ImprovedNoise();

  for (let z = 0; z < size; z += 1) {
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const nx = (x / size) * noiseConfig.repeat;
        const ny = (y / size) * noiseConfig.repeat;
        const nz = (z / size) * noiseConfig.repeat;
        const noiseValue = perlin.noise(
          nx * noiseConfig.scale,
          ny * noiseConfig.scale,
          nz * noiseConfig.scale,
        );

        data[index] = 128 + 128 * noiseValue;
        index += 1;
      }
    }
  }

  const texture = new THREE.Data3DTexture(data, size, size, size);
  texture.format = THREE.RedFormat;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.wrapR = THREE.RepeatWrapping;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;

  NOISE_TEXTURE_CACHE.set(cacheKey, texture);
  return texture;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
