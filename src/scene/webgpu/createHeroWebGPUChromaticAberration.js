import * as THREE from "three/webgpu";
import {
  clamp,
  distance,
  float,
  max,
  mix,
  pow,
  smoothstep,
  uniform,
  uv,
} from "three/tsl";
import { rgbShift } from "three/examples/jsm/tsl/display/RGBShiftNode.js";

export function createHeroWebGPUChromaticAberration(
  inputNode,
  config,
  { reducedMotion } = {},
) {
  const membraneCenter = uniform(
    new THREE.Vector2(config.membrane.center.x, config.membrane.center.y),
  );
  const objectCenter = uniform(
    new THREE.Vector2(config.object.centerStart.x, config.object.centerStart.y),
  );
  const membraneInnerRadius = uniform(config.membrane.innerRadius);
  const membraneOuterRadius = uniform(config.membrane.outerRadius);
  const membraneExponent = uniform(config.membrane.exponent);
  const membraneWeight = uniform(config.membrane.weightFloor);
  const objectInnerRadius = uniform(config.object.innerRadius);
  const objectOuterRadius = uniform(config.object.outerRadius);
  const objectExponent = uniform(config.object.exponent);
  const objectWeight = uniform(config.object.weightFloor);
  const amount = uniform(config.idleAmount);
  const blendStrength = uniform(config.idleBlend);
  const angle = uniform(config.angle);

  const sceneColor =
    typeof inputNode?.getTextureNode === "function" ? inputNode.getTextureNode() : inputNode;
  const shiftedScene = rgbShift(sceneColor, amount, angle);
  const membraneMask = createRadialMask({
    center: membraneCenter,
    innerRadius: membraneInnerRadius,
    outerRadius: membraneOuterRadius,
    exponent: membraneExponent,
  });
  const objectMask = createRadialMask({
    center: objectCenter,
    innerRadius: objectInnerRadius,
    outerRadius: objectOuterRadius,
    exponent: objectExponent,
  });
  const combinedMask = clamp(
    max(membraneMask.mul(membraneWeight), objectMask.mul(objectWeight)),
    0,
    1,
  );
  const outputNode = mix(sceneColor, shiftedScene, clamp(combinedMask.mul(blendStrength), 0, 1));

  return {
    outputNode,
    update({
      elapsed = 0,
      pointer = { x: 0, y: 0 },
      viewportKey = "desktop",
      membraneEnergy = 0,
      objectEnergy = 0,
      objectReveal = 0,
    } = {}) {
      const viewportStrength = config.viewportStrength?.[viewportKey] ?? 1;
      const motionStrength = reducedMotion ? config.reducedMotionScale ?? 0.68 : 1;
      const strengthScale = viewportStrength * motionStrength;
      const membraneSignal = THREE.MathUtils.clamp(membraneEnergy, 0, 1);
      const objectSignal = THREE.MathUtils.clamp(objectEnergy, 0, 1);
      const objectRevealSignal = THREE.MathUtils.clamp(objectReveal, 0, 1);

      membraneCenter.value.set(
        config.membrane.center.x + pointer.x * (config.membrane.pointerParallaxX ?? 0),
        config.membrane.center.y - pointer.y * (config.membrane.pointerParallaxY ?? 0),
      );
      objectCenter.value.set(
        THREE.MathUtils.lerp(
          config.object.centerStart.x,
          config.object.centerEnd.x,
          objectRevealSignal,
        ) + pointer.x * (config.object.pointerParallaxX ?? 0),
        THREE.MathUtils.lerp(
          config.object.centerStart.y,
          config.object.centerEnd.y,
          objectRevealSignal,
        ) - pointer.y * (config.object.pointerParallaxY ?? 0),
      );

      membraneWeight.value =
        (config.membrane.weightFloor ?? 0) +
        membraneSignal * (config.membrane.weightBoost ?? 0);
      objectWeight.value =
        (config.object.weightFloor ?? 0) +
        objectSignal * (config.object.weightBoost ?? 0);
      amount.value =
        (config.idleAmount +
          membraneSignal * (config.impactAmountBoost ?? 0) +
          objectSignal * (config.emergenceAmountBoost ?? 0)) *
        strengthScale;
      blendStrength.value = Math.min(
        config.maxBlend ?? 1,
        (config.idleBlend +
          membraneSignal * (config.impactBlendBoost ?? 0) +
          objectSignal * (config.emergenceBlendBoost ?? 0)) *
          strengthScale,
      );
      angle.value =
        config.angle +
        Math.sin(elapsed * (config.angleDriftSpeed ?? 0.16)) * (config.angleDrift ?? 0) +
        pointer.x * (config.pointerAngleInfluence ?? 0);
    },
  };
}

function createRadialMask({ center, innerRadius, outerRadius, exponent }) {
  const distanceToCenter = distance(uv(), center);
  const falloff = float(1).sub(smoothstep(innerRadius, outerRadius, distanceToCenter));
  return pow(clamp(falloff, 0, 1), exponent);
}
