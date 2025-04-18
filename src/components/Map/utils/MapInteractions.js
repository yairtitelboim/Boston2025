import { setRoadParticleThrottle } from '../hooks/mapAnimations';
import { debugLog } from './MapDebug';

export const setupMapInteractionHandlers = (map) => {
  if (!map) return;

  // Handle any click on the map - we throttle the animation temporarily
  map.on('click', (e) => {
    debugLog('Map click detected, temporarily throttling animations');
    setRoadParticleThrottle(2, 1500); // medium throttle for 1.5 seconds
  });

  // Also throttle during drag operations
  map.on('dragstart', () => {
    debugLog('Map drag started, throttling animations');
    setRoadParticleThrottle(2, 500); // medium throttle, shorter duration
  });

  // Heavy throttle during zoom operations which are more intensive
  map.on('zoomstart', () => {
    debugLog('Map zoom started, heavily throttling animations');
    setRoadParticleThrottle(3, 1000); // high throttle for 1 second
  });

  // Handle the end of these operations
  map.on('zoomend', () => {
    debugLog('Map zoom ended, restoring animations');
    setTimeout(() => setRoadParticleThrottle(1), 300);
  });

  // Listen for custom events from AIChatPanel or SceneManager
  window.mapEventBus.on('scene:loading', () => {
    debugLog('Scene loading detected, heavily throttling animations');
    setRoadParticleThrottle(3, 2000); // heavy throttle during scene changes
  });

  window.mapEventBus.on('scene:loaded', () => {
    debugLog('Scene loaded, restoring animations');
    setTimeout(() => setRoadParticleThrottle(1), 500);
  });

  window.mapEventBus.on('ai:processing', () => {
    debugLog('AI processing detected, throttling animations');
    setRoadParticleThrottle(2, 3000); // medium throttle during AI operations
  });

  // Clean up when component unmounts
  return () => {
    map.off('click');
    map.off('dragstart');
    map.off('zoomstart');
    map.off('zoomend');
  };
};

// Touch event handlers
export const setupTouchHandlers = (map) => {
  if (!map) return;

  const handleTouchStart = (e) => {
    if (!e || !e.touches) return;

    if (e.touches.length === 2) {
      e.preventDefault(); // Prevent default zoom behavior
    }
  };

  // Modified to be passive-compatible
  const handleTouchMove = (e) => {
    if (!e || !e.touches) return;

    // We no longer call preventDefault() here to make this passive-compatible
    // Instead, we'll use CSS to prevent unwanted behaviors
  };

  // Add the event listeners to the canvas container
  const mapCanvas = map.getCanvas();
  if (mapCanvas) {
    mapCanvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    mapCanvas.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      mapCanvas.removeEventListener('touchstart', handleTouchStart);
      mapCanvas.removeEventListener('touchmove', handleTouchMove);
    };
  }
};