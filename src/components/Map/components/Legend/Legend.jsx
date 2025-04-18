import React from 'react';
import styled from 'styled-components';

// Set debug logging flag - disabled in production
const DEBUG_LOGGING = false;

// Helper function for logging that checks DEBUG_LOGGING flag
const log = (...args) => {
  if (DEBUG_LOGGING) {
    console.log(...args);
  }
};

// Styled components with proper prop filtering
const LegendContainer = styled.div`
  padding: 10px;
`;

const CategoryItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px;
  cursor: pointer;
  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
`;

const CategoryName = styled.span`
  margin-right: 10px;
`;

const CategoryCount = styled.span`
  color: #666;
`;

const Legend = ({ categories, onToggleCategory }) => {
  // Only log once when component mounts
  React.useEffect(() => {
    log('Legend: Component mounted with', categories?.length, 'categories');
  }, []);

  if (!categories?.length) {
    return null;
  }

  return (
    <LegendContainer className="map-legend">
      {categories.map(category => (
        <CategoryItem
          key={category.categoryKey}
          onClick={() => onToggleCategory(category.categoryKey)}
        >
          <CategoryName>{category.name}</CategoryName>
          <CategoryCount>{category.count}</CategoryCount>
        </CategoryItem>
      ))}
    </LegendContainer>
  );
};

export default Legend; 