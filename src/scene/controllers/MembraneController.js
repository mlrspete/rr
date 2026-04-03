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

    const { body, rim, sweepBand, halo, conversionVeil, conversionPulse } = config.geometry;
    const bodyGeometry = createMembraneBodyGeometry(body);

    this.membraneBody = new THREE.Mesh(bodyGeometry, materials.membrane);
    this.membraneBody.name = "membraneBody";
    this.membraneBody.renderOrder = 3;
    this.group.add(this.membraneBody);

    this.membraneRim = new THREE.Mesh(
      createMembraneFrameGeometry(rim),
      materials.membraneEdge,
    );
    this.membraneRim.name = "membraneRim";
    this.membraneRim.position.z = body.depth * 0.18;
    this.membraneRim.renderOrder = 5;
    this.group.add(this.membraneRim);

    this.bandTexture = createSweepBandTexture();
    this.bandBaseColor = new THREE.Color(config.palette.cool).lerp(
      new THREE.Color(config.palette.coolEdge),
      0.4,
    );

    this.activeSweepBand = new THREE.Mesh(
      createRoundedBandGeometry(sweepBand.width, sweepBand.height, sweepBand.radius),
      materials.sweepBand.clone(),
    );
    this.activeSweepBand.name = "activeSweepBand";
    this.activeSweepBand.material.map = this.bandTexture;
    this.activeSweepBand.material.alphaMap = this.bandTexture;
    this.activeSweepBand.material.needsUpdate = true;
    this.activeSweepBand.position.z = body.depth * 0.58;
    this.activeSweepBand.renderOrder = 4;
    this.bandBasePosition = this.activeSweepBand.position.clone();
    this.group.add(this.activeSweepBand);

    this.conversionTexture = createConversionTexture();

    this.conversionVeil = new THREE.Mesh(
      createRoundedBandGeometry(
        conversionVeil.width,
        conversionVeil.height,
        conversionVeil.radius,
      ),
      materials.conversionVeil.clone(),
    );
    this.conversionVeil.name = "conversionVeil";
    this.conversionVeil.material.map = this.conversionTexture;
    this.conversionVeil.material.alphaMap = this.conversionTexture;
    this.conversionVeil.material.needsUpdate = true;
    this.conversionVeil.position.set(
      conversionVeil.offsetX,
      conversionVeil.offsetY,
      conversionVeil.offsetZ,
    );
    this.conversionVeil.renderOrder = 5;
    this.veilBasePosition = this.conversionVeil.position.clone();
    this.veilBaseScale = this.conversionVeil.scale.clone();
    this.group.add(this.conversionVeil);

    this.conversionPulse = new THREE.Mesh(
      createRoundedBandGeometry(
        conversionPulse.width,
        conversionPulse.height,
        conversionPulse.radius,
      ),
      materials.conversionPulse.clone(),
    );
    this.conversionPulse.name = "conversionPulse";
    this.conversionPulse.material.map = this.conversionTexture;
    this.conversionPulse.material.alphaMap = this.conversionTexture;
    this.conversionPulse.material.needsUpdate = true;
    this.conversionPulse.position.set(
      conversionPulse.offsetX,
      conversionPulse.offsetY,
      conversionPulse.offsetZ,
    );
    this.conversionPulse.renderOrder = 6;
    this.pulseBasePosition = this.conversionPulse.position.clone();
    this.pulseBaseScale = this.conversionPulse.scale.clone();
    this.group.add(this.conversionPulse);

    this.membraneHalo = createGlowSprite(
      glowTexture,
      config.palette.coolEdge,
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
    introProgress = 1,
    pointer,
    interactionStrength,
    motionScale = 1,
    activation = 0,
    phase = 0,
  }) {
    const motion = this.config.motion;
    const appearance = this.config.appearance;
    const activationConfig = this.config.activation;
    const activationStrength = THREE.MathUtils.clamp(activation, 0, 1.2);
    const phaseClamped = THREE.MathUtils.clamp(phase, 0, 1);
    const lateralBandOffset = THREE.MathUtils.lerp(
      -motion.bandTravelX,
      motion.bandTravelX,
      phaseClamped,
    );
    const introMotion = introProgress * motionScale;
    const idleVerticalDrift =
      Math.sin(elapsed * motion.verticalDriftSpeed + 0.3) * motion.verticalDrift +
      Math.cos(elapsed * motion.secondaryVerticalDriftSpeed + 1.1) *
        motion.secondaryVerticalDrift;
    const idleLateralDrift =
      Math.sin(elapsed * motion.lateralDriftSpeed + 0.42) * motion.lateralDriftX;
    const idleDepthDrift =
      Math.cos(elapsed * motion.depthDriftSpeed + 0.88) * motion.depthDriftZ;
    const idlePitch =
      Math.sin(elapsed * motion.idlePitchSpeed + 0.18) * motion.idlePitch * introMotion;
    const idleYaw =
      Math.cos(elapsed * motion.idleYawSpeed + 0.84) * motion.idleYaw * introMotion;
    const idleRoll =
      Math.sin(elapsed * motion.idleRollSpeed + motion.idleRollPhase) *
      motion.idleRoll *
      introMotion;
    const idleBreath =
      Math.sin(elapsed * motion.idleScaleSpeed + 0.46) *
      motion.idleScaleBreath *
      introProgress;
    const idleGlow = Math.sin(elapsed * motion.haloPulseSpeed + 0.9) * 0.5 + 0.5;
    const idleFrost =
      (Math.sin(elapsed * 0.17 + 0.66) + Math.cos(elapsed * 0.11 + 1.18)) * 0.25 + 0.5;
    const idleBodyBreath = idleBreath * 0.35;

    this.group.position.set(
      this.basePosition.x + idleLateralDrift * introMotion,
      this.basePosition.y +
        idleVerticalDrift * introMotion,
      this.basePosition.z + idleDepthDrift * introMotion,
    );
    this.group.rotation.set(
      this.baseRotation.x +
        idlePitch -
        pointer.y * motion.pointerPitch * interactionStrength * motionScale,
      this.baseRotation.y -
        pointer.x * motion.pointerYaw * interactionStrength * motionScale +
        idleYaw +
        (phaseClamped - 0.5) * motion.phaseYaw * activationStrength,
      this.baseRotation.z + idleRoll,
    );
    this.group.scale.set(
      this.baseScale.x * (1 + idleBreath * 0.7 + activationStrength * 0.016),
      this.baseScale.y * (1 - idleBreath * 0.28 - activationStrength * 0.01),
      this.baseScale.z * (1 + idleBreath + activationStrength * 0.022),
    );

    this.membraneBody.position.z = -activationStrength * 0.02 - idleBodyBreath * 0.018;
    this.membraneBody.scale.set(
      1 + idleBodyBreath * 0.34 + activationStrength * activationConfig.bodyScaleBoost * 0.8,
      1 - idleBodyBreath * 0.14 - activationStrength * 0.04,
      1 + idleBodyBreath * 0.48 + activationStrength * activationConfig.bodyScaleBoost,
    );

    this.membraneRim.position.z =
      this.config.geometry.body.depth * 0.18 +
      activationStrength * 0.014 +
      idleBodyBreath * 0.014;
    this.membraneRim.scale.set(
      1 + idleBodyBreath * 0.18 + activationStrength * activationConfig.rimScaleBoost,
      1 - idleBodyBreath * 0.08 - activationStrength * 0.016,
      1 + idleBodyBreath * 0.22 + activationStrength * activationConfig.rimScaleBoost,
    );

    this.activeSweepBand.position.x = lateralBandOffset;
    this.activeSweepBand.position.y =
      Math.sin(elapsed * 0.42 + phaseClamped * Math.PI) *
        motion.bandBob *
        motionScale +
      Math.sin(elapsed * 0.18 + 0.24) * motion.bandBob * 0.35 * introMotion;
    this.activeSweepBand.position.z =
      this.bandBasePosition.z + activationStrength * activationConfig.bandDepthBoost;
    this.activeSweepBand.rotation.z = THREE.MathUtils.lerp(-0.05, 0.05, phaseClamped);
    this.activeSweepBand.scale.set(
      1 + idleBreath * 0.16 + activationStrength * activationConfig.bandWidthBoost,
      1 + idleBreath * 0.1 + activationStrength * activationConfig.bandHeightBoost,
      1,
    );
    this.activeSweepBand.material.opacity =
      activationConfig.bandBaseOpacity +
      idleGlow * activationConfig.bandIdleOpacity +
      activationStrength * activationConfig.bandPulseOpacity;
    this.activeSweepBand.material.color.copy(this.bandBaseColor);

    const veilOffset =
      (phaseClamped - 0.44) * this.config.geometry.conversionVeil.travelX;
    this.conversionVeil.position.x = this.veilBasePosition.x + veilOffset;
    this.conversionVeil.scale.set(
      this.veilBaseScale.x + activationStrength * this.config.activation.veilScaleBoost,
      this.veilBaseScale.y + activationStrength * this.config.activation.veilScaleBoost * 0.7,
      1,
    );
    this.conversionVeil.material.opacity =
      activationStrength *
      this.config.activation.veilOpacity *
      (0.52 + Math.sin(phaseClamped * Math.PI) * 0.48);

    const pulseOffset =
      (phaseClamped - 0.36) * this.config.geometry.conversionPulse.travelX;
    this.conversionPulse.position.x = this.pulseBasePosition.x + pulseOffset;
    this.conversionPulse.scale.set(
      this.pulseBaseScale.x + activationStrength * this.config.activation.pulseScaleBoost,
      this.pulseBaseScale.y + activationStrength * this.config.activation.pulseScaleBoost,
      1,
    );
    this.conversionPulse.material.opacity =
      activationStrength *
      this.config.activation.pulseOpacity *
      Math.sin(phaseClamped * Math.PI);

    this.membraneHalo.position.x =
      this.haloBasePosition.x +
      Math.sin(elapsed * 0.22 + phaseClamped * Math.PI) *
        motion.haloDriftX *
        motionScale;
    this.membraneHalo.position.y =
      this.haloBasePosition.y +
      Math.cos(elapsed * 0.19 + 0.8) *
        motion.haloDriftY *
        motionScale;
    this.membraneHalo.scale.set(
      this.haloBaseScale.x +
        idleGlow * 0.08 +
        activationStrength * activationConfig.haloScaleXBoost,
      this.haloBaseScale.y +
        idleGlow * 0.12 +
        activationStrength * activationConfig.haloScaleYBoost,
      1,
    );
    this.membraneHalo.material.opacity =
      activationConfig.haloBaseOpacity +
      idleGlow * activationConfig.haloIdleOpacity +
      activationStrength * activationConfig.haloPulseOpacity;

    this.materials.membrane.emissiveIntensity =
      appearance.emissiveIntensity +
      idleGlow * appearance.idleEmissivePulse +
      activationStrength * activationConfig.bodyEmissiveBoost;
    this.materials.membrane.thickness =
      appearance.thickness + activationStrength * activationConfig.bodyThicknessBoost;
    this.materials.membrane.roughness = THREE.MathUtils.clamp(
      appearance.roughness +
        idleFrost * appearance.idleRoughnessDrift +
        activationStrength * activationConfig.bodyRoughnessBoost,
      0,
      1,
    );
    this.materials.membrane.transmission = THREE.MathUtils.clamp(
      appearance.transmission -
        idleFrost * appearance.idleTransmissionDrift -
        activationStrength * activationConfig.bodyTransmissionDip,
      0.6,
      1,
    );
    this.materials.membrane.ior = appearance.ior + activationStrength * 0.03;
    this.materials.membrane.attenuationDistance = Math.max(
      0.24,
      appearance.attenuationDistance -
        idleFrost * appearance.idleAttenuationDrift -
        activationStrength * 0.18,
    );
    this.materials.membrane.envMapIntensity =
      appearance.envMapIntensity + activationStrength * activationConfig.bodyEnvBoost;

    this.materials.membraneEdge.opacity =
      appearance.rimOpacity +
      idleGlow * activationConfig.haloIdleOpacity * 0.4 +
      activationStrength * activationConfig.rimOpacityBoost;
    this.materials.membraneEdge.roughness = THREE.MathUtils.clamp(
      appearance.rimRoughness +
        idleFrost * appearance.idleRoughnessDrift * 0.45 +
        activationStrength * activationConfig.rimRoughnessBoost,
      0,
      1,
    );
    this.materials.membraneEdge.envMapIntensity =
      appearance.rimEnvMapIntensity + activationStrength * activationConfig.rimEnvBoost;
    this.materials.membraneEdge.emissiveIntensity =
      appearance.rimEmissiveIntensity +
      idleGlow * appearance.idleEmissivePulse * 0.8 +
      activationStrength * 0.04;
  }

  destroy() {
    const bandTextures = new Set([
      this.activeSweepBand.material?.map,
      this.activeSweepBand.material?.alphaMap,
      this.conversionVeil.material?.map,
      this.conversionVeil.material?.alphaMap,
      this.conversionPulse.material?.map,
      this.conversionPulse.material?.alphaMap,
    ]);

    for (const texture of bandTextures) {
      texture?.dispose?.();
    }

    this.activeSweepBand.material?.dispose();
    this.conversionVeil.material?.dispose();
    this.conversionPulse.material?.dispose();
    this.membraneHalo.material?.dispose();
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

function createMembraneShape(
  radiusX,
  radiusY,
  { exponent = 3, shoulderPinch = 0.08, points = 72 } = {},
) {
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
  horizontalGradient.addColorStop(0.18, "rgba(255,255,255,0.14)");
  horizontalGradient.addColorStop(0.5, "rgba(255,255,255,0.95)");
  horizontalGradient.addColorStop(0.82, "rgba(255,255,255,0.14)");
  horizontalGradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = horizontalGradient;
  context.fillRect(0, 0, width, height);

  context.globalCompositeOperation = "destination-in";
  const verticalGradient = context.createLinearGradient(0, 0, 0, height);
  verticalGradient.addColorStop(0, "rgba(255,255,255,0)");
  verticalGradient.addColorStop(0.16, "rgba(255,255,255,0.44)");
  verticalGradient.addColorStop(0.5, "rgba(255,255,255,1)");
  verticalGradient.addColorStop(0.84, "rgba(255,255,255,0.44)");
  verticalGradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = verticalGradient;
  context.fillRect(0, 0, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createConversionTexture() {
  const width = 160;
  const height = 320;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    return new THREE.Texture();
  }

  const horizontalGradient = context.createLinearGradient(0, 0, width, 0);
  horizontalGradient.addColorStop(0, "rgba(255,255,255,0)");
  horizontalGradient.addColorStop(0.18, "rgba(255,255,255,0.34)");
  horizontalGradient.addColorStop(0.5, "rgba(255,255,255,1)");
  horizontalGradient.addColorStop(0.82, "rgba(255,255,255,0.34)");
  horizontalGradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = horizontalGradient;
  context.fillRect(0, 0, width, height);

  context.globalCompositeOperation = "destination-in";
  const radialGradient = context.createRadialGradient(
    width * 0.5,
    height * 0.5,
    Math.min(width, height) * 0.08,
    width * 0.5,
    height * 0.5,
    height * 0.48,
  );
  radialGradient.addColorStop(0, "rgba(255,255,255,1)");
  radialGradient.addColorStop(0.36, "rgba(255,255,255,0.76)");
  radialGradient.addColorStop(0.8, "rgba(255,255,255,0.12)");
  radialGradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = radialGradient;
  context.fillRect(0, 0, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
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
