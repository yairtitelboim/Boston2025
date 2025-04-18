# Bell Curve POI Visualization Test

This is a test component for visualizing POI data on bell curves. It demonstrates how to display POI points on bell curves showing the distribution of ratings and reviews.

## How to Use

1. Run the application with `npm start`
2. Navigate to `/test/bell-curve` in your browser
3. Use the toggle buttons to switch between Scatter Plot and Bell Curve modes

## Features

### Bell Curve Mode

In Bell Curve mode, the component displays:

1. Two bell curves:
   - A red curve showing the distribution of ratings
   - A blue curve showing the distribution of reviews

2. POI points positioned on the bell curves:
   - Each POI has two points - one on the rating curve and one on the reviews curve
   - The x-position of each point corresponds to its rating or review count
   - The y-position corresponds to the height of the bell curve at that x-value
   - Points are colored by category

### Scatter Plot Mode

In Scatter Plot mode, the component displays:
- POI points in a traditional scatter plot
- X-axis: Number of reviews
- Y-axis: Rating
- Points are colored by category

## Implementation Details

The bell curve visualization works by:

1. Calculating the mean and standard deviation of ratings and reviews
2. Generating bell curves based on these statistics
3. Positioning each POI point on the bell curves at:
   - x = the POI's rating or review count
   - y = the height of the bell curve at that x-value

This approach allows users to see both:
- The overall distribution of ratings and reviews (via the bell curves)
- Individual POIs in the context of these distributions (via the colored points)

## Applying to the Main Application

To apply this visualization to the main POI Graph component:

1. Add a "Bell Curve" toggle button to the POI Graph header
2. Implement the bell curve generation and POI positioning logic
3. Update the chart options to handle both visualization modes
4. Ensure the POI points maintain their category colors and interactive features

The key is to position each POI point at the height of the bell curve corresponding to its rating or review count, while maintaining the category-based coloring and interactivity.
