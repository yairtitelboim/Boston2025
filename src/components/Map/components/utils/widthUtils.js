// Helper function to get the maximum count
export const getMaxCount = (poiCounts) => {
  if (!poiCounts || typeof poiCounts !== 'object') {
    return 1; // Return default value if poiCounts is null/undefined or not an object
  }
  const counts = Object.values(poiCounts).filter(count => typeof count === 'number');
  return counts.length > 0 ? Math.max(...counts) : 1; // Return 1 if no valid counts found
};

// Helper function to calculate dynamic width based on the count value
export const calculateDynamicWidth = (count, maxCount) => {
  if (!count) return '32px'; // Minimum width

  // Different width ranges for total badge vs category badges
  const isTotalBadge = count > maxCount; // Total will always be larger than any individual count

  // Base width calculation based on the number of digits
  const numDigits = count.toString().length;

  // Min and max widths
  const minWidth = 32;
  const maxWidth = isTotalBadge ? 110 : 80; // Total badge wider, category badges more compact

  // Calculate base width based on number of digits (each digit ~8px + padding)
  const digitWidth = 8; // Approximate width of each digit
  const padding = 16; // Padding (8px on each side)
  const baseWidth = (numDigits * digitWidth) + padding;

  // Scale the width between min and max based on count/maxCount ratio
  const ratio = count / maxCount;

  // Use linear scaling with a logarithmic component for better distribution
  // This gives more width to smaller numbers while still scaling with count
  const logFactor = 0.3 * Math.log10(count + 1); // Logarithmic component
  const linearFactor = 0.7 * ratio; // Linear component
  const scaleFactor = linearFactor + logFactor;

  // Calculate width using both the digit-based approach and the scaling factor
  const scaledWidth = minWidth + (maxWidth - minWidth) * scaleFactor;
  const width = Math.max(baseWidth, scaledWidth);

  // Ensure the width doesn't exceed maxWidth
  const finalWidth = Math.min(width, maxWidth);

  return `${Math.round(finalWidth)}px`;
};