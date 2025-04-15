import { useMemo } from 'react'
import * as THREE from 'three'
import { useTexture } from '@react-three/drei'

// Constants matching NetworkGraph.tsx (or consider importing/sharing)
const NODE_HOVER_SCALE = 1.8
const NODE_SELECT_SCALE = 2.5

// GLSL Shaders for InstancedMesh
const nodeVertexShader = `
  attribute vec3 instanceColor; // Base color from type
  attribute float instanceState; // 0: normal, 1: hover, 2: selected, 3: inactive

  varying vec3 vColor;
  varying float vState;
  varying vec2 vUv;
  varying vec3 vPosition;

  uniform float time; // For pulsing animation

  void main() {
    vColor = instanceColor;
    vState = instanceState;
    vUv = uv;

    // Scale the mesh based on state
    vec3 transformed = position;
    float scale = 1.0;

    if (instanceState == 1.0) { // Hover
      scale = ${NODE_HOVER_SCALE.toFixed(1)};
    } else if (instanceState == 2.0) { // Selected
      scale = ${NODE_SELECT_SCALE.toFixed(1)};
    }

    // Apply scaling
    transformed *= scale;

    // Add subtle pulsing effect
    float pulse = sin(time * 2.0) * 0.05 + 1.0;
    if (instanceState == 2.0) { // More pronounced pulse for selected
      transformed *= pulse;
    }

    vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(transformed, 1.0);
    vPosition = mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const nodeFragmentShader = `
  uniform sampler2D pointTexture; // Glow texture
  uniform vec3 hoverColor;       // Color for hover state
  uniform vec3 selectedColor;    // Color for selected state

  varying vec3 vColor; // Base color from vertex shader
  varying float vState; // State from vertex shader
  varying vec2 vUv;
  varying vec3 vPosition;

  void main() {
    // Calculate distance from center for glow effect
    float dist = length(vUv - vec2(0.5, 0.5)) * 2.0;
    float glow = 1.0 - dist;
    glow = pow(glow, 2.0); // Sharpen the glow

    // Apply glow texture
    vec4 texColor = texture2D(pointTexture, vUv);

    // Determine color based on state
    vec3 finalColor;
    if (vState == 1.0) { // Hover
      finalColor = hoverColor;
    } else if (vState == 2.0) { // Selected
      finalColor = selectedColor;
    } else { // Normal or Inactive
      finalColor = vColor;
    }

    // Apply glow and handle inactive state
    float alpha = texColor.a * glow;
    if (vState == 3.0) { // Inactive
      alpha *= 0.15; // Make inactive nodes significantly dimmer
      finalColor *= 0.5; // Dim the color as well
    }

    // Discard fragment if alpha is too low (creates sharper edges)
    if (alpha < 0.05) discard;

    // Add rim lighting effect
    float rim = 1.0 - abs(dot(normalize(vPosition), vec3(0.0, 0.0, 1.0)));
    rim = pow(rim, 3.0);
    finalColor += rim * 0.3 * finalColor;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

export function useNodeShaderMaterial() {
  const glowTexture = useTexture('/textures/glow.png');

  const nodeMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        pointTexture: { value: glowTexture },
        hoverColor: { value: new THREE.Color('#ffffff') }, // White hover
        selectedColor: { value: new THREE.Color('#A7CBFF') }, // Ethereal light blue selected
      },
      vertexShader: nodeVertexShader,
      fragmentShader: nodeFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide, // Render both sides
    });
  }, [glowTexture]);

  return nodeMaterial;
}