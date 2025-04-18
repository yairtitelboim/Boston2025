import styled, { css, keyframes } from 'styled-components';
import {
  fadeIn,
  pulse,
  bounce,
  rotate,
  shimmer,
  clickEffect,
  selectedEffect,
  modelLoadingAnimation,
  modelIconPulse,
  loadingDotsAnimation,
  moveGradient,
  panelPulseAnimation,
  questionButtonGlow,
  questionScaleEffect,
  modelLoadComplete,
  modelChangeWave,
  colorTransition,
  accentLineExpand
} from './animations';
import { motion } from 'framer-motion';

// New keyframes for button effects
const buttonBlurEffect = keyframes`
  0% {
    filter: blur(0);
    transform: scale(1);
  }
  50% {
    filter: blur(2px);
    transform: scale(0.98);
  }
  100% {
    filter: blur(0);
    transform: scale(1);
  }
`;

// Add blink animation for Diffusion tag
const diffusionTagBlink = keyframes`
  0% {
    background-color: transparent;
    border-line: 2px solid #D66000;
    transform: scale(1);
  }
  50% {
    background-color: #D66000; /* darker orange */
    border-color: #D66000;
    border-line: 1px solid #D66000;
    transform: scale(1.20);
    box-shadow: 0 0 8px rgba(214, 96, 0, 0.7);
  }
  100% {
    background-color: #D66000; /* darker orange */
    border-color: #D66000;
    transform: scale(1.1);
  }
`;

const buttonHighlightEffect = keyframes`
  0% {
    filter: brightness(1) contrast(1);
    transform: scale(1);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
  50% {
    filter: brightness(1.5) contrast(1.2);
    transform: scale(1.02);
    box-shadow: 0 0 15px 5px rgba(var(--model-color-rgb), 0.5);
  }
  100% {
    filter: brightness(1) contrast(1);
    transform: scale(1);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
`;

const buttonClickEffect = keyframes`
  0% {
    transform: scale(1);
    filter: brightness(1);
    border-color: var(--accent-color);
    box-shadow: 0 0 0 0 rgba(var(--model-color-rgb), 0);
  }
  40% {
    transform: scale(0.96);
    filter: brightness(2);
    border-color: var(--accent-color);
    box-shadow: 0 0 20px 4px rgba(var(--model-color-rgb), 0.8);
  }
  100% {
    transform: scale(1);
    filter: brightness(1);
    border-color: var(--accent-color);
    box-shadow: 0 0 0 0 rgba(var(--model-color-rgb), 0);
  }
`;

// Add this new animation keyframe for the micro animation
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Animation keyframes
const playIconEnter = keyframes`
  from {
    opacity: 0;
    transform: scale(0);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const playIconHover = keyframes`
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.2);
  }
`;

// Add new keyframes for terminal animations
const typewriterAnimation = keyframes`
  from { width: 0 }
  to { width: 100% }
`;

const blinkCursor = keyframes`
  from, to { border-right-color: transparent }
  50% { border-right-color: #D66000 }
`;

const fadeInOut = keyframes`
  0% { opacity: 0; transform: translateY(5px); }
  10% { opacity: 1; transform: translateY(0); }
  90% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-5px); }
`;

// Add new loading animation keyframe
const loadingRotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// Add new keyframe for circle pulse
const circlePulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0.8;
  }
`;

// Main Panel Component
export const Panel = styled.div`
  position: absolute;
  left: 10px;
  top: 10px;
  width: 480px;
  background: transparent;
  color: white;
  display: flex;
  flex-direction: column;
  z-index: 1;
  transform: translateX(${props => props.$isCollapsed ? '-110%' : '0'});
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;

  @media (max-width: 768px) {
    position: fixed;
    width: 100%;
    height: 30vh;
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    transform: translateY(${props => props.$isCollapsed ? '100%' : '0'});
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
    z-index: 1000;
  }
`;

// Header Components
export const ChatHeader = styled.div`
  padding: 20px;
  font-size: 24px;
  font-weight: 500;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  @media (max-width: 768px) {
    padding: 12px;
    font-size: 18px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
`;

export const ModelSelectContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: ${props => props.$bgColor || '#0088cc'};
  border-radius: 6px;
  padding: 2px 6px;
  transition: background-color 0.3s ease, transform 0.3s ease, filter 0.3s ease;
  position: relative;
  overflow: hidden;
  transform: scale(0.6);
  margin-left: auto;
  
  &.loading {
    animation: ${panelPulseAnimation} 0.1s ease-in-out;
    filter: contrast(1.2) brightness(1.1);
    box-shadow: 0 0 6px 1px ${props => props.$bgColor || 'rgba(0, 136, 204, 0.5)'};
  }
`;

export const AIBadge = styled.div`
  display: flex;
  align-items: center;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.9);
  background: ${props => props.$bgColor ? `${props.$bgColor}30` : 'rgba(0, 136, 204, 0.2)'};
  padding: 1px 6px;
  border-radius: 3px;
  margin-left: 3px;
  border: 1px solid ${props => props.$bgColor ? `${props.$bgColor}40` : 'rgba(0, 136, 204, 0.3)'};
  
  svg {
    width: 8px;
    height: 8px;
    margin-right: 2px;
  }
`;

export const ModelLoadingIndicator = styled.div`
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 3px;
  background: ${props => props.$bgColor || 'white'};
  opacity: 0;
  transition: opacity 0.3s ease;
  
  .model-select-container.loading & {
    opacity: 1;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      ${props => props.$bgColor || 'white'},
      transparent
    );
    animation: none;
    box-shadow: 0 0 8px 1px ${props => props.$bgColor || 'white'};
    
    .model-select-container.loading & {
      animation: ${moveGradient} 0.3s infinite ease-in-out;
    }
  }
`;

export const LoadingDots = styled.div`
  display: none;
  align-items: center;
  margin-left: 6px;
  
  .model-select-container.loading & {
    display: flex;
  }
`;

export const LoadingDot = styled.div`
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: white;
  margin-right: 2px;
  opacity: 0.2;
  animation: ${props => css`${loadingDotsAnimation} 1.4s infinite`};
  animation-delay: ${props => props.$delay || '0s'};
`;

export const ModelIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-right: 2px;
  
  .model-select-container.loading & {
    animation: ${modelIconPulse} 1s ease-in-out infinite;
    
    svg {
      filter: drop-shadow(0 0 5px white);
    }
  }
  
  svg {
    width: 14px;
    height: 14px;
    transition: filter 0.3s ease;
  }
`;

export const ModelOptionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
`;

export const ModelSelect = styled.select`
  background-color: transparent;
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 4px;
  padding-right: 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  appearance: none;
  position: relative;
  z-index: 1;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 4px center;
  
  &:focus {
    outline: none;
  }
  
  .model-select-container.loading & {
    animation: ${modelLoadingAnimation} 0.7s ease-out;
    backdrop-filter: blur(4px);
    text-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
  }
`;

export const StyledOption = styled.option`
  background-color: ${props => props.$bgColor || '#1A1A1A'};
  color: white;
  padding: 8px 12px;
  font-weight: 500;
`;

// Chat Messages Components
export const ChatMessages = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  padding: 20px;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;

  @media (max-width: 768px) {
    padding: 12px;
    max-height: calc(30vh - 24px);
  }

  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

export const Message = styled.div`
  margin-bottom: 24px;
`;

export const MessageHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
`;

export const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #2A2A2A;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const Sender = styled.div`
  font-size: 18px;
  font-weight: 500;
`;

export const MessageContent = styled.div`
  font-size: 16px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.9);
`;

// Input Area Components
export const InputArea = styled.div`
  padding: 21px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 40px;
  background: linear-gradient(to bottom, transparent, #1A1A1A 20px);

  @media (max-width: 768px) {
    padding: 16px;
    position: sticky;
    bottom: 0;
    background: #1A1A1A;
    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.2);
    margin-top: 20px;
  }
`;

export const Input = styled.input`
  width: 100%;
  padding: 16px;
  background: #2A2A2A;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: white;
  font-size: 16px;
  transition: all 0.3s ease;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.2);
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.05);
  }
  
  @media (max-width: 768px) {
    padding: 12px 16px;
    border-radius: 24px;
    font-size: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) inset;
  }
`;

// Initial prompt components
export const InitialQuestionsContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: stretch;
  background: #1A1A1A;
  border-radius: 16px;
  position: relative;
  overflow: hidden;
  min-height: 140px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

export const LeftContainer = styled.div`
  flex: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
`;

export const RightContainer = styled.div`
  flex: 8;
  display: flex;
  align-items: center;
  padding: 12px;
  padding-left: 25px;
`;

export const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
`;

export const PlayIcon = styled.div`
  width: ${props => props.$isLoading ? '48px' : '0'};
  height: ${props => props.$isLoading ? '48px' : '0'};
  border-style: ${props => props.$isLoading ? 'solid' : 'solid'};
  border-width: ${props => props.$isLoading ? '4px' : '16px 0 16px 26px'};
  border-color: ${props => props.$isLoading 
    ? 'rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.2) #FFFFFF'
    : 'transparent transparent transparent #FFFFFF'};
  border-radius: ${props => props.$isLoading ? '50%' : '0'};
  margin-left: ${props => props.$isLoading ? '0' : '6px'};
  animation: ${props => props.$isLoading 
    ? css`${loadingRotate} 1s linear infinite`
    : css`${playIconEnter} 0.5s ease-out forwards`};
  transform-origin: center;
  transition: all 0.3s ease;
`;

export const PlayButton = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 8px solid #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;

  &:hover {
    border-color: ${props => props.$isLoading ? '#FFFFFF' : '#D66000'};
    
    ${PlayIcon} {
      border-color: ${props => props.$isLoading 
        ? 'rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.2) #FFFFFF'
        : 'transparent transparent transparent #D66000'};
      animation: ${props => props.$isLoading 
        ? css`${loadingRotate} 1s linear infinite`
        : css`${playIconHover} 0.3s forwards`};
    }
  }
`;

export const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-start;
`;

export const ModelBadge = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #FF6B00;
  cursor: pointer;
  margin-bottom: 4px;
  opacity: 0;
  animation: ${circlePulse} 2s infinite ease-in-out;
  animation-delay: 0.5s;
  animation-fill-mode: forwards;
  box-shadow: 0 0 10px rgba(255, 107, 0, 0.5);
`;

export const Title = styled.h1`
  font-size: 26px;
  font-weight: 900;
  color: #FFFFFF;
  margin: 0;
  display: block;
  line-height: 1;
  letter-spacing: 0.01em;
`;

export const Subtitle = styled.div`
  font-size: 17.5px;
  font-weight: 300;
  font-style: italic;
  color: #FFFFFF;
  margin: 0;
  margin-top: 4px;
  display: block;
  line-height: 1;
  letter-spacing: 0.03em;
`;

export const QuestionText = styled.div`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 8px;
  text-align: center;
  line-height: 1.4;
  max-width: 280px;
  font-weight: 400;
  letter-spacing: 0.2px;
`;

export const QuestionButton = styled(motion.button)`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 28px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 20px;
  backdrop-filter: blur(5px);

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  svg {
    transition: transform 0.3s ease;
  }

  &:hover svg {
    transform: translateX(3px);
  }

  &:active {
    transform: translateY(1px);
  }
`;

// Question components
export const QuestionIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 18px; /* Increased spacing */
  color: rgba(255, 255, 255, 0.9);
  flex-shrink: 0; /* Prevent icon from shrinking */
  
  svg {
    width: 22px; /* Slightly larger icons */
    height: 22px;
    filter: drop-shadow(0 0 4px ${props => props.$color || 'rgba(255, 255, 255, 0.3)'});
    animation: ${props => {
      switch(props.$animationType) {
        case 'pulse': return css`${pulse} 2s ease-in-out infinite`;
        case 'bounce': return css`${bounce} 1.5s ease-in-out infinite`;
        case 'rotate': return css`${rotate} 8s linear infinite`;
        default: return 'none';
      }
    }};
  }
`;

export const FollowUpButton = styled(QuestionButton)`
  margin-top: 12px;
  padding: 12px;
  font-size: 16px;
  opacity: 0;
  animation: ${fadeInUp} 0.4s ease-out forwards;
  animation-delay: ${props => props.$animationDelay || 0}s;
  width: 100%; /* Ensure full width alignment with element above */
  
  &:hover {
    opacity: 1;
    transform: translateY(-2px); /* Slight lift on hover */
    transition: transform 0.2s ease, opacity 0.2s ease;
  }
`;

export const SeeMoreButton = styled(QuestionButton)`
  background: var(--see-more-bg, linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.05)));
  border-color: var(--accent-color);
  margin-top: 35px;
  margin-bottom: 25px;
  padding: 16px 20px;
  font-size: 16px;
  
  &:hover {
    background: var(--see-more-hover-bg, linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.08)));
    border-color: var(--accent-color);
  }
  
  &.model-accent-active {
    border-color: var(--accent-color);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15),
      0 0 0 2px rgba(var(--model-color-rgb), 0.15);
  }
`;

export const AnimatedDiv = styled.div`
  margin-bottom: 6px; /* Reduced margin between buttons */
  opacity: 0;
  animation: ${props => css`${fadeIn} 0.5s ease-out forwards`};
  animation-delay: ${props => props.$delay}s;
  
  &.model-loading {
    animation: ${props => css`${modelChangeWave} 0.3s ease-in-out infinite, ${questionScaleEffect} 0.3s ease-in-out infinite`};
    opacity: 1;
    
    ${QuestionButton} {
      animation: ${props => css`${questionButtonGlow} 0.3s ease-in-out infinite, ${colorTransition} 0.6s ease-in-out infinite`};
      border-color: rgba(var(--model-color-rgb), 0.4);
      background: linear-gradient(135deg, 
        rgba(var(--model-color-rgb), 0.1), 
        rgba(var(--model-color-rgb), 0.2),
        rgba(var(--model-color-rgb), 0.1)
      );
      background-size: 200% 200%;
      
      &::before {
        background: rgba(var(--model-color-rgb), 0.7);
        box-shadow: 0 0 8px rgba(var(--model-color-rgb), 0.4);
      }
      
      ${QuestionIcon} {
        filter: drop-shadow(0 0 4px rgba(var(--model-color-rgb), 0.7));
        animation: ${props => css`${pulse} 0.3s ease-in-out infinite`};
        
        svg {
          animation: none;
          filter: drop-shadow(0 0 4px rgba(var(--model-color-rgb), 0.7));
        }
      }
    }
  }
`;

// Collapse Button Components
export const CollapseIconContainer = styled.div`
  position: absolute;
  bottom: 40px;
  z-index: 10;
  transition: left 0.3s ease;

  @media (max-width: 768px) {
    position: fixed;
    left: 70px;
    bottom: 20px;
    transform: ${props => props.$isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)'};
    z-index: 1001;
  }
`;

export const CollapseIcon = styled.div`
  width: 48px;
  height: 48px;
  background: rgba(0, 0, 0, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: all 0.2s ease;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.4);

  @media (max-width: 768px) {
    width: 56px;
    height: 56px;
    background: #1A1A1A;
    border-color: rgba(255, 255, 255, 0.2);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }

  svg {
    width: 26px;
    height: 26px;
    transform: rotate(${props => props.$isCollapsed ? '0deg' : '180deg'});
    transition: transform 0.3s ease;
  }

  &:hover {
    background: ${props => props.$isCollapsed ? 'rgba(0, 0, 0, 0.95)' : '#2A2A2A'};
    border-color: rgba(255, 255, 255, 0.4);
    transform: scale(1.05);
  }
`;

// Loading Components
export const LoadingMessage = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  color: rgba(255, 255, 255, 0.7);
`;

export const LoadingStep = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  opacity: 0;
  transform: translateY(10px);
  animation: ${props => css`${fadeIn} 0.3s ease-out forwards`};
  animation-delay: ${props => props.$delay}ms;

  .icon {
    font-size: 16px;
    min-width: 24px;
  }

  .text {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
  }

  .dots {
    color: rgba(255, 255, 255, 0.4);
    animation: ${props => css`${loadingDotsAnimation} 1.4s infinite`};
  }
`;

// Visualization Components
export const VisualizationCard = styled.div`
  background: #2A2A2A;
  border-radius: 12px;
  padding: 16px;
  margin: 16px 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  
  @media (max-width: 768px) {
    padding: 12px;
    margin: 12px 0;
    width: 100%;
    border-radius: 8px;
    > div {
      -webkit-overflow-scrolling: touch;
    }
  }
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  gap: 8px;
  
  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: white;
  }
`;

export const ModelCard = styled.div`
  background: #1A1A1A;
  border-radius: 8px;
  padding: 12px;
  margin: 8px 0;
  border-left: 3px solid ${props => props.$color};
`;

export const ModelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

export const ModelName = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${props => props.$color};
  }
  
  .name {
    font-weight: 600;
    color: white;
  }
`;

export const ModelStats = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  
  .risk-score {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 600;
    background: ${props => props.$color}20;
    color: ${props => props.$color};
  }
  
  .recovery-time {
    color: white;
    font-weight: 500;
  }
`;

export const ChartContainer = styled.div`
  height: 200px;
  width: 100%;
  margin: 16px 0;

  @media (max-width: 768px) {
    height: 160px;
    margin: 12px 0;
  }
`;

export const ChartLegend = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 8px;
  flex-wrap: wrap;
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    
    .label {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.7);
    }
  }
`;

export const InsightText = styled.p`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  font-style: italic;
  margin: 8px 0 0 0;
`;

// Skeleton Loading Components
export const SkeletonContainer = styled.div`
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  margin-bottom: 16px;
`;

export const SkeletonTitle = styled.div`
  height: 32px;
  width: 60%;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0.05) 100%
  );
  border-radius: 6px;
  margin-bottom: 24px;
  animation: ${shimmer} 1.5s infinite;
`;

export const SkeletonCard = styled.div`
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  margin-bottom: 16px;
`;

export const SkeletonHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
`;

export const SkeletonHeading = styled.div`
  height: 24px;
  width: 40%;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0.05) 100%
  );
  border-radius: 4px;
  animation: ${shimmer} 1.5s infinite;
`;

export const SkeletonCost = styled.div`
  height: 24px;
  width: 120px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0.05) 100%
  );
  border-radius: 4px;
  animation: ${shimmer} 1.5s infinite;
`;

export const SkeletonText = styled.div`
  height: 16px;
  width: ${props => props.$width || '100%'};
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0.05) 100%
  );
  border-radius: 4px;
  margin-bottom: 8px;
  animation: ${shimmer} 1.5s infinite;
`;

export const SkeletonMetrics = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 16px;
`;

export const SkeletonMetric = styled.div`
  height: 32px;
  flex: 1;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0.05) 100%
  );
  border-radius: 4px;
  animation: ${shimmer} 1.5s infinite;
`;

export const DiffusionTag = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  color: white;
  background: transparent;
  padding: 2px 6px;
  border-radius: 6px;
  margin-left: 8px;
  border: 1px solid white;
  cursor: pointer;
  transition: all 0.3s ease;
  transform: scale(0.6);
  
  &.active {
    background-color: #D66000;
    border-color: #D66000;
    color: white;
  }
  
  &.blinking {
    animation: ${diffusionTagBlink} 0.3s forwards;
  }
`;

export const TerminalContainer = styled.div`
  width: 100%;
  font-family: 'Courier New', monospace;
  color: #FFFFFF;
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.3s ease;
  padding-left: -10px;
  position: relative;
  height: 24px; /* Reduced height */
  overflow: hidden;
`;

export const TerminalLine = styled.div`
  font-size: 10px;
  font-weight: 300;
  white-space: nowrap;
  overflow: hidden;
  position: absolute;
  top: 4px;
  left: 4px;
  width: calc(100% - 24px);
  animation: ${fadeInOut} 1.8s forwards;
  opacity: 0;
  transform: translateY(20px);
  line-height: 1.2;

  &:before {
    content: '> ';
    color: #D66000;
    position: absolute;
    left: -16px;
  }
`;

export const ActiveTerminalLine = styled(TerminalLine)`
  opacity: 1;
  transform: translateY(0);
  border-right: 2px solid #D66000;
  animation: 
    ${typewriterAnimation} ${props => props.$duration || '1.5'}s steps(40, end),
    ${blinkCursor} 0.75s step-end infinite;
`;