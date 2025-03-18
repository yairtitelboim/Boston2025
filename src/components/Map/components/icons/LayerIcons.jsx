import React from 'react';

export const LayerIcons = {
  Transit: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 16l4.5-4.5M19 16l-4.5-4.5M12 16V4M12 16l2.5 4M9.5 20l2.5-4" />
    </svg>
  ),
  Bike: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="6" cy="15" r="4" />
      <circle cx="18" cy="15" r="4" />
      <path d="M6 15l4-7h4l2 3h2" />
    </svg>
  ),
  Pedestrian: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="5" r="2" />
      <path d="M10 22l2-11l2 2v9M8 11l4-4l4 4M8 11v5" />
    </svg>
  ),
  Transportation: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 17h14M12 3v14M7 8l5-5l5 5" />
    </svg>
  ),
  Zoning: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21h18M3 3v18M3 7h18M3 14h18M7 3v18M14 3v18" />
    </svg>
  ),
  Planning: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H4V4h16v4M12 8v4M8 10h8" />
      <circle cx="17" cy="17" r="3" />
      <path d="M21 21l-1.5-1.5" />
    </svg>
  ),
  Buildings: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 21h16M4 21V8l8-5l8 5v13M9 21v-5h6v5" />
    </svg>
  ),
  Neighborhood: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21h18M9 8h6M7 21V8l5-5l5 5v13M9 15h6" />
    </svg>
  )
}; 