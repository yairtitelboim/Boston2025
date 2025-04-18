/**
 * Style helper functions for POI Data Bar components
 */

/**
 * Calculates a dynamic width for badges based on the count value
 * The width is proportional to the number of digits in the count
 *
 * @param {number} count - The count value to calculate width for
 * @param {number} maxCount - The maximum count value for scaling
 * @returns {string} - CSS width value (e.g. "45px")
 */
export const calculateDynamicWidth = (count, maxCount) => {
  if (!count) return '32px'; // Minimum width

  // Base width calculation based on the number of digits
  const numDigits = count.toString().length;

  // Min and max widths
  const minWidth = 32;
  const maxWidth = 80;

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