import * as THREE from "three";

import { applyHeroBlobMaterial, createHeroBlobMaterial } from "../materials.js";
import { attachBlobFieldShader, updateBlobFieldShader } from "../shaders/blobFieldShader.js";

const DEFAULT_QUALITY = {
  enabled: true,
  count: 2,
  detail: 4,
};

const TAU = Math.PI * 2;

export class BlobFieldController {
  constructor({ config, palette }) {
    this.config = config;
    this.palette = palette;
    this.group = new THREE.Group();
    this.group.name = "blobField";

    this.layout = null;
    this.entries = [];
    this.activeCount = 0;
    this.quality = {
      ...DEFAULT_QUALITY,
      ...config?.quality,
    };
    this.baseMaterial = createHeroBlobMaterial(palette, config);
    this.geometry = createBlobGeometry(this.quality.detail);

    this.setConfig(config);
  }

  setConfig(config) {
    this.config = config;

    const nextQuality = {
      ...DEFAULT_QUALITY,
      ...config?.quality,
    };
    const detailChanged = nextQuality.detail !== this.quality.detail;

    applyHeroBlobMaterial(this.baseMaterial, this.palette, this.config);

    if (detailChanged) {
      const nextGeometry = createBlobGeometry(nextQuality.detail);
      this.syncGeometry(nextGeometry);
      this.geometry.dispose();
      this.geometry = nextGeometry;
    }

    this.quality = nextQuality;
    this.syncBlobPool(nextQuality.count ?? 0);
    this.refreshEntries();
  }

  setLayout(responsiveProfile) {
    this.layout = responsiveProfile;
    this.refreshEntries();
  }

  update({
    elapsed,
    pointer = { x: 0, y: 0 },
    introProgress = 1,
    motionScale = 1,
    interactionStrength = 1,
  }) {
    if (!this.activeCount || !this.group.visible) {
      return;
    }

    const motion = this.config.motion ?? {};
    const deformation = this.config.deformation ?? {};
    const introEnvelope = THREE.MathUtils.lerp(
      this.config.introOpacityFloor ?? 0.78,
      1,
      introProgress,
    );
    const pointerEnvelope = introProgress * interactionStrength;
    const motionEnvelope = 0.48 + motionScale * 0.52;

    this.group.position.x = pointer.x * (motion.groupParallaxX ?? 0.05) * pointerEnvelope;
    this.group.position.y = -pointer.y * (motion.groupParallaxY ?? 0.036) * pointerEnvelope;
    this.group.rotation.y = pointer.x * (motion.groupYaw ?? 0.032) * pointerEnvelope;
    this.group.rotation.x = -pointer.y * (motion.groupPitch ?? 0.018) * pointerEnvelope;

    for (let index = 0; index < this.activeCount; index += 1) {
      const entry = this.entries[index];
      const driftPhase = elapsed * entry.driftSpeed + entry.phase;
      const rotationPhase = elapsed * entry.rotationSpeed + entry.phase * 0.74;
      const scalePulse =
        1 +
        Math.sin(elapsed * entry.scaleSpeed + entry.phase * 1.28) *
          entry.scaleBreath *
          motionScale;

      entry.mesh.position.set(
        entry.basePosition.x +
          Math.sin(driftPhase) * entry.drift.x * motionEnvelope +
          pointer.x * entry.parallax.x * pointerEnvelope,
        entry.basePosition.y +
          Math.cos(driftPhase * 0.82 + entry.phase * 0.52) *
            entry.drift.y *
            motionEnvelope -
          pointer.y * entry.parallax.y * pointerEnvelope,
        entry.basePosition.z +
          Math.sin(driftPhase * 0.61 + entry.phase * 0.34) *
            entry.drift.z *
            motionEnvelope,
      );
      entry.mesh.rotation.set(
        entry.rotationBase.x +
          Math.sin(rotationPhase) * entry.rotationDrift.x * motionEnvelope,
        entry.rotationBase.y +
          Math.cos(rotationPhase * 0.84 + entry.phase * 0.26) *
            entry.rotationDrift.y *
            motionEnvelope,
        entry.rotationBase.z +
          Math.sin(rotationPhase * 0.66 + entry.phase * 0.41) *
            entry.rotationDrift.z *
            motionEnvelope,
      );
      entry.mesh.scale.setScalar(entry.baseScale * scalePulse);
      entry.material.opacity = entry.opacityBase * introEnvelope;
      entry.material.transparent = entry.material.opacity < 0.999;
      entry.mesh.visible = entry.material.opacity > 0.002;

      if (entry.uniforms) {
        entry.uniforms.uTime.value = elapsed;
        entry.uniforms.uDeformIntensity.value =
          entry.deformIntensity * motionEnvelope * introEnvelope;
        entry.uniforms.uSurfaceIntensity.value =
          entry.surfaceIntensity * introEnvelope;
        entry.uniforms.uPulseStrength.value =
          (deformation.pulseStrength ?? 0.018) *
          entry.pulseStrength *
          (0.72 + motionScale * 0.28);
      }
    }
  }

  destroy() {
    this.baseMaterial.dispose();

    for (const entry of this.entries) {
      entry.material.dispose();
    }

    this.geometry.dispose();
  }

  syncBlobPool(targetSize) {
    while (this.entries.length < targetSize) {
      const material = this.baseMaterial.clone();
      const entry = createBlobEntry({
        index: this.entries.length,
        geometry: this.geometry,
        material,
      });

      attachBlobFieldShader(material, this.palette, this.config, entry.seed);
      entry.uniforms = material.userData.blobFieldUniforms ?? null;
      this.entries.push(entry);
      this.group.add(entry.mesh);
    }

    while (this.entries.length > targetSize) {
      const entry = this.entries.pop();

      if (!entry) {
        break;
      }

      this.group.remove(entry.mesh);
      entry.material.dispose();
    }

    this.activeCount = Math.min(this.activeCount, targetSize);
  }

  syncGeometry(nextGeometry) {
    for (const entry of this.entries) {
      entry.mesh.geometry = nextGeometry;
    }
  }

  refreshEntries() {
    const anchors = this.config.placement?.anchors ?? [];
    const membranePosition = this.layout?.chamber?.membrane?.position ?? null;
    const targetCount =
      this.quality.enabled === false
        ? 0
        : Math.min(this.quality.count ?? 0, anchors.length, this.entries.length);

    this.activeCount = targetCount;
    this.group.visible = targetCount > 0 && Boolean(membranePosition);

    if (!this.group.visible || !membranePosition) {
      for (const entry of this.entries) {
        entry.mesh.visible = false;
        entry.material.opacity = 0;
      }

      return;
    }

    const placement = this.config.placement ?? {};
    const appearance = this.config.appearance ?? {};
    const motion = this.config.motion ?? {};
    const depthShift = placement.depthShift ?? -1.92;
    const scaleMin = placement.scaleMin ?? 0.72;
    const scaleMax = placement.scaleMax ?? 1.08;

    for (let index = 0; index < this.entries.length; index += 1) {
      const entry = this.entries[index];

      if (index >= targetCount) {
        entry.mesh.visible = false;
        entry.material.opacity = 0;
        continue;
      }

      const anchor = anchors[index];
      const scaleNoise = THREE.MathUtils.lerp(scaleMin, scaleMax, hash01(index, 0.37));
      const driftScale = THREE.MathUtils.lerp(0.82, 1.18, hash01(index, 0.74));
      const parallaxScale = THREE.MathUtils.lerp(0.78, 1.12, hash01(index, 1.06));
      const rotationScale = THREE.MathUtils.lerp(0.82, 1.14, hash01(index, 1.42));

      entry.basePosition.set(
        membranePosition.x + (anchor.x ?? 0),
        membranePosition.y + (anchor.y ?? 0),
        membranePosition.z + (anchor.z ?? 0) + depthShift,
      );
      entry.baseScale = (anchor.scale ?? 1) * scaleNoise;
      entry.opacityBase =
        (appearance.opacity ?? 0.2) *
        (anchor.opacity ?? 1) *
        THREE.MathUtils.lerp(0.92, 1.04, hash01(index, 1.88));
      entry.phase = hash01(index, 2.14) * TAU;
      entry.animationSpeed = THREE.MathUtils.lerp(0.86, 1.16, hash01(index, 2.57));
      entry.driftSpeed = THREE.MathUtils.lerp(
        motion.driftSpeedMin ?? 0.05,
        motion.driftSpeedMax ?? 0.08,
        hash01(index, 2.91),
      );
      entry.rotationSpeed = THREE.MathUtils.lerp(
        motion.rotationSpeedMin ?? 0.04,
        motion.rotationSpeedMax ?? 0.07,
        hash01(index, 3.36),
      );
      entry.scaleSpeed = THREE.MathUtils.lerp(
        motion.scaleBreathSpeedMin ?? 0.08,
        motion.scaleBreathSpeedMax ?? 0.13,
        hash01(index, 3.82),
      );
      entry.scaleBreath =
        (motion.scaleBreath ?? 0.026) *
        THREE.MathUtils.lerp(0.76, 1.14, hash01(index, 4.11));
      entry.drift.set(
        (motion.driftX ?? 0.16) * driftScale,
        (motion.driftY ?? 0.1) * THREE.MathUtils.lerp(0.78, 1.12, hash01(index, 4.48)),
        (motion.driftZ ?? 0.12) * THREE.MathUtils.lerp(0.8, 1.1, hash01(index, 4.73)),
      );
      entry.parallax.set(
        (motion.pointerParallaxX ?? 0.05) * parallaxScale,
        (motion.pointerParallaxY ?? 0.034) *
          THREE.MathUtils.lerp(0.78, 1.08, hash01(index, 5.06)),
      );
      entry.rotationBase.set(
        hashCentered(index, 5.41) * 0.08,
        hashCentered(index, 5.73) * 0.12,
        hashCentered(index, 6.08) * 0.06,
      );
      entry.rotationDrift.set(
        (motion.rotationDriftX ?? 0.08) * rotationScale,
        (motion.rotationDriftY ?? 0.14) *
          THREE.MathUtils.lerp(0.82, 1.16, hash01(index, 6.42)),
        (motion.rotationDriftZ ?? 0.06) *
          THREE.MathUtils.lerp(0.82, 1.14, hash01(index, 6.77)),
      );
      entry.deformIntensity = THREE.MathUtils.lerp(0.84, 1.08, hash01(index, 7.04));
      entry.surfaceIntensity = THREE.MathUtils.lerp(0.88, 1.06, hash01(index, 7.31));
      entry.pulseStrength = THREE.MathUtils.lerp(0.84, 1.14, hash01(index, 7.62));
      entry.noiseScale = THREE.MathUtils.lerp(0.86, 1.12, hash01(index, 7.93));
      entry.twistScale = THREE.MathUtils.lerp(0.84, 1.14, hash01(index, 8.27));

      applyHeroBlobMaterial(entry.material, this.palette, this.config);
      updateBlobFieldShader(entry.material, this.palette, this.config, {
        seed: entry.seed,
        animationSpeed: entry.animationSpeed,
        noiseScale: entry.noiseScale,
        twistScale: entry.twistScale,
      });

      entry.mesh.position.copy(entry.basePosition);
      entry.mesh.rotation.copy(entry.rotationBase);
      entry.mesh.scale.setScalar(entry.baseScale);
      entry.mesh.visible = true;
    }
  }
}

function createBlobGeometry(detail = 4) {
  return new THREE.IcosahedronGeometry(1, Math.max(1, Math.round(detail)));
}

function createBlobEntry({ index, geometry, material }) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = `blobFieldSphere${index + 1}`;
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  mesh.visible = false;

  return {
    seed: index + 1 + hash01(index, 0.11),
    mesh,
    material,
    uniforms: null,
    basePosition: new THREE.Vector3(),
    drift: new THREE.Vector3(),
    parallax: new THREE.Vector2(),
    rotationBase: new THREE.Vector3(),
    rotationDrift: new THREE.Vector3(),
    baseScale: 1,
    opacityBase: 0,
    phase: 0,
    animationSpeed: 1,
    driftSpeed: 0.06,
    rotationSpeed: 0.05,
    scaleSpeed: 0.1,
    scaleBreath: 0.02,
    deformIntensity: 1,
    surfaceIntensity: 1,
    pulseStrength: 1,
    noiseScale: 1,
    twistScale: 1,
  };
}

function hash01(index, phase = 0) {
  const value = Math.sin(index * 127.1 + phase * 311.7) * 43758.5453123;
  return value - Math.floor(value);
}

function hashCentered(index, phase = 0) {
  return hash01(index, phase) * 2 - 1;
}
