// Layer IDs for OSM data
export const osmLayerIds = {
    publicTransit: {
        stops: 'osm-transit-stops',
        routes: 'osm-transit-routes'
    },
    bikeInfra: {
        lanes: 'osm-bike-lanes',
        paths: 'osm-bike-paths',
        parking: 'osm-bike-parking'
    },
    pedestrian: {
        paths: 'osm-pedestrian-paths',
        crossings: 'osm-pedestrian-crossings'
    }
};

// LA bounds for data validation
const LA_BOUNDS = {
    north: 34.3373,
    south: 33.7037,
    east: -118.1553,
    west: -118.6682
};

// Layer styles
const styles = {
    publicTransit: {
        stops: {
            type: 'circle',
            paint: {
                'circle-radius': 2,
                'circle-color': '#9B59B6'
            }
        },
        routes: {
            type: 'line',
            paint: {
                'line-color': '#9B59B6',
                'line-width': 2,
                'line-opacity': 0.8
            }
        }
    },
    bikeInfra: {
        lanes: {
            type: 'line',
            paint: {
                'line-color': '#2ECC71',
                'line-width': 2,
                'line-dasharray': [2, 1]
            }
        },
        paths: {
            type: 'line',
            paint: {
                'line-color': '#27AE60',
                'line-width': 3
            }
        },
        parking: {
            type: 'symbol',
            layout: {
                'icon-image': 'bicycle-15',
                'icon-size': 1,
                'icon-allow-overlap': true
            },
            paint: {
                'icon-opacity': 0.8,
                'icon-color': '#2ECC71'
            }
        }
    },
    pedestrian: {
        paths: {
            type: 'line',
            paint: {
                'line-color': '#E67E22',
                'line-width': 2,
                'line-opacity': 0.7
            }
        },
        crossings: {
            type: 'circle',
            paint: {
                'circle-radius': 1.5,
                'circle-color': '#D35400',
                'circle-stroke-width': 0.5,
                'circle-stroke-color': '#ffffff'
            }
        }
    }
};

export async function loadOSMData(map) {
    console.log('Loading LA OSM transit data...');
    
    // Log current map center and bounds
    const center = map.getCenter();
    const bounds = map.getBounds();
    console.log('Current map center:', center);
    console.log('Current map bounds:', bounds);
    
    // Remove existing layers if they exist
    Object.values(osmLayerIds).forEach(category => {
        Object.values(category).forEach(layerId => {
            if (map.getLayer(layerId)) {
                console.log(`Removing existing layer: ${layerId}`);
                map.removeLayer(layerId);
            }
            if (map.getSource(layerId)) {
                console.log(`Removing existing source: ${layerId}`);
                map.removeSource(layerId);
            }
        });
    });

    try {
        // Load each GeoJSON file and add as a layer
        for (const [category, subcategories] of Object.entries(styles)) {
            for (const [subcategory, style] of Object.entries(subcategories)) {
                const categoryMap = {
                    'publicTransit': 'public_transit',
                    'bikeInfra': 'bike_infrastructure',
                    'pedestrian': 'pedestrian'
                };
                
                const mappedCategory = categoryMap[category] || category.toLowerCase();
                // Update filename to use LA data
                const filename = `/data/osm/la_${mappedCategory}_${subcategory}.geojson`;
                const layerId = osmLayerIds[category][subcategory];
                
                console.log(`Loading ${filename}...`);
                
                try {
                    const response = await fetch(filename);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const geojson = await response.json();
                    
                    if (!geojson || !geojson.features) {
                        console.warn(`Invalid GeoJSON data in ${filename}`);
                        continue;
                    }

                    // Validate features are within LA bounds
                    const validFeatures = geojson.features.filter(feature => {
                        if (!feature.geometry || !feature.geometry.coordinates) return false;
                        
                        const coords = feature.geometry.coordinates;
                        let lon, lat;
                        
                        if (feature.geometry.type === 'Point') {
                            [lon, lat] = coords;
                        } else if (feature.geometry.type === 'LineString') {
                            // Use first point of line for bounds check
                            [lon, lat] = coords[0];
                        } else {
                            return true; // Accept other geometry types for now
                        }
                        
                        return (
                            lat >= LA_BOUNDS.south && 
                            lat <= LA_BOUNDS.north && 
                            lon >= LA_BOUNDS.west && 
                            lon <= LA_BOUNDS.east
                        );
                    });

                    console.log(`Found ${geojson.features.length} total features in ${filename}`);
                    console.log(`${validFeatures.length} features are within LA bounds`);
                    
                    if (validFeatures.length === 0) {
                        console.warn(`No features within LA bounds in ${filename}`);
                        continue;
                    }

                    // Update geojson with filtered features
                    geojson.features = validFeatures;
                    
                    // Add source
                    map.addSource(layerId, {
                        type: 'geojson',
                        data: geojson
                    });
                    
                    // Add layer with styling
                    map.addLayer({
                        id: layerId,
                        source: layerId,
                        type: style.type,
                        layout: {
                            visibility: 'none',
                            ...(style.layout || {})
                        },
                        paint: style.paint
                    });
                    
                    // Log the bounds of the added features
                    const featureBounds = getBoundingBox(validFeatures);
                    console.log(`Layer ${layerId} bounds:`, featureBounds);
                    
                    console.log(`Successfully loaded ${layerId}`);
                } catch (error) {
                    console.warn(`Failed to load ${filename}:`, error);
                }
            }
        }
        
        console.log('Finished loading OSM data');
    } catch (error) {
        console.error('Error loading OSM data:', error);
    }
}

// Helper function to calculate bounding box of features
function getBoundingBox(features) {
    let bounds = {
        north: -90,
        south: 90,
        east: -180,
        west: 180
    };
    
    features.forEach(feature => {
        if (!feature.geometry || !feature.geometry.coordinates) return;
        
        const coords = feature.geometry.coordinates;
        let points = [];
        
        if (feature.geometry.type === 'Point') {
            points = [coords];
        } else if (feature.geometry.type === 'LineString') {
            points = coords;
        }
        
        points.forEach(([lon, lat]) => {
            bounds.north = Math.max(bounds.north, lat);
            bounds.south = Math.min(bounds.south, lat);
            bounds.east = Math.max(bounds.east, lon);
            bounds.west = Math.min(bounds.west, lon);
        });
    });
    
    return bounds;
}

export function toggleOSMLayer(map, category, subcategory, visible, color = null) {
    const layerId = osmLayerIds[category][subcategory];
    console.log(`Attempting to toggle ${layerId} to ${visible ? 'visible' : 'hidden'}`);
    
    try {
        if (!map.getLayer(layerId)) {
            console.warn(`Layer ${layerId} not found, attempting to reload OSM data...`);
            loadOSMData(map).then(() => {
                if (map.getLayer(layerId)) {
                    updateLayerVisibility(map, layerId, visible, color);
                } else {
                    console.error(`Failed to load layer ${layerId}`);
                }
            });
            return;
        }
        
        updateLayerVisibility(map, layerId, visible, color);
    } catch (error) {
        console.error(`Error toggling layer ${layerId}:`, error);
    }
}

function updateLayerVisibility(map, layerId, visible, color = null) {
    // Update visibility
    map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
    
    // Update color if provided
    if (color) {
        const layer = map.getLayer(layerId);
        if (layer.type === 'line') {
            map.setPaintProperty(layerId, 'line-color', color);
        } else if (layer.type === 'circle') {
            map.setPaintProperty(layerId, 'circle-color', color);
        } else if (layer.type === 'symbol') {
            map.setPaintProperty(layerId, 'icon-color', color);
        }
    }
    
    console.log(`${layerId} visibility set to ${visible}, color: ${color || 'unchanged'}`);
} 