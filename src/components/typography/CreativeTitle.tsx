import { useRef, useState, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
// Remove DreiText import if not used anymore
// import { Text as DreiText } from '@react-three/drei'
import * as THREE from 'three'
// Import FontLoader and Font from three/examples/jsm instead of three-stdlib
import { FontLoader, Font } from 'three/examples/jsm/loaders/FontLoader.js'
import InterRegular from '@pmndrs/assets/fonts/inter_regular.json' // Import the font JSON data
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { MeshSurfaceSampler } from '@/utils/MeshSurfaceSampler.js'
// Remove FONTS import if no longer needed
// import { FONTS } from '@/utils/fonts'
import { useSpring, animated } from '@react-spring/three'

// Particle Shader Material Definition
const particleVertexShader = `
  attribute vec3 a_targetPosition; // Target position on text surface
  attribute float a_random; // Random value per particle (0 to 1)

  uniform float u_introProgress;
  uniform float u_time;
  uniform float u_pointSize;
  uniform float u_hoverFactor; // How much hover expands particles (0 to 1)
  uniform float u_glitchFactor; // How much glitch effect is active (0 to 1)

  varying float v_alpha;
  varying float v_random;
  varying float v_progressToTarget; // How close particle is to target

  // Simplex noise function (paste snoise code here or import)
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
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  // Glitch offset function
  vec3 glitchOffset(float rand, float time) {
    float glitchTime = mod(time * 0.5 + rand * 10.0, 5.0); // Cycle glitch timing
    if (glitchTime < 0.1 && rand > 0.8) { // Apply glitch randomly for short durations
        return vec3(
            (rand - 0.9) * 2.0, // Small horizontal shift
            (snoise(vec3(rand * 100.0, time * 5.0, 0.0)) - 0.5) * 0.5, // Small vertical shift
            0.0
        ) * u_glitchFactor;
    }
    return vec3(0.0);
  }

  void main() {
    v_random = a_random;

    float startDelay = a_random * 0.4;
    float effectiveProgress = smoothstep(startDelay, 0.8 + startDelay, u_introProgress);
    v_progressToTarget = effectiveProgress;

    vec3 currentPosition = mix(position, a_targetPosition, effectiveProgress);

    // Persistent Animation (Noise Drift)
    float t = u_time * 0.1;
    float noiseFreq = 1.0 + a_random * 0.8;
    float noiseAmp = (0.05 + a_random * 0.05) * (0.5 + effectiveProgress * 0.5);
    vec3 noiseOffset = vec3(
      snoise(currentPosition * noiseFreq + t + a_random * 10.0),
      snoise(currentPosition * noiseFreq + t + a_random * 20.0),
      snoise(currentPosition * noiseFreq + t + a_random * 30.0)
    ) * noiseAmp;

    // Hover effect
    vec3 centerOffset = normalize(currentPosition - vec3(0.0));
    noiseOffset += centerOffset * u_hoverFactor * (0.8 + a_random * 0.4);

    // Apply Glitch
    vec3 glitch = glitchOffset(a_random, u_time);

    vec3 finalPosition = currentPosition + noiseOffset + glitch;

    vec4 mvPosition = modelViewMatrix * vec4(finalPosition, 1.0);

    float basePointSize = u_pointSize * (1.0 + a_random * 0.3);
    float perspectiveScale = (300.0 / -mvPosition.z);
    // Reduce size slightly when glitching
    float glitchSizeFactor = 1.0 - u_glitchFactor * step(0.01, length(glitch)) * 0.3;
    float pointSize = basePointSize * perspectiveScale * glitchSizeFactor;
    gl_PointSize = clamp(pointSize, 1.5, 12.0);

    float distToTargetFactor = 1.0 - smoothstep(0.0, 1.5, distance(currentPosition, a_targetPosition));
    // Make alpha slightly more opaque during intro
    v_alpha = smoothstep(0.05, 0.6, u_introProgress) * distToTargetFactor;
    // Flicker alpha slightly based on time and random for neon effect
    v_alpha *= (0.8 + snoise(vec3(a_random * 50.0, u_time * 2.0, 0.0)) * 0.2);
    // Reduce alpha during glitch
    v_alpha *= (1.0 - u_glitchFactor * step(0.01, length(glitch)) * 0.5);

    gl_Position = projectionMatrix * mvPosition;
  }
`;

const particleFragmentShader = `
  // Use more vibrant neon-like colors
  uniform vec3 u_colorA; // Bright Cyan/Electric Blue
  uniform vec3 u_colorB; // Deep Magenta/Purple
  uniform vec3 u_colorC; // Bright White/Pale Yellow hotspot
  uniform float u_introProgress;
  uniform float u_time; // Add time uniform

  varying float v_alpha;
  varying float v_random;
  varying float v_progressToTarget;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    float edgeAlpha = 1.0 - smoothstep(0.4, 0.5, dist); // Slightly harder edge for glow

    // Blend neon colors
    vec3 baseColor = mix(u_colorA, u_colorB, v_random * 0.6 + 0.2);

    // Add bright hotspot
    float highlightFactor = step(0.9, v_random) * smoothstep(0.7, 1.0, v_progressToTarget);
    // Make hotspot pulse slightly
    float pulse = 0.9 + sin(u_time * 5.0 + v_random * 10.0) * 0.1;
    vec3 finalColor = mix(baseColor, u_colorC * pulse, highlightFactor * 0.95);

    // Increase brightness based on progress
    finalColor *= (0.9 + v_progressToTarget * 0.6);

    float finalAlpha = v_alpha * edgeAlpha;

    if (finalAlpha < 0.001) discard;

    gl_FragColor = vec4(finalColor * finalAlpha, finalAlpha);
  }
`;

interface CreativeTitleProps {
  text: string;
  introProgress: number;
  position?: [number, number, number];
  fontSize?: number; // Used for TextGeometry scale
  particleCountFactor?: number; // Multiplier for particle density
  onComplete?: () => void;
}

export function CreativeTitle({
  text,
  introProgress = 0,
  position = [0, 0, 0],
  fontSize = 1.2,
  particleCountFactor = 1500,
  onComplete,
}: Omit<CreativeTitleProps, 'subtext' | 'maxWidth'>) {
  const groupRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const [particleGeometry, setParticleGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [parsedFont, setParsedFont] = useState<Font | null>(null);
  const [hovered, setHovered] = useState(false);
  const { size, viewport } = useThree();

  // Load and parse font effect
  useEffect(() => {
    try {
      const font = new FontLoader().parse(InterRegular as any);
      setParsedFont(font);
      console.log("Inter font parsed successfully within effect.");
    } catch (error) {
      console.error("Failed to parse Inter font within effect:", error);
      setParsedFont(null); // Ensure state is null on error
    }
  }, []); // Run once on mount

  // Springs for hover and potential glitch animation
  const { hoverFactor, glitchFactor } = useSpring({
    hoverFactor: hovered ? 1.0 : 0.0,
    // Trigger glitch slightly on hover
    glitchFactor: hovered ? 0.4 : 0.0,
    config: { mass: 0.5, tension: 200, friction: 20 }
  });
  const animatedGroupProps = useSpring({
    scale: hovered ? 1.03 : 1,
    config: { mass: 1, tension: 280, friction: 40 }
  });

  // Uniforms memoization - ADD u_glitchFactor and UPDATE colors
  const uniforms = useMemo(() => ({
    u_introProgress: { value: introProgress },
    u_time: { value: 0 },
    u_pointSize: { value: viewport.height * 0.06 },
    u_hoverFactor: { value: 0.0 },
    u_glitchFactor: { value: 0.0 }, // Add glitch uniform
    // Update colors for Neon feel
    u_colorA: { value: new THREE.Color('#00BFFF') }, // DeepSkyBlue / Electric Blue
    u_colorB: { value: new THREE.Color('#8A2BE2') }, // BlueViolet / Magenta
    u_colorC: { value: new THREE.Color('#F8F8FF') }, // GhostWhite / Pale Yellow hotspot
  }), [viewport.height]);

  // Effect to create TextGeometry, sample particles, and set geometry state
  useEffect(() => {
    // Ensure font is parsed before proceeding
    if (!parsedFont) {
      // console.log("Waiting for font to parse...");
      return;
    }

    console.log(`CreativeTitle Effect: Font ready. Running for text \"${text}\". Creating geometry...`)
    let sampler: MeshSurfaceSampler | null = null
    let textMesh: THREE.Mesh | null = null
    let isMounted = true

    // Dispose previous geometry
    if (particleGeometry) {
        particleGeometry.dispose()
        console.log(`Disposed previous particle geometry for \"${text}\".`);
    }
    setParticleGeometry(null)

    try {
      // Font is already checked above, safe to use parsedFont here
      if (!parsedFont.data) {
        console.error("parsedFont.data is missing! Cannot create TextGeometry.");
        throw new Error("Font data is missing");
      }

      const geometry = new TextGeometry(text, {
        font: parsedFont, // Use the font from state
        size: fontSize,
        height: 0.05,
        curveSegments: 4,
        bevelEnabled: false,
      });
      geometry.center();

      textMesh = new THREE.Mesh(geometry)
      sampler = new MeshSurfaceSampler(textMesh).build()

      const numVertices = geometry.attributes.position.count;
      const estimatedSurfaceAreaFactor = numVertices / 1000;
      const particleCount = Math.max(500, Math.floor(estimatedSurfaceAreaFactor * particleCountFactor));
      console.log(`Sampling ${particleCount} particles for \"${text}\" (vertices: ${numVertices})...`);

      const positions = new Float32Array(particleCount * 3);
      const targetPositions = new Float32Array(particleCount * 3);
      const randoms = new Float32Array(particleCount);

      const _position = new THREE.Vector3();
      const _normal = new THREE.Vector3();
      const _color = new THREE.Color();

      for (let i = 0; i < particleCount; i++) {
        sampler.sample(_position, _normal, _color);
        targetPositions.set([_position.x, _position.y, _position.z], i * 3);

        const radius = 5 + Math.random() * 5;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        positions.set([
            radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.sin(phi) * Math.sin(theta),
            radius * Math.cos(phi)
        ], i * 3);

        randoms[i] = Math.random();
      }

      const newParticles = new THREE.BufferGeometry();
      newParticles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      newParticles.setAttribute('a_targetPosition', new THREE.BufferAttribute(targetPositions, 3));
      newParticles.setAttribute('a_random', new THREE.BufferAttribute(randoms, 1));

      if (isMounted) {
        setParticleGeometry(newParticles);
        console.log(`Particle geometry created and set for \"${text}\".`);
      } else {
        newParticles.dispose();
        console.log(`Disposed new particle geometry for \"${text}\" as component unmounted.`);
      }

    } catch (err) {
      console.error(`Error creating text/particle geometry for \"${text}\":`, err)
    } finally {
      textMesh?.geometry?.dispose();
      textMesh = null;
      sampler = null;
    }

    return () => {
      isMounted = false
      setParticleGeometry(currentGeo => {
          if (currentGeo) {
              currentGeo.dispose();
              console.log(`CreativeTitle cleanup: Disposed particle geometry for \"${text}\"`);
          }
          return null;
      });
      console.log(`CreativeTitle cleanup ran for \"${text}\"`);
    }
    // Add parsedFont to dependencies - this effect runs when font is ready OR text/fontSize/factor change
  }, [parsedFont, text, fontSize, particleCountFactor])

  // Update shader uniforms in useFrame
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.u_time.value = state.clock.elapsedTime;
      materialRef.current.uniforms.u_introProgress.value = introProgress;
      materialRef.current.uniforms.u_hoverFactor.value = hoverFactor.get();
      materialRef.current.uniforms.u_glitchFactor.value = glitchFactor.get(); // Update glitch uniform
    }

    // Apply floating motion to the group after intro is complete
    if (groupRef.current && introProgress >= 1) {
        const time = state.clock.elapsedTime;
        groupRef.current.position.y = position[1] + Math.sin(time * 0.4) * 0.06;
        groupRef.current.position.x = position[0] + Math.cos(time * 0.3) * 0.04;
        groupRef.current.position.z = position[2] + Math.sin(time * 0.5) * 0.02;
    } else if (groupRef.current) {
        // Ensure group is at base position during intro
         groupRef.current.position.set(...position);
    }
  });

  return (
    <animated.group
      ref={groupRef}
      position={position} // Set initial position
      // Apply hover scale from spring
      scale={animatedGroupProps.scale as any}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e) => setHovered(false)}
    >
      {/* Render points only when geometry is ready */}
      {particleGeometry && (
        <points ref={pointsRef} geometry={particleGeometry}>
          {/* No need for <primitive> when geometry prop is used */}
          <shaderMaterial
            ref={materialRef}
            // Key prop helps React replace material if shader code changes
            key={particleVertexShader + particleFragmentShader}
            attach="material"
            uniforms={uniforms}
            vertexShader={particleVertexShader}
            fragmentShader={particleFragmentShader}
            transparent={true}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      )}
    </animated.group>
  );
} 