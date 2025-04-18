import { HARBOR_COLORS, WATER_STYLE } from '../constants';

export const initializeHarborLayers = async (map) => {
    if (!map) return;

    // Wait for style to be loaded
    if (!map.isStyleLoaded()) {
        await new Promise(resolve => {
            map.once('style.load', resolve);
        });
    }

    try {
        // Add terrain source
        if (!map.getSource('mapbox-dem')) {
            map.addSource('mapbox-dem', {
                'type': 'raster-dem',
                'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
                'tileSize': 512,
                'maxzoom': 14
            });
        }

        // Add 3D terrain
        map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });

        // Style water
        if (map.getLayer('water')) {
            map.setPaintProperty('water', 'fill-color', WATER_STYLE.color);
            map.setPaintProperty('water', 'fill-opacity', WATER_STYLE.opacity);
        }

        // Style waterways
        if (map.getLayer('waterway')) {
            map.setPaintProperty('waterway', 'line-color', WATER_STYLE.color);
            map.setPaintProperty('waterway', 'line-opacity', WATER_STYLE.opacity);
        }

        // Add custom harbor layers
        await Promise.all([
            addHarborBuildings(map),
            addPiers(map),
            addBridges(map),
            addNavigationMarkers(map)
        ]);
    } catch (error) {
        console.error('Error initializing harbor layers:', error);
    }
};

const addHarborBuildings = async (map) => {
    if (!map.getLayer('harbor-buildings-3d')) {
        map.addLayer({
            'id': 'harbor-buildings-3d',
            'source': 'composite',
            'source-layer': 'building',
            'filter': ['==', 'extrude', 'true'],
            'type': 'fill-extrusion',
            'minzoom': 13,
            'paint': {
                'fill-extrusion-color': HARBOR_COLORS.BUILDINGS,
                'fill-extrusion-height': [
                    'interpolate', ['linear'], ['zoom'],
                    13, 0,
                    13.05, ['get', 'height']
                ],
                'fill-extrusion-base': [
                    'interpolate', ['linear'], ['zoom'],
                    13, 0,
                    13.05, ['get', 'min_height']
                ],
                'fill-extrusion-opacity': 0.8
            }
        });
    }
};

const addPiers = async (map) => {
    if (!map.getLayer('harbor-piers')) {
        map.addLayer({
            'id': 'harbor-piers',
            'source': 'composite',
            'source-layer': 'structure',
            'filter': ['==', ['get', 'type'], 'pier'],
            'type': 'fill-extrusion',
            'paint': {
                'fill-extrusion-color': HARBOR_COLORS.PIERS,
                'fill-extrusion-height': 3,
                'fill-extrusion-base': 0,
                'fill-extrusion-opacity': 0.9
            }
        });
    }
};

const addBridges = async (map) => {
    if (!map.getLayer('harbor-bridges')) {
        map.addLayer({
            'id': 'harbor-bridges',
            'source': 'composite',
            'source-layer': 'road',
            'filter': ['==', ['get', 'structure'], 'bridge'],
            'type': 'fill-extrusion',
            'paint': {
                'fill-extrusion-color': HARBOR_COLORS.BRIDGES,
                'fill-extrusion-height': 15,
                'fill-extrusion-base': 5,
                'fill-extrusion-opacity': 0.9
            }
        });
    }
};

const addNavigationMarkers = async (map) => {
    if (!map.getLayer('harbor-navigation')) {
        map.addLayer({
            'id': 'harbor-navigation',
            'source': 'composite',
            'source-layer': 'marine_label',
            'type': 'symbol',
            'layout': {
                'icon-image': 'harbor-marker',
                'icon-size': 1.2,
                'text-field': ['get', 'name'],
                'text-offset': [0, 1.5],
                'text-anchor': 'top',
                'text-size': 12
            },
            'paint': {
                'text-color': '#ffffff',
                'text-halo-color': '#000000',
                'text-halo-width': 1
            }
        });
    }
};

export const updateHarborLighting = (map, time) => {
    if (!map || !map.isStyleLoaded()) return;
    
    const lightIntensity = calculateLightIntensity(time);
    
    if (map.getLayer('harbor-buildings-3d')) {
        map.setPaintProperty(
            'harbor-buildings-3d',
            'fill-extrusion-opacity',
            lightIntensity
        );
    }
};

const calculateLightIntensity = (time) => {
    const hour = typeof time === 'number' ? time : new Date().getHours();
    const baseIntensity = 0.6;
    const peakIntensity = 1.0;
    const midDay = 12;
    const intensity = baseIntensity + (peakIntensity - baseIntensity) * 
        (1 - Math.abs(hour - midDay) / midDay);
    
    return Math.max(baseIntensity, Math.min(peakIntensity, intensity));
}; 