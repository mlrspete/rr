import * as THREE from "three";

const BLOB_FIELD_SHADER_KEY = "hero-blob-field-v1";

export function attachBlobFieldShader(material, palette, blobFieldConfig, seed = 0) {
  const uniforms = {
    uTime: { value: 0 },
    uSeed: { value: seed },
    uNoiseStrength: { value: 0.14 },
    uNoiseFrequency: { value: 1.18 },
    uSecondaryNoiseStrength: { value: 0.18 },
    uSecondaryNoiseFrequency: { value: 2.24 },
    uNoiseSpeed: { value: 0.12 },
    uTwistAmount: { value: 0.26 },
    uTwistSpeed: { value: 0.08 },
    uPulseStrength: { value: 0.018 },
    uPulseSpeed: { value: 0.11 },
    uSurfaceShiftStrength: { value: 0.18 },
    uSurfaceShiftSpeed: { value: 0.14 },
    uSurfaceResponse: { value: 0.18 },
    uEdgeFresnelStrength: { value: 0.22 },
    uWarmLift: { value: 0.018 },
    uDeformIntensity: { value: 1 },
    uSurfaceIntensity: { value: 1 },
    uBlobPearlColor: { value: new THREE.Color(palette.silver) },
    uBlobEdgeColor: { value: new THREE.Color(palette.coolEdge) },
    uBlobWarmColor: { value: new THREE.Color(palette.warm) },
  };

  material.userData.blobFieldUniforms = uniforms;
  material.customProgramCacheKey = () => BLOB_FIELD_SHADER_KEY;
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uTime;
uniform float uSeed;
uniform float uNoiseStrength;
uniform float uNoiseFrequency;
uniform float uSecondaryNoiseStrength;
uniform float uSecondaryNoiseFrequency;
uniform float uNoiseSpeed;
uniform float uTwistAmount;
uniform float uTwistSpeed;
uniform float uPulseStrength;
uniform float uPulseSpeed;
uniform float uDeformIntensity;
varying float vBlobNoise;
varying float vBlobPulse;
varying vec3 vBlobViewNormal;
varying vec3 vBlobViewPosition;

vec2 rotateBlobXZ(vec2 value, float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat2(c, -s, s, c) * value;
}

float hash13(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.11, 0.17, 0.23));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float valueNoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);

  float n000 = hash13(i + vec3(0.0, 0.0, 0.0));
  float n100 = hash13(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash13(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash13(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash13(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash13(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash13(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash13(i + vec3(1.0, 1.0, 1.0));

  return mix(
    mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
    mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
    f.z
  );
}

float fbmBlob(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;

  for (int octave = 0; octave < 3; octave += 1) {
    value += amplitude * valueNoise(p);
    p = p * 2.04 + vec3(13.1, 17.2, 19.3);
    amplitude *= 0.54;
  }

  return value;
}`,
      )
      .replace(
        "#include <beginnormal_vertex>",
        `#include <beginnormal_vertex>
float blobNormalTwist = (position.y * uTwistAmount + uTime * uTwistSpeed + uSeed) * uDeformIntensity;
objectNormal.xz = rotateBlobXZ(objectNormal.xz, blobNormalTwist);`,
      )
      .replace(
        "#include <begin_vertex>",
        `vec3 transformed = vec3(position);
float blobTime = uTime * uNoiseSpeed + uSeed * 1.371;
float primaryNoise = fbmBlob(transformed * uNoiseFrequency + vec3(blobTime * 0.21, blobTime, blobTime * 0.74));
float secondaryNoise = valueNoise(
  transformed * uSecondaryNoiseFrequency + vec3(blobTime * 0.63, -blobTime * 0.42, blobTime * 0.29)
);
float blobNoiseField = clamp(
  primaryNoise + (secondaryNoise - 0.5) * uSecondaryNoiseStrength,
  0.0,
  1.0
);
float blobPulse = sin(uTime * uPulseSpeed + uSeed * 9.7) * 0.5 + 0.5;
float blobTwist = (transformed.y * uTwistAmount + uTime * uTwistSpeed + uSeed) * uDeformIntensity;
transformed.xz = rotateBlobXZ(transformed.xz, blobTwist);
transformed += normal * (
  ((blobNoiseField - 0.5) * 2.0 * uNoiseStrength) +
  blobPulse * uPulseStrength
) * uDeformIntensity;
vBlobNoise = blobNoiseField;
vBlobPulse = blobPulse;`,
      )
      .replace(
        "#include <project_vertex>",
        `#include <project_vertex>
vBlobViewNormal = normalize(normalMatrix * objectNormal);
vBlobViewPosition = -mvPosition.xyz;`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uTime;
uniform float uSurfaceShiftStrength;
uniform float uSurfaceShiftSpeed;
uniform float uSurfaceResponse;
uniform float uEdgeFresnelStrength;
uniform float uWarmLift;
uniform float uSurfaceIntensity;
uniform vec3 uBlobPearlColor;
uniform vec3 uBlobEdgeColor;
uniform vec3 uBlobWarmColor;
varying float vBlobNoise;
varying float vBlobPulse;
varying vec3 vBlobViewNormal;
varying vec3 vBlobViewPosition;`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
float blobSurfaceBand = 0.5 + 0.5 * sin(
  vBlobNoise * 8.0 +
  uTime * uSurfaceShiftSpeed +
  vBlobPulse * 3.14159265
);
totalEmissiveRadiance +=
  uBlobEdgeColor *
  blobSurfaceBand *
  uSurfaceShiftStrength *
  0.024 *
  uSurfaceIntensity;`,
      )
      .replace(
        "#include <lights_fragment_end>",
        `#include <lights_fragment_end>
float blobViewDot = clamp(
  dot(normalize(vBlobViewNormal), normalize(vBlobViewPosition)),
  0.0,
  1.0
);
float blobFresnel = pow(1.0 - blobViewDot, 2.2);
float blobSurfaceMix = clamp(
  vBlobNoise * 0.74 + blobSurfaceBand * 0.36 + vBlobPulse * 0.18,
  0.0,
  1.0
);
outgoingLight = mix(
  outgoingLight,
  mix(outgoingLight, uBlobPearlColor, 0.16 + blobSurfaceMix * 0.1),
  uSurfaceResponse * uSurfaceIntensity
);
outgoingLight +=
  uBlobEdgeColor *
  blobFresnel *
  uEdgeFresnelStrength *
  (0.34 + blobSurfaceMix * 0.56) *
  uSurfaceIntensity;
outgoingLight +=
  uBlobWarmColor *
  uWarmLift *
  (0.08 + blobSurfaceBand * 0.12) *
  uSurfaceIntensity;`,
      );

    material.userData.blobFieldShader = shader;
  };

  updateBlobFieldShader(material, palette, blobFieldConfig, {
    seed,
  });
  material.needsUpdate = true;

  return uniforms;
}

export function updateBlobFieldShader(
  material,
  palette,
  blobFieldConfig,
  {
    seed = material.userData.blobFieldUniforms?.uSeed?.value ?? 0,
    animationSpeed = 1,
    noiseScale = 1,
    twistScale = 1,
  } = {},
) {
  const uniforms = material.userData.blobFieldUniforms;

  if (!uniforms) {
    return null;
  }

  const appearance = blobFieldConfig?.appearance ?? {};
  const deformation = blobFieldConfig?.deformation ?? {};

  uniforms.uSeed.value = seed;
  uniforms.uNoiseStrength.value = (deformation.noiseStrength ?? 0.14) * noiseScale;
  uniforms.uNoiseFrequency.value = deformation.noiseFrequency ?? 1.18;
  uniforms.uSecondaryNoiseStrength.value = deformation.secondaryNoiseStrength ?? 0.18;
  uniforms.uSecondaryNoiseFrequency.value = deformation.secondaryNoiseFrequency ?? 2.24;
  uniforms.uNoiseSpeed.value = (deformation.noiseSpeed ?? 0.12) * animationSpeed;
  uniforms.uTwistAmount.value = (deformation.twistAmount ?? 0.26) * twistScale;
  uniforms.uTwistSpeed.value = (deformation.twistSpeed ?? 0.08) * animationSpeed;
  uniforms.uPulseStrength.value = deformation.pulseStrength ?? 0.018;
  uniforms.uPulseSpeed.value = (deformation.pulseSpeed ?? 0.11) * animationSpeed;
  uniforms.uSurfaceShiftStrength.value = deformation.surfaceShiftStrength ?? 0.18;
  uniforms.uSurfaceShiftSpeed.value =
    (deformation.surfaceShiftSpeed ?? 0.14) * animationSpeed;
  uniforms.uSurfaceResponse.value = appearance.surfaceResponse ?? 0.18;
  uniforms.uEdgeFresnelStrength.value = appearance.edgeFresnelStrength ?? 0.22;
  uniforms.uWarmLift.value = appearance.warmLift ?? 0.018;
  uniforms.uBlobPearlColor.value.set(appearance.bodyColor ?? palette.silver);
  uniforms.uBlobEdgeColor.value.set(appearance.edgeColor ?? palette.coolEdge);
  uniforms.uBlobWarmColor.value.set(appearance.warmColor ?? palette.warm);

  return uniforms;
}
