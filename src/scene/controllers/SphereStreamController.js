import * as THREE from "three";

const DEFAULT_LEAD_LANE_ORDER = ["heroCore"];
const DEFAULT_QUALITY = {
  poolSize: 4,
  maxActive: 3,
  seedCount: 2,
};

const TAU = Math.PI * 2;

export class SphereStreamController {
  constructor({ config, sphereConfig, baseMaterial, detail }) {
    this.config = config;
    this.sphereConfig = sphereConfig;
    this.baseMaterial = baseMaterial;
    this.group = new THREE.Group();
    this.group.name = "sphereStream";

    this.laneCurves = new Map();
    this.layoutReady = false;
    this.leadLaneOrder = DEFAULT_LEAD_LANE_ORDER;
    this.ambientLaneOrder = [];
    this.leadLaneIndex = 0;
    this.ambientLaneCursor = 0;
    this.ambientEntries = [];
    this.activeAmbientCount = 0;
    this.nextAmbientSpawnTime = 0;
    this.spawnSerial = 0;
    this.lastElapsed = 0;

    this.detail = resolveSphereDetail(detail, sphereConfig);
    this.geometry = createSphereGeometry({
      ...sphereConfig,
      ...this.detail,
    });

    this.heroEntry = createSphereEntry({
      geometry: this.geometry,
      material: baseMaterial.clone(),
      name: "leadSphere",
    });
    this.group.add(this.heroEntry.mesh);

    this.setConfig(config);
  }

  setConfig(config) {
    this.config = config;
    this.leadLaneOrder = config.leadLaneOrder?.length
      ? [...config.leadLaneOrder]
      : DEFAULT_LEAD_LANE_ORDER;
    this.ambientLaneOrder = config.ambientLaneOrder?.length
      ? [...config.ambientLaneOrder]
      : resolveAmbientLaneOrder(config);
    this.leadLaneIndex = Math.max(
      0,
      this.leadLaneOrder.indexOf(config.initialLeadLane ?? this.leadLaneOrder[0]),
    );
    this.ambientLaneCursor = 0;
    this.quality = {
      ...DEFAULT_QUALITY,
      ...config.quality,
    };

    this.rebuildAmbientPool(this.quality.poolSize);

    if (this.layoutReady) {
      this.resetAmbientFlow(this.lastElapsed);
    }
  }

  setLayout(chamberProfile) {
    this.laneCurves.clear();

    for (const [laneKey, laneConfig] of Object.entries(this.config.lanes ?? {})) {
      const curve = createLaneCurve(chamberProfile.sphere, laneConfig);

      if (curve) {
        this.laneCurves.set(laneKey, curve);
      }
    }

    this.layoutReady = true;
    this.resetAmbientFlow(this.lastElapsed);
  }

  advanceLeadLane() {
    if (!this.leadLaneOrder.length) {
      return;
    }

    this.leadLaneIndex = (this.leadLaneIndex + 1) % this.leadLaneOrder.length;
  }

  setDetail(detail) {
    const nextDetail = resolveSphereDetail(detail, this.sphereConfig);

    if (
      nextDetail.widthSegments === this.detail.widthSegments &&
      nextDetail.heightSegments === this.detail.heightSegments
    ) {
      return;
    }

    const nextGeometry = createSphereGeometry({
      ...this.sphereConfig,
      ...nextDetail,
    });

    this.syncGeometry(nextGeometry);
    this.geometry.dispose();
    this.geometry = nextGeometry;
    this.detail = nextDetail;
  }

  update({
    elapsed,
    introProgress = 1,
    leadPathPhase,
    leadOpacity,
    leadScale,
    motionScale = 1,
  }) {
    this.lastElapsed = elapsed;

    this.updateHeroLead({
      elapsed,
      leadPathPhase,
      leadOpacity,
      leadScale,
      motionScale,
    });
    this.updateAmbientEntries({
      elapsed,
      introProgress,
      motionScale,
    });
    this.ensureAmbientFlow(elapsed);
  }

  destroy() {
    this.heroEntry.material.dispose();

    for (const entry of this.ambientEntries) {
      entry.material.dispose();
    }

    this.geometry.dispose();
  }

  rebuildAmbientPool(targetSize) {
    while (this.ambientEntries.length < targetSize) {
      const entry = createSphereEntry({
        geometry: this.geometry,
        material: this.baseMaterial.clone(),
        name: `supportSphere${this.ambientEntries.length + 1}`,
      });

      this.ambientEntries.push(entry);
      this.group.add(entry.mesh);
    }

    while (this.ambientEntries.length > targetSize) {
      const entry = this.ambientEntries.pop();

      if (!entry) {
        break;
      }

      this.group.remove(entry.mesh);
      entry.material.dispose();
    }

    this.activeAmbientCount = Math.min(this.activeAmbientCount, targetSize);
  }

  syncGeometry(nextGeometry) {
    this.heroEntry.mesh.geometry = nextGeometry;

    for (const entry of this.ambientEntries) {
      entry.mesh.geometry = nextGeometry;
    }
  }

  updateHeroLead({
    elapsed,
    leadPathPhase,
    leadOpacity,
    leadScale,
    motionScale,
  }) {
    const leadLaneKey = this.leadLaneOrder[this.leadLaneIndex] ?? this.leadLaneOrder[0];
    const leadLane = this.config.lanes?.[leadLaneKey];
    const leadCurve = this.laneCurves.get(leadLaneKey);

    applyHeroSphereState({
      entry: this.heroEntry,
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

  updateAmbientEntries({ elapsed, introProgress, motionScale }) {
    let activeCount = 0;

    for (const entry of this.ambientEntries) {
      if (!entry.active) {
        continue;
      }

      const lane = this.config.lanes?.[entry.laneKey];
      const curve = this.laneCurves.get(entry.laneKey);

      if (!lane || !curve || entry.duration <= 0) {
        this.deactivateAmbientEntry(entry);
        continue;
      }

      const progress = (elapsed - entry.startTime) / entry.duration;

      if (progress >= 1 || progress <= -0.2) {
        this.deactivateAmbientEntry(entry);
        continue;
      }

      activeCount += 1;

      applyAmbientSphereState({
        entry,
        curve,
        lane,
        progress: THREE.MathUtils.clamp(progress, 0, 1),
        elapsed,
        introProgress,
        motionScale,
        sphereConfig: this.sphereConfig,
        motionConfig: this.config.motion,
      });
    }

    this.activeAmbientCount = activeCount;
  }

  ensureAmbientFlow(elapsed) {
    if (!this.layoutReady || !this.ambientEntries.length || !this.ambientLaneOrder.length) {
      return;
    }

    const maxActive = Math.min(
      this.quality.maxActive ?? this.ambientEntries.length,
      this.ambientEntries.length,
    );

    if (maxActive <= 0) {
      return;
    }

    const cadence = this.config.cadence ?? {};
    const maxCatchUpSpawns = Math.max(1, cadence.maxCatchUpSpawns ?? 2);
    let catchUpSpawns = 0;

    while (
      this.activeAmbientCount < maxActive &&
      elapsed >= this.nextAmbientSpawnTime &&
      catchUpSpawns < maxCatchUpSpawns
    ) {
      const entry = this.findInactiveAmbientEntry();

      if (!entry || !this.activateAmbientEntry(entry, this.nextAmbientSpawnTime)) {
        break;
      }

      this.activeAmbientCount += 1;
      this.nextAmbientSpawnTime += getSpawnInterval(cadence, this.spawnSerial);
      catchUpSpawns += 1;
    }

    if (this.activeAmbientCount >= maxActive && elapsed >= this.nextAmbientSpawnTime) {
      this.nextAmbientSpawnTime = elapsed + getSpawnInterval(cadence, this.spawnSerial + 0.37) * 0.38;
    }
  }

  resetAmbientFlow(referenceElapsed = 0) {
    for (const entry of this.ambientEntries) {
      this.deactivateAmbientEntry(entry);
    }

    this.activeAmbientCount = 0;
    this.nextAmbientSpawnTime = referenceElapsed + (this.config.cadence?.initialDelay ?? 0.12);
    this.ambientLaneCursor = 0;

    const seedTarget = Math.min(
      this.quality.seedCount ?? 0,
      this.quality.maxActive ?? this.ambientEntries.length,
      this.ambientEntries.length,
    );
    const seedSpacing = this.config.cadence?.seedSpacing ?? 0.72;

    for (let index = 0; index < seedTarget; index += 1) {
      const entry = this.ambientEntries[index];
      const progressSeed = THREE.MathUtils.clamp(0.18 + index * 0.24, 0.08, 0.72);

      if (!this.activateAmbientEntry(entry, referenceElapsed, { progressSeed })) {
        break;
      }

      this.activeAmbientCount += 1;
      this.nextAmbientSpawnTime += seedSpacing * 0.38;
    }
  }

  findInactiveAmbientEntry() {
    for (const entry of this.ambientEntries) {
      if (!entry.active) {
        return entry;
      }
    }

    return null;
  }

  activateAmbientEntry(entry, startTime, { progressSeed = 0 } = {}) {
    const laneKey = this.getNextAmbientLaneKey();

    if (!laneKey) {
      return false;
    }

    const lane = this.config.lanes?.[laneKey];
    const curve = this.laneCurves.get(laneKey);

    if (!lane || !curve) {
      return false;
    }

    this.spawnSerial += 1;

    const cadence = this.config.cadence ?? {};
    const motion = this.config.motion ?? {};
    const durationNoise = hash01(this.spawnSerial * 1.63 + entry.index * 0.41);
    const opacityNoise = hash01(this.spawnSerial * 2.17 + entry.index * 0.58);
    const scaleNoise = hash01(this.spawnSerial * 2.93 + entry.index * 0.37);
    const duration = THREE.MathUtils.lerp(
      cadence.durationMin ?? 4,
      cadence.durationMax ?? 5,
      durationNoise,
    );

    entry.active = true;
    entry.laneKey = laneKey;
    entry.duration = duration * (lane.durationScale ?? 1);
    entry.startTime = startTime - entry.duration * progressSeed;
    entry.opacityTarget =
      lane.opacity ??
      THREE.MathUtils.lerp(
        motion.supportOpacityMin ?? 0.1,
        motion.supportOpacityMax ?? 0.22,
        opacityNoise,
      );
    entry.scaleTarget =
      lane.scale ??
      THREE.MathUtils.lerp(
        motion.supportScaleMin ?? 0.68,
        motion.supportScaleMax ?? 0.9,
        scaleNoise,
      );
    entry.phase = lane.driftPhase ?? durationNoise;
    entry.driftBias = lane.driftBias ?? 0;
    entry.arcLift = lane.arcLift ?? 0;
    entry.visibleStart = lane.visibleStart ?? motion.supportVisibleStart ?? 0.12;
    entry.visibleEnd = lane.visibleEnd ?? motion.supportVisibleEnd ?? 0.92;
    entry.fadeInLength = lane.fadeInLength ?? motion.supportFadeInLength ?? 0.16;
    entry.fadeOutLength = lane.fadeOutLength ?? motion.supportFadeOutLength ?? 0.22;
    entry.material.opacity = 0;
    entry.material.transparent = true;
    entry.mesh.visible = false;

    return true;
  }

  deactivateAmbientEntry(entry) {
    entry.active = false;
    entry.laneKey = null;
    entry.duration = 0;
    entry.material.opacity = 0;
    entry.material.transparent = true;
    entry.mesh.visible = false;
  }

  getNextAmbientLaneKey() {
    if (!this.ambientLaneOrder.length) {
      return null;
    }

    for (let attempt = 0; attempt < this.ambientLaneOrder.length; attempt += 1) {
      const laneKey = this.ambientLaneOrder[this.ambientLaneCursor % this.ambientLaneOrder.length];

      this.ambientLaneCursor = (this.ambientLaneCursor + 1) % this.ambientLaneOrder.length;

      if (this.config.lanes?.[laneKey]) {
        return laneKey;
      }
    }

    return null;
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
    index: getEntryIndex(name),
    mesh,
    material,
    point: new THREE.Vector3(),
    tangent: new THREE.Vector3(),
    active: false,
    laneKey: null,
    duration: 0,
    startTime: 0,
    opacityTarget: 0,
    scaleTarget: 1,
    phase: 0,
    driftBias: 0,
    arcLift: 0,
    visibleStart: 0.12,
    visibleEnd: 0.92,
    fadeInLength: 0.16,
    fadeOutLength: 0.22,
  };
}

function getEntryIndex(name) {
  const match = /\d+$/.exec(name);
  return match ? Number(match[0]) : 0;
}

function createSphereGeometry(config) {
  return new THREE.SphereGeometry(
    config.radius,
    config.widthSegments,
    config.heightSegments,
  );
}

function resolveSphereDetail(detail, sphereConfig) {
  return {
    widthSegments: detail?.widthSegments ?? sphereConfig.widthSegments,
    heightSegments: detail?.heightSegments ?? sphereConfig.heightSegments,
  };
}

function resolveAmbientLaneOrder(config) {
  return Object.entries(config.lanes ?? {})
    .filter(([, laneConfig]) => laneConfig.role === "ambient")
    .map(([laneKey]) => laneKey);
}

function createLaneCurve(baseSphere, laneConfig = {}) {
  const points = resolveLanePoints(baseSphere, laneConfig);

  if (points.length < 4) {
    return null;
  }

  const curve = new THREE.CatmullRomCurve3(points);
  curve.curveType = "centripetal";
  curve.closed = false;
  return curve;
}

function resolveLanePoints(baseSphere, laneConfig) {
  if (Array.isArray(laneConfig.points) && laneConfig.points.length) {
    return laneConfig.points
      .map((pointConfig) =>
        vectorFromAnchor(baseSphere, pointConfig.anchor ?? "start", pointConfig.offset),
      )
      .filter(Boolean);
  }

  return [
    vectorFromAnchor(baseSphere, "start", laneConfig.startOffset),
    vectorFromAnchor(baseSphere, "near", laneConfig.nearOffset),
    vectorFromAnchor(baseSphere, "cross", laneConfig.crossOffset),
    vectorFromAnchor(baseSphere, "hidden", laneConfig.hiddenOffset),
  ].filter(Boolean);
}

function vectorFromAnchor(baseSphere, anchor, offset = {}) {
  const x = baseSphere[`${anchor}X`];
  const y = baseSphere[`${anchor}Y`];
  const z = baseSphere[`${anchor}Z`];

  if (![x, y, z].every((value) => Number.isFinite(value))) {
    return null;
  }

  return new THREE.Vector3(
    x + (offset.x ?? 0),
    y + (offset.y ?? 0),
    z + (offset.z ?? 0),
  );
}

function applyHeroSphereState({
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
  const point = curve.getPointAt(progress, entry.point);
  const tangent = curve.getTangentAt(progress, entry.tangent);
  const driftFade =
    1 -
    smootherstep(
      THREE.MathUtils.clamp(
        progress / Math.max(motionConfig.heroDriftFade ?? 0.64, 0.001),
        0,
        1,
      ),
    );
  const opacityEnvelope = THREE.MathUtils.lerp(
    motionConfig.heroApproachOpacityFloor ?? 0.22,
    1,
    smoothstep(
      THREE.MathUtils.clamp(
        progress / Math.max(motionConfig.heroApproachRevealEnd ?? 0.34, 0.001),
        0,
        1,
      ),
    ),
  );
  const entryVisibility = smoothstep(
    THREE.MathUtils.clamp(
      (progress - (motionConfig.heroEntryRevealStart ?? 0.12)) /
        Math.max(motionConfig.heroEntryRevealLength ?? 0.18, 0.001),
      0,
      1,
    ),
  );
  const lanePhase = (lane.driftPhase ?? 0) * TAU;
  const idleOffset =
    Math.sin(elapsed * sphereConfig.idleFloatSpeed + lanePhase) *
    sphereConfig.idleFloatAmplitude *
    leadOpacity *
    motionScale *
    (0.34 + driftFade * 0.66);
  const driftX =
    (
      Math.sin(elapsed * (motionConfig.heroDriftSpeedX ?? 0.24) + lanePhase) *
        (motionConfig.heroDriftX ?? 0.012) +
      (lane.driftBias ?? 0)
    ) *
    driftFade *
    motionScale;
  const driftY =
    (
      Math.sin(elapsed * (motionConfig.heroDriftSpeedY ?? 0.18) + lanePhase * 1.36) *
        (motionConfig.heroDriftY ?? 0.007) +
      Math.sin(progress * Math.PI) * (lane.arcLift ?? 0)
    ) *
    driftFade *
    motionScale;
  const driftZ =
    Math.cos(elapsed * (motionConfig.heroDriftSpeedZ ?? 0.16) + lanePhase * 1.18) *
    (motionConfig.heroDriftZ ?? 0.008) *
    driftFade *
    motionScale;
  const scalePulse =
    1 +
    Math.sin(elapsed * (motionConfig.heroScalePulseSpeed ?? 0.18) + lanePhase * 1.8) *
      (motionConfig.heroScalePulse ?? 0.0045) *
      (0.26 + driftFade * 0.74) *
      motionScale;
  const tangentPull = (motionConfig.heroTangentPull ?? 0.008) * (0.42 + driftFade * 0.58);

  entry.mesh.position.set(
    point.x + driftX + tangent.x * tangentPull,
    point.y + idleOffset + driftY,
    point.z + driftZ,
  );
  entry.mesh.scale.setScalar(leadScale * (lane.scale ?? 1) * scalePulse);
  entry.material.opacity = leadOpacity * opacityEnvelope * entryVisibility;
  entry.material.transparent = entry.material.opacity < 0.999;
  entry.mesh.visible = entry.material.opacity > 0.002;
}

function applyAmbientSphereState({
  entry,
  curve,
  progress,
  elapsed,
  introProgress,
  motionScale,
  sphereConfig,
  motionConfig,
}) {
  const point = curve.getPointAt(progress, entry.point);
  const tangent = curve.getTangentAt(progress, entry.tangent);
  const travelEnvelope = Math.sin(progress * Math.PI);
  const visibleIn = smoothstep(
    THREE.MathUtils.clamp(
      (progress - entry.visibleStart) / Math.max(entry.fadeInLength, 0.001),
      0,
      1,
    ),
  );
  const visibleOut =
    1 -
    smoothstep(
      THREE.MathUtils.clamp(
        (progress - entry.visibleEnd) / Math.max(entry.fadeOutLength, 0.001),
        0,
        1,
      ),
    );
  const opacity = entry.opacityTarget * visibleIn * visibleOut * introProgress;
  const lanePhase = entry.phase * TAU;
  const driftStrength = (0.24 + travelEnvelope * 0.76) * motionScale;
  const idleOffset =
    Math.sin(elapsed * sphereConfig.idleFloatSpeed * 0.82 + lanePhase) *
    sphereConfig.idleFloatAmplitude *
    (motionConfig.supportIdleFloatScale ?? 0.72) *
    driftStrength;
  const driftX =
    (
      Math.sin(elapsed * (motionConfig.supportDriftSpeedX ?? 0.16) + lanePhase) *
        (motionConfig.supportDriftX ?? 0.02) +
      entry.driftBias
    ) *
    driftStrength;
  const driftY =
    (
      Math.sin(elapsed * (motionConfig.supportDriftSpeedY ?? 0.13) + lanePhase * 1.32) *
        (motionConfig.supportDriftY ?? 0.015) +
      travelEnvelope * entry.arcLift
    ) *
    driftStrength;
  const driftZ =
    Math.cos(elapsed * (motionConfig.supportDriftSpeedZ ?? 0.11) + lanePhase * 1.14) *
    (motionConfig.supportDriftZ ?? 0.016) *
    driftStrength;
  const scalePulse =
    1 +
    Math.sin(elapsed * (motionConfig.supportScalePulseSpeed ?? 0.14) + lanePhase * 1.72) *
      (motionConfig.supportScalePulse ?? 0.004) *
      (0.34 + travelEnvelope * 0.66) *
      motionScale;
  const tangentPull =
    (motionConfig.supportTangentPull ?? 0.012) * (0.34 + travelEnvelope * 0.66);

  entry.mesh.position.set(
    point.x + driftX + tangent.x * tangentPull,
    point.y + idleOffset + driftY,
    point.z + driftZ,
  );
  entry.mesh.scale.setScalar(entry.scaleTarget * scalePulse);
  entry.material.opacity = opacity;
  entry.material.transparent = opacity < 0.999;
  entry.mesh.visible = opacity > 0.002;
}

function getSpawnInterval(cadence, seed) {
  const interval = cadence.spawnInterval ?? 1.12;
  const jitter = cadence.spawnJitter ?? 0.18;
  const jitterOffset = (hash01(seed * 1.27 + 0.31) - 0.5) * 2 * jitter;
  return Math.max(0.24, interval + jitterOffset);
}

function hash01(seed) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453123;
  return value - Math.floor(value);
}

function smoothstep(value) {
  const clamped = THREE.MathUtils.clamp(value, 0, 1);
  return clamped * clamped * (3 - 2 * clamped);
}

function smootherstep(value) {
  const clamped = THREE.MathUtils.clamp(value, 0, 1);
  return clamped * clamped * clamped * (clamped * (clamped * 6 - 15) + 10);
}
