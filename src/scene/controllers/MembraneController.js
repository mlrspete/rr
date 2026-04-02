import * as THREE from "three";

export class MembraneController {
  constructor({ config, materials, glowTexture }) {
    this.config = config;
    this.materials = materials;

    this.group = new THREE.Group();
    this.group.name = "membraneSystem";

    this.basePosition = new THREE.Vector3();
    this.baseRotation = new THREE.Euler();
    this.baseScale = new THREE.Vector3(1, 1, 1);

    const { body, rim, sweepBand, halo } = config.geometry;
    const bodyGeometry = createMembraneBodyGeometry(body);

    this.membraneBody = new THREE.Mesh(bodyGeometry, materials.membrane);
    this.membraneBody.name = "membraneBody";
    this.membraneBody.renderOrder = 2;
    this.group.add(this.membraneBody);

    this.membraneRim = new THREE.Mesh(
      createMembraneFrameGeometry(rim),
      materials.membraneEdge,
    );
    this.membraneRim.name = "membraneRim";
    this.membraneRim.position.z = body.depth * 0.16;
    this.membraneRim.renderOrder = 3;
    this.group.add(this.membraneRim);

    this.bandTexture = createSweepBandTexture();
    this.bandBaseColor = new THREE.Color(config.palette.lightWarm);
    this.bandHotColor = new THREE.Color(config.palette.lightWarm).lerp(
      new THREE.Color(config.palette.warm),
      0.22,
    );
    this.haloWarmColor = new THREE.Color(config.palette.warm);

    this.activeSweepBand = new THREE.Mesh(
      createRoundedBandGeometry(sweepBand.width, sweepBand.height, sweepBand.radius),
      materials.sweepBand.clone(),
    );
    this.activeSweepBand.name = "activeSweepBand";
    this.activeSweepBand.material.map = this.bandTexture;
    this.activeSweepBand.material.alphaMap = this.bandTexture;
    this.activeSweepBand.material.needsUpdate = true;
    this.activeSweepBand.position.z = body.depth * 0.62;
    this.activeSweepBand.renderOrder = 4;
    this.bandBasePosition = this.activeSweepBand.position.clone();
    this.group.add(this.activeSweepBand);

    this.membraneHalo = createGlowSprite(
      glowTexture,
      config.palette.cool,
      config.activation.haloBaseOpacity,
    );
    this.membraneHalo.name = "membraneHalo";
    this.membraneHalo.position.set(halo.offsetX, halo.offsetY, halo.offsetZ);
    this.membraneHalo.scale.set(halo.scaleX, halo.scaleY, 1);
    this.membraneHalo.renderOrder = 1;
    this.haloBasePosition = this.membraneHalo.position.clone();
    this.haloBaseScale = this.membraneHalo.scale.clone();
    this.group.add(this.membraneHalo);
  }

  setLayout(transform) {
    this.basePosition.set(transform.position.x, transform.position.y, transform.position.z);
    this.baseRotation.set(transform.rotation.x, transform.rotation.y, transform.rotation.z);
    this.baseScale.set(transform.scale.x, transform.scale.y, transform.scale.z);

    this.group.position.copy(this.basePosition);
    this.group.rotation.copy(this.baseRotation);
    this.group.scale.copy(this.baseScale);
  }

  update({
    elapsed,
    introProgress,
    pointer,
    interactionStrength,
    atmosphereStrength,
    motionScale = 1,
    activationScale = 1,
    sweepWorldX,
    pulse,
    flash,
    direction = 1,
    clusterTargets = [],
  }) {
    const sweepRange = Math.max(this.config.sweep.travelX, Number.EPSILON);
    const sweepRatio = THREE.MathUtils.clamp(
      (sweepWorldX - this.basePosition.x) / sweepRange,
      -1,
      1,
    );
    const approach = getClusterApproach(
      sweepWorldX,
      clusterTargets,
      this.config.activation.clusterApproachRadius,
    );
    const activation = THREE.MathUtils.clamp(
      (approach * 0.7 + pulse * 1.1 + flash * 1.35) * activationScale,
      0,
      1.6,
    );

    this.group.position.x = sweepWorldX;
    this.group.position.y =
      this.basePosition.y +
      Math.sin(elapsed * 0.2 + 1.2) *
        this.config.motion.verticalDrift *
        introProgress *
        atmosphereStrength *
        motionScale;
    this.group.position.z =
      this.basePosition.z +
      Math.abs(sweepRatio) * this.config.motion.depthDrift * approach * activationScale +
      flash * this.config.activation.approachDepthBoost * activationScale;

    this.group.rotation.y =
      this.baseRotation.y +
      sweepRatio * this.config.motion.sweepYaw * motionScale +
      direction * approach * this.config.activation.approachTiltBoost * activationScale -
      pointer.x * this.config.motion.pointerYaw * interactionStrength * motionScale;
    this.group.rotation.x =
      this.baseRotation.x +
      Math.cos(sweepRatio * Math.PI) * this.config.motion.sweepPitch * introProgress * motionScale -
      pointer.y * this.config.motion.pointerPitch * interactionStrength * motionScale;
    this.group.rotation.z =
      this.baseRotation.z +
      direction * approach * this.config.motion.sweepRoll * activationScale +
      Math.sin(elapsed * 0.16 + 0.4) * 0.008 * introProgress * motionScale;
    this.group.scale.set(
      this.baseScale.x * (1 + activation * 0.018),
      this.baseScale.y * (1 - activation * 0.008),
      this.baseScale.z * (1 + activation * 0.018),
    );

    this.membraneBody.position.z = -pulse * 0.026 - approach * 0.012;
    this.membraneBody.scale.set(
      1 + flash * this.config.activation.faceFlashScale + approach * this.config.activation.bodyScaleBoost * 0.36,
      1 - activation * 0.03,
      1 + pulse * 0.12 + approach * this.config.activation.bodyScaleBoost * 0.56,
    );

    this.membraneRim.position.z = this.config.geometry.body.depth * 0.16 + activation * 0.012;
    this.membraneRim.scale.set(
      1 + approach * this.config.activation.rimScaleBoost + flash * this.config.activation.rimFlashScale,
      1 - activation * 0.018,
      1 + approach * this.config.activation.rimScaleBoost + flash * this.config.activation.rimFlashScale,
    );

    this.activeSweepBand.position.x =
      sweepRatio * this.config.motion.bandTravelX +
      direction *
        (approach * this.config.activation.travelBias * activationScale +
          flash * this.config.activation.bandCoreSlide * activationScale);
    this.activeSweepBand.position.y =
      Math.sin(elapsed * 0.34 + sweepRatio * 1.8) *
        this.config.motion.bandBob *
        atmosphereStrength *
        motionScale +
      direction * approach * this.config.motion.bandTravelY * activationScale;
    this.activeSweepBand.position.z =
      this.bandBasePosition.z + activation * this.config.activation.bandDepthBoost;
    this.activeSweepBand.rotation.z = direction * 0.03 + sweepRatio * 0.024;
    this.activeSweepBand.scale.set(
      1 + approach * this.config.activation.bandWidthBoost + flash * 0.14,
      1 + approach * 0.03 + pulse * this.config.activation.bandHeightBoost,
      1,
    );
    this.activeSweepBand.material.opacity =
      this.config.activation.bandBaseOpacity +
      approach * this.config.activation.bandApproachOpacity +
      flash * this.config.activation.bandPulseOpacity +
      pulse * 0.06;
    this.activeSweepBand.material.color.copy(this.bandBaseColor).lerp(
      this.bandHotColor,
      THREE.MathUtils.clamp(approach * 0.6 + flash * 0.9, 0, 1),
    );

    this.membraneHalo.position.x =
      this.haloBasePosition.x +
      Math.sin(elapsed * 0.22 + 0.5) *
        this.config.motion.haloDriftX *
        atmosphereStrength *
        motionScale;
    this.membraneHalo.position.y =
      this.haloBasePosition.y +
      Math.cos(elapsed * 0.19 + 1.1) *
        this.config.motion.haloDriftY *
        atmosphereStrength *
        motionScale;
    this.membraneHalo.scale.set(
      this.haloBaseScale.x + activation * this.config.activation.haloScaleXBoost,
      this.haloBaseScale.y + activation * this.config.activation.haloScaleYBoost,
      1,
    );

    if (this.membraneHalo.material) {
      this.membraneHalo.material.opacity =
        this.config.activation.haloBaseOpacity +
        approach * this.config.activation.haloApproachOpacity +
        flash * this.config.activation.haloPulseOpacity;
      this.membraneHalo.material.color
        .set(this.config.palette.cool)
        .lerp(
          this.haloWarmColor,
          this.config.activation.auraWarmMix * THREE.MathUtils.clamp(approach + flash, 0, 1),
        );
    }

    this.materials.membrane.emissiveIntensity =
      this.config.appearance.emissiveIntensity +
      activation * this.config.activation.bodyEmissiveBoost;
    this.materials.membrane.thickness =
      this.config.appearance.thickness + activation * this.config.activation.bodyThicknessBoost;
    this.materials.membrane.ior =
      this.config.appearance.ior + flash * 0.015 + approach * 0.006;
    this.materials.membrane.attenuationDistance =
      this.config.appearance.attenuationDistance - approach * 0.08 - flash * 0.12;
    this.materials.membrane.envMapIntensity =
      this.config.appearance.envMapIntensity + activation * this.config.activation.bodyEnvBoost;

    this.materials.membraneEdge.opacity =
      this.config.appearance.rimOpacity + activation * this.config.activation.rimOpacityBoost;
    this.materials.membraneEdge.envMapIntensity =
      this.config.appearance.rimEnvMapIntensity + activation * this.config.activation.rimEnvBoost;
    this.materials.membraneEdge.emissiveIntensity =
      this.config.appearance.rimEmissiveIntensity + flash * 0.04 + approach * 0.02;
  }

  getSweepWorldX() {
    return this.group.position.x;
  }

  destroy() {
    const bandTextures = new Set([
      this.activeSweepBand.material?.map,
      this.activeSweepBand.material?.alphaMap,
    ]);

    for (const texture of bandTextures) {
      texture?.dispose?.();
    }

    this.activeSweepBand.material?.dispose();
  }
}

function createMembraneBodyGeometry(spec) {
  const shape = createMembraneShape(spec.radiusX, spec.radiusY, spec);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: spec.depth,
    bevelEnabled: true,
    bevelSegments: 8,
    steps: 1,
    curveSegments: spec.points ?? 72,
    bevelSize: spec.bevelSize,
    bevelThickness: spec.bevelThickness,
  });

  geometry.center();
  return geometry;
}

function createMembraneFrameGeometry(spec) {
  const shape = createMembraneShape(spec.radiusX, spec.radiusY, spec);
  const innerShape = createMembraneShape(
    Math.max(spec.radiusX - spec.frame, 0.06),
    Math.max(spec.radiusY - spec.frame, 0.06),
    {
      exponent: spec.exponent,
      shoulderPinch: spec.shoulderPinch,
      points: spec.points,
    },
  );

  const hole = new THREE.Path();
  hole.setFromPoints(innerShape.getPoints(spec.points ?? 72).reverse());
  shape.holes.push(hole);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: spec.depth,
    bevelEnabled: false,
    steps: 1,
    curveSegments: spec.points ?? 72,
  });

  geometry.center();
  return geometry;
}

function createMembraneShape(radiusX, radiusY, {
  exponent = 3,
  shoulderPinch = 0.08,
  points = 72,
} = {}) {
  const shapePoints = [];

  for (let index = 0; index <= points; index += 1) {
    const angle = (index / points) * Math.PI * 2;
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);

    let x = Math.sign(cosAngle) * Math.pow(Math.abs(cosAngle), 2 / exponent) * radiusX;
    let y = Math.sign(sinAngle) * Math.pow(Math.abs(sinAngle), 2 / exponent) * radiusY;

    const yRatio = Math.abs(y) / Math.max(radiusY, Number.EPSILON);
    const xRatio = Math.abs(x) / Math.max(radiusX, Number.EPSILON);

    x *= 1 - yRatio * shoulderPinch;
    y *= 1 - Math.max(0, xRatio - 0.68) * 0.04;

    shapePoints.push(new THREE.Vector2(x, y));
  }

  return new THREE.Shape(shapePoints);
}

function createRoundedBandGeometry(width, height, radius) {
  const shape = new THREE.Shape();
  const halfWidth = width * 0.5;
  const halfHeight = height * 0.5;
  const corner = Math.min(radius, halfWidth, halfHeight);

  shape.moveTo(-halfWidth + corner, -halfHeight);
  shape.lineTo(halfWidth - corner, -halfHeight);
  shape.absarc(halfWidth - corner, -halfHeight + corner, corner, -Math.PI / 2, 0);
  shape.lineTo(halfWidth, halfHeight - corner);
  shape.absarc(halfWidth - corner, halfHeight - corner, corner, 0, Math.PI / 2);
  shape.lineTo(-halfWidth + corner, halfHeight);
  shape.absarc(-halfWidth + corner, halfHeight - corner, corner, Math.PI / 2, Math.PI);
  shape.lineTo(-halfWidth, -halfHeight + corner);
  shape.absarc(-halfWidth + corner, -halfHeight + corner, corner, Math.PI, Math.PI * 1.5);

  const geometry = new THREE.ShapeGeometry(shape, 40);
  geometry.center();
  return geometry;
}

function createSweepBandTexture() {
  const width = 128;
  const height = 512;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    return new THREE.Texture();
  }

  const horizontalGradient = context.createLinearGradient(0, 0, width, 0);
  horizontalGradient.addColorStop(0, "rgba(255,255,255,0)");
  horizontalGradient.addColorStop(0.18, "rgba(255,255,255,0.18)");
  horizontalGradient.addColorStop(0.5, "rgba(255,255,255,1)");
  horizontalGradient.addColorStop(0.82, "rgba(255,255,255,0.18)");
  horizontalGradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = horizontalGradient;
  context.fillRect(0, 0, width, height);

  context.globalCompositeOperation = "destination-in";
  const verticalGradient = context.createLinearGradient(0, 0, 0, height);
  verticalGradient.addColorStop(0, "rgba(255,255,255,0)");
  verticalGradient.addColorStop(0.16, "rgba(255,255,255,0.52)");
  verticalGradient.addColorStop(0.5, "rgba(255,255,255,1)");
  verticalGradient.addColorStop(0.84, "rgba(255,255,255,0.52)");
  verticalGradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = verticalGradient;
  context.fillRect(0, 0, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function getClusterApproach(positionX, targets, radius) {
  if (!targets.length || radius <= 0) {
    return 0;
  }

  return targets.reduce((closest, targetX) => {
    const proximity = 1 - THREE.MathUtils.clamp(Math.abs(positionX - targetX) / radius, 0, 1);
    return Math.max(closest, proximity);
  }, 0);
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
