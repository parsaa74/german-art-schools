import React, { useEffect, useRef } from 'react';
import { GermanyArtMap } from './MapSetup';
import styled from 'styled-components';

const MapContainer = styled.div`
  width: 100%;
  height: 100vh;
  background: #f0f0f0;
`;

export const MapComponent: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GermanyArtMap | null>(null);

  useEffect(() => {
    if (containerRef.current && !mapRef.current) {
      mapRef.current = new GermanyArtMap(containerRef.current);
      
      // Start animation loop
      const animate = () => {
        requestAnimationFrame(animate);
        mapRef.current?.controls.update();
        mapRef.current?.renderer.render(
          mapRef.current.scene, 
          mapRef.current.camera
        );
      };
      animate();
    }
  }, []);

  return <MapContainer ref={containerRef} />;
}; 