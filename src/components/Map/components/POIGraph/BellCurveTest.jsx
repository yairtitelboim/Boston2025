import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title as ChartTitle,
  Tooltip,
  Legend as ChartLegend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Scatter, Line } from 'react-chartjs-2';
import { SAMPLE_POI_DATA } from '../POIDataBar/constants';

// Flatten the sample data for easier use in the test component
const flattenedSampleData = Object.entries(SAMPLE_POI_DATA).flatMap(([category, items]) =>
  items.map(item => ({
    name: item.name,
    category: category,
    rating: item.rating,
    reviews: item.popularity, // Using popularity as a proxy for reviews
    lat: item.coordinates[1],
    lng: item.coordinates[0],
    color: getCategoryColor(category)
  }))
);

// Simple function to get a color for each category
function getCategoryColor(category) {
  const colorMap = {
    restaurants: '#FF5733', // Red-orange
    cafes: '#C70039',       // Dark red
    bars: '#900C3F',        // Burgundy
    shops: '#581845',       // Purple
    cultural: '#2471A3',    // Blue
    parks: '#229954',       // Green
    education: '#F1C40F',   // Yellow
    healthcare: '#E67E22',  // Orange
    transportation: '#7D3C98' // Purple
  };

  return colorMap[category] || '#777777'; // Default gray
};

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  ChartTitle,
  Tooltip,
  ChartLegend,
  Filler  // Required for fill: true option
);

// Styled components
const TestContainer = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #1a1a1a;
  color: white;
  padding: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h2`
  margin: 0;
`;

const Controls = styled.div`
  display: flex;
  gap: 10px;
`;

const Button = styled.button`
  background-color: ${props => props.$active ? '#4CAF50' : '#333'};
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: ${props => props.$active ? '#45a049' : '#444'};
  }
`;

const ChartContainer = styled.div`
  flex: 1;
  background-color: #2a2a2a;
  border-radius: 8px;
  padding: 20px;
  position: relative;
`;

const BellCurveTest = () => {
  const [data, setData] = useState([]);
  const [showBellCurve, setShowBellCurve] = useState(true);
  const chartRef = useRef(null);

  // Load sample data
  useEffect(() => {
    // Transform sample data into the format we need
    const transformedData = flattenedSampleData.map(poi => ({
      name: poi.name,
      category: poi.category,
      x: poi.rating,  // Rating
      y: poi.reviews, // Number of reviews
      color: poi.color,
      lngLat: [poi.lng, poi.lat]
    }));

    setData(transformedData);
    console.log(`Loaded ${transformedData.length} sample POIs for testing`);
  }, []);

  // Function to calculate normal distribution value (bell curve)
  const normalDistribution = (x, mean, stdDev) => {
    return (1 / (stdDev * Math.sqrt(2 * Math.PI))) *
           Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
  };

  // Function to generate bell curve points
  const generateBellCurve = (values, numPoints = 100) => {
    console.log(`Generating bell curve for ${values.length} values`);

    if (!values || values.length === 0) {
      console.error('No values provided for curve generation');
      return [];
    }

    // Calculate mean and standard deviation
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance) || 1; // Prevent division by zero

    console.log(`Distribution statistics: mean=${mean.toFixed(2)}, stdDev=${stdDev.toFixed(2)}`);

    // Find min and max values with a buffer
    const min = Math.max(0, mean - 3 * stdDev);
    const max = mean + 3 * stdDev;

    console.log(`Curve range: [${min.toFixed(2)}, ${max.toFixed(2)}]`);

    const points = [];
    const step = (max - min) / numPoints;

    for (let i = 0; i <= numPoints; i++) {
      const x = min + (step * i);
      const y = normalDistribution(x, mean, stdDev);
      points.push({ x, y });
    }

    return points;
  };

  // Prepare datasets for the chart
  const prepareDatasets = () => {
    if (!data || data.length === 0) return [];

    // Extract ratings and reviews
    const ratings = data.map(point => point.x).filter(x => !isNaN(x));
    const reviews = data.map(point => point.y).filter(y => !isNaN(y));

    if (showBellCurve) {
      // Calculate mean and standard deviation for ratings
      const ratingMean = ratings.reduce((sum, val) => sum + val, 0) / ratings.length;
      const ratingVariance = ratings.reduce((sum, val) => sum + Math.pow(val - ratingMean, 2), 0) / ratings.length;
      const ratingStdDev = Math.sqrt(ratingVariance) || 1;

      // Calculate mean and standard deviation for reviews
      const reviewsMean = reviews.reduce((sum, val) => sum + val, 0) / reviews.length;
      const reviewsVariance = reviews.reduce((sum, val) => sum + Math.pow(val - reviewsMean, 2), 0) / reviews.length;
      const reviewsStdDev = Math.sqrt(reviewsVariance) || 1;

      console.log(`Rating stats: mean=${ratingMean.toFixed(2)}, stdDev=${ratingStdDev.toFixed(2)}`);
      console.log(`Reviews stats: mean=${reviewsMean.toFixed(2)}, stdDev=${reviewsStdDev.toFixed(2)}`);

      // Generate bell curves
      const ratingCurveData = generateBellCurve(ratings);
      const reviewsCurveData = generateBellCurve(reviews);

      // Find the maximum y values to normalize
      let maxRatingY = 0;
      let maxReviewsY = 0;

      ratingCurveData.forEach(point => {
        maxRatingY = Math.max(maxRatingY, point.y);
      });

      reviewsCurveData.forEach(point => {
        maxReviewsY = Math.max(maxReviewsY, point.y);
      });

      // Normalize the y values
      ratingCurveData.forEach(point => {
        point.y = point.y / maxRatingY;
      });

      reviewsCurveData.forEach(point => {
        point.y = point.y / maxReviewsY;
      });

      // Create the bell curve datasets
      const ratingCurve = {
        label: 'Rating Distribution',
        data: ratingCurveData,
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 0,
        showLine: true,
        fill: true,
        tension: 0.4,
        type: 'line',
        cubicInterpolationMode: 'monotone',
        order: 1  // Draw on top
      };

      const reviewsCurve = {
        label: 'Reviews Distribution',
        data: reviewsCurveData,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 0,
        showLine: true,
        fill: true,
        tension: 0.4,
        type: 'line',
        cubicInterpolationMode: 'monotone',
        order: 2  // Draw below ratings
      };

      // Create POI scatter datasets grouped by category
      const categories = {};

      data.forEach(point => {
        if (!point) return;

        // Calculate the y position on the bell curve
        // For ratings curve: position the point at its rating value on x-axis
        // and at the corresponding height on the bell curve on y-axis
        const ratingX = point.x; // The rating value
        const ratingY = normalDistribution(ratingX, ratingMean, ratingStdDev) / maxRatingY;

        // For reviews curve: position the point at its review count on x-axis
        // and at the corresponding height on the bell curve on y-axis
        const reviewsX = point.y; // The review count
        const reviewsY = normalDistribution(reviewsX, reviewsMean, reviewsStdDev) / maxReviewsY;

        // Create or update category dataset
        if (!categories[point.category]) {
          categories[point.category] = {
            label: point.category,
            data: [],
            backgroundColor: point.color,
            pointRadius: 6,
            pointHoverRadius: 8,
            showLine: false,
            type: 'scatter',
            order: 0  // Draw on top of everything
          };
        }

        // Add the point to the rating curve
        categories[point.category].data.push({
          x: ratingX,  // Rating value on x-axis
          y: ratingY,  // Height on the bell curve on y-axis
          name: point.name,
          category: point.category,
          lngLat: point.lngLat,
          originalX: point.x,
          originalY: point.y,
          curveType: 'rating'
        });

        // Add the point to the reviews curve
        categories[point.category].data.push({
          x: reviewsX,  // Review count on x-axis
          y: reviewsY,  // Height on the bell curve on y-axis
          name: point.name,
          category: point.category,
          lngLat: point.lngLat,
          originalX: point.x,
          originalY: point.y,
          curveType: 'reviews'
        });
      });

      return [ratingCurve, reviewsCurve, ...Object.values(categories)];
    } else {
      // Regular scatter plot with categories
      const categories = {};

      data.forEach(point => {
        if (!point) return;

        if (!categories[point.category]) {
          categories[point.category] = {
            label: point.category,
            data: [],
            backgroundColor: point.color,
            pointRadius: 6,
            pointHoverRadius: 8
          };
        }

        categories[point.category].data.push({
          x: point.y,  // Reviews on x-axis
          y: point.x,  // Rating on y-axis
          name: point.name,
          category: point.category,
          lngLat: point.lngLat
        });
      });

      return Object.values(categories);
    }
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const point = context.raw;
            if (!point) return '';

            if (showBellCurve) {
              if (point.curveType) {
                return `${point.name} (${point.category}) - Rating: ${point.originalX.toFixed(1)}, Reviews: ${point.originalY}`;
              } else {
                const datasetLabel = context.dataset.label;
                if (datasetLabel === 'Rating Distribution') {
                  return `Rating: ${point.x.toFixed(2)}, Relative Frequency: ${point.y.toFixed(4)}`;
                } else if (datasetLabel === 'Reviews Distribution') {
                  return `Reviews: ${point.x.toFixed(0)}, Relative Frequency: ${point.y.toFixed(4)}`;
                }
                return `Value: ${point.x.toFixed(2)}, Relative Frequency: ${point.y.toFixed(4)}`;
              }
            } else {
              return `${point.name} (${point.category}) - Rating: ${point.y.toFixed(1)}, Reviews: ${point.x}`;
            }
          }
        }
      }
    },
    scales: {
      y: {
        title: {
          display: true,
          text: showBellCurve ? 'Relative Frequency' : 'Rating (stars)',
          color: 'rgba(255, 255, 255, 0.7)'
        },
        min: 0,
        max: showBellCurve ? 1.1 : 5,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        }
      },
      x: {
        title: {
          display: true,
          text: showBellCurve ? 'Value' : 'Number of Reviews',
          color: 'rgba(255, 255, 255, 0.7)'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        }
      }
    },
    elements: {
      point: {
        radius: showBellCurve ? 6 : 5,
        hoverRadius: showBellCurve ? 8 : 7
      },
      line: {
        tension: 0.4,
        borderWidth: 3,
        fill: true
      }
    }
  };

  return (
    <TestContainer>
      <Header>
        <Title>Bell Curve POI Visualization Test</Title>
        <Controls>
          <Button
            $active={!showBellCurve}
            onClick={() => setShowBellCurve(false)}
          >
            Scatter Plot
          </Button>
          <Button
            $active={showBellCurve}
            onClick={() => setShowBellCurve(true)}
          >
            Bell Curve
          </Button>
        </Controls>
      </Header>
      <ChartContainer>
        {data.length > 0 ? (
          <Scatter
            ref={chartRef}
            options={chartOptions}
            data={{ datasets: prepareDatasets() }}
          />
        ) : (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            color: 'rgba(255,255,255,0.5)'
          }}>
            Loading test data...
          </div>
        )}
      </ChartContainer>
    </TestContainer>
  );
};

export default BellCurveTest;
