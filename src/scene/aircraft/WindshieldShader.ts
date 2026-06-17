import * as THREE from 'three'

// Multi-layer glass shader for windshield
const windshieldVertexShader = `
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec2 vUv;
varying vec3 vWorldPos;

void main() {
  vUv = uv;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  vNormal = normalize(normalMatrix * normal);
  vViewDir = normalize(cameraPosition - worldPos.xyz);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const windshieldFragmentShader = `
uniform float time;
uniform float rainIntensity;  // 0 = clear, 1 = heavy rain
uniform float frostIntensity; // 0 = clear, 1 = frosted
uniform vec3 tintColor;

varying vec3 vNormal;
varying vec3 vViewDir;
varying vec2 vUv;

// Simple hash for noise
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
  // Fresnel reflection
  float fresnel = pow(1.0 - max(dot(vNormal, vViewDir), 0.0), 3.0);

  // Base glass tint (slight blue-green)
  vec4 glassTint = vec4(tintColor, 0.04);

  // Rain streaks — animated diagonal noise
  float rainStreak = 0.0;
  if (rainIntensity > 0.01) {
    vec2 rainUV = vUv * vec2(20.0, 60.0) + vec2(0.0, time * 0.8);
    rainStreak = noise(rainUV) * noise(rainUV * 2.3) * rainIntensity * 0.25;
  }

  // Frost at edges
  float frostEdge = 0.0;
  if (frostIntensity > 0.01) {
    float edgeDist = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
    frostEdge = (1.0 - smoothstep(0.0, 0.25, edgeDist)) * frostIntensity;
    float frostNoise = noise(vUv * 40.0) * noise(vUv * 80.0 + 0.5);
    frostEdge *= frostNoise * 1.5;
  }

  // Fresnel reflection layer (environment-like)
  vec4 reflectionColor = vec4(0.55, 0.65, 0.75, fresnel * 0.25);

  // Combine layers
  vec4 finalColor = glassTint;
  finalColor += reflectionColor;
  finalColor.a += rainStreak;
  finalColor.rgb = mix(finalColor.rgb, vec3(0.85, 0.92, 0.98), frostEdge);
  finalColor.a  += frostEdge * 0.3;

  finalColor.a = clamp(finalColor.a, 0.0, 0.72);

  gl_FragColor = finalColor;
}
`

export function createWindshieldMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: windshieldVertexShader,
    fragmentShader: windshieldFragmentShader,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      time: { value: 0 },
      rainIntensity: { value: 0 },
      frostIntensity: { value: 0.6 }, // starts frosted, clears during startup
      tintColor: { value: new THREE.Color(0.05, 0.12, 0.25) },
    },
  })
}
