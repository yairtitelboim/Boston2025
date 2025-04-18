import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Panel } from './StyledComponents';
import { 
  handlePanelQuestion, 
  handleQuickAction, 
  handleUrbanImpactQuestion, 
  handleServiceCorridorsQuestion,
  handleInfrastructureImprovementsQuestion,
  MOCK_RESPONSES 
} from '../../../services/claude';
import { handlePanelCollapse } from '../hooks/mapAnimations';
import { MODEL_COLORS } from './mockData';

// Import components
import MessageList from './components/MessageList';
import InitialQuestions, { questionsContainerRef } from './components/InitialQuestions';
import CollapseButton from './components/CollapseButton';

const AIChatPanel = ({ messages, setMessages, handleQuestion, map, initialCollapsed = true }) => {
  // Initialize local messages state if not provided as a prop
  const [localMessages, setLocalMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [selectedModel, setSelectedModel] = useState('claude3');
  const messagesEndRef = useRef(null);
  const panelInitializedRef = useRef(false);
  const questionButtonsRef = useRef([]);
  
  // Use provided messages/setMessages if available, otherwise use local state
  const effectiveMessages = messages || localMessages;
  const effectiveSetMessages = setMessages || setLocalMessages;

  // Expose the loading state setter function globally
  useEffect(() => {
    // Make setIsLoading function accessible globally for card click interactions
    window.setAIChatPanelLoading = setIsLoading;
    
    // Also expose the setMessages function for updating messages from external components
    window.setAIChatPanelMessages = setMessages;
    
    // Add a global reference to the collapse state setter
    window.setAIChatPanelCollapsed = setIsCollapsed;
    
    // Cleanup function to remove the global references when component unmounts
    return () => {
      window.setAIChatPanelLoading = null;
      window.setAIChatPanelMessages = null;
      window.setAIChatPanelCollapsed = null;
    };
  }, [setMessages]);

  // Helper function to convert hex color to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
      `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
      '0, 136, 204'; // Default fallback color
  };

  // Add toggle handler with enhanced debug logging
  const handleCollapseToggle = () => {
    console.log('🔍 Panel collapse clicked');
    console.log('Current collapse state:', isCollapsed);
    console.log('Window width:', window.innerWidth);
    console.log('Is mobile?:', window.innerWidth <= 768);
    
    const newState = !isCollapsed;
    console.log('Setting new collapse state to:', newState);
    
    setIsCollapsed(newState);
    
    // Log after state update
    setTimeout(() => {
      console.log('Updated collapse state:', newState);
      console.log('Panel transform should be:', newState ? '100%' : '0');
    }, 0);
  };

  // Add effect to log panel state changes
  useEffect(() => {
    console.log('Panel collapse state changed to:', isCollapsed);
    console.log('Panel should be:', isCollapsed ? 'hidden' : 'visible');
  }, [isCollapsed]);

  // Auto-scroll effect
  useEffect(() => {
    // Only auto-scroll in these cases:
    // 1. When explicitly set by another component via focusOnLoadingIndicators
    // 2. When the most recent message is from the user (they just sent something)
    const shouldAutoScroll = 
      window.focusOnLoadingIndicators || 
      (effectiveMessages.length > 0 && effectiveMessages[effectiveMessages.length - 1].isUser);
    
    if (shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [effectiveMessages]);

  // Initialize the focusOnLoadingIndicators flag
  useEffect(() => {
    window.focusOnLoadingIndicators = false;
    
    return () => {
      window.focusOnLoadingIndicators = false;
    };
  }, []);

  // Handle panel collapse
  useEffect(() => {
    if (map && map.current) {
      console.log('Applying panel collapse state:', isCollapsed);
      handlePanelCollapse(isCollapsed, map);
    }
  }, [isCollapsed, map]);

  // Special effect for initial load - runs only once on component mount
  useEffect(() => {
    if (!panelInitializedRef.current) {
      console.log('Forcing initial panel collapse');
      setIsCollapsed(true);
      
      // Try multiple times to ensure it stays collapsed during initialization
      const applyCollapse = () => {
        if (map && map.current) {
          handlePanelCollapse(true, map);
        }
      };
      
      // Apply immediately
      applyCollapse();
      
      // And also after short delays to ensure it applies after any other initialization
      const timers = [
        setTimeout(applyCollapse, 100),
        setTimeout(applyCollapse, 500),
        setTimeout(applyCollapse, 1000)
      ];
      
      panelInitializedRef.current = true;
      
      return () => timers.forEach(timer => clearTimeout(timer));
    }
  }, [map]);

  // Add a safe question handler for predefined questions - wrapped in useCallback to maintain reference
  const handlePredefinedQuestion = useCallback(async (questionText) => {
    console.log('Handling predefined question:', questionText);
    console.log('Current model when handling question:', selectedModel);
    
    // When user clicks a question, open the panel if it's closed
    if (isCollapsed) {
      setIsCollapsed(false);
    }
    
    try {
      // Get a valid map reference with enhanced logging
      const directMapRef = map;
      const windowMapRef = window.mapComponent && window.mapComponent.map;
      
      console.log('Map references available:', {
        'Direct map prop': !!directMapRef,
        'window.mapComponent': !!window.mapComponent,
        'window.mapComponent.map': !!windowMapRef,
        'window.mapComponent.handleLoadScene': window.mapComponent && typeof window.mapComponent.handleLoadScene === 'function'
      });
      
      // Use the most reliable map reference
      let effectiveMap = directMapRef || windowMapRef;
      
      // Special case for urban impact question
      if (questionText === "Where could minimal changes create maximum impact?") {
        console.log('Calling handleUrbanImpactQuestion with map:', effectiveMap);
        
        // If window.mapComponent exists, try to load Scene01
        if (window.mapComponent && typeof window.mapComponent.loadSceneByName === 'function') {
          console.log('Attempting to load Scene01 scene');
          const sceneLoaded = window.mapComponent.loadSceneByName("Scene01");
          console.log('Scene01 load result:', sceneLoaded);
        }
        
        // Add the user question to messages
        effectiveSetMessages(prev => {
          const prevMessages = Array.isArray(prev) ? prev : [];
          return [
            ...prevMessages,
            { isUser: true, content: questionText }
          ];
        });
        
        await handleUrbanImpactQuestion(questionText, effectiveMessages, effectiveSetMessages, setIsLoading);
        return;
      }
      
      // Special case for service corridors question
      if (questionText === "Show potential service corridors around Skid Row") {
        console.log('Calling handleServiceCorridorsQuestion with map:', effectiveMap);
        
        // Load the scene immediately before waiting for the service corridors response
        if (window.mapComponent && typeof window.mapComponent.loadSceneByName === 'function') {
          console.log('Pre-loading Zoning scene for service corridors question');
          window.mapComponent.loadSceneByName("Zoning");
        }
        
        // Use Promise.resolve to make this non-blocking
        Promise.resolve().then(() => {
          handleServiceCorridorsQuestion(effectiveMap, effectiveSetMessages, setIsLoading);
        });
        return;
      }
      
      // Special case for Solar Potential Analysis button
      if (questionText === "SHOW_SOLAR_POTENTIAL") {
        console.log('Handling Solar Potential Analysis button click');
        
        // Show a notification
        const notification = document.createElement('div');
        notification.textContent = "Loading solar potential analysis...";
        notification.style.position = "fixed";
        notification.style.bottom = "20px";
        notification.style.left = "50%";
        notification.style.transform = "translateX(-50%)";
        notification.style.backgroundColor = "#4c1d95";
        notification.style.color = "white";
        notification.style.padding = "10px 20px";
        notification.style.borderRadius = "4px";
        notification.style.zIndex = "9999";
        notification.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)";
        notification.style.animation = "fadeInOut 2.5s forwards";
        
        // Create a style element for the animation
        const style = document.createElement('style');
        style.textContent = `
          @keyframes fadeInOut {
            0% { opacity: 0; transform: translate(-50%, 20px); }
            15% { opacity: 1; transform: translate(-50%, 0); }
            85% { opacity: 1; transform: translate(-50%, 0); }
            100% { opacity: 0; transform: translate(-50%, -20px); }
          }
        `;
        document.head.appendChild(style);
        document.body.appendChild(notification);
        
        // Specifically load the "Next" scene as requested
        if (window.mapComponent && typeof window.mapComponent.loadSceneByName === 'function') {
          console.log('Loading "Next" scene for solar potential analysis (exact name match)');
          const sceneLoaded = window.mapComponent.loadSceneByName("Next");
          console.log('Next scene load result:', sceneLoaded);
          
          // Update the AI panel with a message about the solar potential analysis
          effectiveSetMessages(prev => [
            ...prev,
            { isUser: true, content: "View Solar Potential Analysis" },
            { 
              isUser: false, 
              content: { 
                preGraphText: "Loading detailed solar potential analysis for Los Angeles neighborhoods...",
                postGraphText: "This visualization shows the rooftop solar capacity and potential energy generation across different areas. The highlighted regions indicate optimal locations for new solar installations."
              }
            }
          ]);
        }
        
        // Remove the notification after animation completes
        setTimeout(() => {
          document.body.removeChild(notification);
          document.head.removeChild(style);
        }, 2500);
        
        return;
      }
      
      // Special case for infrastructure improvements question
      if (questionText === "What infrastructure improvements would have most impact in Skid Row?") {
        console.log('Calling handleInfrastructureImprovementsQuestion with map:', effectiveMap);
        
        // Load the Next scene immediately
        if (window.mapComponent && typeof window.mapComponent.loadSceneByName === 'function') {
          console.log('Pre-loading Next scene for infrastructure improvements question');
          window.mapComponent.loadSceneByName("Next");
        }
        
        // Use Promise.resolve to make this non-blocking
        Promise.resolve().then(() => {
          handleInfrastructureImprovementsQuestion(effectiveMap, effectiveSetMessages, setIsLoading);
        });
        return;
      }
      
      await handlePanelQuestion(questionText, effectiveMap, effectiveSetMessages, setIsLoading);
    } catch (error) {
      console.error('Error in handlePredefinedQuestion:', error);
      effectiveSetMessages(prev => [...prev, {
        isUser: false,
        content: { 
          preGraphText: "Sorry, I encountered an error processing your request.", 
          postGraphText: "Please try again or select another question." 
        }
      }]);
    }
  }, [isCollapsed, map, selectedModel, effectiveMessages, effectiveSetMessages]);

  return (
    <>
      <Panel 
        $isCollapsed={isCollapsed}
        style={{ willChange: 'transform' }}
      >
        {effectiveMessages.length === 0 ? (
          <InitialQuestions
            handlePredefinedQuestion={handlePredefinedQuestion}
            selectedModel={selectedModel}
          />
        ) : (
          <MessageList
            messages={effectiveMessages}
            isLoading={isLoading}
            handlePredefinedQuestion={handlePredefinedQuestion}
            messagesEndRef={messagesEndRef}
            selectedModel={selectedModel}
          />
        )}
      </Panel>

      <CollapseButton 
        isCollapsed={isCollapsed}
        handleCollapseToggle={handleCollapseToggle}
      />
    </>
  );
};

export default AIChatPanel;
