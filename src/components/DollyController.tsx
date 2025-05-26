import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface DollyControllerProps {
    onComplete: () => void
    targetPosition?: THREE.Vector3
    targetLookAt?: THREE.Vector3
    lerpAlpha?: number
}

export function DollyController({ 
    onComplete, 
    targetPosition = new THREE.Vector3(0, 0, 0),
    targetLookAt = new THREE.Vector3(0, 0, 0),
    lerpAlpha = 0.005,
}: DollyControllerProps) {
    const { camera } = useThree()
    const target = useRef(targetPosition.clone())

    // Initialize camera once
    useEffect(() => {
        // Starting camera position can be whatever is set in Canvas
        console.log('DollyController mounted, starting lerp')
    }, [])

    useFrame(() => {
        // Lerp position
        camera.position.lerp(target.current, lerpAlpha)
        camera.lookAt(targetLookAt)

        // Check if close to target
        if (camera.position.distanceTo(target.current) < 0.5) {
            // Snap to exact target
            camera.position.copy(target.current)
            camera.lookAt(targetLookAt)
            console.log('DollyController reached target')
            onComplete()
        }
    })

    return null
} 