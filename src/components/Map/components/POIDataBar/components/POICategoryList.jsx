import React, { useState } from 'react';
import {
  POICategory,
  POICategoryHeader,
  POICategoryIcon,
  POICountBadge
} from '../styles/POIDataBarStyles';
import POIDetailItems from './POIDetailItems';
import { getMaxCount } from '../utils/poiDataManager';

const POICategoryList = ({
  sortedCategories,
  positionChanges,
  expandedCategories,
  highlightedCategories,
  poiCounts,
  pauseCountUpdates,
  visiblePOIs,
  showAllItems,
  getIconForCategory,
  getColorForCategory,
  renderDataSourceBadge,
  toggleCategory,
  toggleShowAllItems,
  handlePOIItemClick
}) => {
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Determine which categories to display
  const displayedCategories = showAllCategories
    ? sortedCategories
    : sortedCategories.slice(0, 3);
  return (
    <>
      {displayedCategories.map((category, index) => {
        // Determine animation and styling based on position and movement
        const positionClass = '';
        const moveClass = positionChanges[category]
          ? (positionChanges[category].moved === 'up' ? 'move-up' : 'move-down')
          : '';

        return (
          <POICategory
            key={category}
            className={`${positionClass} ${moveClass}`}
            style={{
              transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.8s ease',
              transform: `translateY(0)`,
              opacity: 1,
              position: 'relative',
              zIndex: sortedCategories.length - index, // Higher z-index for top categories
              animationDelay: `${index * 0.08}s`, // Slightly longer delay between items
              borderLeft: positionChanges[category] ?
                (positionChanges[category].moved === 'up' ? '4px solid rgba(50, 205, 50, 0.8)' : '4px solid rgba(255, 165, 0, 0.8)') :
                'none',
              boxShadow: positionChanges[category] ?
                '0 0 10px rgba(255, 255, 255, 0.2)' :
                'none',
            }}
          >
            <POICategoryHeader
              onClick={() => toggleCategory(category)}
              $isExpanded={expandedCategories[category]}
              style={{
                transition: 'background 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease',
                transform: expandedCategories[category] ? 'scale(1.02)' : 'scale(1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                // Add a glowing effect when the category is highlighted
                boxShadow: highlightedCategories[category]
                  ? `0 0 8px ${getColorForCategory(category)}80, inset 0 0 3px ${getColorForCategory(category)}80`
                  : 'none',
                borderLeft: highlightedCategories[category]
                  ? `4px solid ${getColorForCategory(category)}`
                  : positionChanges[category]
                    ? (positionChanges[category].moved === 'up' ? '4px solid rgba(50, 205, 50, 0.8)' : '4px solid rgba(255, 165, 0, 0.8)')
                    : 'none',
                // Make the background color slightly tinted with the category color when highlighted
                background: highlightedCategories[category]
                  ? `linear-gradient(90deg, rgba(30, 41, 59, 0.6) 0%, ${getColorForCategory(category)}15 100%)`
                  : 'rgba(30, 41, 59, 0.6)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                <POICategoryIcon>
                  {getIconForCategory(category)}
                </POICategoryIcon>
                <span>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                  {renderDataSourceBadge(category)}

                  {/* Position change indicator */}
                  {positionChanges[category] && (
                    <span style={{
                      fontSize: '10px',
                      marginLeft: '4px',
                      color: positionChanges[category].moved === 'up' ? 'rgba(50, 205, 50, 0.9)' : 'rgba(255, 165, 0, 0.9)',
                      fontWeight: 'bold',
                    }}>
                      {positionChanges[category].moved === 'up' ? '↑' : '↓'}
                      {Math.abs(positionChanges[category].currPos - positionChanges[category].prevPos)}
                    </span>
                  )}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <POICountBadge
                  color={getColorForCategory(category)}
                  count={poiCounts[category]}
                  isTopThree={false}
                  className={positionChanges[category] ? 'count-changed' : ''}
                  style={{
                    marginRight: '10px',
                    // Calculate width directly based on number of digits
                    width: (() => {
                      const count = poiCounts[category] || 0;
                      const numDigits = count.toString().length;
                      // Each digit gets ~8px + padding
                      return `${Math.max(32, (numDigits * 8) + 16)}px`;
                    })(),
                    // Add transition for smooth width changes
                    transition: 'width 0.5s ease-in-out, background-color 0.3s ease',
                    // Add a subtle indicator that counts are paused
                    opacity: pauseCountUpdates ? 0.9 : 1,
                    boxShadow: pauseCountUpdates ? 'inset 0 0 0 1px rgba(255, 255, 255, 0.3)' : 'none',
                  }}
                >
                  {poiCounts[category] || 0}
                </POICountBadge>

                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  width="16"
                  height="16"
                  style={{
                    transform: expandedCategories[category] ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease'
                  }}
                >
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </POICategoryHeader>

            {expandedCategories[category] && (
              <div style={{
                marginTop: '8px',
                paddingLeft: '12px',
                animation: 'slideDown 0.3s ease-out forwards',
                overflow: 'hidden',
              }}>
                <POIDetailItems
                  category={category}
                  items={visiblePOIs[category]}
                  showAllItems={showAllItems[category]}
                  toggleShowAllItems={toggleShowAllItems}
                  handlePOIItemClick={handlePOIItemClick}
                  getColorForCategory={getColorForCategory}
                />
              </div>
            )}
          </POICategory>
        );
      })}

      {/* Show More/Less button */}
      {sortedCategories.length > 3 && (
        <div
          style={{
            padding: '10px',
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: 'rgba(30, 41, 59, 0.5)',
            margin: '8px 0',
            borderRadius: '8px',
            transition: 'all 0.3s ease',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.3)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.5)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          onClick={() => setShowAllCategories(!showAllCategories)}
        >
          <span style={{ fontSize: '13px', fontWeight: '500' }}>
            {showAllCategories
              ? `Show Less (${sortedCategories.length - 3} less)`
              : `Show More (${sortedCategories.length - 3} more)`}
          </span>
        </div>
      )}
    </>
  );
};

export default POICategoryList;