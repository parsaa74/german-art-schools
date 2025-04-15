'use client'

import { useRef, useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
// Removed unused COLORS import

// Update GlobeProps - remove unused props
interface GlobeProps {
    radius?: number;
    introProgress?: number;
}

// Update component signature
export default function Globe({
    radius = 5,
    introProgress = 1,
}: GlobeProps) {
    const globeRef = useRef<THREE.Group>(null);
    // Removed glowRef as it's not essential for the core shader effect
    const sphereRef = useRef<THREE.Mesh>(null);
    const autoRotate = useRef<boolean>(true);
    const [rotationSpeed, setRotationSpeed] = useState(0.15);
    // Removed unused pulseIntensity state
    // Removed unused startTime state
    // Removed starburstRef as intro effect will be handled by shaders/scaling
    const [mounted, setMounted] = useState(false);

    // --- START: Define Shaders (Inside Component) ---
    const globeVertexShader = /* glsl */`
    uniform float time;
    uniform float radius;
    uniform float introProgress;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition; 
    varying float vNoise; // Restore varying

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
      vec4 p = permute(permute(permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 )) + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
      float n_ = 0.142857142857; // 1.0/7.0
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
      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
    }

    // FBM function (optional, could simplify)
    float fbm(vec3 p) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;
        for (int i = 0; i < 4; i++) { value += amplitude * snoise(p * frequency); amplitude *= 0.5; frequency *= 2.0; }
        return value;
    }

    void main() {
        vUv = uv;
        vec3 pos = position;

        // Restore time-based displacement
        float displacementNoise = snoise(pos * 1.5 + time * 0.1);
        pos += normal * displacementNoise * 0.1 * introProgress; 

        // Keep intro scaling
        float introScale = mix(0.5, 1.0, smoothstep(0.0, 0.7, introProgress));
        pos *= introScale;

        vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
        vPosition = worldPosition.xyz;
        vNormal = normalize(normalMatrix * normal); 

        // Restore time-based noise passing
        vNoise = fbm(pos * 2.0 + time * 0.2);

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
`;

const globeFragmentShader = /* glsl */`
    uniform float time; 
    uniform float radius;
    uniform vec3 color1; // Base color (e.g., deep space blue)
    uniform vec3 color2; // Primary accent (e.g., luminous cyan)
    uniform vec3 color3; // Secondary accent (e.g., subtle nebula purple)
    uniform float noiseScale;
    uniform float fresnelPower;
    uniform float opacityFactor;
    uniform float introProgress;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying float vNoise; // Use noise passed from vertex shader

    // Re-add snoise/fbm if they were removed previously and needed here
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0); const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy)); vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz); vec3 l = 1.0 - g; vec3 i1 = min(g.xyz, l.zxy); vec3 i2 = max(g.xyz, l.zxy);
      vec3 x1 = x0 - i1 + C.xxx; vec3 x2 = x0 - i2 + C.yyy; vec3 x3 = x0 - D.yyy;
      i = mod289(i);
      vec4 p = permute(permute(permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 )) + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
      float n_ = 0.142857142857; vec3 ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z); vec4 x_ = floor(j * ns.z); vec4 y_ = floor(j - 7.0 * x_);
      vec4 x = x_ *ns.x + ns.yyyy; vec4 y = y_ *ns.x + ns.yyyy; vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4(x.xy, y.xy); vec4 b1 = vec4(x.zw, y.zw);
      vec4 s0 = floor(b0)*2.0 + 1.0; vec4 s1 = floor(b1)*2.0 + 1.0; vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy; vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
      vec3 p0 = vec3(a0.xy,h.x); vec3 p1 = vec3(a0.zw,h.y); vec3 p2 = vec3(a1.xy,h.z); vec3 p3 = vec3(a1.zw,h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0); m = m * m;
      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
    }
    float fbm(vec3 p) {
        float value = 0.0; float amplitude = 0.5; float frequency = 1.0;
        // Reduce iterations for potentially smoother noise
        for (int i = 0; i < 3; i++) { value += amplitude * snoise(p * frequency); amplitude *= 0.5; frequency *= 2.0; }
        return value;
    }

    void main() {
        vec3 viewDirection = normalize(cameraPosition - vPosition);
        float fresnel = 1.0 - dot(normalize(vNormal), viewDirection);
        fresnel = pow(fresnel, fresnelPower); // Use uniform power

        float noise = vNoise; // Use noise from vertex shader
        float patternNoise = fbm(vPosition * noiseScale * 0.8 + time * 0.08); // Slightly different scale/speed

        vec3 baseColor = color1;
        vec3 accentColor1 = color2;
        vec3 accentColor2 = color3;

        // Mix colors based on noise, creating softer transitions
        vec3 surfaceColor = baseColor;
        surfaceColor = mix(surfaceColor, accentColor1, smoothstep(-0.2, 0.4, noise) * 0.7); // Smoother, wider transition
        surfaceColor = mix(surfaceColor, accentColor2, smoothstep(0.1, 0.6, patternNoise) * 0.5); // Smoother, wider transition

        // Emissive color based on fresnel and subtle noise modulation
        // No grid contribution here
        vec3 emissiveColor = mix(accentColor1, accentColor2, smoothstep(-0.1, 0.1, noise)) * fresnel * 1.8; // Slightly stronger fresnel
        emissiveColor += accentColor1 * smoothstep(0.5, 0.8, patternNoise) * 0.1; // Subtle glow from secondary noise

        // Final alpha calculation (similar to before, focuses on fresnel and intro)
        float alpha = opacityFactor;
        alpha = mix(alpha * 0.8, 1.0, fresnel * 0.6); // Adjust fresnel influence on alpha
        alpha *= smoothstep(0.1, 0.7, introProgress); // Keep intro fade-in

        vec3 finalColor = surfaceColor + emissiveColor; 
        gl_FragColor = vec4(finalColor, alpha);
    }
`;

const haloVertexShader = /* glsl */`
    uniform float halo_time;
    uniform float halo_introProgress;
    uniform float halo_noiseScale;
    varying vec3 vHaloNormal;
    varying vec3 vHaloPosition; // Pass world position

    // Re-include snoise function if needed for vertex displacement
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
        vec4 p = permute(permute(permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 )) + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
        float n_ = 0.142857142857; // 1.0/7.0
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
        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
    }

    void main() {
        vHaloNormal = normalize(normalMatrix * normal);
        vec3 pos = position;

        // Restore time-based noise displacement for halo
        float noise = snoise(pos * halo_noiseScale * 0.5 + halo_time * 0.1);
        pos += normal * noise * 0.01 * (1.0 - halo_introProgress);

        vHaloPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
`;

const haloFragmentShader = /* glsl */`
    uniform vec3 halo_color; // Base halo color (e.g., a lighter shade of accent)
    uniform float halo_time;
    uniform float halo_introProgress;
    uniform float halo_haloPower; // Fresnel power
    uniform float halo_noiseScale; // Noise scale for texture
    varying vec3 vHaloNormal;
    varying vec3 vHaloPosition; // World position

    // Re-include snoise if needed for fragment effects
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
        vec4 p = permute(permute(permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 )) + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
        float n_ = 0.142857142857; // 1.0/7.0
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
        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
    }

    void main() {
        vec3 viewDirection = normalize(cameraPosition - vHaloPosition);
        // Calculate base intensity from view direction (Fresnel-like)
        float intensity = 1.0 - dot(vHaloNormal, viewDirection);
        intensity = pow(intensity, halo_haloPower); // Apply power curve

        // Modulate intensity with subtle, slow-moving noise
        float noise = snoise(vHaloPosition * halo_noiseScale * 0.5 + halo_time * 0.04); // Slower time, finer scale
        intensity *= (0.9 + noise * 0.1); // Subtle variation, less impact than before

        // Slow, gentle pulse effect
        float pulse = 0.85 + 0.15 * sin(halo_time * 0.8 + vHaloPosition.y * 1.5); // Slower pulse, reduced range
        intensity *= pulse;

        // Fade in during intro (keep)
        intensity *= smoothstep(0.4, 0.9, halo_introProgress);

        // Use a base halo color, maybe slightly modulated by noise or time
        vec3 finalHaloColor = halo_color;
        // Optional: Very subtle color shift over time
         // finalHaloColor = mix(halo_color, vec3(0.5, 0.7, 0.9), smoothstep(0.0, 1.0, sin(halo_time * 0.05))); 

        // Final alpha, potentially reduced overall intensity
        gl_FragColor = vec4(finalHaloColor, intensity * 0.65); // Reduced max intensity
    }
    `;
    // --- END: Define Shaders (Inside Component) ---


    // --- START: Memoize Materials (Inside Component) ---
    const globeMaterial = useMemo(() => {
        const useLights = true; // Keep lights enabled for surface interaction
        const baseUniforms = { // Base uniforms with updated colors
            time: { value: 0.0 },
            radius: { value: radius },
            color1: { value: new THREE.Color('#020418') },   // Darker base blue
            color2: { value: new THREE.Color('#00BFFF') },   // Luminous deep sky blue / cyan
            color3: { value: new THREE.Color('#2A0D5A') },   // Subtle deep purple
            noiseScale: { value: 3.5 }, // Slightly adjusted noise scale
            fresnelPower: { value: 3.0 }, // Adjusted fresnel power
            opacityFactor: { value: 0.8 }, // Adjusted opacity
            introProgress: { value: introProgress },
        };

        // Restore the merge but keep includes commented out
        const finalUniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.lights, baseUniforms]);


        return new THREE.ShaderMaterial({
            uniforms: finalUniforms, // Use merged uniforms
            vertexShader: globeVertexShader,
            fragmentShader: globeFragmentShader,
            lights: useLights, // Set lights based on the variable
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.NormalBlending,
        });
    }, [radius, introProgress]); // Dependencies for uniforms

    const haloMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                // Use a lighter, related color for the halo
                halo_color: { value: new THREE.Color('#60A0FF') }, // Lighter cyan/blue
                halo_time: { value: 0 },
                halo_introProgress: { value: introProgress },
                halo_noiseScale: { value: 20.0 }, // Adjusted noise scale for halo
                halo_haloPower: { value: 3.5 } // Adjusted power for halo fresnel
            },
            vertexShader: haloVertexShader,
            fragmentShader: haloFragmentShader,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            depthWrite: false,
            lights: false // Explicitly disable lights for halo
        });
    }, [introProgress]); // Dependency for uniform
    // --- END: Memoize Materials (Inside Component) ---


    // Set mounted flag when component loads on client
    useEffect(() => {
        setMounted(true);
    }, []);

    // Animation loop for rotation and pulse effects
    useFrame((state) => {
        if (!globeRef.current) return;

        const elapsedSeconds = state.clock.getElapsedTime();

        // Update shader uniforms for BOTH materials
        if (globeMaterial?.uniforms?.time) {
            globeMaterial.uniforms.time.value = elapsedSeconds;
        }
        if (globeMaterial?.uniforms?.introProgress) {
             globeMaterial.uniforms.introProgress.value = introProgress; // Update introProgress for globe
        }
        if (haloMaterial?.uniforms?.halo_time) {
            haloMaterial.uniforms.halo_time.value = elapsedSeconds;
        }
         if (haloMaterial?.uniforms?.halo_introProgress) {
            haloMaterial.uniforms.halo_introProgress.value = introProgress; // Update introProgress for halo
        }


        // Intro animation effects
        if (introProgress < 1) {
            // Dramatic scale up with bounce effect
            const bounceEasing = (t: number) => {
                const b = 4; // Higher = more bounce
                return 1 - Math.pow(1 - t, 2) * Math.sin((t * Math.PI * b) * (1 - t));
            };
            const scaleValue = 0.05 + bounceEasing(introProgress) * 0.95;
            globeRef.current.scale.set(scaleValue, scaleValue, scaleValue);

            // Dramatic rotation with acceleration
            const rotationEase = THREE.MathUtils.smoothstep(introProgress, 0, 0.8);
            const rotationSpeed = 0.03 * rotationEase;
            globeRef.current.rotation.y += rotationSpeed;
            globeRef.current.rotation.x = Math.sin(introProgress * Math.PI * 2) * 0.2 * (1 - introProgress);

            // Dramatic pulsing glow effect
            if (sphereRef.current && sphereRef.current.material instanceof THREE.MeshPhysicalMaterial) {
                // Use multiple wave frequencies for richer effect
                const pulseWave = 0.3 + 0.15 * Math.sin(elapsedSeconds * 5) * (1 - introProgress);
                const secondaryPulse = 0.05 * Math.sin(elapsedSeconds * 12) * (1 - introProgress);
                const finalOpacity = THREE.MathUtils.lerp(pulseWave + secondaryPulse, 0.7, introProgress);
                sphereRef.current.material.opacity = finalOpacity; // Keep sphere opacity logic

                // Removed glowRef related animation logic
            }

            // Removed starburstRef animation logic entirely
        } else {
            // Regular animation after intro
            // Smooth auto-rotation with custom speed
            if (autoRotate.current) {
                globeRef.current.rotation.y += rotationSpeed * 0.005;
            }

            // Removed glowRef pulse effect logic
        }
    });

    // Handle mouse interactions
    const handlePointerDown = () => {
        autoRotate.current = false;
    };

    const handlePointerUp = () => {
        // Resume rotation after a delay
        setTimeout(() => {
            autoRotate.current = true;
        }, 1000);
    };

    // Speed up rotation when hovering
    const handlePointerOver = () => {
        setRotationSpeed(0.25);
        // setPulseIntensity(0.1); // Removed reference
    };

    const handlePointerOut = () => {
        setRotationSpeed(0.15);
        // setPulseIntensity(0); // Removed reference
    };

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                autoRotate.current = !autoRotate.current;
            }
            if (e.code === 'KeyR') {
                if (globeRef.current) {
                    globeRef.current.rotation.set(0, 0, 0);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Only render nodes if introProgress is sufficient and we're client-side mounted
    const shouldRenderNodes = mounted && introProgress > 0.7;

    // Initial rotation for intro effect
    const initialRotation = introProgress < 1 ?
        { x: Math.PI * 0.1 * (1 - introProgress), y: Math.PI * 0.2 * (1 - introProgress), z: 0 } :
        { x: 0, y: 0, z: 0 };

    return (
        <group
            ref={globeRef}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            rotation={[initialRotation.x, initialRotation.y, initialRotation.z]}
        >
            {/* Base globe sphere with custom shader */}
            <mesh ref={sphereRef}>
                <sphereGeometry args={[radius, 128, 128]} /> {/* Increased segments */}
                {/* Use the memoized material */}
                <primitive object={globeMaterial} attach="material" />
            </mesh>
            {/* Add Wireframe Overlay */}
            {/* Optional: Keep or remove wireframe based on desired aesthetic */}
            {/* <mesh geometry={sphereRef.current?.geometry}> 
                <meshBasicMaterial wireframe color="#3355AA" transparent opacity={0.08} /> 
            </mesh> */}

            {/* Removed atmospheric glow mesh (glowRef) */}

            {/* Outer atmosphere halo */}
            <mesh>
                <sphereGeometry args={[radius * 1.06, 32, 32]} />
                 {/* Use the memoized material */}
            <primitive object={haloMaterial} attach="material" />
        </mesh>

        {/* Remove UniversityNodes rendering */}
        {/* {mounted && ( ... )} */}

        {/* Removed Intro starburst effect */}

        {/* Removed Enhanced lighting */}
            {/* <ambientLight intensity={0.4} /> */}
            {/* <directionalLight position={[10, 10, 5]} intensity={1.2} color="#F2EFEA" /> */}
            {/* <pointLight position={[0, 0, 10]} intensity={1.5} color="#19B098" distance={20} /> */}
            {/* <pointLight position={[10, 5, 0]} intensity={1.3} color="#4E348F" distance={15} /> */}
            {/* <pointLight position={[-10, -5, 0]} intensity={1.3} color="#E85B39" distance={15} /> */}
        </group>
    );
}
