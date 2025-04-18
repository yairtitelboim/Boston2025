// Function to toggle POI marker visibility
export const togglePOIMarkerVisibility = (event, map, arePOIMarkersVisible, setArePOIMarkersVisible, setShowPOIMarkers, setShowOSMPOIs) => {
  // Prevent event propagation
  event.stopPropagation();
  
  // Toggle the visibility state
  const newVisibilityState = !arePOIMarkersVisible;
  setArePOIMarkersVisible(newVisibilityState);
  
  // Handle visibility directly through the map
  if (map?.current) {
    try {
      console.log(`Direct map manipulation to set POI markers visibility: ${newVisibilityState}`);
      
      // Find and toggle native Mapbox POI layers
      const mapboxPOILayers = map.current.getStyle().layers.filter(layer => 
        (layer.id.includes('poi') || layer.id.includes('label') || layer.id.includes('symbol')) && 
        !layer.id.includes('road') && !layer.id.includes('highway') && !layer.id.includes('building')
      );
      
      // Find OSM POI layers (through pattern matching)
      const osmPOILayers = map.current.getStyle().layers.filter(layer => 
        layer.id.includes('osm-poi') || 
        layer.id.includes('poi-osm') || 
        layer.id.match(/poi-.+-layer/)
      );
      
      // Combined list of all POI related layers
      const poiLayers = [...mapboxPOILayers, ...osmPOILayers];
      
      console.log(`Found ${poiLayers.length} POI layers to toggle visibility`);
      
      // Toggle visibility for all POI layers
      poiLayers.forEach(layer => {
        try {
          map.current.setLayoutProperty(
            layer.id,
            'visibility',
            newVisibilityState ? 'visible' : 'none'
          );
          console.log(`Set visibility of ${layer.id} to ${newVisibilityState ? 'visible' : 'none'}`);
        } catch (e) {
          console.warn(`Could not set visibility for layer ${layer.id}:`, e);
        }
      });
      
      // For parent component state consistency, call the setters if provided
      if (setShowPOIMarkers) {
        setShowPOIMarkers(newVisibilityState);
      }
      
      if (setShowOSMPOIs) {
        // We'll update the state but not trigger the data reload
        // by calling the setter directly
        setShowOSMPOIs(newVisibilityState);
      }
    } catch (e) {
      console.error("Error toggling POI visibility:", e);
    }
  }
  
  console.log(`POI markers visibility set to: ${newVisibilityState ? 'visible' : 'hidden'} (data collection unaffected)`);
};

// Function to highlight all POIs from all expanded categories
export const highlightAllActivePOIs = (
  allBuildingsHighlighted,
  setAllBuildingsHighlighted,
  setPauseCountUpdates,
  visiblePOIs,
  activeBuildingHighlightRef,
  removeCategoryHighlights,
  setHighlightedCategories,
  highlightCategoryPOIs,
  highlightedCategories
) => {
  // Toggle the state
  const newHighlightState = !allBuildingsHighlighted;
  setAllBuildingsHighlighted(newHighlightState);
  
  // Toggle pausing of count updates to match highlight state
  setPauseCountUpdates(newHighlightState);
  
  if (newHighlightState) {
    // Get all categories with visible POIs
    const visibleCategories = Object.keys(visiblePOIs).filter(cat => 
      visiblePOIs[cat]?.length > 0
    );
    
    if (visibleCategories.length === 0) {
      console.log("No categories with POIs to highlight");
      return;
    }
    
    // First, clear any individual highlight
    if (activeBuildingHighlightRef.current) {
      activeBuildingHighlightRef.current.remove();
      activeBuildingHighlightRef.current = null;
    }
    
    // Clear any existing category highlights to avoid duplicates
    removeCategoryHighlights();
    
    // Track total POIs and highlights
    let totalPOIs = 0;
    
    // Simply call highlightCategoryPOIs for each category with POIs
    console.log(`Starting highlight process for ${visibleCategories.length} categories...`);
    visibleCategories.forEach(category => {
      // Count total POIs
      totalPOIs += visiblePOIs[category]?.length || 0;
      
      // Set this category as highlighted in the UI
      setHighlightedCategories(prev => ({
        ...prev,
        [category]: true
      }));
      
      // Use the existing category highlighting function without expanding the category
      highlightCategoryPOIs(category);
    });
    
    console.log(`Highlight all initiated: targeting ${totalPOIs} POIs across ${visibleCategories.length} categories`);
    
  } else {
    // Remove all category highlights
    console.log("Clearing all category highlights");
    removeCategoryHighlights();
    
    // Reset highlighted categories
    const resetHighlightedCategories = {};
    Object.keys(highlightedCategories).forEach(cat => {
      resetHighlightedCategories[cat] = false;
    });
    setHighlightedCategories(resetHighlightedCategories);
  }
}; 