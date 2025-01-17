'use client'

import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import AtmosphereMaterial from './shaders/AtmosphereMaterial'
import { audioSystem } from '../audio/AudioSystem'

interface AtmosphereProps {
    radius?: number
    scale?: number
}

export default function Atmosphere({ radius = 5, scale = 1.2 }: AtmosphereProps) {
    const materialRef = useRef<THREE.ShaderMaterial>(null)

    useFrame((state, delta) => {
        if (materialRef.current) {
            const uniforms = materialRef.current.uniforms
            if (uniforms.time) uniforms.time.value += delta * 0.5
            if (uniforms.cameraPosition) uniforms.cameraPosition.value.copy(state.camera.position)

            // Enhanced audio reactivity
            const intensity = audioSystem.getAudioIntensity()
            const bands = audioSystem.getFrequencyBands()
            
            if (uniforms.audioIntensity) uniforms.audioIntensity.value += (intensity * 0.2 - uniforms.audioIntensity.value) * 0.1
            if (uniforms.audioHighBand) uniforms.audioHighBand.value += (bands.high * 0.3 - uniforms.audioHighBand.value) * 0.1
            if (uniforms.audioMidBand) uniforms.audioMidBand.value += (bands.mid * 0.25 - uniforms.audioMidBand.value) * 0.1
            if (uniforms.audioLowBand) uniforms.audioLowBand.value += (bands.low * 0.2 - uniforms.audioLowBand.value) * 0.1

            // Dynamic color transitions
            const phase = Math.sin(uniforms.time.value * 0.2) * 0.5 + 0.5
            uniforms.atmosphereColor.value.lerp(new THREE.Color('#1a1a2e').lerp(new THREE.Color('#2a1a3e'), phase), 0.05)
            uniforms.rimColor.value.lerp(new THREE.Color('#4a4a8a').lerp(new THREE.Color('#6a4a9a'), phase), 0.05)
            uniforms.glowColor.value.lerp(new THREE.Color('#8a8aff').lerp(new THREE.Color('#aa8aff'), phase), 0.05)
        }
    })

    const material = new AtmosphereMaterial({
        uniforms: {
            time: { value: 0 },
            radius: { value: radius },
            atmosphereColor: { value: new THREE.Color('#1a1a2e') },
            rimColor: { value: new THREE.Color('#4a4a8a') },
            glowColor: { value: new THREE.Color('#8a8aff') },
            audioIntensity: { value: 0 },
            audioHighBand: { value: 0 },
            audioMidBand: { value: 0 },
            audioLowBand: { value: 0 },
            cameraPosition: { value: new THREE.Vector3() }
        }
    })

    return (
        <mesh scale={scale}>
            <sphereGeometry args={[radius, 64, 64]} />
            <primitive 
                ref={materialRef}
                object={material}
                attach="material"
                transparent
                depthWrite={false}
                opacity={0.6}
                side={THREE.BackSide}
            />
        </mesh>
    )
} 