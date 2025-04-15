'use client';

import { useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Custom hook for handling shader time updates
 * Returns a function to register a shader with time uniform
 */
export function useShaderTime() {
  // Use a ref to store shaders that need time updates
  const shadersRef = useRef<THREE.ShaderMaterial[]>([]);
  
  // Setup frame updates for all registered shaders
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    shadersRef.current.forEach(shader => {
      if (shader.uniforms && shader.uniforms.time) {
        shader.uniforms.time.value = time;
      }
    });
  });
  
  // Function to register a shader
  const registerShader = useCallback((shader: THREE.ShaderMaterial) => {
    if (!shadersRef.current.includes(shader)) {
      shadersRef.current.push(shader);
    }
    
    // Setup initial time uniform if needed
    if (!shader.uniforms.time) {
      shader.uniforms.time = { value: 0 };
    }
    
    // Return unregister function
    return () => {
      shadersRef.current = shadersRef.current.filter(s => s !== shader);
    };
  }, []);
  
  return registerShader;
} 