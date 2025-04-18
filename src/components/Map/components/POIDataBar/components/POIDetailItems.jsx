import React from 'react';
import {
  POIDetailItem,
  POIDetailTitle,
  POIDetailDescription,
  POIStatsBar
} from '../styles/POIDataBarStyles';

const POIDetailItems = ({
  category,
  items,
  showAllItems,
  toggleShowAllItems,
  handlePOIItemClick,
  getColorForCategory
}) => {
  const categoryColor = getColorForCategory(category);
  
  if (!items || items.length === 0) {
    return (
      <POIDetailItem 
        color="#6b7280"
        style={{ cursor: 'default' }}
      >
        <POIDetailTitle>No {category} in current view</POIDetailTitle>
        <POIDetailDescription>
          Try zooming out or panning the map to see more POIs.
        </POIDetailDescription>
      </POIDetailItem>
    );
  }
  
  // Show only first 3 items if not expanded
  const displayItems = showAllItems ? items : items.slice(0, 3);
  const hasMoreItems = items.length > 3;
  
  return (
    <>
      {displayItems.map(item => {
        const hasCoordinates = item.coordinates && Array.isArray(item.coordinates) && item.coordinates.length === 2;
        
        return (
          <POIDetailItem 
            key={item.id} 
            color={categoryColor} 
            onClick={hasCoordinates ? () => handlePOIItemClick(item) : undefined}
            style={!hasCoordinates ? { opacity: 0.7, cursor: 'default' } : {}}
          >
            <POIDetailTitle>
              {item.name}
              {hasCoordinates && (
                <span style={{ 
                  marginLeft: 'auto', 
                  fontSize: '12px', 
                  color: 'rgba(255,255,255,0.6)',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <svg 
                    viewBox="0 0 24 24" 
                    width="14" 
                    height="14" 
                    stroke="currentColor" 
                    fill="none" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="10" r="3" />
                    <path d="M12 21l-8-8a8 8 0 1 1 16 0l-8 8z" />
                  </svg>
                  <span style={{ marginLeft: '3px' }}>Locate</span>
                </span>
              )}
            </POIDetailTitle>
            <POIDetailDescription>
              {item.type} {item.rating ? `• Rating: ${item.rating}` : ''}
              {item.properties?.phone ? ` • ${item.properties.phone}` : ''}
              {!hasCoordinates && (
                <span style={{ 
                  display: 'block', 
                  marginTop: '4px', 
                  fontSize: '11px', 
                  fontStyle: 'italic', 
                  color: 'rgba(255,255,255,0.5)' 
                }}>
                  No location data available
                </span>
              )}
            </POIDetailDescription>
            {item.popularity && <POIStatsBar value={item.popularity} color={categoryColor} />}
          </POIDetailItem>
        );
      })}
      
      {/* Show/Hide more items button */}
      {hasMoreItems && (
        <div 
          onClick={(e) => toggleShowAllItems(category, e)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            marginTop: '6px',
            marginBottom: '4px',
            transition: 'background-color 0.2s ease',
            borderRadius: '6px',
            backgroundColor: 'rgba(255,255,255,0.05)',
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
        >
          {showAllItems ? (
            <>
              <span>Show Less</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ marginLeft: '6px' }}>
                <path d="M7 14l5-5 5 5z" />
              </svg>
            </>
          ) : (
            <>
              <span>Show All {items.length} Items</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ marginLeft: '6px' }}>
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default POIDetailItems; 