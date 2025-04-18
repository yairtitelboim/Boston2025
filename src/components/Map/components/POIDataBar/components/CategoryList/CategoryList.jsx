import React from 'react';
import CategoryItem from '../CategoryItem/CategoryItem';
import { POIDataContent } from '../../styles/POIDataBarStyles';

const CategoryList = ({ 
  sortedCategories,
  positionChanges,
  expandedCategories,
  highlightedCategories,
  poiCounts,
  visiblePOIs,
  pauseCountUpdates,
  getColorForCategory,
  toggleCategory,
  getMaxCount
}) => {
  return (
    <POIDataContent>
      {sortedCategories.map((category, index) => (
        <CategoryItem
          key={category}
          category={category}
          index={index}
          positionChange={positionChanges[category]}
          isExpanded={expandedCategories[category]}
          isHighlighted={highlightedCategories[category]}
          count={poiCounts[category]}
          visiblePOIs={visiblePOIs[category]}
          isPaused={pauseCountUpdates}
          color={getColorForCategory(category)}
          onToggle={() => toggleCategory(category)}
          maxCount={getMaxCount()}
          totalCategories={sortedCategories.length}
        />
      ))}
    </POIDataContent>
  );
};

export default CategoryList; 