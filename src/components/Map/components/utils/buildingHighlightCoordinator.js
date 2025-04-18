// Utility functions for coordinating building highlights and managing overlaps

const DISTANCE_THRESHOLD = 0.0001; // Approximately 10 meters in decimal degrees
const BASE_HEIGHT_OFFSET = 5;
const CATEGORY_HEIGHT_OFFSETS = {
    restaurants: 0,
    cafes: 1,
    bars: 2,
    shops: 3,
    cultural: 4,
    parks: 5,
    education: 6,
    healthcare: 7,
    transportation: 8
};

/**
 * Calculate distance between two coordinates in decimal degrees
 */
function calculateDistance(coord1, coord2) {
    const [lon1, lat1] = coord1;
    const [lon2, lat2] = coord2;
    return Math.sqrt(Math.pow(lon2 - lon1, 2) + Math.pow(lat2 - lat1, 2));
}

/**
 * Group nearby POIs together
 * @param {Array} pois Array of POIs with coordinates and category
 * @returns {Array} Array of POI groups
 */
function groupNearbyPOIs(pois) {
    const groups = [];
    const processed = new Set();

    pois.forEach((poi, index) => {
        if (processed.has(index)) return;

        const group = {
            center: poi.coordinates,
            categories: new Set([poi.category]),
            pois: [poi]
        };
        processed.add(index);

        // Find all POIs within threshold distance
        pois.forEach((otherPoi, otherIndex) => {
            if (processed.has(otherIndex)) return;
            
            const distance = calculateDistance(poi.coordinates, otherPoi.coordinates);
            if (distance <= DISTANCE_THRESHOLD) {
                group.categories.add(otherPoi.category);
                group.pois.push(otherPoi);
                processed.add(otherIndex);
            }
        });

        groups.push(group);
    });

    return groups;
}

/**
 * Calculate highlight parameters for a POI group
 * @param {Object} group POI group with categories and center coordinates
 * @returns {Object} Highlight parameters including height offset and color
 */
function calculateHighlightParams(group) {
    const categories = Array.from(group.categories);
    
    // If only one category, use its standard height offset
    if (categories.length === 1) {
        return {
            heightOffset: BASE_HEIGHT_OFFSET + CATEGORY_HEIGHT_OFFSETS[categories[0]] * 2,
            color: getColorForCategory(categories[0]),
            categories: categories
        };
    }

    // For multiple categories, use the highest height offset
    const maxHeightOffset = Math.max(...categories.map(cat => CATEGORY_HEIGHT_OFFSETS[cat]));
    
    // For multiple categories, blend the colors or use a special highlight
    return {
        heightOffset: BASE_HEIGHT_OFFSET + maxHeightOffset * 2,
        color: '#FFFFFF', // Use white for multi-category buildings
        categories: categories,
        isMultiCategory: true
    };
}

/**
 * Get color for a category (placeholder - should match your existing color scheme)
 */
function getColorForCategory(category) {
    const colors = {
        restaurants: '#ff9900',
        cafes: '#cc6600',
        bars: '#990099',
        shops: '#0066ff',
        cultural: '#cc3300',
        parks: '#33cc33',
        education: '#ff3333',
        healthcare: '#ff0000',
        transportation: '#10b981'
    };
    return colors[category] || '#888888';
}

/**
 * Coordinate building highlights to prevent z-fighting
 * @param {Array} pois Array of POIs to highlight
 * @returns {Array} Array of highlight instructions
 */
function coordinateHighlights(pois) {
    const groups = groupNearbyPOIs(pois);
    
    return groups.map((group, index) => {
        const params = calculateHighlightParams(group);
        return {
            id: `building-highlight-${index}`,
            coordinates: group.center,
            heightOffset: params.heightOffset,
            color: params.color,
            categories: Array.from(params.categories),
            isMultiCategory: params.isMultiCategory || false,
            originalPOIs: group.pois
        };
    });
}

export {
    coordinateHighlights,
    groupNearbyPOIs,
    calculateHighlightParams,
    DISTANCE_THRESHOLD,
    BASE_HEIGHT_OFFSET,
    CATEGORY_HEIGHT_OFFSETS
}; 