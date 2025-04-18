# Boston Map Visualization Application

## Overview

This application is a sophisticated interactive map visualization tool built on Mapbox GL JS, designed to display and analyze various data layers for the city of Boston. The application provides a rich set of features for visualizing Points of Interest (POIs), buildings, transportation networks, and other urban data layers.

## Core Components

### Main Map Component (`src/components/index.jsx`)

The central component of the application, responsible for initializing the Mapbox map and coordinating all other components. Key features include:

- Mapbox GL JS integration with custom styling
- Layer management for various data visualizations
- Camera controls for 3D navigation
- Integration with AI chat functionality
- Global state management for layer visibility

### Layer Toggle (`src/components/Map/components/LayerToggle.jsx`)

A comprehensive UI component that allows users to toggle the visibility of various map layers:

- Category-based organization of map layers
- Toggle switches for individual layers and categories
- Expandable/collapsible sections for better organization
- Integration with the layer state manager for persistent state
- Special handling for parks, transportation networks, and building layers

### POI Graph (`src/components/Map/components/POIGraph/index.jsx`)

A data visualization component that displays statistics about Points of Interest (POIs) in the current map view:

- Interactive scatter plot showing POI ratings vs. number of reviews
- Category filtering with color-coded legend
- Real-time updates as the map view changes
- Integration with building highlighting based on POI categories
- Toggle between Mapbox POI data and OpenStreetMap (OSM) data

### POI Data Bar (`src/components/Map/components/POIDataBar/POIDataBar.jsx`)

A sidebar component that displays categorized lists of POIs visible in the current map view:

- Categorized display of POIs with counts
- Expandable/collapsible categories
- Highlighting functionality for POIs on the map
- Integration with building highlighting
- Support for both Mapbox and OSM data sources

### Scene Manager (`src/components/Map/components/SceneManager.jsx`)

A powerful tool for saving and restoring map states, including layer visibility, camera position, and other settings:

- Save current map state as a named scene
- Load saved scenes to restore previous states
- Update existing scenes with new states
- Delete scenes that are no longer needed
- Edit scene names for better organization
- Global API for programmatic scene management

## Data Sources

The application uses multiple data sources:

1. **Mapbox Base Layers**: The foundation of the map, including streets, buildings, and basic POI data.
2. **OpenStreetMap (OSM) Data**: Additional POI data and specialized layers like bike paths, pedestrian networks, and transit routes.
3. **Boston Buildings Layer**: Custom 3D building data for Boston with POI category integration.
4. **Custom Data Layers**: Various specialized layers for urban analysis, including:
   - Property prices
   - Employment clusters
   - Planning analysis
   - Neighborhood boundaries
   - Parks and green spaces

## Key Features

### Layer Management

- Toggle visibility of individual layers and layer categories
- Persistent layer state across sessions
- Global layer state manager for coordinated updates
- Special handling for 3D buildings and POI markers

### POI Visualization

- Multiple visualization modes (markers, graph, data bar)
- Category-based filtering and highlighting
- Integration between POI data and building visualization
- Support for both Mapbox and OSM data sources

### Scene Management

- Save and restore complete map states
- Camera position tracking and restoration
- Layer visibility state persistence
- Global API for programmatic scene control

### UI Components

- Collapsible sidebars and panels
- Interactive data visualizations
- Category-based organization of controls
- Responsive design for different screen sizes

## Technical Architecture

The application is built with:

- **React**: For component-based UI
- **Mapbox GL JS**: For map rendering and interaction
- **Chart.js**: For data visualizations
- **Styled Components**: For component styling
- **Custom Event Bus**: For cross-component communication
- **Local Storage**: For persisting scenes and settings

## Layer Categories

The application organizes map layers into several categories:

1. **Transportation**:
   - Roads
   - Public Transit (routes and stops)
   - Bike Network (lanes, paths, parking)
   - Pedestrian Network (paths, crossings)

2. **Buildings**:
   - Boston Buildings (with POI category integration)
   - Mapbox 3D Buildings

3. **Points of Interest (POIs)**:
   - Mapbox POIs
   - OSM POIs (with category filtering)

4. **Urban Analysis**:
   - Property Prices
   - Employment Clusters
   - Planning Analysis
   - Neighborhood Boundaries
   - Parks and Green Spaces
   - Zoning Data

## Usage Guidelines

### Layer Toggle

- Use the "Map Layers" panel to toggle visibility of different data layers
- Expand categories to access sublayers
- Use the "Toggle All Layers" option to quickly show or hide all layers

### POI Visualization

- Toggle POI markers on the map using the layer controls
- Open the POI Graph to see statistical visualizations of POI data
- Use the POI Data Bar to browse categorized lists of POIs
- Filter POIs by category using the legend in the POI Graph

### Scene Management

- Access the Scene Manager through the "Saved Scenes" option in the layer panel
- Save the current map state with a descriptive name
- Click on a saved scene to restore its state
- Update scenes with new states as needed
- Delete scenes that are no longer needed

## Implementation Notes

- The application uses a global layer state manager to coordinate layer visibility across components
- Scene management integrates with this layer state manager for consistent state restoration
- POI data is processed in real-time as the map view changes
- Building colors are dynamically updated based on POI category visibility
- The application supports both 2D and 3D visualization modes

## Future Enhancements

Potential areas for improvement include:

1. Enhanced data filtering capabilities
2. Additional visualization types for POI and urban data
3. Improved performance for large datasets
4. More detailed building information display
5. Integration with additional data sources
6. Advanced search functionality
7. User accounts for saving and sharing scenes
8. Mobile-optimized interface
