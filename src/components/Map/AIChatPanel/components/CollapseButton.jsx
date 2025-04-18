import React from 'react';
import styled from 'styled-components';

export const CollapseIconContainer = styled.div`
  position: absolute;
  left: ${props => props.$isCollapsed ? '10px' : '498px'};
  top: 65px;
  transform: none;
  z-index: 10;
  transition: left 0.3s ease;

  @media (max-width: 768px) {
    position: fixed;
    left: 50%;
    top: ${props => props.$isCollapsed ? 'auto' : 'calc(40vh - 28px)'};
    bottom: ${props => props.$isCollapsed ? '20px' : 'auto'};
    transform: translateX(-50%) ${props => props.$isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)'};
    z-index: 1001;
  }
`;

export const CollapseIcon = styled.div`
  width: 36px;
  height: 36px;
  background: rgba(0, 0, 0, 0.85);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: all 0.2s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);

  @media (max-width: 768px) {
    width: 56px;
    height: 56px;
    background: #1A1A1A;
    border-color: rgba(255, 255, 255, 0.2);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }

  svg {
    width: 20px;
    height: 20px;
    transform: rotate(${props => props.$isCollapsed ? '0deg' : '180deg'});
    transition: transform 0.3s ease;
  }

  &:hover {
    background: ${props => props.$isCollapsed ? 'rgba(0, 0, 0, 0.95)' : '#2A2A2A'};
    border-color: rgba(255, 255, 255, 0.3);
  }
`;

const CollapseButton = ({ isCollapsed, handleCollapseToggle }) => {
  return (
    <CollapseIconContainer $isCollapsed={isCollapsed}>
      <CollapseIcon 
        onClick={handleCollapseToggle}
        title={isCollapsed ? "Expand panel" : "Collapse panel"}
        $isCollapsed={isCollapsed}
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/>
        </svg>
      </CollapseIcon>
    </CollapseIconContainer>
  );
};

export default CollapseButton; 