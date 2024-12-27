import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapStore } from '@/stores/mapStore';
import { MAPBOX_TOKEN } from '@/config';

mapboxgl.accessToken = MAPBOX_TOKEN;

const Map: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { setMap } = useMapStore();

  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [10.4515, 51.1657],
      zoom: 5.5,
      bounds: [
        [5.866, 47.270],
        [15.042, 55.059],
      ],
      maxBounds: [
        [3.866, 45.270],
        [17.042, 57.059],
      ],
    });

    map.current.on('load', () => {
      if (!map.current) return;
      
      map.current.addSource('germany', {
        type: 'geojson',
        data: '/data/germany.geojson'
      });

      map.current.addLayer({
        id: 'germany-boundary',
        type: 'fill',
        source: 'germany',
        paint: {
          'fill-color': '#f0f0f0',
          'fill-opacity': 0.4
        }
      });

      setMap(map.current);
    });

    return () => {
      map.current?.remove();
    };
  }, [setMap]);

  return <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />;
};

export default Map; 