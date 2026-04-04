import * as THREE from "three";

const DEFAULT_LANE_ORDER = ["mid", "upperMid", "mid", "low"];

export class SphereStreamController {
  constructor({ config, sphereConfig, baseMaterial }) {
    this.config = config;
    this.sphereConfig = sphereConfig;
    this.group = new THREE.Group();
    this.group.name = "sphereStream";

    this.laneOrder = config.leadLaneOrder ?? DEFAULT_LANE_ORDER;
    this.laneCurves = new Map();
    this.leadLaneIndex = Math.max(
      0,
      this.laneOrder.indexOf(config.initialLeadLane ?? this.laneOrder[0]),
    );

    this.geometry = createSphereGeometry(sphereConfig);
    this.entry = createSphereEntry({
      geometry: this.geometry,
      material: baseMaterial.clone(),
      name: "leadSphere",
    });

    this.group.add(this.entry.mesh);
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
      entry: this.entry,
      curve: leadCurve,
      lane: leadLane,
      leadPathPhase,
      leadOpacity,
      leadScale,
      elapsed,
      motionScale,
      sphereConfig: this.sphereConfig,
      motionConfig: this.config.motion,
    });
  }

  destroy() {
    this.entry.material.dispose();
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
  motionScale,
  sphereConfig,
  motionConfig,
}) {
  if (!curve || !lane) {
    entry.material.opacity = 0;
    entry.mesh.visible = false;
    return;
  }

  const progress = smootherstep(THREE.MathUtils.clamp(leadPathPhase, 0, 1));
  const point = curve.getPointAt(progress);
  const tangent = curve.getTangentAt(progress);
  const driftFade = 1 -
    smootherstep(
      THREE.MathUtils.clamp(
        progress / Math.max(motionConfig.leadDriftFade ?? 0.64, 0.001),
        0,
        1,
      ),
    );
  const opacityEnvelope = THREE.MathUtils.lerp(
    motionConfig.approachOpacityFloor ?? 0.62,
    1,
    smoothstep(
      THREE.MathUtils.clamp(
        progress / Math.max(motionConfig.approachRevealEnd ?? 0.32, 0.001),
        0,
        1,
      ),
    ),
  );
  const lanePhase = lane.driftPhase * Math.PI * 2;
  const idleOffset =
    Math.sin(elapsed * sphereConfig.idleFloatSpeed + lanePhase) *
    sphereConfig.idleFloatAmplitude *
    leadOpacity *
    motionScale *
    (0.4 + driftFade * 0.6);
  const driftX =
    (
      Math.sin(elapsed * (motionConfig.leadDriftSpeedX ?? 0.42) + lanePhase) *
        (motionConfig.leadDriftX ?? 0.024) +
      (lane.driftBias ?? 0)
    ) *
    driftFade *
    motionScale;
  const driftY =
    (
      Math.sin(elapsed * (motionConfig.leadDriftSpeedY ?? 0.34) + lanePhase * 1.36) *
        (motionConfig.leadDriftY ?? 0.016) +
      Math.sin(progress * Math.PI) * (lane.arcLift ?? 0)
    ) *
    driftFade *
    motionScale;
  const driftZ =
    Math.cos(elapsed * (motionConfig.leadDriftSpeedZ ?? 0.28) + lanePhase * 1.18) *
    (motionConfig.leadDriftZ ?? 0.015) *
    driftFade *
    motionScale;
  const scalePulse =
    1 +
    Math.sin(elapsed * (motionConfig.leadScalePulseSpeed ?? 0.3) + lanePhase * 1.8) *
      (motionConfig.leadScalePulse ?? 0.012) *
      (0.2 + driftFade * 0.8) *
      motionScale;
  const tangentPull = (motionConfig.leadTangentPull ?? 0.014) * (0.45 + driftFade * 0.55);

  entry.mesh.position.set(
    point.x + driftX + tangent.x * tangentPull,
    point.y + idleOffset + driftY,
    point.z + driftZ,
  );
  entry.mesh.scale.setScalar(leadScale * (lane.scale ?? 1) * scalePulse);
  entry.material.opacity = leadOpacity * opacityEnvelope;
  entry.material.transparent = entry.material.opacity < 0.999;
  entry.mesh.visible = entry.material.opacity > 0.002;
}

function smoothstep(value) {
  const clamped = THREE.MathUtils.clamp(value, 0, 1);
  return clamped * clamped * (3 - 2 * clamped);
}

function smootherstep(value) {
  const clamped = THREE.MathUtils.clamp(value, 0, 1);
  return clamped * clamped * clamped * (clamped * (clamped * 6 - 15) + 10);
}
