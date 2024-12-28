import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const ColorFlowMaterial = () => {
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec2 vUv;
        void main() {
          vec3 color1 = vec3(0.5, 0.8, 1.0);
          vec3 color2 = vec3(1.0, 0.2, 0.5);
          float pattern = sin(vUv.x * 10.0 + time) * cos(vUv.y * 10.0 + time);
          gl_FragColor = vec4(mix(color1, color2, pattern), 1.0);
        }
      `,
      uniforms: {
        time: { value: 0 }
      },
      transparent: true,
      opacity: 0.5
    });
  }, []);
  
  useFrame(({ clock }) => {
    shaderMaterial.uniforms.time.value = clock.getElapsedTime();
  });
  
  return shaderMaterial;
};
