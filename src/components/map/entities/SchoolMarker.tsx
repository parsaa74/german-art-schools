import { Billboard, Text } from '@react-three/drei';
import { School } from '@/types';
import { MAP_CONFIG, COLORS, MATERIALS } from '@/lib/geo';
import { latLngToVector3 } from '@/lib/geo';
import { FONTS } from '@/utils/fonts';

interface SchoolMarkerProps {
  school: School;
}

export const SchoolMarker: React.FC<SchoolMarkerProps> = ({ school }) => {
  const position = latLngToVector3(
    school.lat,
    school.lng,
    MAP_CONFIG.radius + MAP_CONFIG.markerElevation
  );

  return (
    <group position={position} renderOrder={4}>
      <Billboard
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false}
      >
        {/* School icon */}
        <mesh renderOrder={4}>
          <circleGeometry args={[0.1, 32]} />
          <meshBasicMaterial
            color={COLORS.marker}
            transparent
            opacity={MATERIALS.marker.opacity}
            depthTest={false}
          />
        </mesh>

        {/* School name */}
        <Text
          position={[0, 0.15, 0]}
          fontSize={0.25}
          maxWidth={2}
          color={COLORS.text}
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.03}
          outlineColor={COLORS.textOutline}
          outlineOpacity={1}
          renderOrder={5}
          characters="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZäöüÄÖÜß"
          font={FONTS.INTER_REGULAR}
        >
          {school.name}
        </Text>
      </Billboard>
    </group>
  );
}; 