import { useState, useEffect } from 'react';
import { Feature, FeatureCollection, Polygon } from 'geojson';

export interface StateFeature extends Feature<Polygon> {
  properties: {
    name: string;
    id: string;
  };
}

export interface GermanyGeoJSON extends FeatureCollection {
  features: StateFeature[];
}

export const useGermanyMap = () => {
  const [geoData, setGeoData] = useState<GermanyGeoJSON | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMapData = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching map data...');
        
        // Try both possible file names
        let response = await fetch('/germany-states.json');
        if (!response.ok) {
          console.log('Trying alternate file...');
          response = await fetch('/germany.json');
        }
        
        if (!response.ok) {
          console.error('Failed to load map data:', {
            status: response.status,
            statusText: response.statusText,
            url: response.url
          });
          throw new Error(`Failed to load map data: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Validate the data structure
        if (!data.type || data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
          console.error('Invalid GeoJSON format:', data);
          throw new Error('Invalid GeoJSON format');
        }

        // Validate each feature
        data.features.forEach((feature: StateFeature, index: number) => {
          if (!feature.properties?.id || !feature.properties?.name) {
            throw new Error(`Invalid state data at index ${index}`);
          }
          if (!feature.geometry?.coordinates || !Array.isArray(feature.geometry.coordinates[0])) {
            throw new Error(`Invalid geometry data for state ${feature.properties.name}`);
          }
        });

        // Log the loaded data for debugging
        console.log('Loaded GeoJSON data:', {
          type: data.type,
          featureCount: data.features.length,
          features: data.features.map((f: StateFeature) => ({
            id: f.properties.id,
            name: f.properties.name,
            coordinates: f.geometry.coordinates[0].length
          }))
        });

        setGeoData(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load map data';
        console.error('Error in useGermanyMap:', err);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadMapData();
  }, []);

  return { geoData, isLoading, error };
}; 