import * as THREE from 'three';
import { extend } from '@react-three/fiber';

export interface GeometricTypographyMaterialUniforms {
  time: { value: number };
  color: { value: THREE.Color };
  hover: { value: number };
  glitchIntensity: { value: number };
  textureMap: { value: THREE.Texture | null };
  resolution: { value: THREE.Vector2 };
  audioIntensity: { value: number };
  audioHighBand: { value: number };
  audioMidBand: { value: number };
  audioLowBand: { value: number };
}

class GeometricTypographyMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      transparent: true,
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color('#4D1BFF') },
        hover: { value: 0 },
        glitchIntensity: { value: 0 },
        textureMap: { value: null },
        resolution: { value: new THREE.Vector2(1, 1) },
        audioIntensity: { value: 0 },
        audioHighBand: { value: 0 },
        audioMidBand: { value: 0 },
        audioLowBand: { value: 0 }
      },
      vertexShader: `
        uniform float time;
        uniform float hover;
        uniform float glitchIntensity;
        uniform float audioIntensity;
        uniform float audioHighBand;
        uniform float audioMidBand;
        uniform float audioLowBand;
        
        varying vec2 vUv;
        varying float vProgress;
        
        // Improved noise function
        float noise(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }
        
        // Smooth rotation function
        vec2 rotate2D(vec2 position, float angle) {
          mat2 m = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
          return m * position;
        }

        // Wave function with multiple frequencies
        float wave(float x, float z) {
          return sin(x * 4.0 + time * 2.0) * 0.02 + 
                 cos(x * 8.0 + time * 1.5) * 0.01 +
                 sin(x * 16.0 + time) * 0.005;
        }
        
        void main() {
          vUv = uv;
          vProgress = hover;
          
          // Enhanced position calculation
          vec3 pos = position;
          
          // Audio-reactive wave effect
          float waveY = wave(pos.x, pos.z) * (1.0 + audioIntensity * 0.5);
          pos.y += waveY * hover;
          
          // Dynamic rotation based on hover and audio
          vec2 rotated = rotate2D(pos.xy, hover * 0.1 * sin(time * 2.0 + audioHighBand * 2.0));
          pos.xy = mix(pos.xy, rotated, hover);
          
          // Advanced glitch effect with audio influence
          if (glitchIntensity > 0.0) {
            float noise = noise(uv + time * 2.0);
            float glitchAmount = glitchIntensity * (0.03 + audioHighBand * 0.02);
            pos.x += noise * glitchAmount * (1.0 - hover) * sin(time * 20.0);
            pos.y += noise * glitchAmount * cos(time * 15.0);
            pos.z += noise * glitchAmount * sin(time * 10.0);
          }
          
          // Audio-reactive breathing effect
          float breathing = sin(time * 2.0 + audioMidBand * 4.0) * 0.02 + 1.0;
          pos *= mix(1.0, breathing, hover * 0.3);
          
          // Scale up on hover with elastic and audio effect
          float elasticScale = 1.0 + hover * 0.2 * (1.0 + sin(time * 8.0) * 0.05 + audioIntensity * 0.1);
          pos *= elasticScale;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color;
        uniform float hover;
        uniform float glitchIntensity;
        uniform sampler2D textureMap;
        uniform vec2 resolution;
        uniform float audioIntensity;
        uniform float audioHighBand;
        uniform float audioMidBand;
        uniform float audioLowBand;
        
        varying vec2 vUv;
        varying float vProgress;

        // Enhanced color manipulation
        vec3 energyColor(vec3 color, float energy) {
          return color * (1.0 + energy * 0.8) + vec3(energy * 0.3);
        }
        
        void main() {
          // Dynamic UV distortion with audio influence
          vec2 distortedUV = vUv + vec2(
            sin(vUv.y * 20.0 + time * 2.0) * (0.003 + audioHighBand * 0.002),
            cos(vUv.x * 20.0 + time * 1.5) * (0.003 + audioMidBand * 0.002)
          ) * hover;
          
          vec4 texColor = texture2D(textureMap, distortedUV);
          
          // Audio-reactive gradient
          float gradient = sin(vUv.x * 6.28318 + time + audioLowBand * 2.0) * 0.5 + 0.5;
          gradient *= sin(vUv.y * 4.0 + time * 0.8 + audioMidBand * 2.0) * 0.5 + 0.5;
          gradient += sin(vUv.x * 10.0 - time * 0.5 + audioHighBand * 2.0) * 0.2;
          
          // Enhanced color blending with audio
          vec3 baseColor = color;
          vec3 hoverColor = energyColor(color, hover + audioIntensity * 0.3);
          vec3 finalColor = mix(baseColor, hoverColor, gradient * vProgress);
          
          // Energy field effect
          float energy = length(vUv - 0.5) * 2.0;
          energy = 1.0 - smoothstep(0.0, 1.0, energy);
          finalColor += vec3(0.2, 0.4, 1.0) * energy * (hover + audioHighBand * 0.3) * 0.5;
          
          // Audio-reactive holographic scanlines
          float scanline = sin(vUv.y * 200.0 + time * 5.0 + audioHighBand * 10.0) * 0.5 + 0.5;
          scanline *= sin(vUv.x * 150.0 - time * 3.0 + audioMidBand * 8.0) * 0.5 + 0.5;
          finalColor = mix(finalColor, finalColor * 1.2, scanline * vProgress * 0.3);
          
          // Edge glow with audio pulse
          float edge = 1.0 - smoothstep(0.4, 0.5, distance(vUv, vec2(0.5)));
          vec3 edgeColor = vec3(0.3, 0.6, 1.0) * edge * (hover + audioIntensity * 0.2);
          finalColor += edgeColor * 0.4;
          
          // Glitch color effect with audio influence
          if (glitchIntensity > 0.0) {
            float noise = fract(sin(dot(vUv + time * 0.1, vec2(12.9898,78.233))) * 43758.5453123);
            float glitchLine = step(0.98 - glitchIntensity * (0.2 + audioHighBand * 0.1), noise);
            vec3 glitchColor = vec3(1.0, 0.2, 0.8) * (1.0 + audioIntensity * 0.3);
            finalColor = mix(finalColor, glitchColor, glitchLine * glitchIntensity);
          }
          
          // Audio-reactive alpha
          float alpha = texColor.a;
          alpha = mix(alpha, min(alpha * (1.2 + audioIntensity * 0.2), 1.0), hover);
          
          gl_FragColor = vec4(finalColor * texColor.rgb, alpha);
        }
      `
    });
  }
}

extend({ GeometricTypographyMaterial });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      geometricTypographyMaterial: THREE.ShaderMaterial & {
        uniforms: GeometricTypographyMaterialUniforms;
      };
    }
  }
}

export { GeometricTypographyMaterial }; 