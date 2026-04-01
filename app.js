import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";
import { OBJLoader } from "https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/loaders/OBJLoader.js";

const sceneHost = document.querySelector("[data-scene-host]");
const canvas = document.querySelector("#hero-canvas");

if (!sceneHost || !canvas) {
  throw new Error("REAL RUST hero mount point is missing.");
}

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
const clock = new THREE.Clock();

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: "high-performance",
});

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.16;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, reduceMotion ? 1.4 : 1.8));

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x090506, reduceMotion ? 0.092 : 0.075);

const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
camera.position.set(0, 0.12, 8.25);

const stage = new THREE.Group();
stage.position.set(0, -0.62, 0);
scene.add(stage);

const envGroup = new THREE.Group();
const rustGroup = new THREE.Group();
const travellersGroup = new THREE.Group();

stage.add(envGroup, rustGroup, travellersGroup);

const shadow = new THREE.Mesh(
  new THREE.CircleGeometry(2.8, 64),
  new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
  }),
);
shadow.rotation.x = -Math.PI / 2;
shadow.position.set(0, -1.2, 0.45);
stage.add(shadow);

const ambient = new THREE.HemisphereLight(0xf7eee9, 0x140806, 1.24);
const fill = new THREE.PointLight(0x98d2d5, 12, 18, 2);
fill.position.set(-4.2, 2.6, 3.4);

const key = new THREE.PointLight(0xff8b4b, 21, 24, 2);
key.position.set(3.6, 2.4, 4.4);

const rim = new THREE.PointLight(0xffc996, 10, 18, 2);
rim.position.set(0.2, -0.8, 6);

scene.add(ambient, fill, key, rim);

const path = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(-3.8, 1.25, 1.05),
    new THREE.Vector3(-2.2, 1.06, 0.45),
    new THREE.Vector3(-1.12, 0.28, -0.2),
    new THREE.Vector3(-0.15, 0.08, -0.72),
    new THREE.Vector3(0.78, -0.05, -0.28),
    new THREE.Vector3(1.95, 0.24, 0.44),
    new THREE.Vector3(3.35, -0.58, 1.16),
  ],
  false,
  "centripetal",
  0.56,
);

const secondaryPath = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(-3.2, 0.18, 1.8),
    new THREE.Vector3(-1.4, 0.68, 0.72),
    new THREE.Vector3(0.42, 0.38, -0.42),
    new THREE.Vector3(2.45, 0.92, 0.4),
  ],
  false,
  "centripetal",
  0.58,
);

const curveLine = new THREE.Mesh(
  new THREE.TubeGeometry(path, 120, 0.012, 16, false),
  new THREE.MeshBasicMaterial({
    color: 0x8ed0d4,
    transparent: true,
    opacity: 0.17,
    depthWrite: false,
  }),
);
curveLine.position.z -= 0.1;
envGroup.add(curveLine);

const portalPulse = createOrbit(1.12, 0.016, 0xff9f63, 0x7fb8c1);
portalPulse.rotation.set(0.95, 0.12, -0.44);
portalPulse.position.set(0.08, 0.02, -0.2);
envGroup.add(portalPulse);

const largeOrbit = createOrbit(3.8, 0.03, 0xff8b4b, 0xffd8b5);
largeOrbit.scale.set(1, 0.46, 1);
largeOrbit.rotation.set(1.15, 0.28, 0.48);
largeOrbit.position.set(0.42, -0.18, -0.16);
envGroup.add(largeOrbit);

const sideOrbit = createOrbit(2.15, 0.022, 0x8ed0d4, 0xd8f3f3);
sideOrbit.scale.set(1, 0.62, 1);
sideOrbit.rotation.set(0.72, -0.86, 0.28);
sideOrbit.position.set(1.2, 0.48, -0.72);
envGroup.add(sideOrbit);

createGlassPanel({
  size: [4.3, 3.05, 0.06],
  position: new THREE.Vector3(-1.9, 1.08, -0.18),
  rotation: new THREE.Euler(-0.04, 0.34, -0.2),
});

createGlassPanel({
  size: [2.06, 2.42, 0.05],
  position: new THREE.Vector3(2.72, -0.62, -0.28),
  rotation: new THREE.Euler(0.12, -0.54, 0.3),
});

createGlassPanel({
  size: [1.45, 2.5, 0.05],
  position: new THREE.Vector3(0.24, 0.56, -1.1),
  rotation: new THREE.Euler(0.08, -0.3, 0.05),
});

const dust = createDustField();
envGroup.add(dust);

const leadTraveller = createTraveller({
  tint: 0xffb28a,
  glow: 0xff8247,
  edge: 0x8ed0d4,
  scale: 1,
});
travellersGroup.add(leadTraveller);

const echoTraveller = createTraveller({
  tint: 0xdaf6f7,
  glow: 0x8ed0d4,
  edge: 0xffbf95,
  scale: 0.62,
});
travellersGroup.add(echoTraveller);

const sparkTraveller = createTraveller({
  tint: 0xffddc9,
  glow: 0xffab75,
  edge: 0xc9f1f3,
  scale: 0.42,
});
travellersGroup.add(sparkTraveller);

const rustObjects = [];
const rustConfigs = [
  {
    path: "rust obj items/target.reactive.obj",
    scale: 1.58,
    position: new THREE.Vector3(-0.18, -0.08, -0.1),
    rotation: new THREE.Euler(0.02, -0.68, -0.04),
    tint: 0x836f61,
    glow: 0xff8f4e,
  },
  {
    path: "rust obj items/riot.helmet.obj",
    scale: 5.3,
    position: new THREE.Vector3(0.06, -0.2, -0.06),
    rotation: new THREE.Euler(0.38, 0.92, -0.28),
    tint: 0x7d7065,
    glow: 0x88cad1,
  },
  {
    path: "rust obj items/water.purifier.obj",
    scale: 1.42,
    position: new THREE.Vector3(0.22, -0.05, -0.2),
    rotation: new THREE.Euler(0.06, 0.72, -0.06),
    tint: 0x897363,
    glow: 0xff9b58,
  },
];

const loader = new OBJLoader();

await Promise.all(
  rustConfigs.map(async (config) => {
    try {
      const loaded = await loader.loadAsync(new URL(`./${config.path}`, import.meta.url).href);
      const prepared = normalizeRustObject(loaded, config);
      rustGroup.add(prepared.group);
      rustObjects.push(prepared);
    } catch (error) {
      console.error(`Unable to load ${config.path}`, error);
    }
  }),
);

document.body.classList.add("is-ready");

resize();
window.addEventListener("resize", resize);
sceneHost.addEventListener("pointermove", onPointerMove, { passive: true });
sceneHost.addEventListener("pointerleave", () => {
  pointer.tx = 0;
  pointer.ty = 0;
});

renderer.setAnimationLoop(render);

function createOrbit(radius, tube, baseColor, emissiveColor) {
  const mesh = new THREE.Mesh(
    new THREE.TorusGeometry(radius, tube, 24, 220),
    new THREE.MeshStandardMaterial({
      color: baseColor,
      emissive: emissiveColor,
      emissiveIntensity: 0.16,
      metalness: 0.82,
      roughness: 0.32,
      transparent: true,
      opacity: 0.78,
    }),
  );

  return mesh;
}

function createGlassPanel({ size, position, rotation }) {
  const geometry = new THREE.BoxGeometry(size[0], size[1], size[2]);
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xb6dde0,
    metalness: 0.08,
    roughness: 0.08,
    transmission: 0.9,
    thickness: 0.8,
    ior: 1.15,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    transparent: true,
    opacity: 0.18,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  mesh.rotation.copy(rotation);

  const edge = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({
      color: 0xd4edf0,
      transparent: true,
      opacity: 0.28,
    }),
  );
  edge.position.copy(position);
  edge.rotation.copy(rotation);

  envGroup.add(mesh, edge);
}

function createDustField() {
  const count = 160;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const colorA = new THREE.Color(0xffb68b);
  const colorB = new THREE.Color(0x9ad5d9);

  for (let index = 0; index < count; index += 1) {
    const stride = index * 3;
    const radius = 2.6 + Math.random() * 2.4;
    const angle = Math.random() * Math.PI * 2;
    const height = (Math.random() - 0.5) * 2.4;
    positions[stride] = Math.cos(angle) * radius;
    positions[stride + 1] = height;
    positions[stride + 2] = (Math.random() - 0.5) * 4.2;

    const mixed = colorA.clone().lerp(colorB, Math.random());
    colors[stride] = mixed.r;
    colors[stride + 1] = mixed.g;
    colors[stride + 2] = mixed.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      size: 0.034,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
    }),
  );
}

function createTraveller({ tint, glow, edge, scale }) {
  const group = new THREE.Group();

  const coreGeometry = new THREE.IcosahedronGeometry(0.36, 5);
  perturbGeometry(coreGeometry, 0.1);

  const core = new THREE.Mesh(
    coreGeometry,
    new THREE.MeshPhysicalMaterial({
      color: tint,
      emissive: glow,
      emissiveIntensity: 0.34,
      roughness: 0.04,
      metalness: 0.1,
      transmission: 0.88,
      thickness: 0.65,
      ior: 1.2,
      clearcoat: 1,
      transparent: true,
      opacity: 0.92,
    }),
  );

  const shell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.47, 1),
    new THREE.MeshBasicMaterial({
      color: edge,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
    }),
  );

  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.56, 0.018, 16, 128),
    new THREE.MeshStandardMaterial({
      color: glow,
      emissive: edge,
      emissiveIntensity: 0.22,
      metalness: 0.8,
      roughness: 0.3,
      transparent: true,
      opacity: 0.74,
    }),
  );
  halo.rotation.set(1.22, 0.18, 0.52);

  group.add(core, shell, halo);
  group.userData = { core, shell, halo, scale };

  return group;
}

function perturbGeometry(geometry, amplitude) {
  const position = geometry.getAttribute("position");
  const vector = new THREE.Vector3();

  for (let index = 0; index < position.count; index += 1) {
    vector.fromBufferAttribute(position, index);
    const normal = vector.clone().normalize();
    const wave =
      Math.sin(normal.x * 8.2) * 0.5 +
      Math.cos(normal.y * 7.6) * 0.35 +
      Math.sin(normal.z * 9.1) * 0.25;
    vector.addScaledVector(normal, wave * amplitude);
    position.setXYZ(index, vector.x, vector.y, vector.z);
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
}

function normalizeRustObject(object, config) {
  const wrapper = new THREE.Group();
  const materials = [];

  object.traverse((child) => {
    if (!child.isMesh) {
      return;
    }

    child.geometry.computeVertexNormals();

    const material = new THREE.MeshPhysicalMaterial({
      color: config.tint,
      emissive: config.glow,
      emissiveIntensity: 0.08,
      metalness: 0.82,
      roughness: 0.44,
      clearcoat: 0.24,
      clearcoatRoughness: 0.36,
      transparent: true,
      opacity: 0,
    });

    child.material = material;
    child.castShadow = false;
    child.receiveShadow = false;
    materials.push(material);
  });

  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const longestSide = Math.max(size.x, size.y, size.z) || 1;

  object.position.sub(center);
  object.position.y -= size.y * 0.18;

  wrapper.add(object);
  wrapper.scale.setScalar((1.75 / longestSide) * config.scale);
  wrapper.position.copy(config.position);
  wrapper.rotation.copy(config.rotation);
  wrapper.visible = false;

  return {
    group: wrapper,
    materials,
    scale: wrapper.scale.clone(),
    position: config.position.clone(),
    rotation: config.rotation.clone(),
  };
}

function setOpacity(materials, opacity) {
  for (const material of materials) {
    material.opacity = opacity;
  }
}

function smoothRange(value, start, end) {
  const t = THREE.MathUtils.clamp((value - start) / (end - start), 0, 1);
  return t * t * (3 - 2 * t);
}

function bellCurve(value, start, peakStart, peakEnd, end) {
  const fadeIn = smoothRange(value, start, peakStart);
  const fadeOut = 1 - smoothRange(value, peakEnd, end);
  return THREE.MathUtils.clamp(Math.min(fadeIn, fadeOut), 0, 1);
}

function onPointerMove(event) {
  const bounds = sceneHost.getBoundingClientRect();
  pointer.tx = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
  pointer.ty = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
}

function resize() {
  const width = sceneHost.clientWidth;
  const height = sceneHost.clientHeight;
  const narrow = width < 720;

  camera.fov = narrow ? 41 : width < 1080 ? 37 : 34;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  camera.position.z = narrow ? 9.1 : width < 1080 ? 8.7 : 8.25;
  stage.position.y = narrow ? -0.78 : -0.62;
  shadow.position.y = narrow ? -1.3 : -1.2;
  renderer.setSize(width, height, false);
}

function render() {
  const elapsed = clock.getElapsedTime();
  const cycleDuration = reduceMotion ? 18 : 14;
  const cycle = elapsed / cycleDuration;
  const activeIndex = rustObjects.length ? Math.floor(cycle) % rustObjects.length : 0;
  const phase = cycle % 1;
  const reveal = bellCurve(phase, 0.18, 0.34, 0.78, 0.94);
  const transformPulse = bellCurve(phase, 0.16, 0.28, 0.42, 0.58);

  pointer.x = THREE.MathUtils.lerp(pointer.x, pointer.tx, 0.04);
  pointer.y = THREE.MathUtils.lerp(pointer.y, pointer.ty, 0.04);

  camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 0.34, 0.04);
  camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0.16 - pointer.y * 0.22, 0.04);
  camera.lookAt(pointer.x * 0.18, -0.08 - pointer.y * 0.06, 0);

  largeOrbit.rotation.z += reduceMotion ? 0.0016 : 0.0026;
  largeOrbit.rotation.x = 1.15 + Math.sin(elapsed * 0.18) * 0.05;
  sideOrbit.rotation.y -= reduceMotion ? 0.0014 : 0.0022;
  sideOrbit.rotation.z = 0.28 + Math.sin(elapsed * 0.22) * 0.12;
  portalPulse.rotation.z += reduceMotion ? 0.0022 : 0.0038;
  portalPulse.scale.setScalar(1 + transformPulse * 0.16);
  portalPulse.material.emissiveIntensity = 0.16 + transformPulse * 0.55;
  portalPulse.material.opacity = 0.76 + transformPulse * 0.18;

  dust.rotation.y = elapsed * 0.015;
  dust.rotation.x = Math.sin(elapsed * 0.08) * 0.05;

  updateTraveller(leadTraveller, path, (phase * 0.8 + 0.06) % 1, elapsed, 1.02 - reveal * 0.68, transformPulse);
  updateTraveller(echoTraveller, secondaryPath, (phase * 0.84 + 0.46) % 1, elapsed, 0.6, 0.08);
  updateTraveller(sparkTraveller, path, (phase * 0.78 + 0.68) % 1, elapsed, 0.42, 0.04);

  shadow.scale.setScalar(1.08 + reveal * 0.32);
  shadow.material.opacity = 0.16 + reveal * 0.1;

  rustObjects.forEach((item, index) => {
    const isActive = index === activeIndex;
    const opacity = isActive ? reveal : 0;

    item.group.visible = opacity > 0.001;
    setOpacity(item.materials, opacity);

    item.group.position.x = item.position.x + Math.sin(elapsed * 0.32 + index * 1.1) * 0.08;
    item.group.position.y = item.position.y + Math.sin(elapsed * 0.72 + index * 0.6) * 0.05;
    item.group.position.z = item.position.z + Math.cos(elapsed * 0.24 + index) * 0.06;
    item.group.rotation.x = item.rotation.x + Math.sin(elapsed * 0.24 + index) * 0.05;
    item.group.rotation.y = item.rotation.y + Math.sin(elapsed * 0.3 + index * 0.4) * 0.24;
    item.group.rotation.z = item.rotation.z + Math.cos(elapsed * 0.18 + index) * 0.03;

    const scaleBoost = 0.96 + opacity * 0.16 + transformPulse * 0.05;
    item.group.scale.copy(item.scale).multiplyScalar(scaleBoost);

    item.materials.forEach((material) => {
      material.emissiveIntensity = 0.06 + opacity * 0.2 + transformPulse * 0.12;
    });
  });

  renderer.render(scene, camera);
}

function updateTraveller(traveller, curve, progress, elapsed, visibility, pulse) {
  const point = curve.getPointAt(progress);
  const tangent = curve.getTangentAt(progress);
  const nextPoint = point.clone().add(tangent);

  traveller.position.copy(point);
  traveller.position.y += Math.sin(elapsed * 0.9 + progress * 9) * 0.06;
  traveller.lookAt(nextPoint);
  traveller.rotation.z += elapsed * 0.22 + progress * 3.4;

  const distanceToPortal = point.distanceTo(portalPulse.position);
  const portalInfluence = THREE.MathUtils.clamp(1 - distanceToPortal / 1.8, 0, 1);
  const opacity = THREE.MathUtils.clamp(visibility - portalInfluence * pulse * 0.6, 0, 1);

  traveller.scale.setScalar(
    traveller.userData.scale * (0.92 + portalInfluence * 0.16 + Math.sin(elapsed * 1.2 + progress * 10) * 0.03),
  );

  traveller.userData.core.material.opacity = opacity * 0.94;
  traveller.userData.shell.material.opacity = opacity * 0.16;
  traveller.userData.halo.material.opacity = opacity * 0.72;
}
