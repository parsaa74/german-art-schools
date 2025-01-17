import * as THREE from 'three'
import { extend } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'

const AtmosphereMaterial = shaderMaterial(
  {
    time: 0,
    radius: 5.0,
    atmosphereColor: new THREE.Color('#4287f5'),
    rimColor: new THREE.Color('#ffffff'),
    audioIntensity: 0.0,
    audioHighBand: 0.0
  },
  /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vViewPosition;
    
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vViewPosition = cameraPosition - worldPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vViewPosition;
    
    uniform float time;
    uniform float radius;
    uniform vec3 atmosphereColor;
    uniform vec3 rimColor;
    uniform float audioIntensity;
    uniform float audioHighBand;
    
    void main() {
      // Calculate fresnel effect for atmosphere rim
      vec3 viewDir = normalize(vViewPosition);
      float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 3.0);
      
      // Add time-based variation
      float pulseIntensity = sin(time * 0.5) * 0.5 + 0.5;
      
      // Layer the atmosphere with varying opacity
      float innerLayer = fresnel * 0.3;
      float middleLayer = fresnel * 0.5 * (1.0 + audioIntensity * 0.3);
      float outerLayer = fresnel * 0.8 * (1.0 + audioHighBand * 0.5);
      
      // Combine layers with different colors
      vec3 innerColor = atmosphereColor * innerLayer;
      vec3 middleColor = mix(atmosphereColor, rimColor, 0.3) * middleLayer;
      vec3 outerColor = mix(atmosphereColor, rimColor, 0.7) * outerLayer;
      
      // Add pulse effect
      vec3 finalColor = innerColor + middleColor + outerColor;
      finalColor *= 1.0 + pulseIntensity * 0.2;
      
      // Add distance-based fog for depth
      float fogFactor = 1.0 - exp(-length(vViewPosition) * 0.1);
      finalColor = mix(finalColor, vec3(0.0), fogFactor * 0.5);
      
      gl_FragColor = vec4(finalColor, fresnel * (0.6 + audioIntensity * 0.2));
    }
  `
)

extend({ AtmosphereMaterial })

type AtmosphereMaterialImpl = {
  uniforms: {
    time: { value: number }
    radius: { value: number }
    atmosphereColor: { value: THREE.Color }
    rimColor: { value: THREE.Color }
    audioIntensity: { value: number }
    audioHighBand: { value: number }
  }
} & THREE.ShaderMaterial

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'atmosphereMaterial': Partial<AtmosphereMaterialImpl> & JSX.IntrinsicElements['shaderMaterial']
    }
  }
}

export type { AtmosphereMaterialImpl as AtmosphereMaterial }
export default AtmosphereMaterial 