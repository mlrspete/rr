import * as THREE from "three/webgpu";
import { pass } from "three/tsl";

import { createHeroWebGPUChromaticAberration } from "./createHeroWebGPUChromaticAberration.js";
import { heroWebGPUPostProcessingConfig } from "./heroWebGPUPostProcessingConfig.js";

export function createHeroWebGPUPostProcessing(
  renderer,
  scene,
  camera,
  { reducedMotion = false, volumetricLighting = null } = {},
) {
  const scenePass = pass(scene, camera);
  const sceneColorNode = volumetricLighting?.createCompositeNode?.(scenePass) ?? scenePass;
  const chromaticAberration = createHeroWebGPUChromaticAberration(
    sceneColorNode,
    heroWebGPUPostProcessingConfig.chromaticAberration,
    { reducedMotion },
  );
  const postProcessing = new THREE.PostProcessing(renderer, chromaticAberration.outputNode);

  postProcessing.outputNode = chromaticAberration.outputNode;
  postProcessing.needsUpdate = true;

  return {
    postProcessing,
    scenePass,
    chromaticAberration,
  };
}
