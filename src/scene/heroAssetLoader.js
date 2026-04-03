import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

import { curatedHeroAssetKeys, getHeroAssetSpec } from "./heroAssetRegistry.js";

const objLoader = new OBJLoader();
const assetTemplateCache = new Map();

export async function loadHeroAssetInstance(key, { createMaterial } = {}) {
  const spec = getHeroAssetSpec(key);
  const template = await getOrLoadAssetTemplate(spec);
  const group = template.root.clone(true);
  const material = createMaterial ? createMaterial(spec) : null;

  group.traverse((child) => {
    if (!child.isMesh) {
      return;
    }

    if (material) {
      child.material = material;
    } else if (Array.isArray(child.material)) {
      child.material = child.material.map((entry) => entry?.clone());
    } else if (child.material) {
      child.material = child.material.clone();
    }

    child.castShadow = false;
    child.receiveShadow = false;
    child.renderOrder = 2;
  });

  return {
    key: spec.key,
    spec,
    group,
    bounds: cloneBounds(template.bounds),
    material,
  };
}

export function preloadHeroAssets(keys = curatedHeroAssetKeys) {
  return Promise.all(keys.map((key) => getOrLoadAssetTemplate(getHeroAssetSpec(key))));
}

export function disposeHeroAssetInstance(instance) {
  if (!instance?.group) {
    return;
  }

  const uniqueMaterials = new Set();

  instance.group.traverse((child) => {
    if (!child.isMesh) {
      return;
    }

    if (Array.isArray(child.material)) {
      for (const material of child.material) {
        if (material) {
          uniqueMaterials.add(material);
        }
      }
    } else if (child.material) {
      uniqueMaterials.add(child.material);
    }
  });

  for (const material of uniqueMaterials) {
    material.dispose();
  }

  instance.group.removeFromParent();
}

export function clearHeroAssetCache() {
  const uniqueGeometries = new Set();
  const uniqueMaterials = new Set();

  for (const template of assetTemplateCache.values()) {
    template.root.traverse((child) => {
      if (!child.isMesh) {
        return;
      }

      if (child.geometry) {
        uniqueGeometries.add(child.geometry);
      }

      if (Array.isArray(child.material)) {
        for (const material of child.material) {
          if (material) {
            uniqueMaterials.add(material);
          }
        }
      } else if (child.material) {
        uniqueMaterials.add(child.material);
      }
    });
  }

  for (const geometry of uniqueGeometries) {
    geometry.dispose();
  }

  for (const material of uniqueMaterials) {
    material.dispose();
  }

  assetTemplateCache.clear();
}

async function getOrLoadAssetTemplate(spec) {
  if (!assetTemplateCache.has(spec.key)) {
    assetTemplateCache.set(spec.key, buildAssetTemplate(spec));
  }

  return assetTemplateCache.get(spec.key);
}

async function buildAssetTemplate(spec) {
  const objects = await Promise.all(
    (spec.sourceUrls ?? []).map(async (sourceUrl) => {
      try {
        return await objLoader.loadAsync(sourceUrl);
      } catch (error) {
        throw new Error(`Failed to load hero asset "${spec.key}" from ${sourceUrl}`, {
          cause: error,
        });
      }
    }),
  );

  const root = new THREE.Group();
  const normalized = new THREE.Group();
  const assembly = new THREE.Group();

  normalized.name = `${spec.key}-normalized`;
  root.name = `${spec.key}-template`;
  assembly.name = `${spec.key}-assembly`;

  for (const object of objects) {
    assembly.add(object);
  }

  normalized.add(assembly);
  root.add(normalized);

  normalized.rotation.set(
    spec.normalizeRotation?.x ?? 0,
    spec.normalizeRotation?.y ?? 0,
    spec.normalizeRotation?.z ?? 0,
  );

  root.updateMatrixWorld(true);

  assembly.traverse((child) => {
    if (!child.isMesh) {
      return;
    }

    child.geometry.deleteAttribute("normal");
    child.geometry.computeVertexNormals();
    child.geometry.normalizeNormals();

    child.geometry.computeBoundingBox();
    child.geometry.computeBoundingSphere();
  });

  root.updateMatrixWorld(true);

  const initialBounds = new THREE.Box3().setFromObject(root);
  const initialCenter = initialBounds.getCenter(new THREE.Vector3());
  normalized.position.sub(initialCenter);

  root.updateMatrixWorld(true);

  const centeredBounds = new THREE.Box3().setFromObject(root);
  const centeredSize = centeredBounds.getSize(new THREE.Vector3());
  const referenceExtent = Math.max(
    centeredSize.x,
    centeredSize.y,
    centeredSize.z,
    Number.EPSILON,
  );
  const uniformScale = (spec.targetExtent ?? 1.8) / referenceExtent;
  normalized.scale.setScalar(uniformScale);

  root.updateMatrixWorld(true);

  return {
    root,
    bounds: extractBounds(new THREE.Box3().setFromObject(root)),
  };
}

function extractBounds(box) {
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const sphere = box.getBoundingSphere(new THREE.Sphere());

  return {
    box: box.clone(),
    size,
    center,
    radius: sphere.radius,
    halfHeight: size.y * 0.5,
  };
}

function cloneBounds(bounds) {
  return {
    box: bounds.box.clone(),
    size: bounds.size.clone(),
    center: bounds.center.clone(),
    radius: bounds.radius,
    halfHeight: bounds.halfHeight,
  };
}
