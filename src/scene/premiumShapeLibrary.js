import * as THREE from "three";

const premiumShapeTemplateCache = new Map();
const normalizedPremiumShapeExtent = 1.72;

function createPremiumShapeSpec({
  key,
  label,
  silhouette,
  displayRotation,
  materialTone,
  wobbleAmount,
  wobbleSpeed,
}) {
  return {
    key,
    kind: "premium-shape",
    family: "premium-branded-form",
    label,
    silhouette,
    targetExtent: normalizedPremiumShapeExtent,
    normalizeRotation: { x: 0, y: 0, z: 0 },
    displayRotation,
    position: { x: 0, y: 0, z: 0 },
    wobbleAmount,
    wobbleSpeed,
    materialTone,
  };
}

export const premiumShapeRegistry = {
  facetOblong: createPremiumShapeSpec({
    key: "facetOblong",
    label: "Faceted Oblong",
    silhouette: "faceted-oblong",
    displayRotation: { x: 0.18, y: -0.72, z: 0.12 },
    wobbleAmount: 0.018,
    wobbleSpeed: 0.34,
    materialTone: {
      color: "#e7dfd4",
      emissive: "#786357",
      emissiveIntensity: 0.028,
      metalness: 0.2,
      roughness: 0.24,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      sheen: 0.78,
      sheenColor: "#f1e8de",
      sheenRoughness: 0.22,
      specularIntensity: 0.95,
      specularColor: "#f1e8de",
      ior: 1.46,
      iridescence: 0.02,
      flatShading: true,
      envMapIntensity: 1.28,
    },
  }),
  capsuleBar: createPremiumShapeSpec({
    key: "capsuleBar",
    label: "Capsule Bar",
    silhouette: "beveled-capsule-bar",
    displayRotation: { x: 0.08, y: -0.48, z: -0.16 },
    wobbleAmount: 0.014,
    wobbleSpeed: 0.28,
    materialTone: {
      color: "#62646c",
      emissive: "#4d5b70",
      emissiveIntensity: 0.018,
      metalness: 0.94,
      roughness: 0.2,
      clearcoat: 1,
      clearcoatRoughness: 0.07,
      sheen: 0.16,
      sheenColor: "#c9d2df",
      sheenRoughness: 0.36,
      specularIntensity: 1,
      specularColor: "#d7dde6",
      ior: 1.38,
      iridescence: 0.01,
      envMapIntensity: 1.62,
    },
  }),
};

export const curatedPremiumShapeKeys = ["facetOblong", "capsuleBar"];
export const premiumShapeFamily = {
  primary: curatedPremiumShapeKeys,
};
export const defaultPremiumShapeKey = curatedPremiumShapeKeys[0];

export function getPremiumShapeSpec(key = defaultPremiumShapeKey) {
  return premiumShapeRegistry[key] ?? premiumShapeRegistry[defaultPremiumShapeKey];
}

export function loadPremiumShapeInstance(key, { createMaterial } = {}) {
  const spec = getPremiumShapeSpec(key);
  const template = getOrCreatePremiumShapeTemplate(spec);
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
  });

  return {
    key: spec.key,
    spec,
    group,
    bounds: cloneBounds(template.bounds),
    material,
  };
}

export function preloadPremiumShapes(keys = curatedPremiumShapeKeys) {
  return Promise.resolve(
    keys.map((key) => getOrCreatePremiumShapeTemplate(getPremiumShapeSpec(key))),
  );
}

export function disposePremiumShapeInstance(instance) {
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

export function clearPremiumShapeCache() {
  const uniqueGeometries = new Set();
  const uniqueMaterials = new Set();

  for (const template of premiumShapeTemplateCache.values()) {
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

  premiumShapeTemplateCache.clear();
}

function getOrCreatePremiumShapeTemplate(spec) {
  if (!premiumShapeTemplateCache.has(spec.key)) {
    premiumShapeTemplateCache.set(spec.key, buildPremiumShapeTemplate(spec));
  }

  return premiumShapeTemplateCache.get(spec.key);
}

function buildPremiumShapeTemplate(spec) {
  const root = new THREE.Group();
  const normalized = new THREE.Group();
  const mesh = new THREE.Mesh(
    createPremiumShapeGeometry(spec),
    createPremiumShapeTemplateMaterial(spec),
  );

  normalized.name = `${spec.key}-normalized`;
  root.name = `${spec.key}-template`;
  normalized.add(mesh);
  root.add(normalized);

  normalized.rotation.set(
    spec.normalizeRotation?.x ?? 0,
    spec.normalizeRotation?.y ?? 0,
    spec.normalizeRotation?.z ?? 0,
  );

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
  const uniformScale = (spec.targetExtent ?? normalizedPremiumShapeExtent) / referenceExtent;
  normalized.scale.setScalar(uniformScale);

  root.updateMatrixWorld(true);

  return {
    root,
    bounds: extractBounds(new THREE.Box3().setFromObject(root)),
  };
}

function createPremiumShapeGeometry(spec) {
  switch (spec.key) {
    case "capsuleBar":
      return createCapsuleBarGeometry();
    case "facetOblong":
    default:
      return createFacetedOblongGeometry();
  }
}

function createFacetedOblongGeometry() {
  const geometry = new THREE.IcosahedronGeometry(1, 0).toNonIndexed();
  const positions = geometry.getAttribute("position");
  const vertex = new THREE.Vector3();

  for (let index = 0; index < positions.count; index += 1) {
    vertex.fromBufferAttribute(positions, index);

    const axisRatio = THREE.MathUtils.clamp(Math.abs(vertex.x), 0, 1);
    const shoulder = 1 - axisRatio * 0.14;

    vertex.x *= 1.28;
    vertex.y *= 0.8 * shoulder;
    vertex.z *= 0.92 + (1 - axisRatio) * 0.08;

    positions.setXYZ(index, vertex.x, vertex.y, vertex.z);
  }

  positions.needsUpdate = true;
  geometry.rotateZ(Math.PI * 0.08);
  geometry.computeVertexNormals();
  return geometry;
}

function createCapsuleBarGeometry() {
  const geometry = new THREE.CapsuleGeometry(0.46, 1.34, 10, 24);
  const positions = geometry.getAttribute("position");
  const vertex = new THREE.Vector3();
  const axisLimit = 1.16;

  geometry.rotateZ(Math.PI / 2);

  for (let index = 0; index < positions.count; index += 1) {
    vertex.fromBufferAttribute(positions, index);

    const axisRatio = THREE.MathUtils.clamp(Math.abs(vertex.x) / axisLimit, 0, 1);
    const centerBias = 1 - axisRatio;

    vertex.x *= 1.04;
    vertex.y *= 0.72 - axisRatio * 0.04;
    vertex.z *= 0.58 + centerBias * 0.08;

    positions.setXYZ(index, vertex.x, vertex.y, vertex.z);
  }

  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function createPremiumShapeTemplateMaterial(spec) {
  const tone = spec.materialTone ?? {};

  return new THREE.MeshPhysicalMaterial({
    color: tone.color ?? "#ddd5ca",
    emissive: tone.emissive ?? "#775d4f",
    emissiveIntensity: tone.emissiveIntensity ?? 0.025,
    metalness: tone.metalness ?? 0.42,
    roughness: tone.roughness ?? 0.2,
    clearcoat: tone.clearcoat ?? 1,
    clearcoatRoughness: tone.clearcoatRoughness ?? 0.07,
    sheen: tone.sheen ?? 0.46,
    sheenColor: new THREE.Color(tone.sheenColor ?? "#f4eadf"),
    sheenRoughness: tone.sheenRoughness ?? 0.28,
    specularIntensity: tone.specularIntensity ?? 0.96,
    specularColor: new THREE.Color(tone.specularColor ?? "#efe6dc"),
    ior: tone.ior ?? 1.42,
    iridescence: tone.iridescence ?? 0.02,
    envMapIntensity: tone.envMapIntensity ?? 1.36,
    flatShading: tone.flatShading ?? false,
  });
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
