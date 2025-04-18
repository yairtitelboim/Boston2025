// Constants for categories
export const CATEGORIES = [
  'restaurants',
  'cafes',
  'bars',
  'shops',
  'cultural',
  'parks',
  'education',
  'healthcare',
  'transportation'
];

// Get color for each category
export const getColorForCategory = (category) => {
  switch (category) {
    case 'restaurants':
      return '#ff9900'; // Orange
    case 'cafes':
      return '#cc6600'; // Brown
    case 'bars':
      return '#990099'; // Purple
    case 'shops':
      return '#0066ff'; // Blue
    case 'cultural':
      return '#cc3300'; // Dark Orange
    case 'parks':
      return '#33cc33'; // Green
    case 'education':
      return '#ff3333'; // Red
    case 'healthcare':
      return '#ff0000'; // Bright Red
    case 'transportation':
      return '#10b981'; // Teal/Green
    default:
      return '#6366f1'; // Indigo
  }
};

// Get icon for each category
export const getIconForCategory = (category) => {
  switch (category) {
    case 'restaurants':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
          <path d="M18 3a3 3 0 00-3 3v12h3m0-12a3 3 0 013 3v9h-3m-9-3h.01M6 3v18h2m4-18v18h2"/>
        </svg>
      );
    case 'cafes':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
          <path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zm4-7v3m4-3v3m4-3v3"/>
        </svg>
      );
    case 'bars':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
          <path d="M8 3H3v3h5V3z M21 3h-5v3h5V3z M8 21h8v-4a4 4 0 00-8 0v4z M12 11a4 4 0 100-8 4 4 0 000 8z"/>
        </svg>
      );
    case 'shops':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
          <path d="M3 3h18v18H3V3z M3 9h18 M9 21V9 M15 21V9"/>
        </svg>
      );
    case 'cultural':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
          <path d="M2 20h20M12 3L2 10l10 7 10-7-10-7z M4 14v6 M8 14v6 M12 14v6 M16 14v6 M20 14v6"/>
        </svg>
      );
    case 'parks':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
          <path d="M12 22v-8m0 0l4-8-8 1 4 7z M12 6a3 3 0 100-6 3 3 0 000 6z"/>
        </svg>
      );
    case 'education':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
          <path d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422M12 14v6 M6 10v4a6 6 0 0012 0v-4"/>
        </svg>
      );
    case 'healthcare':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
          <path d="M9 12h6M12 9v6M12 21a9 9 0 100-18 9 9 0 000 18z"/>
        </svg>
      );
    case 'transportation':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
          <path d="M5 17H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-1m-6 0v-1a2 2 0 114 0v1m-4 0h4m-11 1v-3m0 0h8m-8 0l-2-2m2 2l-2 2"/>
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
          <circle cx="12" cy="12" r="10"/>
        </svg>
      );
  }
}; 