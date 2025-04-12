'use client'

import { useThree } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

export default function PostProcessing() {
  const { gl } = useThree();

  // Only render when WebGL context is ready
  if (!gl) return null;

  return (
    <EffectComposer>
      <Bloom
        intensity={0.4} // Lower intensity to reduce flickering
        luminanceThreshold={0.9}
        luminanceSmoothing={0.025}
      />
    </EffectComposer>
  );
}