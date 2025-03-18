import React from 'react';
import { SidePopup } from './SidePopup';

const MarkerCard = ({ marker, index, type }) => {
  const score = marker.properties?.score || 0;
  const opacity = 0.1 + (score / 100) * 0.8;
  const color = `rgba(255, 0, 217, ${opacity})`;
  
  return (
    <div 
      style={{ 
        marginBottom: '20px',
        padding: '15px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '6px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '10px'
      }}>
        <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
          {type} Site {index + 1}
        </div>
        <div style={{ 
          background: color,
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          Score: {score}
        </div>
      </div>
      <div style={{ 
        fontSize: '14px',
        lineHeight: '1.4',
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: '8px'
      }}>
        {marker.properties?.description || 'No description available'}
      </div>
      <div style={{ 
        fontSize: '12px',
        color: 'rgba(255, 255, 255, 0.6)'
      }}>
        Source: {marker.properties?.source || 'Unknown'}
      </div>
    </div>
  );
};

export const NeighborhoodPopup = ({ 
  selectedNeighborhood, 
  neighborhoodMarkers, 
  onClose 
}) => {
  if (!selectedNeighborhood || !neighborhoodMarkers) return null;

  return (
    <SidePopup
      title={selectedNeighborhood.name}
      subtitle={`${selectedNeighborhood.markerCount} Total Development Sites`}
      onClose={onClose}
    >
      {/* Show adaptive reuse sites first if any exist */}
      {neighborhoodMarkers.adaptiveReuse.length > 0 && (
        <div>
          <h3>Adaptive Reuse Sites ({neighborhoodMarkers.adaptiveReuse.length})</h3>
          {neighborhoodMarkers.adaptiveReuse.map((marker, index) => (
            <MarkerCard 
              key={`ar-${index}`}
              marker={marker}
              index={index}
              type="Adaptive Reuse"
            />
          ))}
        </div>
      )}
      
      {/* Show development potential sites */}
      {neighborhoodMarkers.development.length > 0 && (
        <div>
          <h3>Development Potential Sites ({neighborhoodMarkers.development.length})</h3>
          {neighborhoodMarkers.development.map((marker, index) => (
            <MarkerCard 
              key={`dev-${index}`}
              marker={marker}
              index={index}
              type="Development"
            />
          ))}
        </div>
      )}
    </SidePopup>
  );
}; 