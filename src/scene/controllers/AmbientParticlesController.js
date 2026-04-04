import * as THREE from "three";

const GOLDEN_RATIO = 0.61803398875;
const VERTICAL_BANDS = [0.14, 0.36, 0.6, 0.84];

export class AmbientParticlesController {
  constructor({ config, palette, reducedMotion = false }) {
    this.config = config;
    this.palette = palette;
    this.reducedMotion = reducedMotion;
    this.group = new THREE.Group();
    this.group.name = "ambientParticles";

    this.texture = createParticleTexture();
    this.geometry = new THREE.BufferGeometry();
    this.material = new THREE.PointsMaterial({
      color: new THREE.Color(palette.chrome),
      size: 0.056,
      map: this.texture,
      alphaMap: this.texture,
      vertexColors: true,
      transparent: true,
      opacity: 0.068,
      depthWrite: false,
      sizeAttenuation: true,
      toneMapped: false,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.name = "ambientParticleField";
    this.points.frustumCulled = false;
    this.points.renderOrder = -1;
    this.group.add(this.points);

    this.layout = null;
    this.baseOpacity = this.material.opacity;
    this.basePositions = new Float32Array(0);
    this.motionData = [];
  }

  setLayout(responsiveProfile) {
    const viewportKey = responsiveProfile.viewportKey;
    const layout =
      this.config.layouts?.[viewportKey] ?? this.config.layouts?.desktop ?? null;

    if (!layout) {
      this.layout = null;
      this.points.visible = false;
      this.geometry.setDrawRange(0, 0);
      return;
    }

    this.layout = layout;

    const requestedCount = layout.count ?? 0;
    const count = this.reducedMotion
      ? Math.max(4, Math.round(requestedCount * (this.config.reducedMotionCountScale ?? 0.7)))
      : requestedCount;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const silver = new THREE.Color(this.palette.silver);
    const coolEdge = new THREE.Color(this.palette.coolEdge);
    const chrome = new THREE.Color(this.palette.chrome);

    this.baseOpacity = layout.opacity ?? 0.1;
    this.basePositions = new Float32Array(count * 3);
    this.motionData = new Array(count);
    const placement = this.config.placement ?? {};
    const drift = this.config.drift ?? {};
    const intensityConfig = this.config.intensity ?? {};
    const horizontalEdgeBias = clamp01(placement.horizontalEdgeBias ?? 0);
    const verticalJitter = placement.verticalJitter ?? 0.16;
    const depthExponent = Math.max(0.72, placement.depthExponent ?? 1);
    const intensityMin = intensityConfig.min ?? 0.7;
    const intensityMax = intensityConfig.max ?? 0.94;
    const nearFade = intensityConfig.nearFade ?? 0.9;
    const farFade = intensityConfig.farFade ?? 1;
    const zones = placement.zones ?? [];

    for (let index = 0; index < count; index += 1) {
      const positionOffset = index * 3;
      const band = VERTICAL_BANDS[index % VERTICAL_BANDS.length];
      const xT = biasToEdges(fract(index * GOLDEN_RATIO + 0.17), horizontalEdgeBias);
      const yT = clamp01(band + (seed(index, 0.42) - 0.5) * verticalJitter);
      const zT = Math.pow(clamp01(fract(index * GOLDEN_RATIO * 1.37 + 0.61)), depthExponent);
      let x = THREE.MathUtils.lerp(layout.minX, layout.maxX, xT);
      let y = THREE.MathUtils.lerp(layout.minY, layout.maxY, yT);
      const z = THREE.MathUtils.lerp(layout.minZ, layout.maxZ, zT);
      ({ x, y } = displaceFromZones(x, y, zones, index));

      const depthFactor = clamp01(
        THREE.MathUtils.inverseLerp(layout.minZ, layout.maxZ, z),
      );
      const tint = silver
        .clone()
        .lerp(coolEdge, (this.config.coolTintMix ?? 0.32) + seed(index, 1.12) * 0.18)
        .lerp(chrome, 0.08 + seed(index, 2.08) * 0.12);
      const intensity =
        THREE.MathUtils.lerp(intensityMin, intensityMax, seed(index, 3.2)) *
        THREE.MathUtils.lerp(farFade, nearFade, depthFactor);
      const motionScale = THREE.MathUtils.lerp(
        drift.farMotionScale ?? 0.66,
        drift.nearMotionScale ?? 0.9,
        depthFactor,
      );

      tint.multiplyScalar(intensity);

      this.basePositions[positionOffset] = x;
      this.basePositions[positionOffset + 1] = y;
      this.basePositions[positionOffset + 2] = z;
      positions[positionOffset] = x;
      positions[positionOffset + 1] = y;
      positions[positionOffset + 2] = z;
      colors[positionOffset] = tint.r;
      colors[positionOffset + 1] = tint.g;
      colors[positionOffset + 2] = tint.b;

      this.motionData[index] = {
        phase: seed(index, 4.3) * Math.PI * 2,
        speed: THREE.MathUtils.lerp(
          drift.minSpeed ?? 0.04,
          drift.maxSpeed ?? 0.12,
          seed(index, 5.1),
        ) * motionScale,
        driftX: THREE.MathUtils.lerp(
          drift.minX ?? 0.03,
          drift.maxX ?? 0.08,
          seed(index, 6.2),
        ) * motionScale,
        driftY: THREE.MathUtils.lerp(
          drift.minY ?? 0.02,
          drift.maxY ?? 0.06,
          seed(index, 7.4),
        ) * motionScale,
        driftZ: THREE.MathUtils.lerp(
          drift.minZ ?? 0.01,
          drift.maxZ ?? 0.05,
          seed(index, 8.6),
        ) * motionScale,
        parallaxX: (drift.parallaxX ?? 0.05) * (0.56 + seed(index, 9.7) * 0.24),
        parallaxY: (drift.parallaxY ?? 0.03) * (0.56 + seed(index, 10.9) * 0.24),
      };
    }

    this.material.size = layout.size ?? this.material.size;
    this.material.opacity = this.baseOpacity;
    this.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage),
    );
    this.geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    this.geometry.setDrawRange(0, count);
    this.geometry.computeBoundingSphere();
    this.points.visible = count > 0;
  }

  update({ elapsed, pointer, introProgress = 1, motionScale = 1 }) {
    if (!this.layout) {
      return;
    }

    const positionAttribute = this.geometry.getAttribute("position");

    if (!positionAttribute) {
      return;
    }

    const positions = positionAttribute.array;
    const ambientMotionScale =
      (0.52 + motionScale * 0.28) *
      (this.reducedMotion ? this.config.reducedMotionDriftScale ?? 0.34 : 1);
    const parallaxScale = (this.config.pointerInfluence ?? 0.05) * introProgress;

    for (let index = 0; index < this.motionData.length; index += 1) {
      const positionOffset = index * 3;
      const motion = this.motionData[index];
      const baseX = this.basePositions[positionOffset];
      const baseY = this.basePositions[positionOffset + 1];
      const baseZ = this.basePositions[positionOffset + 2];
      const driftPhase = elapsed * motion.speed + motion.phase;

      positions[positionOffset] =
        baseX +
        Math.sin(driftPhase) * motion.driftX * ambientMotionScale +
        pointer.x * motion.parallaxX * parallaxScale;
      positions[positionOffset + 1] =
        baseY +
        Math.cos(driftPhase * 0.82 + motion.phase * 0.5) *
          motion.driftY *
          ambientMotionScale -
        pointer.y * motion.parallaxY * parallaxScale;
      positions[positionOffset + 2] =
        baseZ +
        Math.sin(driftPhase * 0.58 + motion.phase * 0.3) *
          motion.driftZ *
          ambientMotionScale;
    }

    positionAttribute.needsUpdate = true;
    this.material.opacity = this.baseOpacity * THREE.MathUtils.lerp(0.68, 1, introProgress);
  }

  destroy() {
    this.texture.dispose();
    this.geometry.dispose();
    this.material.dispose();
  }
}

function createParticleTexture() {
  const size = 64;
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
  gradient.addColorStop(0, "rgba(255,255,255,0.82)");
  gradient.addColorStop(0.24, "rgba(255,255,255,0.34)");
  gradient.addColorStop(0.62, "rgba(255,255,255,0.06)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function displaceFromZones(x, y, zones, index) {
  let nextX = x;
  let nextY = y;

  for (let zoneIndex = 0; zoneIndex < zones.length; zoneIndex += 1) {
    const zone = zones[zoneIndex];
    const radiusX = Math.max(zone.radiusX ?? 0, 0.001);
    const radiusY = Math.max(zone.radiusY ?? 0, 0.001);
    const dx = nextX - (zone.centerX ?? 0);
    const dy = nextY - (zone.centerY ?? 0);
    const normalizedDistance = Math.sqrt(
      (dx * dx) / (radiusX * radiusX) + (dy * dy) / (radiusY * radiusY),
    );

    if (normalizedDistance >= 1) {
      continue;
    }

    const zoneStrength = clamp01(zone.strength ?? 0.7);
    const padding = zone.padding ?? 0.16;
    const push = smoothstep(1 - normalizedDistance) * zoneStrength;
    const angle =
      normalizedDistance > 0.0001
        ? Math.atan2(dy / radiusY, dx / radiusX)
        : seed(index + zoneIndex * 17, 11.3) * Math.PI * 2;

    const boundaryRadius = 1 + padding;
    const targetX = (zone.centerX ?? 0) + Math.cos(angle) * radiusX * boundaryRadius;
    const targetY = (zone.centerY ?? 0) + Math.sin(angle) * radiusY * boundaryRadius;

    nextX = THREE.MathUtils.lerp(nextX, targetX, push);
    nextY = THREE.MathUtils.lerp(nextY, targetY, push);
  }

  return { x: nextX, y: nextY };
}

function biasToEdges(value, biasStrength) {
  if (biasStrength <= 0) {
    return value;
  }

  const edgeMapped =
    value < 0.5
      ? Math.pow(value * 2, 1.32) * 0.5
      : 1 - Math.pow((1 - value) * 2, 1.32) * 0.5;
  return THREE.MathUtils.lerp(value, edgeMapped, biasStrength);
}

function seed(index, phase = 0) {
  const value = Math.sin(index * 127.1 + phase * 311.7) * 43758.5453123;
  return fract(value);
}

function fract(value) {
  return value - Math.floor(value);
}

function clamp01(value) {
  return THREE.MathUtils.clamp(value, 0, 1);
}

function smoothstep(value) {
  const clamped = clamp01(value);
  return clamped * clamped * (3 - 2 * clamped);
}
