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
        
        const possibleFiles = ['/germany-states.json', '/germany.json', '/de-states.json'];
        let response = null;
        let loadedFile = '';

        // Try all possible file names
        for (const file of possibleFiles) {
          try {
            const res = await fetch(file);
            if (res.ok) {
              response = res;
              loadedFile = file;
              break;
            }
          } catch (e) {
            console.warn(`Failed to load ${file}:`, e);
          }
        }
        
        if (!response) {
          throw new Error(`Failed to load map data. Tried: ${possibleFiles.join(', ')}`);
        }

        console.log(`Successfully loaded map data from: ${loadedFile}`);
        
        const data = await response.json();
        
        // Validate the data structure
        if (!data.type || data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
          console.error('Invalid GeoJSON format:', data);
          throw new Error('Invalid GeoJSON format: Missing required FeatureCollection structure');
        }

        // Validate each feature with detailed error messages
        data.features.forEach((feature: StateFeature, index: number) => {
          if (!feature.properties) {
            throw new Error(`Missing properties for feature at index ${index}`);
          }
          if (!feature.properties.id) {
            throw new Error(`Missing id for state at index ${index}`);
          }
          if (!feature.properties.name) {
            throw new Error(`Missing name for state ${feature.properties.id}`);
          }
          if (!feature.geometry) {
            throw new Error(`Missing geometry for state ${feature.properties.name}`);
          }
          if (!feature.geometry.coordinates || !Array.isArray(feature.geometry.coordinates[0])) {
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