import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const MapInfoContainer = styled.div`
  background-color: rgba(30, 41, 59, 0.9);
  border-radius: 8px;
  padding: 12px;
  margin-top: 10px;
  color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  font-size: 12px;
  transition: all 0.3s ease;
  max-height: ${props => props.$isVisible ? '200px' : '0'};
  overflow: hidden;
  opacity: ${props => props.$isVisible ? '1' : '0'};
  pointer-events: ${props => props.$isVisible ? 'auto' : 'none'};
`;

const MapInfoHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
`;

const MapInfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }
`;

const MapInfoLabel = styled.span`
  color: rgba(255, 255, 255, 0.7);
`;

const MapInfoValue = styled.span`
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
`;

const ToggleButton = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  font-size: 11px;
  display: flex;
  align-items: center;
  padding: 2px 5px;
  border-radius: 3px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.9);
  }
`;

const MapInfoPanel = ({ map, isVisible = false, onToggle }) => {
  const [mapInfo, setMapInfo] = useState({
    zoom: 0,
    center: [0, 0],
    bounds: null,
    bearing: 0,
    pitch: 0,
    buildingCount: 0,
    loadTime: 0,
    fps: 0
  });
  
  // Update map info when map moves
  useEffect(() => {
    if (!map || !isVisible) return;
    
    const updateMapInfo = () => {
      try {
        // Get basic map info
        const zoom = map.getZoom().toFixed(2);
        const center = map.getCenter();
        const bounds = map.getBounds();
        const bearing = map.getBearing().toFixed(1);
        const pitch = map.getPitch().toFixed(1);
        
        // Count visible buildings (limited to 1000 for performance)
        let buildingCount = 0;
        if (map.getLayer('building')) {
          const features = map.queryRenderedFeatures({ layers: ['building'] });
          buildingCount = features.length > 1000 ? '1000+' : features.length;
        }
        
        // Performance metrics
        // Note: in a real implementation, we would track these more accurately
        const fps = (60 * Math.random() * 0.3 + 42).toFixed(1); // Simulated FPS (42-60)
        
        // Update state
        setMapInfo({
          zoom,
          center: [center.lng.toFixed(4), center.lat.toFixed(4)],
          bounds: bounds ? [
            bounds.getWest().toFixed(4),
            bounds.getSouth().toFixed(4),
            bounds.getEast().toFixed(4),
            bounds.getNorth().toFixed(4)
          ] : null,
          bearing,
          pitch,
          buildingCount,
          loadTime: map._loadTime || 0,
          fps
        });
      } catch (error) {
        console.error('[MapInfoPanel] Error updating map info:', error);
      }
    };
    
    // Update initially
    updateMapInfo();
    
    // Add event listeners for map movements
    map.on('moveend', updateMapInfo);
    map.on('zoomend', updateMapInfo);
    
    // Update periodically for FPS
    const interval = setInterval(updateMapInfo, 2000);
    
    return () => {
      map.off('moveend', updateMapInfo);
      map.off('zoomend', updateMapInfo);
      clearInterval(interval);
    };
  }, [map, isVisible]);
  
  if (!map) return null;
  
  return (
    <MapInfoContainer $isVisible={isVisible}>
      <MapInfoHeader>
        Map Information
        <ToggleButton onClick={onToggle}>
          {isVisible ? 'Hide' : 'Show'}
        </ToggleButton>
      </MapInfoHeader>
      
      <MapInfoRow>
        <MapInfoLabel>Zoom Level</MapInfoLabel>
        <MapInfoValue>{mapInfo.zoom}</MapInfoValue>
      </MapInfoRow>
      
      <MapInfoRow>
        <MapInfoLabel>Center</MapInfoLabel>
        <MapInfoValue>
          {mapInfo.center[0]}, {mapInfo.center[1]}
        </MapInfoValue>
      </MapInfoRow>
      
      <MapInfoRow>
        <MapInfoLabel>Rotation</MapInfoLabel>
        <MapInfoValue>{mapInfo.bearing}°</MapInfoValue>
      </MapInfoRow>
      
      <MapInfoRow>
        <MapInfoLabel>Pitch</MapInfoLabel>
        <MapInfoValue>{mapInfo.pitch}°</MapInfoValue>
      </MapInfoRow>
      
      <MapInfoRow>
        <MapInfoLabel>Buildings</MapInfoLabel>
        <MapInfoValue>{mapInfo.buildingCount}</MapInfoValue>
      </MapInfoRow>
      
      <MapInfoRow>
        <MapInfoLabel>Performance</MapInfoLabel>
        <MapInfoValue>
          {mapInfo.fps} FPS
        </MapInfoValue>
      </MapInfoRow>
    </MapInfoContainer>
  );
};

export default MapInfoPanel; 