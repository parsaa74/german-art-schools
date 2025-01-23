import * as THREE from 'three';
import { extend } from '@react-three/fiber';

export interface NodeGlowMaterialUniforms {
  time: { value: number };
  baseColor: { value: THREE.Color };
  glowColor: { value: THREE.Color };
  isHovered: { value: number };
  audioIntensity: { value: number };
  audioHighBand: { value: number };
  audioMidBand: { value: number };
  audioLowBand: { value: number };
}

class NodeGlowMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      transparent: true,
      uniforms: {
        time: { value: 0 },
        baseColor: { value: new THREE.Color('#ffffff') },
        glowColor: { value: new THREE.Color('#4a4a8a') },
        isHovered: { value: 0 },
        audioIntensity: { value: 0 },
        audioHighBand: { value: 0 },
        audioMidBand: { value: 0 },
        audioLowBand: { value: 0 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 baseColor;
        uniform vec3 glowColor;
        uniform float isHovered;
        uniform float audioIntensity;
        uniform float audioHighBand;
        uniform float audioMidBand;
        uniform float audioLowBand;
        
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        
        // Improved noise function for more organic movement
        float noise(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }
        
        // Voronoi pattern for cellular texture
        float voronoi(vec2 x) {
          vec2 n = floor(x);
          vec2 f = fract(x);
          float md = 5.0;
          vec2 m = vec2(0.0);
          
          for(int i = -1; i <= 1; i++) {
            for(int j = -1; j <= 1; j++) {
              vec2 g = vec2(float(i), float(j));
              vec2 o = noise(n + g) * vec2(sin(time), cos(time));
              vec2 r = g + o - f;
              float d = dot(r, r);
              if(d < md) {
                md = d;
                m = o;
              }
            }
          }
          return md;
        }
        
        void main() {
          // Enhanced fresnel effect with audio reactivity
          float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
          fresnel = fresnel * (1.0 + audioIntensity * 0.8);
          
          // Dynamic cellular pattern
          vec2 voronoiUv = vUv * 4.0 + vec2(
            sin(time * 0.5) * audioHighBand,
            cos(time * 0.3) * audioMidBand
          );
          float cellPattern = voronoi(voronoiUv);
          
          // Audio-reactive wave pattern
          float wavePattern = 
            sin(vUv.x * 20.0 + time * 2.0) * audioHighBand * 0.5 +
            cos(vUv.y * 15.0 - time) * audioMidBand * 0.3 +
            sin((vUv.x + vUv.y) * 10.0 + time * 1.5) * audioLowBand * 0.4;
          
          // Combine patterns with smooth transitions
          float pattern = mix(
            cellPattern,
            wavePattern,
            audioIntensity * sin(time) * 0.5 + 0.5
          );
          
          // Enhanced color mixing with audio reactivity
          vec3 color = mix(baseColor, glowColor, fresnel);
          color = mix(
            color,
            glowColor * (1.5 + audioHighBand),
            pattern * (0.4 + audioIntensity * 0.3)
          );
          
          // Dynamic hover effect
          float hoverGlow = isHovered * (0.6 + sin(time * 4.0) * 0.3);
          color = mix(
            color,
            glowColor * (2.0 + audioMidBand),
            hoverGlow * fresnel
          );
          
          // Enhanced opacity with audio pulse
          float opacity = 0.85 + audioIntensity * 0.25;
          opacity *= (0.9 + fresnel * 0.5);
          opacity *= 1.0 + hoverGlow * 0.4;
          opacity *= 1.0 + pattern * 0.2;
          
          gl_FragColor = vec4(color, opacity);
        }
      `
    });
  }

  set time(v: number) {
    this.uniforms.time.value = v;
  }

  set baseColor(v: THREE.Color) {
    this.uniforms.baseColor.value = v;
  }

  set glowColor(v: THREE.Color) {
    this.uniforms.glowColor.value = v;
  }

  set isHovered(v: number) {
    this.uniforms.isHovered.value = v;
  }

  set audioIntensity(v: number) {
    this.uniforms.audioIntensity.value = v;
  }

  set audioHighBand(v: number) {
    this.uniforms.audioHighBand.value = v;
  }

  set audioMidBand(v: number) {
    this.uniforms.audioMidBand.value = v;
  }

  set audioLowBand(v: number) {
    this.uniforms.audioLowBand.value = v;
  }
}

extend({ NodeGlowMaterial });

export { NodeGlowMaterial as default, type NodeGlowMaterialUniforms }; 