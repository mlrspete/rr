import * as THREE from "three";

const DEFAULT_QUALITY = {
  transmissionFloor: 0.72,
  idleTransmissionDriftScale: 1,
  bodyTransmissionBoostScale: 1,
  bodyRoughnessShiftScale: 1,
  bodyClearcoatBoostScale: 1,
  bodyClearcoatRoughnessShiftScale: 1,
  bodyThicknessBoostScale: 1,
  bodyAttenuationDistanceBoostScale: 1,
  bodyEnvBoostScale: 1,
  bodyEmissiveBoostScale: 1,
  bodyIorBoostScale: 1,
  rimEnvBoostScale: 1,
  rimOpacityBoostScale: 1,
  rimRoughnessShiftScale: 1,
  rimEmissiveBoostScale: 1,
};

const DEFAULT_FROST = {
  enabled: false,
  normalScale: { x: 0, y: 0 },
  clearcoatNormalScale: { x: 0, y: 0 },
};

export class MembraneController {
  constructor({ config, materials, glowTexture }) {
    this.config = config;
    this.materials = materials;
    this.frostNormalTexture = null;

    this.group = new THREE.Group();
    this.group.name = "membraneSystem";

    this.basePosition = new THREE.Vector3();
    this.baseRotation = new THREE.Euler();
    this.baseScale = new THREE.Vector3(1, 1, 1);
    this.bandBaseColor = new THREE.Color();
    this.bandHighlightColor = new THREE.Color();

    const { body, sweepBand, halo, conversionVeil, conversionPulse } = config.geometry;
    const bodyGeometry = createMembraneBodyGeometry(body);

    this.membraneBody = new THREE.Mesh(bodyGeometry, materials.membrane);
    this.membraneBody.name = "membraneBody";
    this.membraneBody.renderOrder = 3;
    this.group.add(this.membraneBody);

    this.membraneRim = materials.membraneEdge
      ? new THREE.Mesh(bodyGeometry, materials.membraneEdge)
      : null;

    if (this.membraneRim) {
      this.membraneRim.name = "membraneRim";
      this.membraneRim.renderOrder = 4;
      this.group.add(this.membraneRim);
    }

    this.bandTexture = createSweepBandTexture();

    this.activeSweepBand = new THREE.Mesh(
      createRoundedBandGeometry(sweepBand.width, sweepBand.height, sweepBand.radius),
      materials.sweepBand.clone(),
    );
    this.activeSweepBand.name = "activeSweepBand";
    this.activeSweepBand.material.map = this.bandTexture;
    this.activeSweepBand.material.alphaMap = this.bandTexture;
    this.activeSweepBand.material.needsUpdate = true;
    this.activeSweepBand.position.z = body.depth * 0.64;
    this.activeSweepBand.renderOrder = 5;
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
    this.conversionVeil.renderOrder = 6;
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
    this.conversionPulse.renderOrder = 7;
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

    this.setConfig(config);
  }

  setConfig(config) {
    this.config = config;
    this.bandBaseColor.copy(new THREE.Color(config.palette.cool)).lerp(
      new THREE.Color(config.palette.coolEdge),
      0.26,
    );
    this.bandHighlightColor.copy(new THREE.Color(config.palette.coolEdge)).lerp(
      new THREE.Color(config.palette.chrome),
      0.22,
    );

    this.activeSweepBand.material.opacity = config.activation.bandBaseOpacity;
    this.activeSweepBand.material.color.copy(this.bandBaseColor);
    this.membraneHalo.material.color.set(config.palette.coolEdge);
    this.membraneHalo.material.opacity = config.activation.haloBaseOpacity;

    if (this.membraneRim) {
      this.membraneRim.visible = (config.appearance.rimOpacity ?? 0) > 0.001;
    }

    this.applyFrostTexture();
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
    const quality = this.config.quality ?? DEFAULT_QUALITY;
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
    const impactPulse = createPhasePulse(phaseClamped, 0.48, 0.18);
    const translatePulse = createPhasePulse(phaseClamped, 0.68, 0.26);
    const emergenceWindow =
      smoothstep(THREE.MathUtils.clamp((phaseClamped - 0.24) / 0.2, 0, 1)) *
      (1 - smoothstep(THREE.MathUtils.clamp((phaseClamped - 0.82) / 0.16, 0, 1)));
    const emergencePulse = activationStrength * emergenceWindow;
    const opticalResponse = activationStrength * (0.58 + impactPulse * 0.42);
    const transferResponse = activationStrength * (0.5 + translatePulse * 0.5);

    this.group.position.set(
      this.basePosition.x + idleLateralDrift * introMotion,
      this.basePosition.y + idleVerticalDrift * introMotion,
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
      this.baseScale.x *
        (1 + idleBreath * 0.14 + activationStrength * 0.004 - emergencePulse * 0.004),
      this.baseScale.y *
        (1 - idleBreath * 0.04 - activationStrength * 0.002 - emergencePulse * 0.006),
      this.baseScale.z *
        (1 + idleBreath * 0.1 + activationStrength * 0.006 + emergencePulse * 0.014),
    );

    this.membraneBody.position.z =
      -activationStrength * 0.004 -
      idleBodyBreath * 0.01 +
      emergencePulse * 0.016 +
      opticalResponse * 0.004;
    this.membraneBody.scale.set(
      1 +
        idleBodyBreath * 0.06 +
        activationStrength * activationConfig.bodyScaleBoost * 0.24 -
        emergencePulse * 0.008,
      1 - idleBodyBreath * 0.02 - activationStrength * 0.008 - emergencePulse * 0.008,
      1 +
        idleBodyBreath * 0.1 +
        activationStrength * activationConfig.bodyScaleBoost * 0.64 +
        emergencePulse * 0.05,
    );

    if (this.membraneRim) {
      const rimShellScale =
        (appearance.rimShellScale ?? 1.01) +
        activationStrength * activationConfig.rimScaleBoost * 0.55 +
        emergencePulse * 0.006;

      this.membraneRim.position.z = this.membraneBody.position.z + 0.004 + opticalResponse * 0.002;
      this.membraneRim.scale.setScalar(rimShellScale);
      this.membraneRim.visible = (appearance.rimOpacity ?? 0) > 0.001;
    }

    this.activeSweepBand.position.x = lateralBandOffset;
    this.activeSweepBand.position.y =
      Math.sin(elapsed * 0.42 + phaseClamped * Math.PI) *
        motion.bandBob *
        motionScale +
      Math.sin(elapsed * 0.18 + 0.24) * motion.bandBob * 0.28 * introMotion;
    this.activeSweepBand.position.z =
      this.bandBasePosition.z +
      activationStrength * activationConfig.bandDepthBoost +
      opticalResponse * 0.018 +
      emergencePulse * 0.016;
    this.activeSweepBand.rotation.z = THREE.MathUtils.lerp(-0.045, 0.045, phaseClamped);
    this.activeSweepBand.scale.set(
      1 +
        idleBreath * 0.06 +
        activationStrength * activationConfig.bandWidthBoost +
        opticalResponse * 0.022,
      1 +
        idleBreath * 0.04 +
        activationStrength * activationConfig.bandHeightBoost +
        emergencePulse * 0.024,
      1,
    );
    this.activeSweepBand.material.opacity =
      activationConfig.bandBaseOpacity +
      idleGlow * activationConfig.bandIdleOpacity +
      activationStrength *
        activationConfig.bandPulseOpacity *
        (0.56 + impactPulse * 0.44);
    this.activeSweepBand.material.color
      .copy(this.bandBaseColor)
      .lerp(this.bandHighlightColor, opticalResponse * 0.22 + emergencePulse * 0.16);

    const veilOffset =
      (phaseClamped - 0.44) * this.config.geometry.conversionVeil.travelX;
    this.conversionVeil.position.x = this.veilBasePosition.x + veilOffset;
    this.conversionVeil.position.z =
      this.veilBasePosition.z + emergencePulse * 0.032 + transferResponse * 0.012;
    this.conversionVeil.scale.set(
      this.veilBaseScale.x +
        activationStrength * this.config.activation.veilScaleBoost +
        emergencePulse * 0.05,
      this.veilBaseScale.y +
        activationStrength * this.config.activation.veilScaleBoost * 0.7 +
        emergencePulse * 0.032,
      1,
    );
    this.conversionVeil.material.opacity =
      activationStrength *
      this.config.activation.veilOpacity *
      (0.18 + Math.sin(phaseClamped * Math.PI) * 0.22 + translatePulse * 0.38);

    const pulseOffset =
      (phaseClamped - 0.36) * this.config.geometry.conversionPulse.travelX;
    this.conversionPulse.position.x = this.pulseBasePosition.x + pulseOffset;
    this.conversionPulse.position.z =
      this.pulseBasePosition.z + emergencePulse * 0.04 + opticalResponse * 0.014;
    this.conversionPulse.scale.set(
      this.pulseBaseScale.x +
        activationStrength * this.config.activation.pulseScaleBoost +
        emergencePulse * 0.065,
      this.pulseBaseScale.y +
        activationStrength * this.config.activation.pulseScaleBoost +
        emergencePulse * 0.05,
      1,
    );
    this.conversionPulse.material.opacity =
      activationStrength *
      this.config.activation.pulseOpacity *
      Math.sin(phaseClamped * Math.PI) *
      (0.48 + impactPulse * 0.52);

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
        idleGlow * 0.06 +
        activationStrength * activationConfig.haloScaleXBoost,
      this.haloBaseScale.y +
        idleGlow * 0.1 +
        activationStrength * activationConfig.haloScaleYBoost,
      1,
    );
    this.membraneHalo.material.opacity =
      activationConfig.haloBaseOpacity +
      idleGlow * activationConfig.haloIdleOpacity +
      activationStrength *
        activationConfig.haloPulseOpacity *
        (0.58 + impactPulse * 0.42);

    this.materials.membrane.emissiveIntensity =
      appearance.emissiveIntensity +
      idleGlow * appearance.idleEmissivePulse +
      opticalResponse *
        activationConfig.bodyEmissiveBoost *
        quality.bodyEmissiveBoostScale;
    this.materials.membrane.thickness =
      appearance.thickness +
      transferResponse *
        activationConfig.bodyThicknessBoost *
        quality.bodyThicknessBoostScale;
    this.materials.membrane.roughness = THREE.MathUtils.clamp(
      appearance.roughness +
        idleFrost * appearance.idleRoughnessDrift +
        opticalResponse *
          activationConfig.bodyRoughnessShift *
          quality.bodyRoughnessShiftScale,
      0.04,
      1,
    );
    this.materials.membrane.clearcoat = THREE.MathUtils.clamp(
      appearance.clearcoat +
        opticalResponse *
          activationConfig.bodyClearcoatBoost *
          quality.bodyClearcoatBoostScale,
      0,
      1,
    );
    this.materials.membrane.clearcoatRoughness = THREE.MathUtils.clamp(
      appearance.clearcoatRoughness +
        idleFrost * appearance.idleClearcoatRoughnessDrift +
        opticalResponse *
          activationConfig.bodyClearcoatRoughnessShift *
          quality.bodyClearcoatRoughnessShiftScale,
      0.02,
      1,
    );
    this.materials.membrane.transmission = THREE.MathUtils.clamp(
      appearance.transmission -
        idleFrost * appearance.idleTransmissionDrift * quality.idleTransmissionDriftScale +
        opticalResponse *
          activationConfig.bodyTransmissionBoost *
          quality.bodyTransmissionBoostScale,
      quality.transmissionFloor,
      1,
    );
    this.materials.membrane.ior =
      appearance.ior +
      opticalResponse * activationConfig.bodyIorBoost * quality.bodyIorBoostScale;
    this.materials.membrane.attenuationDistance = Math.max(
      0.18,
      appearance.attenuationDistance -
        idleFrost * appearance.idleAttenuationDrift * 0.45 +
        opticalResponse *
          activationConfig.bodyAttenuationDistanceBoost *
          quality.bodyAttenuationDistanceBoostScale,
    );
    this.materials.membrane.envMapIntensity =
      appearance.envMapIntensity +
      idleGlow * appearance.idleEnvDrift +
      opticalResponse * activationConfig.bodyEnvBoost * quality.bodyEnvBoostScale;

    if (this.materials.membraneEdge) {
      this.materials.membraneEdge.opacity = THREE.MathUtils.clamp(
        (appearance.rimOpacity ?? 0) +
          opticalResponse *
            activationConfig.rimOpacityBoost *
            quality.rimOpacityBoostScale,
        0,
        1,
      );
      this.materials.membraneEdge.emissiveIntensity =
        (appearance.rimEmissiveIntensity ?? 0) +
        idleGlow * appearance.idleEmissivePulse * 0.2 +
        opticalResponse *
          activationConfig.rimEmissiveBoost *
          quality.rimEmissiveBoostScale;
      this.materials.membraneEdge.roughness = THREE.MathUtils.clamp(
        (appearance.rimRoughness ?? 0) +
          idleFrost * appearance.idleRoughnessDrift * 0.55 +
          opticalResponse *
            activationConfig.rimRoughnessShift *
            quality.rimRoughnessShiftScale,
        0.02,
        1,
      );
      this.materials.membraneEdge.clearcoat = THREE.MathUtils.clamp(
        (appearance.rimClearcoat ?? 0) +
          opticalResponse *
            activationConfig.bodyClearcoatBoost *
            quality.bodyClearcoatBoostScale *
            0.45,
        0,
        1,
      );
      this.materials.membraneEdge.clearcoatRoughness = THREE.MathUtils.clamp(
        (appearance.rimClearcoatRoughness ?? 0) +
          idleFrost * appearance.idleClearcoatRoughnessDrift * 0.45 +
          activationStrength *
            activationConfig.bodyClearcoatRoughnessShift *
            quality.bodyClearcoatRoughnessShiftScale *
            0.22,
        0.02,
        1,
      );
      this.materials.membraneEdge.transmission = THREE.MathUtils.clamp(
        (appearance.rimTransmission ?? 0) +
          opticalResponse *
            activationConfig.bodyTransmissionBoost *
            quality.bodyTransmissionBoostScale *
            0.12,
        0,
        1,
      );
      this.materials.membraneEdge.thickness =
        (appearance.rimThickness ?? 0) +
        transferResponse *
          activationConfig.bodyThicknessBoost *
          quality.bodyThicknessBoostScale *
          0.16;
      this.materials.membraneEdge.ior =
        (appearance.rimIor ?? appearance.ior) +
        opticalResponse *
          activationConfig.bodyIorBoost *
          quality.bodyIorBoostScale *
          0.4;
      this.materials.membraneEdge.envMapIntensity =
        (appearance.rimEnvMapIntensity ?? appearance.envMapIntensity) +
        idleGlow * appearance.idleEnvDrift * 0.2 +
        opticalResponse * activationConfig.rimEnvBoost * quality.rimEnvBoostScale;
    }
  }

  destroy() {
    const bandTextures = new Set([
      this.activeSweepBand.material?.map,
      this.activeSweepBand.material?.alphaMap,
      this.conversionVeil.material?.map,
      this.conversionVeil.material?.alphaMap,
      this.conversionPulse.material?.map,
      this.conversionPulse.material?.alphaMap,
      this.frostNormalTexture,
    ]);

    for (const texture of bandTextures) {
      texture?.dispose?.();
    }

    this.activeSweepBand.material?.dispose();
    this.conversionVeil.material?.dispose();
    this.conversionPulse.material?.dispose();
    this.membraneHalo.material?.dispose();
  }

  applyFrostTexture() {
    const frost = resolveFrostConfig(this.config.frost);
    const nextTexture = frost.enabled ? createFrostNormalTexture(frost) : null;

    applyFrostTextureToMaterial(this.materials.membrane, nextTexture, frost);
    applyFrostTextureToMaterial(this.materials.membraneEdge, nextTexture, frost);

    this.frostNormalTexture?.dispose?.();
    this.frostNormalTexture = nextTexture;
  }
}

function createMembraneBodyGeometry(spec) {
  const shape = createMembraneFaceShape(spec);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: spec.depth,
    bevelEnabled: true,
    bevelSegments: spec.bevelSegments ?? 8,
    steps: 1,
    curveSegments: spec.cornerSegments ?? spec.points ?? 24,
    bevelSize: spec.bevelSize,
    bevelThickness: spec.bevelThickness,
  });

  geometry.center();
  return geometry;
}

function createMembraneFaceShape(spec) {
  if (spec.width && spec.height) {
    return createRoundedRectShape(spec.width, spec.height, {
      cornerRadius: spec.cornerRadius,
    });
  }

  return createSuperellipseShape(spec.radiusX, spec.radiusY, spec);
}


function createRoundedRectShape(width, height, { cornerRadius = 0.24 } = {}) {
  const shape = new THREE.Shape();
  const halfWidth = width * 0.5;
  const halfHeight = height * 0.5;
  const radius = Math.min(cornerRadius, halfWidth, halfHeight);

  shape.moveTo(-halfWidth + radius, -halfHeight);
  shape.lineTo(halfWidth - radius, -halfHeight);
  shape.absarc(halfWidth - radius, -halfHeight + radius, radius, -Math.PI / 2, 0);
  shape.lineTo(halfWidth, halfHeight - radius);
  shape.absarc(halfWidth - radius, halfHeight - radius, radius, 0, Math.PI / 2);
  shape.lineTo(-halfWidth + radius, halfHeight);
  shape.absarc(-halfWidth + radius, halfHeight - radius, radius, Math.PI / 2, Math.PI);
  shape.lineTo(-halfWidth, -halfHeight + radius);
  shape.absarc(-halfWidth + radius, -halfHeight + radius, radius, Math.PI, Math.PI * 1.5);

  return shape;
}

function createSuperellipseShape(
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

function smoothstep(value) {
  const clamped = THREE.MathUtils.clamp(value, 0, 1);
  return clamped * clamped * (3 - 2 * clamped);
}

function createPhasePulse(phase, center, radius) {
  if (radius <= 0) {
    return 0;
  }

  return 1 - smoothstep(THREE.MathUtils.clamp(Math.abs(phase - center) / radius, 0, 1));
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

function resolveFrostConfig(frost = DEFAULT_FROST) {
  return {
    ...DEFAULT_FROST,
    ...frost,
    normalScale: {
      ...DEFAULT_FROST.normalScale,
      ...(frost.normalScale ?? {}),
    },
    clearcoatNormalScale: {
      ...DEFAULT_FROST.clearcoatNormalScale,
      ...(frost.clearcoatNormalScale ?? {}),
    },
  };
}

function applyFrostTextureToMaterial(material, texture, frost) {
  if (!material) {
    return;
  }

  const previousNormalMap = material.normalMap;
  const previousClearcoatNormalMap = material.clearcoatNormalMap;

  material.normalMap = texture;
  material.clearcoatNormalMap = texture;
  material.normalScale.set(frost.normalScale.x, frost.normalScale.y);
  material.clearcoatNormalScale.set(
    frost.clearcoatNormalScale.x,
    frost.clearcoatNormalScale.y,
  );

  if (
    previousNormalMap !== texture ||
    previousClearcoatNormalMap !== texture
  ) {
    material.needsUpdate = true;
  }
}

function createFrostNormalTexture(spec) {
  const size = Math.max(16, spec.textureSize ?? 64);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");

  if (!context) {
    return new THREE.Texture();
  }

  const imageData = context.createImageData(size, size);
  const heights = new Float32Array(size * size);
  const filteredHeights = new Float32Array(size * size);
  const octaves = Math.max(1, spec.octaves ?? 3);
  const baseFrequency = spec.baseFrequency ?? 1.8;
  const gain = spec.gain ?? 0.54;
  const lacunarity = spec.lacunarity ?? 2.1;
  const directionalWarp = spec.directionalWarp ?? 0.18;
  const heightStrength = spec.heightStrength ?? 1.2;
  const seed = spec.seed ?? 1;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const u = x / size;
      const v = y / size;
      let amplitude = 1;
      let frequency = baseFrequency;
      let amplitudeSum = 0;
      let height = 0;

      for (let octave = 0; octave < octaves; octave += 1) {
        const warpedX =
          u * frequency +
          Math.sin((v * 1.7 + octave * 0.37 + seed * 0.11) * Math.PI * 2) *
            directionalWarp;
        const warpedY =
          v * frequency +
          Math.cos((u * 1.35 + octave * 0.29 + seed * 0.07) * Math.PI * 2) *
            directionalWarp *
            0.85;

        height += amplitude * sampleValueNoise(warpedX, warpedY, seed + octave * 19.37);
        amplitudeSum += amplitude;
        amplitude *= gain;
        frequency *= lacunarity;
      }

      height /= Math.max(amplitudeSum, Number.EPSILON);
      height =
        height * 0.84 +
        Math.sin((u * 1.2 + v * 0.72 + seed * 0.03) * Math.PI * 8) * 0.04;
      heights[y * size + x] = height;
    }
  }

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const center = heights[y * size + x];
      const left = heights[y * size + wrapIndex(x - 1, size)];
      const right = heights[y * size + wrapIndex(x + 1, size)];
      const up = heights[wrapIndex(y - 1, size) * size + x];
      const down = heights[wrapIndex(y + 1, size) * size + x];

      filteredHeights[y * size + x] =
        center * 0.44 + (left + right + up + down) * 0.14;
    }
  }

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const left = filteredHeights[y * size + wrapIndex(x - 1, size)];
      const right = filteredHeights[y * size + wrapIndex(x + 1, size)];
      const up = filteredHeights[wrapIndex(y - 1, size) * size + x];
      const down = filteredHeights[wrapIndex(y + 1, size) * size + x];
      const dx = (right - left) * heightStrength;
      const dy = (down - up) * heightStrength;

      let nx = -dx;
      let ny = -dy;
      let nz = 1;
      const length = Math.hypot(nx, ny, nz) || 1;

      nx /= length;
      ny /= length;
      nz /= length;

      const index = (y * size + x) * 4;
      imageData.data[index] = Math.round((nx * 0.5 + 0.5) * 255);
      imageData.data[index + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      imageData.data[index + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      imageData.data[index + 3] = 255;
    }
  }

  context.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(spec.repeatX ?? 1, spec.repeatY ?? 1);
  texture.colorSpace = THREE.NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function sampleValueNoise(x, y, seed) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = x0 + 1;
  const y1 = y0 + 1;
  const tx = x - x0;
  const ty = y - y0;
  const sx = smoothHermite(tx);
  const sy = smoothHermite(ty);

  const top = THREE.MathUtils.lerp(
    sampleGridNoise(x0, y0, seed),
    sampleGridNoise(x1, y0, seed),
    sx,
  );
  const bottom = THREE.MathUtils.lerp(
    sampleGridNoise(x0, y1, seed),
    sampleGridNoise(x1, y1, seed),
    sx,
  );

  return THREE.MathUtils.lerp(top, bottom, sy);
}

function sampleGridNoise(x, y, seed) {
  const value = Math.sin(x * 127.1 + y * 311.7 + seed * 91.19) * 43758.5453123;
  return value - Math.floor(value);
}

function smoothHermite(value) {
  return value * value * (3 - 2 * value);
}

function wrapIndex(value, size) {
  return ((value % size) + size) % size;
}
