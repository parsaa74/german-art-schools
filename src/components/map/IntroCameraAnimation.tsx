import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3, PerspectiveCamera } from 'three'
import { useSpring, animated } from '@react-spring/three'
import { easeInOutCubic, easeInOutExpo } from '@/utils/easing'

interface IntroCameraAnimationProps {
    startPosition: [number, number, number]
    targetPosition: [number, number, number]
    startAnimations: boolean
    duration?: number
    delay?: number
    initialFov?: number
    targetFov?: number
    rotationAmplitude?: number
}

export function IntroCameraAnimation({
    startPosition,
    targetPosition,
    startAnimations,
    duration = 4000,
    delay = 1000,
    initialFov = 75,
    targetFov = 60,
    rotationAmplitude = 0.1
}: IntroCameraAnimationProps) {
    const cameraRef = useRef<PerspectiveCamera>()
    const progressRef = useRef(0)
    const startVec = new Vector3(...startPosition)
    const targetVec = new Vector3(...targetPosition)

    // Spring animation for smooth camera movement
    const { progress } = useSpring({
        from: { progress: 0 },
        to: { progress: startAnimations ? 1 : 0 },
        config: {
            duration,
            easing: easeInOutCubic
        },
        delay
    })

    // Spring animation for FOV
    const { fov } = useSpring({
        from: { fov: initialFov },
        to: { fov: startAnimations ? targetFov : initialFov },
        config: {
            duration: duration * 0.8, // Slightly faster than position animation
            easing: easeInOutExpo
        },
        delay: delay + duration * 0.1 // Start slightly after position animation
    })

    useFrame((state) => {
        if (!cameraRef.current) {
            cameraRef.current = state.camera as PerspectiveCamera
            cameraRef.current.fov = initialFov
            cameraRef.current.updateProjectionMatrix()
        }

        if (cameraRef.current && startAnimations) {
            // Interpolate between start and target positions
            const currentProgress = progress.get()
            progressRef.current = currentProgress

            const newPosition = new Vector3().lerpVectors(
                startVec,
                targetVec,
                currentProgress
            )

            // Apply position
            cameraRef.current.position.copy(newPosition)

            // Smooth rotation during zoom
            if (currentProgress > 0 && currentProgress < 1) {
                const rotationAngle = Math.sin(currentProgress * Math.PI) * rotationAmplitude
                cameraRef.current.rotation.z = rotationAngle
                
                // Add subtle x-axis rotation for more dynamism
                const xRotation = Math.sin(currentProgress * Math.PI * 2) * (rotationAmplitude * 0.5)
                cameraRef.current.rotation.x = xRotation
            }

            // Update FOV
            cameraRef.current.fov = fov.get()
            cameraRef.current.updateProjectionMatrix()

            // Ensure camera looks at center
            cameraRef.current.lookAt(0, 0, 0)
        }
    })

    return null
} 