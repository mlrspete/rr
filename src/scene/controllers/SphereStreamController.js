import * as THREE from "three";

const DEFAULT_LANE_ORDER = ["mid", "low", "upperMid"];

export class SphereStreamController {
  constructor({ config, sphereConfig, baseMaterial, reducedMotion = false }) {
    this.config = config;
    this.sphereConfig = sphereConfig;
    this.reducedMotion = reducedMotion;
    this.group = new THREE.Group();
    this.group.name = "sphereStream";

    this.laneOrder = config.leadLaneOrder ?? DEFAULT_LANE_ORDER;
    this.laneCurves = new Map();
    this.leadLaneIndex = Math.max(
      0,
      this.laneOrder.indexOf(config.initialLeadLane ?? this.laneOrder[0]),
    );

    this.geometry = createSphereGeometry(sphereConfig);
    this.trailSlots = (config.trailSlots ?? []).slice(
      0,
      Math.max(0, (config.poolSize ?? 3) - 1),
    );
    this.entries = [
      createSphereEntry({
        geometry: this.geometry,
        material: baseMaterial.clone(),
        name: "leadSphere",
      }),
      ...this.trailSlots.map((slot, index) =>
        createSphereEntry({
          geometry: this.geometry,
          material: baseMaterial.clone(),
          name: `trailSphere${index + 1}`,
        }),
      ),
    ];

    for (const entry of this.entries) {
      this.group.add(entry.mesh);
    }
  }

  setLayout(chamberProfile) {
    this.laneCurves.clear();

    for (const [laneKey, laneConfig] of Object.entries(this.config.lanes ?? {})) {
      this.laneCurves.set(laneKey, createLaneCurve(chamberProfile.sphere, laneConfig));
    }
  }

  advanceLeadLane() {
    this.leadLaneIndex = (this.leadLaneIndex + 1) % this.laneOrder.length;
  }

  update({
    elapsed,
    leadPathPhase,
    leadOpacity,
    leadScale,
    motionScale = 1,
  }) {
    const leadLaneKey = this.laneOrder[this.leadLaneIndex] ?? this.laneOrder[0];
    const leadLane = this.config.lanes?.[leadLaneKey];
    const leadCurve = this.laneCurves.get(leadLaneKey);

    applyLeadSphereState({
      entry: this.entries[0],
      curve: leadCurve,
      lane: leadLane,
      leadPathPhase,
      leadOpacity,
      leadScale,
      elapsed,
      sphereConfig: this.sphereConfig,
      motionConfig: this.config.motion,
    });

    const reducedMotionScale = this.reducedMotion
      ? this.config.reducedMotionTimeScale ?? 0.74
      : 1;
    const streamTime = elapsed * reducedMotionScale;
    const trailDuration = Math.max(this.config.trailTravelDuration ?? 2.85, 0.001);

    this.trailSlots.forEach((slot, slotIndex) => {
      const entry = this.entries[slotIndex + 1];
      const loopTime = streamTime + (slot.timeOffset ?? 0);
      const iteration = Math.floor(loopTime / trailDuration);
      const laneIndex = positiveModuloInt(iteration + (slot.laneShift ?? 0), this.laneOrder.length);
      const laneKey = this.laneOrder[laneIndex] ?? this.laneOrder[0];
      const lane = this.config.lanes?.[laneKey];
      const curve = this.laneCurves.get(laneKey);
      const phase = positiveModulo(loopTime / trailDuration + (lane?.phaseOffset ?? 0), 1);

      applyTrailSphereState({
        entry,
        curve,
        lane,
        slot,
        phase,
        elapsed,
        motionScale,
        reducedMotion: this.reducedMotion,
        trailEndProgress: this.config.trailEndProgress ?? 0.82,
        fadeInEnd: this.config.trailFadeInEnd ?? 0.18,
        fadeOutStart: this.config.trailFadeOutStart ?? 0.68,
        motionConfig: this.config.motion,
      });
    });
  }

  destroy() {
    for (const entry of this.entries) {
      entry.material.dispose();
    }

    this.geometry.dispose();
  }
}

function createSphereEntry({ geometry, material, name }) {
  material.transparent = true;
  material.opacity = 0;

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.renderOrder = 2;
  mesh.visible = false;

  return {
    mesh,
    material,
  };
}

function createSphereGeometry(config) {
  const geometry = new THREE.SphereGeometry(
    config.radius,
    config.widthSegments,
    config.heightSegments,
  );
  geometry.computeVertexNormals();
  return geometry;
}

function createLaneCurve(baseSphere, laneConfig = {}) {
  const curve = new THREE.CatmullRomCurve3([
    vectorFromOffset(baseSphere, "start", laneConfig.startOffset),
    vectorFromOffset(baseSphere, "near", laneConfig.nearOffset),
    vectorFromOffset(baseSphere, "cross", laneConfig.crossOffset),
    vectorFromOffset(baseSphere, "hidden", laneConfig.hiddenOffset),
  ]);
  curve.curveType = "centripetal";
  curve.closed = false;
  return curve;
}

function vectorFromOffset(baseSphere, prefix, offset = {}) {
  return new THREE.Vector3(
    baseSphere[`${prefix}X`] + (offset.x ?? 0),
    baseSphere[`${prefix}Y`] + (offset.y ?? 0),
    baseSphere[`${prefix}Z`] + (offset.z ?? 0),
  );
}

function applyLeadSphereState({
  entry,
  curve,
  lane,
  leadPathPhase,
  leadOpacity,
  leadScale,
  elapsed,
  sphereConfig,
  motionConfig,
}) {
  if (!curve || !lane) {
    entry.material.opacity = 0;
    entry.mesh.visible = false;
    return;
  }

  const progress = THREE.MathUtils.clamp(leadPathPhase, 0, 1);
  const point = curve.getPointAt(progress);
  const tangent = curve.getTangentAt(progress);
  const stagingInfluence = 1 - smoothstep(progress / 0.22);
  const idleOffset =
    Math.sin(elapsed * sphereConfig.idleFloatSpeed + lane.driftPhase) *
    sphereConfig.idleFloatAmplitude *
    leadOpacity;
  const driftX =
    Math.sin(elapsed * 0.48 + lane.driftPhase) *
    motionConfig.leadDriftX *
    stagingInfluence;
  const driftZ =
    Math.cos(elapsed * 0.36 + lane.driftPhase * 1.4) *
    motionConfig.leadDriftZ *
    stagingInfluence;

  entry.mesh.position.set(
    point.x + driftX + tangent.x * motionConfig.leadTangentPull,
    point.y + idleOffset,
    point.z + driftZ,
  );
  entry.mesh.scale.setScalar(leadScale * (lane.scale ?? 1));
  entry.material.opacity = leadOpacity;
  entry.material.transparent = leadOpacity < 0.999;
  entry.mesh.visible = leadOpacity > 0.002;
}

function applyTrailSphereState({
  entry,
  curve,
  lane,
  slot,
  phase,
  elapsed,
  motionScale,
  reducedMotion,
  trailEndProgress,
  fadeInEnd,
  fadeOutStart,
  motionConfig,
}) {
  if (!curve || !lane) {
    entry.material.opacity = 0;
    entry.mesh.visible = false;
    return;
  }

  const easedPhase = smoothstep(phase);
  const progress = THREE.MathUtils.lerp(0, trailEndProgress, easedPhase);
  const point = curve.getPointAt(progress);
  const tangent = curve.getTangentAt(progress);
  const reveal = smoothstep(THREE.MathUtils.clamp(phase / Math.max(fadeInEnd, 0.001), 0, 1));
  const fadeOut = 1 -
    smoothstep(
      THREE.MathUtils.clamp(
        (phase - fadeOutStart) / Math.max(1 - fadeOutStart, 0.001),
        0,
        1,
      ),
    );
  const opacityScale = reducedMotion ? 0.86 : 1;
  const opacity = (slot.maxOpacity ?? 0.5) * opacityScale * reveal * fadeOut;

  if (opacity <= 0.002) {
    entry.material.opacity = 0;
    entry.mesh.visible = false;
    return;
  }

  const backfieldInfluence = 1 - easedPhase * 0.7;
  const driftX =
    Math.sin(elapsed * 0.42 + (slot.phaseSeed ?? 0)) *
    motionConfig.trailDriftX *
    backfieldInfluence *
    motionScale;
  const driftZ =
    Math.cos(elapsed * 0.34 + lane.driftPhase * Math.PI * 2 + (slot.phaseSeed ?? 0)) *
    motionConfig.trailDriftZ *
    backfieldInfluence *
    motionScale;
  const bob =
    Math.sin(elapsed * motionConfig.trailBobSpeed + (slot.phaseSeed ?? 0)) *
    motionConfig.trailBob *
    reveal *
    motionScale;
  const pulse =
    1 +
    Math.sin(elapsed * 0.36 + (slot.phaseSeed ?? 0) * 2.2) *
      motionConfig.trailScalePulse *
      reveal;

  entry.mesh.position.set(
    point.x + driftX + tangent.x * motionConfig.trailTangentPull,
    point.y + bob,
    point.z + driftZ + (slot.depthOffset ?? 0),
  );
  entry.mesh.scale.setScalar((slot.scale ?? 0.9) * (lane.scale ?? 1) * pulse);
  entry.material.opacity = opacity;
  entry.material.transparent = true;
  entry.mesh.visible = true;
}

function smoothstep(value) {
  const clamped = THREE.MathUtils.clamp(value, 0, 1);
  return clamped * clamped * (3 - 2 * clamped);
}

function positiveModulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function positiveModuloInt(value, divisor) {
  const normalized = value % divisor;
  return normalized < 0 ? normalized + divisor : normalized;
}
