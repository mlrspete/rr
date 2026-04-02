import * as THREE from "three";

import {
  disposeHeroAssetInstance,
  loadHeroAssetInstance,
} from "../heroAssetLoader.js";
import {
  disposePremiumShapeInstance,
  loadPremiumShapeInstance,
} from "../premiumShapeLibrary.js";

export const SLOT_STATES = {
  PREMIUM: "premium",
  RUST: "rust",
};

export class SlotController {
  constructor({
    name,
    side,
    orderIndex = 0,
    premiumShapeKey,
    rustAssetKey,
    config,
    materials,
    createMaterial,
  }) {
    this.name = name;
    this.side = side;
    this.sideSign = side === "left" ? -1 : 1;
    this.orderIndex = orderIndex;
    this.config = config;
    this.createMaterial = createMaterial;

    this.group = new THREE.Group();
    this.group.name = name;

    this.anchorTransform = new THREE.Group();
    this.anchorTransform.name = "anchorTransform";
    this.group.add(this.anchorTransform);

    this.premiumMesh = new THREE.Group();
    this.premiumMesh.name = "premiumShapeMesh";
    this.anchorTransform.add(this.premiumMesh);

    this.rustMesh = new THREE.Group();
    this.rustMesh.name = "rustMesh";
    this.anchorTransform.add(this.rustMesh);

    this.distortionShell = new THREE.Mesh(
      createDistortionShellGeometry(config.shell.radius, config.shell.detail),
      materials.slotDistortion.clone(),
    );
    this.distortionShell.name = "distortionShell";
    this.anchorTransform.add(this.distortionShell);

    this.calloutAnchor = new THREE.Object3D();
    this.calloutAnchor.name = "calloutAnchor";
    this.anchorTransform.add(this.calloutAnchor);

    this.currentStateEnum = SLOT_STATES;
    this.currentState = side === "left" ? SLOT_STATES.PREMIUM : SLOT_STATES.RUST;
    this.transitionLock = false;
    this.revealScalar = { value: this.currentState === SLOT_STATES.RUST ? 1 : 0 };
    this.revealUniformRef = this.revealScalar;

    this.transitionState = {
      active: false,
      direction: 1,
      fromState: this.currentState,
      toState: this.currentState,
      passId: -1,
    };

    this.premiumShapeKey = premiumShapeKey;
    this.rustAssetKey = rustAssetKey;
    this.callout = { kicker: "", title: "" };
    this.calloutPools = {
      premiumToRust: [],
      rustToPremium: [],
    };
    this.calloutSeed = orderIndex;

    this.basePosition = new THREE.Vector3();
    this.baseRotation = new THREE.Euler();
    this.baseScale = 1;
    this.calloutBasePosition = new THREE.Vector3();
    this.worldPosition = new THREE.Vector3();
    this.localPosition = new THREE.Vector3();

    this.idleSeed = Math.random() * Math.PI * 2;
    this.isActive = true;
    this.isReady = false;
    this.isDestroyed = false;
    this.pendingRustToken = 0;
    this.transitionCount = 0;

    this.premiumInstance = null;
    this.rustInstance = null;

    this.applyVisualState({
      rustBlend: this.currentState === SLOT_STATES.RUST ? 1 : 0,
      overlap: 0,
      softness: 0,
      force: true,
      elapsed: 0,
    });
  }

  async initialize() {
    if (this.isReady || this.isDestroyed) {
      return;
    }

    this.setPremiumShapeKey(this.premiumShapeKey);
    await this.setRustAssetKey(this.rustAssetKey);

    if (this.isDestroyed) {
      return;
    }

    this.isReady = true;
    this.applyRestState(true, 0);
  }

  setPremiumShapeKey(nextKey) {
    if (this.isDestroyed) {
      return;
    }

    const resolvedKey = `${nextKey}`;

    if (this.premiumShapeKey === resolvedKey && this.premiumInstance) {
      return;
    }

    this.premiumShapeKey = resolvedKey;

    if (this.premiumInstance) {
      disposePremiumShapeInstance(this.premiumInstance);
      this.premiumMesh.clear();
    }

    this.premiumInstance = loadPremiumShapeInstance(resolvedKey, {
      createMaterial: this.createMaterial,
    });
    this.premiumMesh.add(this.premiumInstance.group);
    this.applyRestState(true, 0);
  }

  async setRustAssetKey(nextKey) {
    if (this.isDestroyed) {
      return;
    }

    const resolvedKey = `${nextKey}`;

    if (this.rustAssetKey === resolvedKey && this.rustInstance) {
      return;
    }

    this.rustAssetKey = resolvedKey;
    this.pendingRustToken += 1;
    const token = this.pendingRustToken;
    const nextInstance = await loadHeroAssetInstance(resolvedKey, {
      createMaterial: this.createMaterial,
    });

    if (this.isDestroyed || token !== this.pendingRustToken) {
      disposeHeroAssetInstance(nextInstance);
      return;
    }

    if (this.rustInstance) {
      disposeHeroAssetInstance(this.rustInstance);
      this.rustMesh.clear();
    }

    this.rustInstance = nextInstance;
    this.rustMesh.add(nextInstance.group);
    this.applyRestState(true, 0);
  }

  setCalloutPreset({ calloutPools = {}, presetSeed = 0 } = {}) {
    this.calloutPools = {
      premiumToRust: [...(calloutPools.premiumToRust ?? [])],
      rustToPremium: [...(calloutPools.rustToPremium ?? [])],
    };
    this.calloutSeed = presetSeed + this.orderIndex;
  }

  setLayout(layout, activeSlot = true, variation = null) {
    const mergedLayout = mergeLayoutVariation(layout, variation);

    this.isActive = activeSlot;
    this.callout = mergedLayout.callout ?? this.callout;
    this.basePosition.set(
      mergedLayout.position.x,
      mergedLayout.position.y,
      mergedLayout.position.z,
    );
    this.baseRotation.set(
      mergedLayout.rotation.x,
      mergedLayout.rotation.y,
      mergedLayout.rotation.z,
    );
    this.baseScale = mergedLayout.scale;
    this.calloutBasePosition.set(
      this.sideSign * this.config.calloutAnchor.x,
      this.config.calloutAnchor.y,
      this.config.calloutAnchor.z,
    );

    this.group.visible = activeSlot;
    this.anchorTransform.position.copy(this.basePosition);
    this.anchorTransform.rotation.copy(this.baseRotation);
    this.anchorTransform.scale.setScalar(this.baseScale);
    this.calloutAnchor.position.copy(this.calloutBasePosition);
    this.applyRestState(true, 0);
  }

  beginTransition({ direction, passId }) {
    if (
      this.isDestroyed ||
      !this.group.visible ||
      !this.isReady ||
      this.transitionState.active
    ) {
      return false;
    }

    this.transitionCount += 1;
    this.transitionLock = true;
    this.transitionState.active = true;
    this.transitionState.direction = direction;
    this.transitionState.fromState = this.currentState;
    this.transitionState.toState =
      this.currentState === SLOT_STATES.PREMIUM ? SLOT_STATES.RUST : SLOT_STATES.PREMIUM;
    this.transitionState.passId = passId;
    return true;
  }

  getCalloutEvent() {
    if (!this.transitionState.active) {
      return null;
    }

    const directionKey =
      this.transitionState.toState === SLOT_STATES.RUST
        ? "premiumToRust"
        : "rustToPremium";
    const calloutCopy = getCalloutCopy(
      this.calloutPools[directionKey],
      this.transitionCount + this.calloutSeed,
    );

    return {
      id: `${this.side}-${this.name}-${this.transitionCount}`,
      side: this.side,
      anchor: this.calloutAnchor,
      kicker: calloutCopy?.kicker ?? this.callout.kicker,
      title: calloutCopy?.title ?? this.callout.title,
      tone:
        calloutCopy?.tone ??
        (directionKey === "premiumToRust" ? "cool" : "warm"),
    };
  }

  update({
    elapsed,
    introProgress,
    direction,
    membraneWorldInverse,
    motionScale = 1,
    fxScale = 1,
  }) {
    if (this.isDestroyed || !this.group.visible) {
      return;
    }

    const floatAmount =
      Math.sin(elapsed * this.config.idle.floatSpeed + this.idleSeed) *
      this.config.idle.floatAmplitude *
      introProgress *
      motionScale;
    const yawAmount =
      Math.sin(elapsed * this.config.idle.yawSpeed + this.idleSeed * 0.7) *
      this.config.idle.yawAmplitude *
      introProgress *
      motionScale;

    this.anchorTransform.position.set(
      this.basePosition.x,
      this.basePosition.y + floatAmount,
      this.basePosition.z,
    );
    this.anchorTransform.rotation.set(
      this.baseRotation.x,
      this.baseRotation.y + yawAmount * this.sideSign,
      this.baseRotation.z,
    );

    this.group.updateWorldMatrix(true, false);
    this.anchorTransform.getWorldPosition(this.worldPosition);

    if (membraneWorldInverse) {
      this.localPosition.copy(this.worldPosition).applyMatrix4(membraneWorldInverse);
    } else {
      this.localPosition.copy(this.worldPosition);
    }

    if (this.transitionState.active) {
      const localSweepX = this.localPosition.x * this.transitionState.direction;
      const rustBlend = resolveRustBlend(
        this.transitionState.fromState,
        this.transitionState.toState,
        localSweepX,
        this.config.reveal.leadDistance,
        this.config.reveal.trailDistance,
      );
      const overlap = resolveBandMix(
        Math.abs(localSweepX),
        this.config.reveal.overlapInner,
        this.config.reveal.overlapOuter,
      ) * fxScale;
      const softness = resolveBandMix(
        Math.abs(localSweepX),
        this.config.reveal.overlapOuter * 0.45,
        this.config.reveal.softnessOuter,
      ) * fxScale;

      this.applyVisualState({
        rustBlend,
        overlap,
        softness,
        force: false,
        elapsed,
      });

      if (localSweepX <= -this.config.reveal.trailDistance) {
        this.currentState = this.transitionState.toState;
        this.transitionState.active = false;
        this.transitionLock = false;
        this.applyRestState(true, elapsed);
      }

      return;
    }

    this.applyRestState(false, elapsed);
  }

  getTriggerX() {
    this.group.updateWorldMatrix(true, false);
    this.anchorTransform.getWorldPosition(this.worldPosition);
    return this.worldPosition.x;
  }

  getTransitionStartX(direction) {
    return this.getTriggerX() - direction * this.config.reveal.leadDistance;
  }

  destroy() {
    this.isDestroyed = true;
    this.distortionShell.geometry?.dispose();
    this.distortionShell.material?.dispose();

    if (this.premiumInstance) {
      disposePremiumShapeInstance(this.premiumInstance);
      this.premiumInstance = null;
    }

    if (this.rustInstance) {
      disposeHeroAssetInstance(this.rustInstance);
      this.rustInstance = null;
    }

    this.group.removeFromParent();
  }

  applyRestState(force = false, elapsed = 0) {
    this.applyVisualState({
      rustBlend: this.currentState === SLOT_STATES.RUST ? 1 : 0,
      overlap: 0,
      softness: 0,
      force,
      elapsed,
    });
  }

  applyVisualState({
    rustBlend,
    overlap,
    softness,
    force = false,
    elapsed = 0,
  }) {
    const reveal = THREE.MathUtils.clamp(rustBlend, 0, 1);
    const premiumVisibility = THREE.MathUtils.clamp(1 - reveal, 0, 1);
    const rustVisibility = THREE.MathUtils.clamp(reveal, 0, 1);
    const positionShift = this.config.reveal.positionShift;
    const liftShift = this.config.reveal.liftShift;
    const rotationShift = this.config.reveal.rotationShift;
    const scaleIn = this.config.reveal.scaleIn;
    const scaleOut = this.config.reveal.scaleOut;
    const softPenalty = softness * this.config.reveal.softOpacityPenalty;
    const shellUniforms = this.distortionShell.material.uniforms;

    this.revealScalar.value = reveal;

    this.calloutAnchor.position.set(
      this.calloutBasePosition.x + this.sideSign * (reveal - 0.5) * 0.05,
      this.calloutBasePosition.y + overlap * 0.045 + softness * 0.02,
      this.calloutBasePosition.z,
    );

    this.premiumMesh.position.set(
      -this.sideSign * reveal * positionShift - this.sideSign * softness * 0.04,
      reveal * liftShift + softness * 0.02,
      this.config.depth.premiumZ + reveal * 0.08 + overlap * 0.03,
    );
    this.premiumMesh.rotation.set(
      this.premiumInstance?.spec?.displayRotation?.x ?? 0,
      (this.premiumInstance?.spec?.displayRotation?.y ?? 0) + reveal * rotationShift * this.sideSign,
      (this.premiumInstance?.spec?.displayRotation?.z ?? 0) - reveal * 0.04 * this.sideSign,
    );
    this.premiumMesh.scale.setScalar(
      THREE.MathUtils.lerp(scaleOut, scaleIn, reveal) * (1 - softness * 0.06),
    );

    this.rustMesh.position.set(
      this.sideSign * (1 - reveal) * positionShift + this.sideSign * softness * 0.04,
      (1 - reveal) * liftShift + softness * 0.02,
      this.config.depth.rustZ - (1 - reveal) * 0.08 - overlap * 0.02,
    );
    this.rustMesh.rotation.set(
      this.rustInstance?.spec?.displayRotation?.x ?? 0,
      (this.rustInstance?.spec?.displayRotation?.y ?? 0) -
        (1 - reveal) * rotationShift * this.sideSign,
      (this.rustInstance?.spec?.displayRotation?.z ?? 0) + (1 - reveal) * 0.04 * this.sideSign,
    );
    this.rustMesh.scale.setScalar(
      THREE.MathUtils.lerp(scaleIn, scaleOut, reveal) * (1 - softness * 0.05),
    );

    if (this.premiumInstance?.material) {
      this.premiumInstance.material.opacity = THREE.MathUtils.clamp(
        this.config.reveal.premiumHiddenOpacity +
          premiumVisibility * (1 - this.config.reveal.premiumHiddenOpacity) -
          softPenalty * 0.7,
        0,
        1,
      );
    }

    if (this.rustInstance?.material) {
      this.rustInstance.material.opacity = THREE.MathUtils.clamp(
        this.config.reveal.rustHiddenOpacity +
          rustVisibility * (1 - this.config.reveal.rustHiddenOpacity) -
          softPenalty * 0.6,
        0,
        1,
      );
    }

    this.distortionShell.position.set(
      this.sideSign * (reveal - 0.5) * 0.1,
      softness * 0.015,
      this.config.depth.rustZ + 0.14 + overlap * 0.04,
    );
    this.distortionShell.scale.setScalar(
      0.84 + overlap * (this.config.shell.scaleBoost * 1.4) + softness * 0.08,
    );

    if (shellUniforms) {
      shellUniforms.uTime.value = elapsed;
      shellUniforms.uOpacity.value =
        this.config.shell.baseOpacity + overlap * this.config.shell.peakOpacity;
      shellUniforms.uIntensity.value = overlap + softness * 0.3;
      shellUniforms.uColor.value.set(this.side === "left" ? "#6682b8" : "#c98a66");
    }

    this.distortionShell.visible = overlap > 0.001 || softness > 0.001;

    if (force) {
      this.group.updateMatrixWorld(true);
    }
  }
}

function createDistortionShellGeometry(radius, detail) {
  return new THREE.IcosahedronGeometry(radius, detail);
}

function resolveRustBlend(fromState, toState, localSweepX, leadDistance, trailDistance) {
  const progress = 1 - smoothstep(-trailDistance, leadDistance, localSweepX);

  if (fromState === SLOT_STATES.PREMIUM && toState === SLOT_STATES.RUST) {
    return progress;
  }

  if (fromState === SLOT_STATES.RUST && toState === SLOT_STATES.PREMIUM) {
    return 1 - progress;
  }

  return fromState === SLOT_STATES.RUST ? 1 : 0;
}

function resolveBandMix(value, inner, outer) {
  return 1 - smoothstep(inner, outer, value);
}

function smoothstep(edge0, edge1, value) {
  if (edge0 === edge1) {
    return value < edge0 ? 0 : 1;
  }

  const x = THREE.MathUtils.clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return x * x * (3 - 2 * x);
}

function getCalloutCopy(pool, index) {
  if (!pool?.length) {
    return null;
  }

  const normalizedIndex = ((index % pool.length) + pool.length) % pool.length;
  return pool[normalizedIndex];
}

function mergeLayoutVariation(layout, variation) {
  if (!variation) {
    return layout;
  }

  return {
    ...layout,
    position: {
      x: layout.position.x + (variation.positionOffset?.x ?? 0),
      y: layout.position.y + (variation.positionOffset?.y ?? 0),
      z: layout.position.z + (variation.positionOffset?.z ?? 0),
    },
    rotation: {
      x: layout.rotation.x + (variation.rotationOffset?.x ?? 0),
      y: layout.rotation.y + (variation.rotationOffset?.y ?? 0),
      z: layout.rotation.z + (variation.rotationOffset?.z ?? 0),
    },
    scale: layout.scale * (variation.scaleMultiplier ?? 1),
  };
}
