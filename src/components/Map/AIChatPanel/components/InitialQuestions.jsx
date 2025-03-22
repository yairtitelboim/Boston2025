import React, { useEffect, useRef, memo } from 'react';
import { 
  Rocket, 
  Wand2, 
  ChevronRight, 
  Home,
  Scale,
  Map
} from 'lucide-react';
import { 
  InitialPrompt, 
  AnimatedDiv, 
  QuestionButton, 
  QuestionIcon, 
  SeeMoreButton 
} from '../StyledComponents';
import { MODEL_COLORS } from '../mockData';

// Create a ref accessible outside the component to reference the instance
// This allows us to manipulate the DOM without needing re-renders
const questionsContainerRef = React.createRef();

const InitialQuestions = ({ 
  handlePredefinedQuestion, 
  selectedModel 
}) => {
  console.log('InitialQuestions rendering with model:', selectedModel);
  
  // Create refs to access buttons for animation
  const buttonRefs = useRef([]);
  const initialRender = useRef(true);
  const componentInstanceId = useRef(`questions-${Math.random().toString(36).substring(2, 9)}`);

  // Helper function to apply the model color theme to elements
  const getModelTheme = () => {
    const theme = MODEL_COLORS[selectedModel] || MODEL_COLORS.claude3;
    console.log('Getting model theme:', theme, 'for model:', selectedModel);
    return theme;
  };

  // Helper function to convert hex color to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
      `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
      '0, 136, 204'; // Default fallback color
  };

  // Add a data attribute to help identify this component instance
  useEffect(() => {
    if (questionsContainerRef.current) {
      questionsContainerRef.current.setAttribute('data-instance-id', componentInstanceId.current);
      console.log('Set instance ID on container:', componentInstanceId.current);
      
      // Apply accent colors for all buttons on initial render
      const modelColor = MODEL_COLORS[selectedModel] || MODEL_COLORS.claude3;
      document.querySelectorAll('.initial-question').forEach(button => {
        button.classList.add('model-accent-active');
      });
    }
  }, []);

  // Effect to update button properties when model changes
  useEffect(() => {
    console.log('🔄 InitialQuestions useEffect triggered');
    console.log('📱 Selected Model:', selectedModel);
    console.log('🎯 Initial Render:', initialRender.current);
    console.log('🔍 Questions Container Ref:', questionsContainerRef.current);
    console.log('🔢 Button Refs Count:', buttonRefs.current.length);
    
    if (!initialRender.current) {
      console.log('♻️ Not initial render - parent handles animation');
      
      // Debug current button states
      buttonRefs.current.forEach((buttonRef, index) => {
        if (buttonRef) {
          console.log(`🔘 Button ${index} classes:`, buttonRef.className);
          console.log(`🎨 Button ${index} accent color:`, buttonRef.style.getPropertyValue('--accent-color'));
          console.log(`✨ Button ${index} has model-highlight:`, buttonRef.classList.contains('model-highlight'));
          console.log(`💫 Button ${index} has model-accent-active:`, buttonRef.classList.contains('model-accent-active'));
        }
      });
    } else {
      console.log('🎬 Initial render - setting up initial state');
      initialRender.current = false;
      
      // Debug initial setup
      if (questionsContainerRef.current) {
        const buttons = questionsContainerRef.current.querySelectorAll('.initial-question');
        console.log('📊 Initial button count:', buttons.length);
        buttons.forEach((button, index) => {
          console.log(`🔄 Initial setup for button ${index}:`, button.className);
        });
      }
    }
  }, [selectedModel]);

  // Add debug log before render
  console.log('🎨 InitialQuestions render', {
    selectedModel,
    modelTheme: getModelTheme(),
    buttonCount: buttonRefs.current.length,
    instanceId: componentInstanceId.current
  });

  console.log('InitialQuestions before return, model:', selectedModel);
  console.log('Button count in component:', buttonRefs.current.length);
  
  // Add a click handler wrapper
  const handleQuestionClick = (questionText) => {
    console.log('🖱️ Question clicked:', questionText);
    
    // Get the clicked button
    const button = buttonRefs.current.find(ref => 
      ref && ref.textContent.includes(questionText)
    );
    
    if (button) {
      console.log('✨ Adding click animation class');
      button.classList.add('clicking');
      
      // Let the click animation complete before handling the question
      setTimeout(() => {
        console.log('🎭 Click animation complete, removing class');
        button.classList.remove('clicking');
        
        // Small delay before starting model change
        setTimeout(() => {
          console.log('🚀 Processing question:', questionText);
          handlePredefinedQuestion(questionText);
        }, 50);
      }, 150); // Match this to the animation duration
    } else {
      console.log('⚠️ Button ref not found for:', questionText);
      handlePredefinedQuestion(questionText);
    }
  };

  return (
    <div ref={questionsContainerRef} className="questions-container">
      <InitialPrompt>
        <div style={{ 
          fontSize: '26px', 
          marginBottom: '50px',
          marginTop: '15px',
          fontWeight: 700,
          fontFamily: "'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          lineHeight: 1.4,
        }}>
          Navigate LA's urban complexity: <span style={{ fontWeight: 900, color: '#fffdfa' }}>Identifying strategic intervention points</span> for walkable futures
        </div>
      </InitialPrompt>

      <AnimatedDiv $delay={0} style={{ marginTop: '30px', marginBottom: '20px' }} className="AnimatedDiv">
        <QuestionButton 
          ref={el => {
            buttonRefs.current[0] = el;
            if (el) console.log('Button ref 0 set:', el.textContent.trim().substring(0, 20) + '...');
          }}
          onClick={() => handleQuestionClick("Find neighborhoods primed for value explosion")}
          $accentColor={getModelTheme()}
          $iconGlow={getModelTheme()}
          $modelColorRgb={hexToRgb(getModelTheme())}
          $bgGradient={`linear-gradient(135deg, ${getModelTheme()}20, ${getModelTheme()}20)`}
          $hoverBgGradient={`linear-gradient(135deg, ${getModelTheme()}30, ${getModelTheme()}40)`}
          className="initial-question"
        >
          <QuestionIcon $animationType="pulse" $color={getModelTheme()} className="QuestionIcon">
            <Rocket strokeWidth={1.5} />
          </QuestionIcon>
          <span>Find neighborhoods primed for value explosion</span>
        </QuestionButton>
      </AnimatedDiv>

      <AnimatedDiv $delay={0} style={{ marginBottom: '20px' }} className="AnimatedDiv">
        <QuestionButton 
          ref={el => buttonRefs.current[1] = el}
          onClick={() => handleQuestionClick("Where could minimal changes create maximum impact?")}
          $accentColor={getModelTheme()}
          $iconGlow={getModelTheme()}
          $modelColorRgb={hexToRgb(getModelTheme())}
          $bgGradient={`linear-gradient(135deg, ${getModelTheme()}20, ${getModelTheme()}20)`}
          $hoverBgGradient={`linear-gradient(135deg, ${getModelTheme()}30, ${getModelTheme()}40)`}
          className="initial-question"
        >
          <QuestionIcon $animationType="rotate" $color={getModelTheme()} className="QuestionIcon">
            <Wand2 strokeWidth={1.5} />
          </QuestionIcon>
          <span>Where could minimal changes create maximum impact?</span>
        </QuestionButton>
      </AnimatedDiv>

      <AnimatedDiv $delay={0} style={{ marginBottom: '20px' }} className="AnimatedDiv">
        <QuestionButton 
          ref={el => buttonRefs.current[2] = el}
          onClick={() => handleQuestionClick("Which neighborhoods would transform with just one policy change?")}
          $accentColor={getModelTheme()}
          $iconGlow={getModelTheme()}
          $modelColorRgb={hexToRgb(getModelTheme())}
          $bgGradient={`linear-gradient(135deg, ${getModelTheme()}20, ${getModelTheme()}20)`}
          $hoverBgGradient={`linear-gradient(135deg, ${getModelTheme()}30, ${getModelTheme()}40)`}
          className="initial-question"
        >
          <QuestionIcon $animationType="rotate" $color={getModelTheme()} className="QuestionIcon">
            <Scale strokeWidth={1.5} />
          </QuestionIcon>
          <span>Which neighborhoods would transform with just one policy change?</span>
        </QuestionButton>
      </AnimatedDiv>
      
      <AnimatedDiv $delay={0} style={{ marginBottom: '20px' }} className="AnimatedDiv">
        <QuestionButton 
          ref={el => buttonRefs.current[3] = el}
          onClick={() => handleQuestionClick("Map housing opportunity gaps near job centers")}
          $accentColor={getModelTheme()}
          $iconGlow={getModelTheme()}
          $modelColorRgb={hexToRgb(getModelTheme())}
          $bgGradient={`linear-gradient(135deg, ${getModelTheme()}20, ${getModelTheme()}20)`}
          $hoverBgGradient={`linear-gradient(135deg, ${getModelTheme()}30, ${getModelTheme()}40)`}
          className="initial-question"
        >
          <QuestionIcon $animationType="pulse" $color={getModelTheme()} className="QuestionIcon">
            <Home strokeWidth={1.5} />
          </QuestionIcon>
          <span>Map housing opportunity gaps near job centers</span>
        </QuestionButton>
      </AnimatedDiv>
      
      <AnimatedDiv $delay={0} style={{ marginBottom: '100px' }} className="AnimatedDiv">
        <SeeMoreButton 
          ref={el => buttonRefs.current[4] = el}
          onClick={() => handleQuestionClick("Show me more policy optimization opportunities")}
          $modelColorRgb={hexToRgb(getModelTheme())}
          className="initial-question"
        >
          <QuestionIcon $animationType="bounce" $color={getModelTheme()} className="QuestionIcon">
            <ChevronRight strokeWidth={1.5} />
          </QuestionIcon>
          <span>See more options</span>
        </SeeMoreButton>
      </AnimatedDiv>
    </div>
  );
};

// Use React.memo with a comparison function that ALWAYS returns true
// This effectively prevents ANY re-renders of this component after initial mounting
const MemoizedInitialQuestions = memo(InitialQuestions, () => {
  console.log('Memo comparison function called - Always returning true to prevent re-renders');
  return true; // Always prevent re-renders
});

// Export the component and the ref to access it
export default MemoizedInitialQuestions;
export { questionsContainerRef }; 