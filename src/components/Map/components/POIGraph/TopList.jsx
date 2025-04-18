import React, { useState, useCallback } from 'react';
import styled from 'styled-components';

const QualityButton = styled.button`
  background: transparent;
  color: white;
  border: none;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  opacity: ${props => props.$active ? 1 : 0.7};
  background-color: ${props => props.$active ? 'rgba(255, 255, 255, 0.1)' : 'transparent'};
  transition: all 0.2s;
  border-radius: 4px;
  position: relative;

  &:hover {
    opacity: 1;
    background-color: rgba(255, 255, 255, 0.1);
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const PercentInput = styled.input`
  background: transparent;
  border: none;
  color: white;
  width: 40px;
  font-size: 14px;
  text-align: center;
  padding: 0;
  margin: 0;
  outline: none;

  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  &[type=number] {
    -moz-appearance: textfield;
  }
`;

const QualityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '16px', height: '16px' }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const TopList = ({
  visible = true,
  onFilterChange,
  maxReviews = 100,
  maxRating = 5
}) => {
  // Quality level as a percentage (0-100)
  const [qualityLevel, setQualityLevel] = useState(0);
  const [isEditing, setIsEditing] = useState(false);

  // Calculate min rating and min reviews based on quality level
  const calculateFilters = useCallback((level) => {
    // Convert percentage to actual values
    const minRating = (level / 100) * maxRating;
    const minReviews = Math.floor((level / 100) * maxReviews);

    return { minRating, minReviews };
  }, [maxRating, maxReviews]);

  // Handle quality level change
  const handleQualityChange = useCallback((newLevel) => {
    // Ensure the value is between 0 and 100
    const clampedLevel = Math.max(0, Math.min(100, newLevel));
    setQualityLevel(clampedLevel);

    // Apply the filter
    if (onFilterChange) {
      const filters = calculateFilters(clampedLevel);
      onFilterChange(filters);
    }
  }, [onFilterChange, calculateFilters]);

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      setQualityLevel(value);
    }
  };

  // Handle input blur
  const handleInputBlur = () => {
    setIsEditing(false);
    handleQualityChange(qualityLevel);
  };

  // Handle input key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  };

  if (!visible) return null;

  return (
    <QualityButton $active={qualityLevel > 0} title="Set quality filter percentage">
      <QualityIcon />
      <PercentInput
        type="number"
        min="0"
        max="100"
        value={qualityLevel}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onKeyPress={handleKeyPress}
        onFocus={() => setIsEditing(true)}
      />
      %
    </QualityButton>
  );
};

export default TopList;
