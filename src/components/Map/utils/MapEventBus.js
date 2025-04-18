// Define window level event bus for communication
export const initializeEventBus = () => {
  if (!window.mapEventBus) {
    window.mapEventBus = {
      listeners: {},
      emit: function(event, data) {
        if (this.listeners[event]) {
          this.listeners[event].forEach(callback => {
            try {
              callback(data);
            } catch (error) {
              console.error(`Error in mapEventBus listener for ${event}:`, error);
            }
          });
        }
      },
      on: function(event, callback) {
        if (!this.listeners[event]) {
          this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
        
        // Return an unsubscribe function
        return () => {
          if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
          }
        };
      }
    };
  }
  return window.mapEventBus;
}; 