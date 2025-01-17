import * as THREE from 'three';

export class ParticleFlowMaterial extends THREE.ShaderMaterial {
    constructor() {
        super({
            vertexShader: `
                uniform float time;
                uniform float flowSpeed;
                uniform float particleSize;
                
                attribute float random;
                attribute vec3 startPosition;
                attribute vec3 endPosition;
                
                varying float vAlpha;
                
                void main() {
                    float progress = mod(time * flowSpeed + random, 1.0);
                    
                    // Cubic bezier curve for smooth flow
                    vec3 midPoint = mix(startPosition, endPosition, 0.5) + vec3(0.0, 0.0, 1.0);
                    vec3 p1 = mix(startPosition, midPoint, progress);
                    vec3 p2 = mix(midPoint, endPosition, progress);
                    vec3 position = mix(p1, p2, progress);
                    
                    // Fade in/out based on progress
                    vAlpha = sin(progress * 3.14159);
                    
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                    gl_PointSize = particleSize * (1.0 / -mvPosition.z);
                }
            `,
            fragmentShader: `
                varying float vAlpha;
                uniform vec3 color;
                
                void main() {
                    float r = length(gl_PointCoord - vec2(0.5));
                    if (r > 0.5) discard;
                    
                    float glow = 0.5 - r;
                    gl_FragColor = vec4(color, vAlpha * glow);
                }
            `,
            uniforms: {
                time: { value: 0 },
                flowSpeed: { value: 0.2 },
                particleSize: { value: 4.0 },
                color: { value: new THREE.Color(0x88ccff) }
            },
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
    }
}

export default ParticleFlowMaterial; 