import { useCallback, useRef, useEffect } from 'react';
import * as turf from '@turf/turf';

const PARTICLE_CONFIG = {
  baseCount: 400,  // Keep the same number of particles
  baseSpeed: 0.0004,  // Keep the same speed
  colors: {
    low: '#ff9800',    // Orange
    medium: '#f57c00', // Dark Orange
    high: '#e65100',   // Deep Orange
    extreme: '#bf360c' // Very Deep Orange
  }
};

export const useAIConsensusAnimation = (map, isVisible, mockData) => {
  const animationFrame = useRef(null);
  const particles = useRef([]);

  const initializeParticleLayer = useCallback(() => {
    if (!map.current) return;

    // Remove existing layer and source if they exist
    if (map.current.getLayer('ai-consensus-particles')) {
      map.current.removeLayer('ai-consensus-particles');
    }
    if (map.current.getSource('ai-consensus-particles')) {
      map.current.removeSource('ai-consensus-particles');
    }

    // Add new source
    map.current.addSource('ai-consensus-particles', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });

    // Add particle layer
    map.current.addLayer({
      'id': 'ai-consensus-particles',
      'type': 'circle',
      'source': 'ai-consensus-particles',
      'paint': {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, 4,  // Increased base size
          15, 6,  // Increased medium size
          20, 8   // Increased max size
        ],
        'circle-color': [
          'interpolate',
          ['linear'],
          ['get', 'disagreement'],
          0.8, PARTICLE_CONFIG.colors.low,
          0.85, PARTICLE_CONFIG.colors.medium,
          0.9, PARTICLE_CONFIG.colors.high,
          0.95, PARTICLE_CONFIG.colors.extreme
        ],
        'circle-opacity': 0.95,
        'circle-blur': 0.2
      }
    });
  }, []);

  const generateParticlesInZip = useCallback((feature, modelData) => {
    console.log('[AI Animation] Generating particles for ZIP:', feature.properties.Zip_Code);
    if (!map.current || !modelData?.disagreement) {
      console.log('[AI Animation] Cannot generate particles - missing map or model data');
      return [];
    }

    const zipParticles = [];
    const polygon = feature.geometry;
    const bbox = turf.bbox(polygon);
    const particleCount = Math.floor(PARTICLE_CONFIG.baseCount * modelData.disagreement);
    
    console.log('[AI Animation] Attempting to generate', particleCount, 'particles');
    
    // Generate random points within the ZIP code polygon
    for (let i = 0; i < particleCount; i++) {
      let point;
      let attempts = 0;
      const maxAttempts = 50;

      // Try to generate a point within the polygon
      do {
        const x = bbox[0] + (Math.random() * (bbox[2] - bbox[0]));
        const y = bbox[1] + (Math.random() * (bbox[3] - bbox[1]));
        point = turf.point([x, y]);
        attempts++;
      } while (!turf.booleanPointInPolygon(point, polygon) && attempts < maxAttempts);

      if (turf.booleanPointInPolygon(point, polygon)) {
        zipParticles.push({
          type: 'Feature',
          properties: {
            disagreement: modelData.disagreement,
            speed: PARTICLE_CONFIG.baseSpeed * (0.8 + Math.random() * 0.4),
            angle: Math.random() * Math.PI * 2,
            radius: 0.0005 + (Math.random() * 0.001), // Increased radius by 5x
            centerLng: point.geometry.coordinates[0],
            centerLat: point.geometry.coordinates[1],
            zipCode: feature.properties.Zip_Code
          },
          geometry: {
            type: 'Point',
            coordinates: point.geometry.coordinates
          }
        });
      }
    }

    console.log('[AI Animation] Generated', zipParticles.length, 'particles for ZIP', feature.properties.Zip_Code);
    return zipParticles;
  }, []);

  const generateParticles = useCallback((zipFeatures) => {
    console.log('[AI Animation] Starting particle generation for', zipFeatures.length, 'ZIP codes');
    const allParticles = [];

    zipFeatures.forEach(feature => {
      const zipCode = feature.properties.Zip_Code;
      const modelData = mockData[zipCode];

      if (modelData?.disagreement) {
        const zipParticles = generateParticlesInZip(feature, modelData);
        allParticles.push(...zipParticles);
      }
    });

    console.log('[AI Animation] Generated total of', allParticles.length, 'particles');
    return allParticles;
  }, [mockData, generateParticlesInZip]);

  const animate = useCallback(() => {
    if (!map.current || !isVisible) return;

    const source = map.current.getSource('ai-consensus-particles');
    if (!source) return;

    const time = Date.now() * PARTICLE_CONFIG.baseSpeed;
    const updatedFeatures = particles.current.map(particle => {
      const {
        angle,
        speed,
        radius,
        centerLng,
        centerLat
      } = particle.properties;

      // Calculate new position in a circular motion
      const newAngle = angle + (time * speed);
      const x = centerLng + Math.cos(newAngle) * radius;
      const y = centerLat + Math.sin(newAngle) * radius;

      return {
        ...particle,
        geometry: {
          ...particle.geometry,
          coordinates: [x, y]
        }
      };
    });

    source.setData({
      type: 'FeatureCollection',
      features: updatedFeatures
    });

    animationFrame.current = requestAnimationFrame(animate);
  }, [isVisible]);

  // Initialize particles when visibility changes
  useEffect(() => {
    if (!map.current) return;

    if (isVisible) {
      // Initialize layer if needed
      if (!map.current.getSource('ai-consensus-particles')) {
        initializeParticleLayer();
      }

      // Get ZIP code data and generate particles
      const zipSource = map.current.getSource('zipcodes');
      if (!zipSource) return;

      // Get the data directly from the source
      const zipData = zipSource._data;
      particles.current = generateParticles(zipData.features);

      // Update particle source with initial positions
      const source = map.current.getSource('ai-consensus-particles');
      if (source) {
        source.setData({
          type: 'FeatureCollection',
          features: particles.current
        });
      }

      // Start animation
      map.current.setLayoutProperty('ai-consensus-particles', 'visibility', 'visible');
      animate();
    } else {
      // Stop animation and hide layer
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
        animationFrame.current = null;
      }
      if (map.current.getLayer('ai-consensus-particles')) {
        map.current.setLayoutProperty('ai-consensus-particles', 'visibility', 'none');
      }
    }

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
        animationFrame.current = null;
      }
    };
  }, [isVisible, initializeParticleLayer, generateParticles, animate]);

  return {
    initializeParticleLayer,
    generateParticles
  };
}; 