// Debug utilities
const DEBUG = false;

export const debugLog = (...args) => DEBUG && console.log('[MapDebug]', ...args);
export const debugWarn = (...args) => DEBUG && console.warn('[MapDebug]', ...args);
export const debugError = (...args) => DEBUG && console.error('[MapDebug]', ...args);

// Performance monitoring
export const monitorPerformance = () => {
  if (!DEBUG) return;
  
  // Memory usage reporting (Chrome only)
  const reportMemory = () => {
    if (window.performance && window.performance.memory) {
      const memoryInfo = window.performance.memory;
      debugLog('Memory Usage:', {
        totalJSHeapSize: (memoryInfo.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
        usedJSHeapSize: (memoryInfo.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
        jsHeapSizeLimit: (memoryInfo.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB',
        usagePercentage: ((memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100).toFixed(2) + '%'
      });
    }
  };
  
  let frameCount = 0;
  let lastTime = performance.now();
  let fps = 0;
  let isMonitoring = true;
  
  const measureFPSInterval = setInterval(() => {
    if (!isMonitoring) {
      clearInterval(measureFPSInterval);
      return;
    }
    
    const currentTime = performance.now();
    const elapsedMs = currentTime - lastTime;
    
    if (elapsedMs >= 1000) {
      fps = Math.round((frameCount * 1000) / elapsedMs);
      debugLog('Estimated FPS:', fps);
      reportMemory();
      
      if (fps < 15) {
        debugWarn('Low FPS detected:', fps);
      }
      
      frameCount = 0;
      lastTime = currentTime;
    } else {
      frameCount++;
    }
  }, 100);
  
  const memoryInterval = setInterval(reportMemory, 10000);
  
  return () => {
    isMonitoring = false;
    clearInterval(measureFPSInterval);
    clearInterval(memoryInterval);
  };
}; 