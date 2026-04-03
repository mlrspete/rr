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
      size: 0.07,
      map: this.texture,
      alphaMap: this.texture,
      vertexColors: true,
      transparent: true,
      opacity: 0.1,
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
      ? Math.max(6, Math.round(requestedCount * (this.config.reducedMotionCountScale ?? 0.7)))
      : requestedCount;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const silver = new THREE.Color(this.palette.silver);
    const coolEdge = new THREE.Color(this.palette.coolEdge);
    const chrome = new THREE.Color(this.palette.chrome);

    this.baseOpacity = layout.opacity ?? 0.1;
    this.basePositions = new Float32Array(count * 3);
    this.motionData = new Array(count);

    for (let index = 0; index < count; index += 1) {
      const positionOffset = index * 3;
      const band = VERTICAL_BANDS[index % VERTICAL_BANDS.length];
      const xT = clamp01(fract(index * GOLDEN_RATIO + 0.17));
      const yT = clamp01(band + (seed(index, 0.42) - 0.5) * 0.16);
      const zT = clamp01(fract(index * GOLDEN_RATIO * 1.37 + 0.61));
      const x = THREE.MathUtils.lerp(layout.minX, layout.maxX, xT);
      const y = THREE.MathUtils.lerp(layout.minY, layout.maxY, yT);
      const z = THREE.MathUtils.lerp(layout.minZ, layout.maxZ, zT);
      const tint = silver
        .clone()
        .lerp(coolEdge, (this.config.coolTintMix ?? 0.32) + seed(index, 1.12) * 0.18)
        .lerp(chrome, 0.08 + seed(index, 2.08) * 0.12);
      const intensity = 0.7 + seed(index, 3.2) * 0.24;

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
          this.config.drift?.minSpeed ?? 0.04,
          this.config.drift?.maxSpeed ?? 0.12,
          seed(index, 5.1),
        ),
        driftX: THREE.MathUtils.lerp(
          this.config.drift?.minX ?? 0.03,
          this.config.drift?.maxX ?? 0.08,
          seed(index, 6.2),
        ),
        driftY: THREE.MathUtils.lerp(
          this.config.drift?.minY ?? 0.02,
          this.config.drift?.maxY ?? 0.06,
          seed(index, 7.4),
        ),
        driftZ: THREE.MathUtils.lerp(
          this.config.drift?.minZ ?? 0.01,
          this.config.drift?.maxZ ?? 0.05,
          seed(index, 8.6),
        ),
        parallaxX: (this.config.drift?.parallaxX ?? 0.05) * (0.68 + seed(index, 9.7) * 0.42),
        parallaxY: (this.config.drift?.parallaxY ?? 0.03) * (0.68 + seed(index, 10.9) * 0.42),
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
      (0.58 + motionScale * 0.42) *
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
    this.material.opacity = this.baseOpacity * THREE.MathUtils.lerp(0.72, 1, introProgress);
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
  gradient.addColorStop(0, "rgba(255,255,255,0.94)");
  gradient.addColorStop(0.24, "rgba(255,255,255,0.5)");
  gradient.addColorStop(0.62, "rgba(255,255,255,0.08)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  texture.needsUpdate = true;
  return texture;
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
