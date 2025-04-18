import React from 'react';
import POIDetail from '../POIDetail/POIDetail';
import {
  POICategory,
  POICategoryHeader,
  POICategoryIcon,
  POICountBadge
} from '../../styles/POIDataBarStyles';
import { getIconForCategory } from '../../utils/categoryIcons';
import { calculateDynamicWidth } from '../../utils/styleHelpers';

const CategoryItem = ({
  category,
  index,
  positionChange,
  isExpanded,
  isHighlighted,
  count,
  visiblePOIs,
  isPaused,
  color,
  onToggle,
  maxCount,
  totalCategories
}) => {
  return (
    <POICategory
      className={`${positionChange?.moved === 'up' ? 'move-up' : positionChange?.moved === 'down' ? 'move-down' : ''}`}
      style={{
        transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.8s ease',
        transform: 'translateY(0)',
        opacity: 1,
        position: 'relative',
        zIndex: totalCategories - index,
        animationDelay: `${index * 0.08}s`,
        borderLeft: positionChange ?
          (positionChange.moved === 'up' ? '4px solid rgba(50, 205, 50, 0.8)' : '4px solid rgba(255, 165, 0, 0.8)') :
          'none',
        boxShadow: positionChange ? '0 0 10px rgba(255, 255, 255, 0.2)' : 'none',
      }}
    >
      <POICategoryHeader
        onClick={onToggle}
        $isExpanded={isExpanded}
        style={{
          transition: 'background 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease',
          transform: isExpanded ? 'scale(1.02)' : 'scale(1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: isHighlighted
            ? `0 0 8px ${color}80, inset 0 0 3px ${color}80`
            : 'none',
          borderLeft: isHighlighted
            ? `4px solid ${color}`
            : positionChange
              ? (positionChange.moved === 'up' ? '4px solid rgba(50, 205, 50, 0.8)' : '4px solid rgba(255, 165, 0, 0.8)')
              : 'none',
          background: isHighlighted
            ? `linear-gradient(90deg, rgba(30, 41, 59, 0.6) 0%, ${color}15 100%)`
            : 'rgba(30, 41, 59, 0.6)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <POICategoryIcon>
            {getIconForCategory(category)}
          </POICategoryIcon>
          <span>
            {category.charAt(0).toUpperCase() + category.slice(1)}
            {positionChange && (
              <span style={{
                fontSize: '10px',
                marginLeft: '4px',
                color: positionChange.moved === 'up' ? 'rgba(50, 205, 50, 0.9)' : 'rgba(255, 165, 0, 0.9)',
                fontWeight: 'bold',
              }}>
                {positionChange.moved === 'up' ? '↑' : '↓'}
                {Math.abs(positionChange.currPos - positionChange.prevPos)}
              </span>
            )}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <POICountBadge
            color={color}
            count={count}
            isTopThree={false}
            className={positionChange ? 'count-changed' : ''}
            style={{
              marginRight: '10px',
              // Calculate width directly based on number of digits
              width: (() => {
                const countValue = count || 0;
                const numDigits = countValue.toString().length;
                // Each digit gets ~8px + padding
                return `${Math.max(32, (numDigits * 8) + 16)}px`;
              })(),
              transition: 'width 0.5s ease-in-out, background-color 0.3s ease',
              opacity: isPaused ? 0.9 : 1,
              boxShadow: isPaused ? 'inset 0 0 0 1px rgba(255, 255, 255, 0.3)' : 'none',
            }}
          >
            {count || 0}
          </POICountBadge>

          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            width="16"
            height="16"
            style={{
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease'
            }}
          >
            <path d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </POICategoryHeader>

      {isExpanded && (
        <div style={{
          marginTop: '8px',
          paddingLeft: '12px',
          animation: 'slideDown 0.3s ease-out forwards',
          overflow: 'hidden',
        }}>
          <POIDetail items={visiblePOIs} category={category} color={color} />
        </div>
      )}
    </POICategory>
  );
};

export default CategoryItem;