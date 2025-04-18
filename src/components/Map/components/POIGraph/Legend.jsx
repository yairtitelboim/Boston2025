import React from 'react';
import styled from 'styled-components';
import { getColorForCategory } from '../POIDataBar/utils/poiDataManager';

const LegendContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  margin-top: auto;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  flex-wrap: wrap; /* Allow wrapping for more categories */
  justify-content: center; /* Center items when wrapped */
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  opacity: ${props => props.$isActive ? 1 : 0.3};
  transition: all 0.2s ease;
  padding: 4px 8px;
  border-radius: 4px;
  background: ${props => props.$isActive && props.$isOnlyVisible ? 'rgba(255, 255, 255, 0.15)' : 'transparent'};
  font-weight: ${props => props.$isOnlyVisible ? 'bold' : 'normal'};

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const ColorDot = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${props => props.color};
  margin-right: 6px;
`;

const CategoryName = styled.span`
  color: white;
  font-size: 12px;
`;

const CategoryCount = styled.span`
  color: rgba(255, 255, 255, 0.7);
  font-size: 11px;
  margin-left: 4px;
`;

const Legend = ({ categories, onToggleCategory, visibleCategories }) => {
  const handleToggle = (category) => {
    onToggleCategory(category);
  };

  // Filter out any categories that should be skipped in the legend
  const filteredCategories = categories.filter(category => {
    // Skip categories with skipInCustomLegend flag
    return !category.skipInCustomLegend;
  });

  const renderCategory = (category) => {
    const categoryKey = category.name.toLowerCase();
    const isActive = visibleCategories[categoryKey];

    // Check if this category is the only visible one
    const isOnlyVisibleCategory = Object.entries(visibleCategories).every(([cat, isVisible]) =>
      cat === categoryKey ? isVisible : !isVisible
    );

    return (
      <LegendItem
        key={category.name}
        $isActive={isActive}
        $isOnlyVisible={isOnlyVisibleCategory}
        onClick={() => handleToggle(category.name)}
      >
        <ColorDot color={getColorForCategory(categoryKey)} />
        <CategoryName>{category.name}</CategoryName>
        <CategoryCount>{category.count}</CategoryCount>
      </LegendItem>
    );
  };

  return (
    <LegendContainer>
      {filteredCategories.map(renderCategory)}
    </LegendContainer>
  );
};

export default Legend;