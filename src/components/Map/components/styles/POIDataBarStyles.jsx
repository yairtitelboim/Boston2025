import styled, { keyframes } from 'styled-components';

// Animations
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideDown = keyframes`
  from {
    max-height: 0;
    opacity: 0;
  }
  to {
    max-height: 1000px;
    opacity: 1;
  }
`;

const pulseHighlight = keyframes`
  0% {
    background-color: rgba(59, 130, 246, 0.3);
  }
  50% {
    background-color: rgba(59, 130, 246, 0.5);
  }
  100% {
    background-color: rgba(59, 130, 246, 0.3);
  }
`;

// New leaderboard animations
const moveUp = keyframes`
  0% {
    transform: translateY(20px);
    opacity: 0.6;
    z-index: 1;
  }
  20% {
    transform: translateY(-5px);
  }
  40% {
    transform: translateY(0);
  }
  60% {
    transform: translateY(-3px);
  }
  80% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(0);
    opacity: 1;
    z-index: 10;
  }
`;

const moveDown = keyframes`
  0% {
    transform: translateY(-20px);
    opacity: 0.6;
  }
  30% {
    transform: translateY(5px);
  }
  50% {
    transform: translateY(0);
  }
  70% {
    transform: translateY(3px);
  }
  90% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
`;

const scaleIn = keyframes`
  0% {
    transform: scale(0.95);
  }
  50% {
    transform: scale(1.03);
  }
  100% {
    transform: scale(1);
  }
`;

const shineEffect = keyframes`
  0% {
    background-position: -100px;
  }
  40% {
    background-position: 300px;
  }
  100% {
    background-position: 300px;
  }
`;

const goldPulse = keyframes`
  0% {
    box-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
    border-color: rgba(255, 215, 0, 0.6);
  }
  50% {
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.8), 0 0 20px rgba(255, 165, 0, 0.4);
    border-color: rgba(255, 215, 0, 1);
  }
  100% {
    box-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
    border-color: rgba(255, 215, 0, 0.6);
  }
`;

const silverPulse = keyframes`
  0% {
    box-shadow: 0 0 5px rgba(192, 192, 192, 0.5);
    border-color: rgba(192, 192, 192, 0.6);
  }
  50% {
    box-shadow: 0 0 12px rgba(192, 192, 192, 0.8);
    border-color: rgba(192, 192, 192, 1);
  }
  100% {
    box-shadow: 0 0 5px rgba(192, 192, 192, 0.5);
    border-color: rgba(192, 192, 192, 0.6);
  }
`;

const bronzePulse = keyframes`
  0% {
    box-shadow: 0 0 5px rgba(205, 127, 50, 0.5);
    border-color: rgba(205, 127, 50, 0.6);
  }
  50% {
    box-shadow: 0 0 10px rgba(205, 127, 50, 0.8);
    border-color: rgba(205, 127, 50, 1);
  }
  100% {
    box-shadow: 0 0 5px rgba(205, 127, 50, 0.5);
    border-color: rgba(205, 127, 50, 0.6);
  }
`;

export const POIDataBarContainer = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(10px);
  padding: 12px; /* Reduced from 16px */
  border-radius: 12px;
  z-index: 1;
  transition: transform 0.3s ease;
  transform: translateX(${props => props.$isCollapsed ? 'calc(-100% - 10px)' : '0'});
  width: 442px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  will-change: transform;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.3);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(148, 163, 184, 0.5);
    border-radius: 4px;
    &:hover {
      background: rgba(148, 163, 184, 0.7);
    }
  }
`;

export const POIDataHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px; /* Reduced from 16px */
  padding-bottom: 8px; /* Reduced from 12px */
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
`;

export const POIDataTitle = styled.h2`
  color: #fff;
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
`;

export const CollapseButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 1;
  }

  svg {
    width: 24px;
    height: 24px;
    transform: rotate(${props => props.$isCollapsed ? '0deg' : '180deg'});
    transition: transform 0.3s ease;
  }
`;

export const ExpandButton = styled.button`
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(15, 23, 42, 0.9);
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px;
  display: ${props => props.$isCollapsed ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  opacity: 0.7;
  transition: opacity 0.2s ease;
  z-index: 1;

  &:hover {
    opacity: 1;
  }

  svg {
    width: 24px;
    height: 24px;
    transform: rotate(0deg);
  }
`;

export const POICategory = styled.div`
  margin-bottom: 2px; /* Further reduced from 6px */
  animation: ${fadeIn} 0.3s ease forwards;
  transform-origin: top center;
  will-change: transform, opacity;
  position: relative;
  transition: transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.8s ease, box-shadow 0.8s ease;

  &.move-up {
    animation: ${moveUp} 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  &.move-down {
    animation: ${moveDown} 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }
`;

export const POICategoryHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 3px 8px; /* Further reduced from 6px 12px */
  background: rgba(30, 41, 59, 0.6);
  border-radius: 4px; /* Reduced from 8px */
  cursor: pointer;
  margin-bottom: ${props => props.$isExpanded ? '1px' : '0'}; /* Further reduced from 4px */
  transition: background 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    background: rgba(30, 41, 59, 0.8);
  }

  &.top-category {
    animation: ${pulseHighlight} 2s infinite;
  }
`;

export const POICategoryIcon = styled.div`
  width: 16px; /* Further reduced from 24px */
  height: 16px; /* Further reduced from 24px */
  margin-right: 4px; /* Further reduced from 8px */
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  opacity: 0.9;

  svg {
    stroke: currentColor;
  }
`;

export const POICategoryTitle = styled.h3`
  color: #fff;
  font-size: 11px; /* Further reduced from 15px */
  font-weight: 500;
  margin: 0;
  flex-grow: 1;
  display: flex;
  align-items: center;
  width: 100%;
`;

export const POIDetailItem = styled.div`
  display: flex;
  flex-direction: column;
  padding: 8px 12px; /* Increased from 7px 10px for more space */
  background: ${props => `${props.color}33` || 'rgba(30, 41, 59, 0.4)'}; /* Using category color with 20% opacity */
  border-radius: 6px;
  margin-bottom: 6px; /* Increased from 4px for more space */
  margin-top: 2px; /* Added top margin */
  border-left: 3px solid ${props => props.color || '#3b82f6'};
  animation: ${fadeIn} 0.3s ease forwards;
  animation-delay: 0.1s;
  opacity: 0;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;

  &:hover {
    background: ${props => `${props.color}66` || 'rgba(30, 41, 59, 0.7)'}; /* Using category color with 40% opacity */
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(0px);
  }
`;

export const POIDetailTitle = styled.div`
  font-weight: 500;
  color: #fff;
  margin-bottom: 4px; /* Increased from 2px for more space */
  font-size: 14px; /* Kept the same size */
  display: flex;
  align-items: center;
  gap: 6px; /* Increased from 4px for more space */
`;

export const POIDetailDescription = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px; /* Kept the same size */
  line-height: 1.4; /* Increased from 1.3 for better readability */
  margin-bottom: 2px; /* Added bottom margin */
`;

export const POIDataContent = styled.div`
  overflow-y: auto;
  max-height: calc(100vh - 100px);
  position: relative;

  /* Create a staggered animation effect for children */
  & > * {
    transition: transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1),
                opacity 0.8s ease,
                margin-top 0.5s ease,
                margin-bottom 0.5s ease;
  }
`;

export const POIStatsBar = styled.div`
  height: 5px; /* Increased from 4px */
  background: rgba(30, 41, 59, 0.6);
  border-radius: 3px; /* Increased from 2px */
  overflow: hidden;
  margin: 6px 0 2px; /* Increased top margin from 4px to 6px, added bottom margin */

  &::before {
    content: '';
    display: block;
    height: 100%;
    width: 0%;
    background: ${props => props.color || '#3b82f6'};
    border-radius: 3px;
    animation: growWidth 1s ease-out forwards;
    animation-delay: 0.2s;
  }

  @keyframes growWidth {
    from {
      width: 0%;
    }
    to {
      width: ${props => props.value || 0}%;
    }
  }
`;

// Style for the position badges/counts with animation
export const POICountBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.color || '#6366f1'};
  color: white;
  border-radius: 12px;
  padding: 1px 8px;
  font-size: 11px;
  font-weight: bold;
  margin-left: auto;
  text-align: center;
  box-sizing: border-box;
  transition: all 0.3s ease;
  transform: translateX(0);

  /* Dynamic width based on content */
  width: ${props => {
    const count = props.children?.toString() || '';
    const numDigits = count.length;
    const digitWidth = 8; // Approximate width of each digit
    const padding = 16; // Padding (8px on each side)
    return `${Math.max(32, (numDigits * digitWidth) + padding)}px`;
  }};

  &.count-changed {
    animation: pulse 1s ease-in-out;
  }

  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
`;

// Add global styles for the POI popup
export const createGlobalStyles = () => {
  const styleId = 'poi-popup-global-styles';

  // Don't add duplicate styles
  if (document.getElementById(styleId)) return;

  const styleEl = document.createElement('style');
  styleEl.id = styleId;
  styleEl.textContent = `
    /* POI Popup Styles */
    .poi-popup {
      animation: popup-fade-in 0.3s ease forwards;
    }

    .poi-popup .mapboxgl-popup-content {
      background-color: #1e293b;
      color: white;
      padding: 0;
      border-radius: 8px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .poi-popup .mapboxgl-popup-close-button {
      color: white;
      font-size: 18px;
      padding: 5px 8px;
      z-index: 1;
      right: 1px;
      top: 1px;
    }

    .poi-popup .mapboxgl-popup-close-button:hover {
      background-color: rgba(255, 255, 255, 0.1);
      color: white;
      border-radius: 0 8px 0 0;
    }

    .poi-popup .mapboxgl-popup-tip {
      border-top-color: #1e293b !important;
      border-bottom-color: #1e293b !important;
      filter: drop-shadow(0 -4px 3px rgba(0, 0, 0, 0.1));
    }

    @keyframes popup-fade-in {
      0% {
        opacity: 0;
        transform: translateY(10px) scale(0.95);
      }
      100% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes poi-pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.6);
      }
      70% {
        box-shadow: 0 0 0 20px rgba(59, 130, 246, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
      }
    }
  `;

  document.head.appendChild(styleEl);
};