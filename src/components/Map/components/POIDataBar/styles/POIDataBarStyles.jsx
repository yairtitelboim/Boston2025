import styled, { createGlobalStyle } from 'styled-components';

// Create global styles for animations and transitions
export const GlobalStyle = createGlobalStyle`
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideIn {
    from { transform: translateX(-20px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  @keyframes slideDown {
    from { max-height: 0; opacity: 0; }
    to { max-height: 1000px; opacity: 1; }
  }

  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
    70% { box-shadow: 0 0 0 10px rgba(255, 255, 255, 0); }
    100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
  }

  @keyframes move-up {
    0% { transform: translateY(0); }
    20% { transform: translateY(-5px); }
    100% { transform: translateY(0); }
  }

  @keyframes move-down {
    0% { transform: translateY(0); }
    20% { transform: translateY(5px); }
    100% { transform: translateY(0); }
  }

  .move-up {
    animation: move-up 0.8s ease;
  }

  .move-down {
    animation: move-down 0.8s ease;
  }

  .count-changed {
    animation: pulse 0.6s ease-in-out;
  }
`;

// Main container
export const POIContainer = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  width: ${props => (props.$isCollapsed ? '50px' : '300px')};
  background-color: rgba(15, 23, 42, 0.9);
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  color: white;
  overflow: hidden;
  transition: width 0.3s ease, height 0.3s ease;
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 100; /* Increased z-index to ensure it's above all map elements */
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
`;

// Header styles
export const POIHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: rgba(30, 41, 59, 0.8);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

export const POITitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
`;

// Buttons
export const CollapseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

export const POIOptionsMenuButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

// Options Menu
export const POIOptionsMenu = styled.div`
  position: absolute;
  top: 50px;
  right: 20px;
  width: 180px;
  background-color: rgba(30, 41, 59, 0.95);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  z-index: 20;
  animation: fadeIn 0.2s ease-out;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

// Categories container
export const POICategories = styled.div`
  overflow-y: auto;
  padding: 12px;
  flex-grow: 1;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background-color: rgba(255, 255, 255, 0.4);
  }
`;

// Category styles
export const POICategory = styled.div`
  margin-bottom: 8px;
  background-color: rgba(30, 41, 59, 0.5);
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  animation: slideIn 0.3s ease-out forwards;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
`;

export const POICategoryHeader = styled.div`
  padding: 10px 14px;
  cursor: pointer;
  font-weight: 500;
  transform-origin: center;
  user-select: none;
  background-color: ${props => props.$isExpanded ? 'rgba(30, 41, 59, 0.8)' : 'rgba(30, 41, 59, 0.6)'};
`;

export const POICategoryIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-right: 10px;
  font-size: 16px;
`;

// Badge for POI counts
export const POICountBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 3px ${props => props.$isTotal ? '16px' : '8px'};
  background-color: ${props => props.$isTotal ? 'transparent' : (props.color || '#3b82f6')};
  color: white;
  border-radius: 12px;
  font-size: ${props => props.$isTotal ? '16px' : '11px'};
  font-weight: ${props => props.$isTotal ? '700' : '600'};
  height: 22px;
  border: ${props => props.$isTotal ? '1px solid rgba(255, 255, 255, 0.8)' : 'none'};
  box-shadow: ${props => props.$isTotal
    ? '0 0 10px rgba(255, 255, 255, 0.15)'
    : '0 1px 3px rgba(0, 0, 0, 0.2)'};
  transition: all 0.3s ease;

  /* Dynamic width based on content */
  width: ${props => {
    if (props.$isTotal) return 'auto';
    const count = props.children?.toString() || '';
    const numDigits = count.length;
    const digitWidth = 8; // Approximate width of each digit
    const padding = 16; // Padding (8px on each side)
    return `${Math.max(32, (numDigits * digitWidth) + padding)}px`;
  }};

  &:hover {
    transform: ${props => props.$isTotal ? 'scale(1.08)' : 'scale(1.05)'};
    border-color: ${props => props.$isTotal ? 'rgba(255, 255, 255, 1)' : 'none'};
    box-shadow: ${props => props.$isTotal
      ? '0 0 15px rgba(255, 255, 255, 0.25)'
      : '0 2px 4px rgba(0, 0, 0, 0.25)'};
  }
`;

// Detail item styles
export const POIDetailItem = styled.div`
  padding: 10px;
  margin-bottom: 6px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.2s ease;
  background-color: rgba(30, 41, 59, 0.5);
  border-left: 3px solid ${props => props.color || '#3b82f6'};

  &:hover {
    background-color: rgba(30, 41, 59, 0.8);
    transform: translateX(2px);
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

export const POIDetailTitle = styled.div`
  font-weight: 500;
  margin-bottom: 4px;
  font-size: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const POIDetailDescription = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// Stats bar for popularity
export const POIStatsBar = styled.div`
  height: 4px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  margin-top: 6px;
  overflow: hidden;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${props => `${props.value || 0}%`};
    background-color: ${props => props.color || '#3b82f6'};
    border-radius: 2px;
  }
`;

// Footer
export const POIFooter = styled.div`
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 8px;
  background-color: rgba(30, 41, 59, 0.8);
`;

export default {
  POIContainer,
  POIHeader,
  POITitle,
  POICategories,
  CollapseButton,
  GlobalStyle,
  POIFooter,
  POIOptionsMenu,
  POIOptionsMenuButton,
  POICategory,
  POICategoryHeader,
  POICategoryIcon,
  POICountBadge,
  POIDetailItem,
  POIDetailTitle,
  POIDetailDescription,
  POIStatsBar
};