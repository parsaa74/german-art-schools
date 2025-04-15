import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { LineMaterial } from 'three-stdlib';
import * as THREE from 'three';

// --- START: AnimatedLine Component ---
interface AnimatedLineProps {
    points: [THREE.Vector3, THREE.Vector3];
    startColor?: THREE.Color | string | number;
    endColor?: THREE.Color | string | number;
    lineWidth?: number;
    opacity?: number;
    animationDuration?: number; 
}

function AnimatedLine({ 
    points,
    startColor = '#1E90FF', 
    endColor = '#00FFFF',
    lineWidth = 1.5,
    opacity = 0.7,
    animationDuration = 0.6 
}: AnimatedLineProps) {
    const lineRef = useRef<any>(null);
    const materialRef = useRef<LineMaterial>(null);
    const progress = useRef(0);
    const lineLength = useMemo(() => points[0].distanceTo(points[1]), [points]);
    const { size } = useThree();
    const resolutionVec = useMemo(() => new THREE.Vector2(size.width, size.height), [size.width, size.height]);

    useFrame((_state, delta) => {
        if (progress.current < 1 && lineRef.current && materialRef.current) {
            progress.current += delta / animationDuration;
            progress.current = Math.min(progress.current, 1); 
            materialRef.current.dashOffset = lineLength * (1 - progress.current);
            materialRef.current.needsUpdate = true; 
        }
    });

    return (
        <Line
            ref={lineRef}
            points={points}
            color={"white"}
            lineWidth={lineWidth}
            transparent
            opacity={opacity}
            dashed={true}    
            dashSize={lineLength} 
            gapSize={lineLength} 
        >
            <lineMaterialImpl 
                ref={materialRef}
                vertexColors={true}
                linewidth={lineWidth} 
                transparent={true}
                opacity={opacity}
                dashed={true}
                dashSize={lineLength}
                gapSize={lineLength}
                dashOffset={lineLength} 
                resolution={resolutionVec} 
                blending={THREE.AdditiveBlending}
            />
        </Line>
    );
}
// --- END: AnimatedLine Component ---

interface ConnectionLinesProps {
    points: Array<[THREE.Vector3, THREE.Vector3]>;
}

export default function ConnectionLines({ points }: ConnectionLinesProps) {
    if (!points || points.length === 0) {
        return null; 
    }
    
    return (
        <group>
            {points.map((pair, i) => (
                <AnimatedLine
                    key={`line-${i}`}
                    points={pair}
                />
            ))}
        </group>
    );
} 