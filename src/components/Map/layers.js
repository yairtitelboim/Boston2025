import { WHITE_PARTICLE_SIZE, WHITE_PARTICLE_OPACITY } from './constants';

export const particleLayers = {
  baseParticles: {
    id: 'particles',
    type: 'circle',
    source: 'particles',
    minzoom: 13,
    maxzoom: 20,
    paint: {
      'circle-radius': ['get', 'particleSize'],
      'circle-color': ['get', 'color'],
      'circle-opacity': [
        'match',
        ['get', 'type'],
        'trail', ['*', 0.8, ['get', 'opacity']],
        ['get', 'opacity']
      ],
      'circle-blur': [
        'match',
        ['get', 'type'],
        'trail', 0.8,
        0.5
      ]
    }
  },

  greenBuildingParticles: {
    id: 'green-building-particles',
    type: 'circle',
    source: 'green-building-particles',
    paint: {
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        8, ['*', ['get', 'particleSize'], 1.5],
        16, ['*', ['get', 'particleSize'], 1.1]
      ],
      'circle-color': ['get', 'color'],
      'circle-opacity': ['get', 'opacity'],
      'circle-blur': 0.2
    }
  },

  whiteRoadParticles: {
    id: 'white-road-particles',
    type: 'circle',
    source: 'white-road-particles',
    paint: {
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        8, ['*', ['get', 'particleSize'], 1.2],
        16, ['*', ['get', 'particleSize'], 0.8]
      ],
      'circle-color': ['get', 'color'],
      'circle-opacity': ['get', 'opacity'],
      'circle-blur': 0.2
    }
  },

  powerGridLines: {
    id: 'power-grid-main',
    type: 'line',
    source: 'power-grid-network',
    sourceLayer: 'road',
    paint: {
      'line-color': '#FFD966',
      'line-width': [
        'interpolate',
        ['linear'],
        ['zoom'],
        13, 3,
        16, 6
      ],
      'line-opacity': 0.7,
      'line-blur': [
        'interpolate',
        ['linear'],
        ['zoom'],
        13, 1,
        16, 2
      ]
    }
  }
};

export const buildingLayers = {
  buildings: {
    id: '3d-buildings',
    source: 'composite',
    'source-layer': 'building',
    type: 'fill-extrusion',
    minzoom: 12,
    paint: {
      'fill-extrusion-color': [
        'case',
        ['boolean', ['feature-state', 'inPowerGrid'], false],
        [
          'interpolate',
          ['linear'],
          ['feature-state', 'yellowIntensity'],
          0, '#8B7355',
          0.5, '#DAA520',
          1, '#f7db05'
        ],
        ['case',
          ['boolean', ['feature-state', 'isNegative'], false],
          '#380614',
          ['case',
            ['boolean', ['feature-state', 'isGreen'], false],
            '#51ff00',
            '#1a1a1a'
          ]
        ]
      ],
      'fill-extrusion-height': [
        'interpolate',
        ['linear'],
        ['zoom'],
        15, ['get', 'height'],
        16, ['*', ['get', 'height'], 0.95],
        17, ['*', ['get', 'height'], 0.9]
      ],
      'fill-extrusion-base': ['get', 'min_height'],
      'fill-extrusion-opacity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        15, 0.9,
        16, 0.85,
        17, 0.8
      ],
      'fill-extrusion-vertical-gradient': true,
      'fill-extrusion-ambient-occlusion-intensity': 0.3,
      'fill-extrusion-ambient-occlusion-radius': 3
    }
  }
}; 