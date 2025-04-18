import * as turf from '@turf/turf';

// Track highlighted layers for proper cleanup
const highlightedLayers = new Set();
// Track which POIs have been highlighted to prevent duplicates
const highlightedLocations = new Map();
// Height offset incrementer to prevent z-fighting
let currentHeightOffset = 0;

// Constants for building highlighting
const HIGHLIGHT_HEIGHT_MULTIPLIER = 1.3; // Make buildings 30% taller for better visibility
const MIN_BUILDING_HEIGHT = 40; // Default building height if none is provided
const SOURCE_PREFIX = 'highlight-source-';
const LAYER_PREFIX = 'highlight-layer-';
const Z_INDEX_BASE = 10; // Higher z-index to ensure our highlights appear above other layers

/**
 * Clear all existing building highlights
 */
function clearAllHighlights(map) {
    if (!map) return;

    console.log('Clearing all highlight layers...');

    // Remove all highlight layers
    highlightedLayers.forEach(layerId => {
        if (map.getLayer(layerId)) {
            map.removeLayer(layerId);
        }

        // Also remove the associated source
        const sourceId = layerId.replace(LAYER_PREFIX, SOURCE_PREFIX);
        if (map.getSource(sourceId)) {
            map.removeSource(sourceId);
        }
    });

    // Reset tracking variables
    highlightedLayers.clear();
    highlightedLocations.clear();
    currentHeightOffset = 0;
}

/**
 * Check if the 3D buildings layer exists and is visible
 */
const ensureBuildingsLayerExists = (map) => {
    if (!map) return false;

    // Check for any of the possible building layers
    const buildingLayers = ['3d-buildings', 'buildings-3d-layer', 'osm-buildings-3d', 'boston-buildings'];
    let foundLayer = false;
    let visibleLayer = false;

    for (const layerId of buildingLayers) {
        if (map.getLayer(layerId)) {
            foundLayer = true;
            const visibility = map.getLayoutProperty(layerId, 'visibility');
            if (visibility !== 'none') {
                visibleLayer = true;
                console.log(`Found visible building layer: ${layerId}`);
                break;
            }
        }
    }

    if (!foundLayer) {
        console.warn('No 3D buildings layers exist');
        return false;
    }

    if (!visibleLayer) {
        console.warn('3D buildings layers exist but none are visible');
        return false;
    }

    return true;
};

/**
 * Helper function to validate coordinates
 */
const isValidCoordinate = (coord) => {
    return Array.isArray(coord) &&
           coord.length === 2 &&
           !isNaN(coord[0]) &&
           !isNaN(coord[1]) &&
           Math.abs(coord[0]) <= 180 &&
           Math.abs(coord[1]) <= 90;
};

/**
 * Get the building data at a specific coordinate
 */
const getBuildingAtCoordinate = (map, coordinate) => {
    if (!map || !coordinate) return null;

    try {
        // Project the coordinate to pixel space
        const point = map.project(coordinate);
        const width = 20; // Slightly larger area to search
        const height = 20;

        // First try with 3d-buildings layer
        if (map.getLayer('3d-buildings')) {
            const features = map.queryRenderedFeatures(
                [
                    [point.x - width / 2, point.y - height / 2],
                    [point.x + width / 2, point.y + height / 2]
                ],
                { layers: ['3d-buildings'] }
            );

            // Return the first building found
            if (features.length > 0) {
                console.log('Found building in 3d-buildings layer');
                return features[0];
            }
        }

        // Fallback: try querying the building source layer directly
        const buildingFeatures = map.queryRenderedFeatures(
            [
                [point.x - width / 2, point.y - height / 2],
                [point.x + width / 2, point.y + height / 2]
            ],
            { sourceLayer: 'building' }
        );

        if (buildingFeatures.length > 0) {
            console.log('Found building in building source layer');
            return buildingFeatures[0];
        }
    } catch (error) {
        console.error('Error getting building at coordinate:', error);
    }

    return null;
};

/**
 * Create valid GeoJSON for a building
 */
const createValidBuildingGeoJSON = (building, heightMultiplier = HIGHLIGHT_HEIGHT_MULTIPLIER, color = '#FF4136') => {
    if (!building || !building.geometry) {
        console.warn('Invalid building data provided');
        return null;
    }

    try {
        // Get the building geometry
        const buildingGeometry = building.geometry;

        // Create a simplified polygon to avoid rendering issues
        let validFeature;

        if (buildingGeometry.type === 'Polygon') {
            // Get the coordinates and ensure they're valid
            const coordinates = buildingGeometry.coordinates;
            if (!Array.isArray(coordinates) || !coordinates.length) {
                return null;
            }

            // Filter out invalid coordinates and simplify to reduce complexity
            const validCoordinates = coordinates[0].filter(isValidCoordinate);
            if (validCoordinates.length < 3) {
                return null;
            }

            // Create a simplified version of the polygon
            const simplifiedPolygon = turf.simplify(
                turf.polygon([validCoordinates]),
                { tolerance: 0.0001, highQuality: true }
            );

            // Set height from properties or default
            const baseHeight = building.properties?.height || MIN_BUILDING_HEIGHT;
            const minHeight = building.properties?.base_height || 0;

            validFeature = {
                type: 'Feature',
                properties: {
                    height: baseHeight * heightMultiplier,
                    base_height: minHeight,
                    color: color,
                    zindex: Z_INDEX_BASE + currentHeightOffset
                },
                geometry: simplifiedPolygon.geometry
            };
        } else if (buildingGeometry.type === 'MultiPolygon') {
            // For MultiPolygon, create a buffer instead to avoid rendering issues
            const center = turf.center(building);
            const buffered = turf.buffer(center, 30, { units: 'meters' });

            const baseHeight = building.properties?.height || MIN_BUILDING_HEIGHT;
            const minHeight = building.properties?.base_height || 0;

            validFeature = {
                type: 'Feature',
                properties: {
                    height: baseHeight * heightMultiplier,
                    base_height: minHeight,
                    color: color,
                    zindex: Z_INDEX_BASE + currentHeightOffset
                },
                geometry: buffered.geometry
            };
        } else {
            console.warn('Unsupported building geometry type:', buildingGeometry.type);
            return null;
        }

        return {
            type: 'FeatureCollection',
            features: [validFeature]
        };
    } catch (error) {
        console.error('Error creating valid building GeoJSON:', error);
        return null;
    }
};

/**
 * Enhanced function to highlight POI buildings using actual building geometry
 * @param {Object} map - Mapbox map instance
 * @param {Array} pois - Array of POIs to highlight
 * @param {Function} onComplete - Callback when all highlights are complete
 */
function highlightPOIBuildings(map, pois, onComplete) {
    if (!map || !pois || pois.length === 0) {
        console.warn('Cannot highlight POIs: Invalid parameters');
        return 0;
    }

    // Check if 3D buildings are available
    const has3DBuildings = ensureBuildingsLayerExists(map);
    if (!has3DBuildings) {
        console.warn('3D buildings layer not available, using fallback highlighting method');

        // Try to enable any building layers that might exist but are hidden
        const buildingLayers = ['3d-buildings', 'buildings-3d-layer', 'osm-buildings-3d', 'boston-buildings'];
        let enabledAnyLayer = false;

        for (const layerId of buildingLayers) {
            if (map.getLayer(layerId)) {
                try {
                    map.setLayoutProperty(layerId, 'visibility', 'visible');
                    console.log(`Enabled building layer: ${layerId}`);
                    enabledAnyLayer = true;
                } catch (err) {
                    console.error(`Error enabling ${layerId}:`, err);
                }
            }
        }

        // If we enabled any layer, try again after a short delay
        if (enabledAnyLayer) {
            console.log('Enabled building layers, retrying highlight after delay');
            setTimeout(() => {
                highlightPOIBuildings(map, pois, onComplete);
            }, 300);
            return 0;
        }
    }

    // Clear existing highlights
    clearAllHighlights(map);
    console.log(`Starting to highlight ${pois.length} POIs`);

    // Calculate a unique location key to prevent duplicate highlights
    const getLocationKey = (coordinates) => {
        return `${coordinates[0].toFixed(5)},${coordinates[1].toFixed(5)}`;
    };

    // Group POIs by location to prevent duplicate highlights
    const uniqueLocations = new Map();

    pois.forEach(poi => {
        if (!poi.coordinates || !Array.isArray(poi.coordinates) || poi.coordinates.length !== 2) {
            console.warn('Skipping POI with invalid coordinates');
            return;
        }

        const locationKey = getLocationKey(poi.coordinates);

        if (!uniqueLocations.has(locationKey)) {
            uniqueLocations.set(locationKey, {
                coordinates: poi.coordinates,
                categories: new Set(),
                color: poi.color || '#FF4136'
            });
        }

        // Add the category
        if (poi.category) {
            uniqueLocations.get(locationKey).categories.add(poi.category);
        }
    });

    console.log(`Grouped into ${uniqueLocations.size} unique locations for highlighting`);

    // Process each unique location
    let highlightCount = 0;
    uniqueLocations.forEach((location, locationKey) => {
        // Skip if already highlighted
        if (highlightedLocations.has(locationKey)) {
            return;
        }

        // Mark this location as highlighted
        highlightedLocations.set(locationKey, true);

        // Increment height offset for z-fighting prevention
        currentHeightOffset += 10;

        // Create source and layer IDs
        const sourceId = `${SOURCE_PREFIX}${highlightCount}`;
        const layerId = `${LAYER_PREFIX}${highlightCount}`;
        highlightedLayers.add(layerId);

        // When 3D buildings are available, try to highlight the actual building
        if (has3DBuildings) {
            // Try to get the building at this location
            const building = getBuildingAtCoordinate(map, location.coordinates);

            if (building) {
                console.log(`Found building at ${locationKey}`);

                // Create valid GeoJSON for the building
                const buildingGeoJSON = createValidBuildingGeoJSON(building, HIGHLIGHT_HEIGHT_MULTIPLIER, location.color);

                if (buildingGeoJSON) {
                    try {
                        // Add source with building shape
                        map.addSource(sourceId, {
                            type: 'geojson',
                            data: buildingGeoJSON
                        });

                        // Add a prominent extrusion layer
                        map.addLayer({
                            id: layerId,
                            type: 'fill-extrusion',
                            source: sourceId,
                            layout: {
                                visibility: 'visible'
                            },
                            paint: {
                                'fill-extrusion-color': location.color,
                                'fill-extrusion-height': ['get', 'height'],
                                'fill-extrusion-base': ['get', 'base_height'],
                                'fill-extrusion-opacity': 0.9,
                                'fill-extrusion-vertical-gradient': true,
                                'fill-extrusion-translate': [0, 0],
                                'fill-extrusion-translate-anchor': 'viewport'
                            }
                        });

                        highlightCount++;
                        return;
                    } catch (error) {
                        console.error(`Error creating building highlight at ${locationKey}:`, error);
                        // Continue to fallback
                    }
                }
            }
        }

        // Fallback to buffer method if no building is found or there's an error
        createBufferHighlight(map, location, highlightCount);
        highlightCount++;
    });

    if (onComplete) {
        onComplete(highlightCount);
    }

    return highlightCount;
}

/**
 * Fallback method to create a highlight using a buffer around the POI
 */
function createBufferHighlight(map, location, index) {
    const sourceId = `${SOURCE_PREFIX}${index}`;
    const layerId = `${LAYER_PREFIX}${index}`;
    highlightedLayers.add(layerId);

    try {
        // Create a prominent buffer around the point
        const point = turf.point(location.coordinates);
        const buffered = turf.buffer(point, 40, { units: 'meters' });

        // Add source
        map.addSource(sourceId, {
            type: 'geojson',
            data: buffered
        });

        // Add a visually distinctive extrusion layer
        map.addLayer({
            id: layerId,
            type: 'fill-extrusion',
            source: sourceId,
            layout: {
                visibility: 'visible'
            },
            paint: {
                'fill-extrusion-color': location.color,
                'fill-extrusion-height': 2000 + currentHeightOffset,
                'fill-extrusion-base': 0,
                'fill-extrusion-opacity': 0.85,
                'fill-extrusion-vertical-gradient': true,
                // Ensure our highlight is visually prominent
                'fill-extrusion-translate': [0, 0],
                'fill-extrusion-translate-anchor': 'viewport'
            }
        });

        console.log(`Created buffer highlight for location at index ${index}`);
    } catch (error) {
        console.error(`Error creating buffer highlight at index ${index}:`, error);
    }
}

export {
    highlightPOIBuildings,
    clearAllHighlights
};