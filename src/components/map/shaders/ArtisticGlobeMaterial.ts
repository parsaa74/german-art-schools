import * as THREE from 'three'
import { extend } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'

const ArtisticGlobeMaterial = shaderMaterial(
  {
    time: 0,
    radius: 5.0,
    mousePosition: new THREE.Vector2(0, 0),
    mouseStrength: 0,
    audioIntensity: 0.0,
    audioLowBand: 0.0,
    audioMidBand: 0.0,
    audioHighBand: 0.0,
    baseColor: new THREE.Color('#1a1a2e'),
    accentColor: new THREE.Color('#4a4a8a'),
    highlightColor: new THREE.Color('#8a8aff')
  },
  /* glsl */ `
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vViewPosition;
    
    uniform float time;
    uniform float audioIntensity;
    uniform vec2 mousePosition;
    uniform float mouseStrength;
    
    // Simplex noise function
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    
    float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      
      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      
      i = mod289(i);
      vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0));
                
      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;
      
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
      
      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);
      
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }
    
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vUv = uv;
      vPosition = position;
      
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vViewPosition = cameraPosition - worldPosition.xyz;
      
      // Organic movement with layered noise
      float noise1 = snoise(position * 0.4 + time * 0.1);
      float noise2 = snoise(position * 0.8 + time * 0.05);
      float displacement = mix(noise1, noise2, 0.5) * 0.1;
      
      // Interactive displacement
      vec3 mousePos = vec3(mousePosition * 2.0 - 1.0, 0.0);
      float mouseDistance = length(position - mousePos);
      float mouseDisplacement = (1.0 - smoothstep(0.0, 2.0, mouseDistance)) * mouseStrength * 0.1;
      
      vec3 newPosition = position + normal * (displacement + mouseDisplacement);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `,
  /* glsl */ `
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vViewPosition;
    
    uniform float time;
    uniform float audioIntensity;
    uniform float audioLowBand;
    uniform float audioMidBand;
    uniform float audioHighBand;
    uniform vec3 baseColor;
    uniform vec3 accentColor;
    uniform vec3 highlightColor;
    
    // Artistic line pattern
    float getLines(vec3 p) {
      float t = time * 0.2;
      vec3 q = p;
      q.x *= 0.6;
      q.y += sin(q.x * 4.0 + t) * 0.1;
      return smoothstep(0.0, 0.1, abs(sin(q.y * 10.0)));
    }
    
    void main() {
      // Enhanced Fresnel
      vec3 viewDir = normalize(vViewPosition);
      float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 2.0);
      
      // Dynamic pattern
      float lines = getLines(vPosition);
      float pattern = lines * (0.3 + audioLowBand * 0.2);
      
      // Color composition
      vec3 color = mix(baseColor, accentColor, pattern);
      color = mix(color, highlightColor, fresnel * (0.3 + audioHighBand * 0.2));
      
      // Rim light
      float rim = pow(1.0 - abs(dot(viewDir, vNormal)), 4.0);
      color += highlightColor * rim * 0.5;
      
      // Audio-reactive glow
      float glow = audioIntensity * 0.2;
      color *= 1.0 + glow;
      
      // Dynamic noise texture
      float noise = fract(sin(dot(vUv, vec2(12.9898, 78.233)) + time) * 43758.5453);
      color += noise * 0.03;
      
      // Final color with proper opacity
      gl_FragColor = vec4(color, 0.9 + fresnel * 0.1);
    }
  `
)

extend({ ArtisticGlobeMaterial })

type ArtisticGlobeMaterialImpl = {
  uniforms: {
    time: { value: number }
    radius: { value: number }
    mousePosition: { value: THREE.Vector2 }
    mouseStrength: { value: number }
    audioIntensity: { value: number }
    audioLowBand: { value: number }
    audioMidBand: { value: number }
    audioHighBand: { value: number }
    baseColor: { value: THREE.Color }
    accentColor: { value: THREE.Color }
    highlightColor: { value: THREE.Color }
  }
} & THREE.ShaderMaterial

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'artisticGlobeMaterial': Partial<ArtisticGlobeMaterialImpl> & JSX.IntrinsicElements['shaderMaterial']
    }
  }
}

export type { ArtisticGlobeMaterialImpl as ArtisticGlobeMaterial }
export default ArtisticGlobeMaterial 