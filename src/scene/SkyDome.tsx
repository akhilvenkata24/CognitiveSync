import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import * as THREE from 'three'
import { useFlightStore } from '../store/useFlightStore'
import { FlightPhase } from '../types/flightPhase'

// Sun position & sky params per mission phase
const PHASE_SKY: Record<
  FlightPhase,
  {
    sunElevation: number // degrees above horizon
    turbidity: number
    rayleigh: number
    colorTemp: number // Kelvin → used to tint sun/ambient
    ambientIntensity: number
    starsOpacity: number
  }
> = {
  [FlightPhase.PREFLIGHT]: {
    sunElevation: -5,
    turbidity: 3.0,
    rayleigh: 3.5,
    colorTemp: 2800,
    ambientIntensity: 0.15,
    starsOpacity: 1.0,
  },
  [FlightPhase.STARTUP]: {
    sunElevation: 2,
    turbidity: 3.0,
    rayleigh: 3.0,
    colorTemp: 3200,
    ambientIntensity: 0.3,
    starsOpacity: 0.5,
  },
  [FlightPhase.TAXI]: {
    sunElevation: 10,
    turbidity: 2.5,
    rayleigh: 2.5,
    colorTemp: 3800,
    ambientIntensity: 0.6,
    starsOpacity: 0.0,
  },
  [FlightPhase.TAKEOFF]: {
    sunElevation: 18,
    turbidity: 2.0,
    rayleigh: 1.8,
    colorTemp: 4800,
    ambientIntensity: 0.9,
    starsOpacity: 0.0,
  },
  [FlightPhase.CLIMB]: {
    sunElevation: 30,
    turbidity: 1.8,
    rayleigh: 1.4,
    colorTemp: 5200,
    ambientIntensity: 1.1,
    starsOpacity: 0.0,
  },
  [FlightPhase.CRUISE]: {
    sunElevation: 55,
    turbidity: 1.5,
    rayleigh: 0.8,
    colorTemp: 5800,
    ambientIntensity: 1.4,
    starsOpacity: 0.0,
  },
  [FlightPhase.DESCENT]: {
    sunElevation: 20,
    turbidity: 2.5,
    rayleigh: 2.8,
    colorTemp: 4000,
    ambientIntensity: 0.8,
    starsOpacity: 0.0,
  },
  [FlightPhase.LANDING]: {
    sunElevation: 3,
    turbidity: 3.5,
    rayleigh: 4.0,
    colorTemp: 2500,
    ambientIntensity: 0.4,
    starsOpacity: 0.1,
  },
}

// Approximate color from Kelvin temperature
function kelvinToColor(k: number): THREE.Color {
  const t = k / 100
  let r: number, g: number, b: number
  if (t <= 66) {
    r = 255
    g = Math.max(0, Math.min(255, 99.4708025861 * Math.log(t) - 161.1195681661))
    b = t <= 19 ? 0 : Math.max(0, Math.min(255, 138.5177312231 * Math.log(t - 10) - 305.0447927307))
  } else {
    r = Math.max(0, Math.min(255, 329.698727446 * Math.pow(t - 60, -0.1332047592)))
    g = Math.max(0, Math.min(255, 288.1221695283 * Math.pow(t - 60, -0.0755148492)))
    b = 255
  }
  return new THREE.Color(r / 255, g / 255, b / 255)
}

const skyVertexShader = `
varying vec3 vWorldPosition;
void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const skyFragmentShader = `
uniform vec3 sunPosition;
uniform float turbidity;
uniform float rayleigh;
uniform float mieCoefficient;
uniform float mieDirectionalG;
uniform vec3 sunColor;

varying vec3 vWorldPosition;

const vec3 up = vec3(0.0, 1.0, 0.0);
const float e = 2.71828182845904523536;
const float pi = 3.141592653589793238462643383;

const float n = 1.0003;
const float N = 2.545E25;
const float rayleighZenithLength = 8.4E3;
const float mieZenithLength = 1.25E3;
const vec3 lambda = vec3(680E-9, 550E-9, 450E-9);
const vec3 K = vec3(0.686, 0.678, 0.666);
const float v = 4.0;
const float depolarizationFactor = 0.035;
const float primaries = 0.398;
const float mieV = 3.936;
const float mieConst = 1.8399E-14;
const float sunAngularDiameterCos = 0.999956676946448443553574619906976478926848692873900859324;
const float THREE_OVER_SIXTEEN_PI = 0.05968310365946075;
const float ONE_OVER_FOUR_PI = 0.07957747154594767;

vec3 totalRayleigh(vec3 lambda_) {
  return (8.0 * pow(pi, 3.0) * pow(pow(n, 2.0) - 1.0, 2.0) * (6.0 + 3.0 * depolarizationFactor))
       / (3.0 * N * pow(lambda_, vec3(4.0)) * (6.0 - 7.0 * depolarizationFactor));
}

float rayleighPhase(float cosTheta) {
  return THREE_OVER_SIXTEEN_PI * (1.0 + pow(cosTheta, 2.0));
}

vec3 totalMie(vec3 lambda_, vec3 K_, float T) {
  float c = 0.2 * T * 10E-18;
  return 0.434 * c * pi * pow((2.0 * pi) / lambda_, vec3(v - 2.0)) * K_;
}

float henyeyGreensteinPhase(float cosTheta, float g) {
  return ONE_OVER_FOUR_PI * ((1.0 - pow(g, 2.0)) / pow(1.0 - 2.0 * g * cosTheta + pow(g, 2.0), 1.5));
}

float sunIntensity(float zenithAngleCos) {
  float cutoffAngle = pi / 1.95;
  return primaries * max(0.0, 1.0 - pow(e, -((cutoffAngle - acos(zenithAngleCos)) / 1.4)));
}

void main() {
  vec3 direction = normalize(vWorldPosition);
  float zenithAngle = acos(max(0.0, dot(up, direction)));
  float inverse = 1.0 / (cos(zenithAngle) + 0.15 * pow(93.885 - ((zenithAngle * 180.0) / pi), -1.253));
  float sR = rayleighZenithLength * inverse;
  float sM = mieZenithLength * inverse;

  vec3 betaR = totalRayleigh(lambda) * rayleigh;
  vec3 betaM = totalMie(lambda, K, turbidity) * mieCoefficient;

  vec3 Fex = exp(-(betaR * sR + betaM * sM));

  vec3 sunDir = normalize(sunPosition);
  float cosTheta = dot(direction, sunDir);
  float rPhase = rayleighPhase(cosTheta * 0.5 + 0.5);
  vec3 betaRTheta = betaR * rPhase;

  float mPhase = henyeyGreensteinPhase(cosTheta, mieDirectionalG);
  vec3 betaMTheta = betaM * mPhase;

  float Sun = sunIntensity(dot(sunDir, up));
  vec3 Lout = (betaRTheta + betaMTheta) / (betaR + betaM) * Sun * Fex;

  // Sun disc
  float sundisk = smoothstep(sunAngularDiameterCos, sunAngularDiameterCos + 0.00002, cosTheta);
  Lout += (Sun * 19000.0 * Fex) * sundisk * sunColor;

  // Exposure
  gl_FragColor = vec4(1.0 - exp(-1.0 * Lout), 1.0);
}
`

export function SkyDome() {
  const { currentPhase } = useFlightStore()
  const meshRef = useRef<THREE.Mesh>(null)
  const lerpedParams = useRef({
    sunElevation: -5,
    turbidity: 3.0,
    rayleigh: 3.5,
    starsOpacity: 1.0,
  })

  const uniforms = useMemo(
    () => ({
      sunPosition: { value: new THREE.Vector3(0, -0.1, 1) },
      turbidity: { value: 3.0 },
      rayleigh: { value: 3.5 },
      mieCoefficient: { value: 0.005 },
      mieDirectionalG: { value: 0.8 },
      sunColor: { value: new THREE.Color(1, 0.9, 0.7) },
    }),
    []
  )

  useFrame((_, delta) => {
    const target = PHASE_SKY[currentPhase]
    const speed = delta * 0.4

    lerpedParams.current.sunElevation = THREE.MathUtils.lerp(
      lerpedParams.current.sunElevation,
      target.sunElevation,
      speed
    )
    lerpedParams.current.turbidity = THREE.MathUtils.lerp(
      lerpedParams.current.turbidity,
      target.turbidity,
      speed
    )
    lerpedParams.current.rayleigh = THREE.MathUtils.lerp(
      lerpedParams.current.rayleigh,
      target.rayleigh,
      speed
    )

    const elevRad = THREE.MathUtils.degToRad(lerpedParams.current.sunElevation)
    uniforms.sunPosition.value.set(Math.cos(elevRad) * 0.5, Math.sin(elevRad), Math.cos(elevRad))
    uniforms.turbidity.value = lerpedParams.current.turbidity
    uniforms.rayleigh.value = lerpedParams.current.rayleigh

    const sunColor = kelvinToColor(target.colorTemp)
    uniforms.sunColor.value.lerp(sunColor, speed)
  })

  return (
    <>
      <mesh ref={meshRef} scale={[-1, 1, 1]}>
        <sphereGeometry args={[50000, 32, 32]} />
        <shaderMaterial
          side={THREE.BackSide}
          vertexShader={skyVertexShader}
          fragmentShader={skyFragmentShader}
          uniforms={uniforms}
          depthWrite={false}
        />
      </mesh>

      {/* Stars — fade based on phase */}
      <Stars radius={45000} depth={500} count={5000} factor={6} saturation={0.1} fade speed={0.2} />
    </>
  )
}
