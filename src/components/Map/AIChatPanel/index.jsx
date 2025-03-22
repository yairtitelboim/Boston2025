import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Panel, ChatHeader } from './StyledComponents';
import { 
  handlePanelQuestion, 
  handleQuickAction, 
  handleUrbanImpactQuestion, 
  handleServiceCorridorsQuestion,
  handleInfrastructureImprovementsQuestion,
  MOCK_RESPONSES 
} from '../../../services/claude';
import { handlePanelCollapse } from '../hooks/mapAnimations';
import { Sparkles } from 'lucide-react';
import { MODEL_COLORS } from './mockData';

// Import components
import ModelSelector from './components/ModelSelector';
import MessageList from './components/MessageList';
import InputArea from './components/InputArea';
import InitialQuestions, { questionsContainerRef } from './components/InitialQuestions';
import CollapseButton from './components/CollapseButton';

const AIChatPanel = ({ messages, setMessages, handleQuestion, map, initialCollapsed = true }) => {
  // Initialize local messages state if not provided as a prop
  const [localMessages, setLocalMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
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
    // Check for focusOnLoadingIndicators flag
    if (!window.focusOnLoadingIndicators) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      // When user submits a question, open the panel if it's closed
      if (isCollapsed) {
        setIsCollapsed(false);
      }
      await handlePanelQuestion(inputValue.trim(), map, effectiveSetMessages, setIsLoading);
      setInputValue('');
    }
  };

  const handleModelChange = (e) => {
    console.log('🎨 ========== MODEL CHANGE START ==========');
    console.log('🔄 Current model:', selectedModel);
    console.log('🎯 Target model:', e.target.value);
    
    const newModel = e.target.value;
    const modelColor = MODEL_COLORS[newModel];
    
    console.log('🎨 New model color:', modelColor);
    console.log('🔍 Initial questions before DOM manipulation:', document.querySelectorAll('.initial-question').length);
    
    // Set loading UI for model selector only
    const modelSelectContainer = document.querySelector('.model-select-container');
    if (modelSelectContainer) {
      console.log('✨ Adding loading class to model select container');
      modelSelectContainer.classList.add('loading');
    } else {
      console.log('⚠️ WARNING: Could not find model select container');
    }
    
    // Update all buttons simultaneously with the new color
    document.querySelectorAll('.initial-question').forEach((button, index) => {
      console.log(`🔘 Processing button ${index}:`, button.textContent.trim().substring(0, 20) + '...');
      
      // Update the CSS variable for RGB
      const rgbValue = hexToRgb(modelColor);
      console.log(`🌈 Setting RGB value for button ${index}:`, rgbValue);
      button.style.setProperty('--model-color-rgb', rgbValue);
      
      // Update the background gradients directly 
      button.style.background = `linear-gradient(135deg, ${modelColor}20, ${modelColor}20)`;
      button.style.setProperty('--hover-gradient', `linear-gradient(135deg, ${modelColor}30, ${modelColor}40)`);
      
      // Update accent colors - this will persist as the stroke color
      console.log(`💫 Setting accent color for button ${index}:`, modelColor);
      button.style.setProperty('--accent-color', modelColor);
      button.style.setProperty('--icon-glow', modelColor);
      
      // Directly style the accent line (::before pseudo-element)
      button.style.borderColor = `${modelColor}30`;
      
      // Special handling for the "See more options" button
      if (button.textContent.trim().includes("See more options")) {
        console.log('🔧 Configuring See More button');
        button.style.setProperty('--see-more-bg', `linear-gradient(135deg, ${modelColor}20, ${modelColor}30)`);
        button.style.setProperty('--see-more-hover-bg', `linear-gradient(135deg, ${modelColor}30, ${modelColor}40)`);
        button.style.borderColor = `${modelColor}40`;
      }
      
      // Apply highlight effect
      console.log(`✨ Adding model-highlight class to button ${index}`);
      button.classList.add('model-highlight');
    });
    
    // Update icon colors
    document.querySelectorAll('.QuestionIcon').forEach((icon, index) => {
      console.log(`🎨 Setting icon color ${index}:`, modelColor);
      icon.style.color = modelColor;
    });
    
    // Apply the new model selection WITHOUT updating React state yet
    document.querySelectorAll('.model-select').forEach(select => {
      console.log('🔄 Setting select value to', newModel);
      select.value = newModel;
    });
    
    // Use a single timeout for the entire animation - longer duration for visibility
    console.log('⏱️ Setting timeout for state update (400ms)');
    setTimeout(() => {
      console.log('⚡ Timeout callback executing');
      
      // Update the React state
      requestAnimationFrame(() => {
        console.log('🔄 Updating selectedModel state to', newModel);
        setSelectedModel(newModel);
      });
      
      // Remove loading UI for model selector
      if (modelSelectContainer) {
        console.log('🔄 Removing loading class from model select container');
        modelSelectContainer.classList.remove('loading');
      }
      
      // After a longer delay, remove ONLY the highlight effect
      // but preserve the color changes
      setTimeout(() => {
        document.querySelectorAll('.initial-question').forEach((button, index) => {
          console.log(`🎭 Removing model-highlight class from button ${index}`);
          button.classList.remove('model-highlight');
          
          // Add a persistent style class for the accent
          console.log(`✨ Adding model-accent-active class to button ${index}`);
          button.classList.add('model-accent-active');
          
          // Ensure the ::before element keeps the accent color
          const computedStyle = window.getComputedStyle(button, '::before');
          if (computedStyle) {
            console.log(`💫 Forcing accent color recalculation for button ${index}`);
            button.style.setProperty('--accent-color', modelColor);
          }
        });
        console.log('🎉 ========== MODEL CHANGE COMPLETE ==========');
      }, 400); // Increased from 100ms to 400ms to match the animation duration
    }, 400); // Increased from 100ms to 400ms
  };

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
      
      // For hardcoded questions like "Where are the major flood-prone areas?", 
      // we can directly use the mock response if available
      if (questionText === "Where are the major flood-prone areas?" && 
          MOCK_RESPONSES && MOCK_RESPONSES[questionText]) {
        effectiveSetMessages(prev => [
          ...prev,
          { isUser: true, content: questionText },
          { isUser: false, content: JSON.parse(MOCK_RESPONSES[questionText].content[0].text) }
        ]);
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

  // Add console log to show dependencies
  console.log('Dependencies for handlePredefinedQuestion:', {
    isCollapsed,
    map: !!map,
    setMessages: !!effectiveSetMessages,
    setIsLoading: !!setIsLoading,
    selectedModel
  });

  return (
    <>
      <Panel 
        $isCollapsed={isCollapsed}
        style={{ willChange: 'transform' }}
      >
        <ChatHeader>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', width: '100%' }}>
            <ModelSelector 
              selectedModel={selectedModel}
              handleModelChange={handleModelChange}
            />
          </div>
        </ChatHeader>

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

        <InputArea
          inputValue={inputValue}
          setInputValue={setInputValue}
          handleSubmit={handleSubmit}
        />
      </Panel>

      <CollapseButton 
        isCollapsed={isCollapsed}
        handleCollapseToggle={handleCollapseToggle}
      />
    </>
  );
};

export default AIChatPanel;
