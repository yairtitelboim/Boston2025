import React, { useEffect, useRef, useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { handlePanelQuestion, handleQuickAction, handleUrbanImpactQuestion, MOCK_RESPONSES, URBAN_IMPACT_GRAPH_DATA } from '../../services/claude';
import { initializePanelAnimations, handlePanelCollapse } from './hooks/mapAnimations';
import { 
  AlertTriangle, 
  Building, 
  BarChart2, 
  Clock, 
  Map as MapIcon,
  ArrowRight,
  Rocket,
  Zap,
  Wand2,
  ChevronRight,
  Home,
  Sparkles,
  Brain,
  Cpu,
  Sparkle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ZAxis,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Mock data for a 15-minute city analysis cluster
const clusterData = {
  name: "Downtown LA Arts District",
  type: "Mixed-Use Urban Core",
  walkScore: 92,
  bikeScore: 86,
  transitScore: 88,
  address: "Arts District",
  city: "Los Angeles, CA 90013",
  amenitiesWithin15Min: 284,
  essentialServices: "95%",
  greenSpaces: "12 acres",
  lastMajorDev: "2022",
  keyFeatures: "Creative Offices, Residential Lofts, Art Galleries, Restaurants",
  imageUrl: "https://images.unsplash.com/photo-1582225373839-3f67b3057106?q=80&w=2787&auto=format&fit=crop"
};

// LLM models for analysis
const llmModels = [
  { id: 'gpt4', name: 'GPT-4', color: '#3b82f6', confidence: 89 },
  { id: 'claude3', name: 'Claude 3', color: '#8b5cf6', confidence: 92 },
  { id: 'llama3', name: 'Llama 3', color: '#10b981', confidence: 85 },
  { id: 'deepseek', name: 'DeepSeek-R1', color: '#f97316', confidence: 87 }
];

// Add milestone categories for 15-minute city metrics
const milestoneCategories = {
  'Mobility': {
    color: '#4B5563',
    factors: ['Public Transit', 'Bike Infrastructure']
  },
  'Accessibility': {
    color: '#047857',
    factors: ['Essential Services', 'Green Spaces']
  },
  'Urban Design': {
    color: '#1D4ED8',
    factors: ['Mixed-Use Development', 'Walkability']
  }
};

// Update risk factor data with 15-minute city metrics
const accessibilityData = [
  { 
    factor: 'Public Transit',
    category: 'Mobility',
    'GPT-4': 85, 
    'Claude 3': 88, 
    'Llama 3': 82,
    'DeepSeek-R1': 84,
    description: '4 metro stops within 10-minute walk',
    impact: 'Excellent transit connectivity'
  },
  { 
    factor: 'Bike Infrastructure',
    category: 'Mobility', 
    'GPT-4': 75, 
    'Claude 3': 78, 
    'Llama 3': 72,
    'DeepSeek-R1': 76,
    description: '8.5 miles of protected bike lanes',
    impact: 'Strong cycling infrastructure'
  },
  { 
    factor: 'Essential Services',
    category: 'Accessibility', 
    'GPT-4': 92, 
    'Claude 3': 90, 
    'Llama 3': 88,
    'DeepSeek-R1': 89,
    description: '95% of essentials within 15 minutes',
    impact: 'Excellent daily needs access'
  },
  { 
    factor: 'Green Spaces',
    category: 'Accessibility', 
    'GPT-4': 68, 
    'Claude 3': 65, 
    'Llama 3': 70,
    'DeepSeek-R1': 66,
    description: '12 acres of parks and plazas',
    impact: 'Moderate green space access'
  },
  { 
    factor: 'Mixed-Use Development',
    category: 'Urban Design', 
    'GPT-4': 88, 
    'Claude 3': 85, 
    'Llama 3': 82,
    'DeepSeek-R1': 84,
    description: '78% mixed-use zoning',
    impact: 'Strong land use diversity'
  },
  { 
    factor: 'Walkability',
    category: 'Urban Design', 
    'GPT-4': 95, 
    'Claude 3': 92, 
    'Llama 3': 90,
    'DeepSeek-R1': 93,
    description: 'Walk Score: 92/100',
    impact: 'Excellent pedestrian environment'
  }
];

// Recovery timeline data
const recoveryTimelineData = [
  { day: 0, 'GPT-4': 0, 'Claude 3': 0, 'Llama 3': 0, 'DeepSeek-R1': 0 },
  { day: 2, 'GPT-4': 8, 'Claude 3': 15, 'Llama 3': 5, 'DeepSeek-R1': 3 },
  { day: 4, 'GPT-4': 21, 'Claude 3': 32, 'Llama 3': 11, 'DeepSeek-R1': 9 },
  { day: 6, 'GPT-4': 36, 'Claude 3': 48, 'Llama 3': 18, 'DeepSeek-R1': 16 },
  { day: 8, 'GPT-4': 47, 'Claude 3': 62, 'Llama 3': 26, 'DeepSeek-R1': 35 },
  { day: 10, 'GPT-4': 58, 'Claude 3': 73, 'Llama 3': 35, 'DeepSeek-R1': 52 },
  { day: 12, 'GPT-4': 67, 'Claude 3': 81, 'Llama 3': 43, 'DeepSeek-R1': 63 },
  { day: 14, 'GPT-4': 74, 'Claude 3': 89, 'Llama 3': 51, 'DeepSeek-R1': 70 },
  { day: 16, 'GPT-4': 81, 'Claude 3': 94, 'Llama 3': 58, 'DeepSeek-R1': 76 },
  { day: 18, 'GPT-4': 86, 'Claude 3': 98, 'Llama 3': 65, 'DeepSeek-R1': 82 },
  { day: 20, 'GPT-4': 91, 'Claude 3': 100, 'Llama 3': 71, 'DeepSeek-R1': 87 },
  { day: 24, 'GPT-4': 97, 'Claude 3': 100, 'Llama 3': 83, 'DeepSeek-R1': 95 },
  { day: 28, 'GPT-4': 100, 'Claude 3': 100, 'Llama 3': 91, 'DeepSeek-R1': 98 },
  { day: 32, 'GPT-4': 100, 'Claude 3': 100, 'Llama 3': 96, 'DeepSeek-R1': 100 },
  { day: 36, 'GPT-4': 100, 'Claude 3': 100, 'Llama 3': 100, 'DeepSeek-R1': 100 }
];

// Model conclusions
const modelConclusions = [
  {
    id: 'llama3',
    name: 'Llama 3',
    color: '#10b981',
    recoveryTime: '36 days',
    riskScore: 78,
    keyInsight: 'Elevation is the dominant risk factor',
    uniqueFinding: 'Historical flood patterns suggest longer recovery periods than other models predict'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek-R1',
    color: '#f97316',
    recoveryTime: '32 days',
    riskScore: 73,
    keyInsight: 'Elevation combined with bayou proximity creates compound risk',
    uniqueFinding: 'Retail businesses recover significantly slower than office spaces in this area'
  },
  {
    id: 'gpt4',
    name: 'GPT-4',
    color: '#3b82f6',
    recoveryTime: '24 days',
    riskScore: 65,
    keyInsight: 'Power infrastructure is the critical path dependency',
    uniqueFinding: 'Building proximity to backup power grid significantly reduces recovery time'
  },
  {
    id: 'claude3',
    name: 'Claude 3',
    color: '#8b5cf6',
    recoveryTime: '20 days',
    riskScore: 52,
    keyInsight: 'Business continuity plans most important for rapid recovery',
    uniqueFinding: 'Tenants with remote work capabilities recover 42% faster than those without'
  }
];

// Add color constants for each model (using the same colors from claude.js)
const MODEL_COLORS = {
  gpt4: '#3b82f6',     // blue
  claude3: '#8b5cf6',  // purple
  llama3: '#10b981',   // green
  deepseek: '#f97316'  // orange
};

// Add all keyframe animations at the top of the file
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const bounce = keyframes`
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
`;

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

// Add loading animation keyframes
const modelLoadingAnimation = keyframes`
  0% { opacity: 0.7; transform: scale(0.95); }
  50% { opacity: 1; transform: scale(1.05); }
  100% { opacity: 1; transform: scale(1); }
`;

// Add pulse animation for the model icon
const modelIconPulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.08); }
  100% { transform: scale(1); }
`;

// Add a loading dots animation
const loadingDotsAnimation = keyframes`
  0%, 100% { opacity: 0.2; }
  20% { opacity: 1; }
  40% { opacity: 0.2; }
`;

// Add moveGradient animation for loading indicator
const moveGradient = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

// Add click animation
const clickEffect = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(0.97);
  }
  100% {
    transform: scale(1);
  }
`;

// Add selection animation
const selectedEffect = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

// Add shimmer animation to the top keyframes
const shimmer = keyframes`
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
`;

// Add this styled component near other animations
`;
const Panel = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 35%;
  background: #1A1A1A;
  color: white;
  display: flex;
  flex-direction: column;
  z-index: 1;
  transform: translateX(${props => props.$isCollapsed ? '-100%' : '0'});
  transition: transform 0.3s ease;
  box-shadow: ${props => props.$isCollapsed ? 'none' : '0 0 20px rgba(0,0,0,0.5)'};

  @media (max-width: 768px) {
    position: fixed;
    width: 100%;
    height: 60vh;
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    transform: translateY(${props => props.$isCollapsed ? '100%' : '0'});
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
    z-index: 1000;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
`;

const ChatHeader = styled.div`
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

const ChatMessages = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  padding: 20px;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch; /* For smoother scrolling on iOS */

  @media (max-width: 768px) {
    padding: 12px;
    max-height: calc(60vh - 138px); /* Adjust based on header and input area heights */
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

const Message = styled.div`
  margin-bottom: 24px;
`;

const MessageHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
`;

const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #2A2A2A;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Sender = styled.div`
  font-size: 18px;
  font-weight: 500;
`;

const MessageContent = styled.div`
  font-size: 16px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.9);
`;

const InputArea = styled.div`
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);

  @media (max-width: 768px) {
    padding: 16px;
    position: sticky;
    bottom: 0;
    background: #1A1A1A;
    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.2);
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 16px;
  background: #2A2A2A;
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 16px;
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  @media (max-width: 768px) {
    padding: 12px 16px;
    border-radius: 24px;
    font-size: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) inset;
  }
`;

const InitialPrompt = styled.div`
  text-align: center;
  font-size: 20px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 60px; /* Adjusted spacing */
  padding: 0 20px;
  position: relative;
  
  /* Add divider line */
  &::after {
    content: '';
    position: absolute;
    bottom: -30px;
    left: 50%;
    transform: translateX(-50%);
    width: 80%;
    height: 1px;
    background: linear-gradient(to right, 
      rgba(255, 255, 255, 0), 
      rgba(255, 255, 255, 0.2) 50%, 
      rgba(255, 255, 255, 0));
  }
`;

const PromptText = styled.div`
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 300;
  margin-top: 12px;
  line-height: 1.4;
  max-width: 85%;
  margin-left: auto;
  margin-right: auto;
`;

// Define QuestionIcon before QuestionButton that references it
const QuestionIcon = styled.div`
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

const QuestionButton = styled.button`
  width: 92%; /* Slightly narrower for better spacing */
  margin: 18px auto; /* Increased vertical spacing */
  padding: 16px 18px; /* More padding */
  background: ${props => 
    props.$bgGradient || 
    'linear-gradient(135deg, rgba(50, 50, 50, 0.6), rgba(40, 40, 40, 0.8))'};
  background-size: 200% 200%;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px; /* More rounded corners */
  color: white;
  font-size: 17px;
  font-weight: 400;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15); /* Enhanced shadow */
  position: relative;
  overflow: hidden;
  
  /* Colored accent line */
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px; /* Slightly wider accent */
    background: ${props => props.$accentColor || 'rgba(255, 255, 255, 0.2)'};
    border-top-left-radius: 16px;
    border-bottom-left-radius: 16px;
    transition: width 0.3s ease;
  }
  
  &:hover {
    background: ${props => 
      props.$hoverBgGradient || 
      'linear-gradient(135deg, rgba(60, 60, 60, 0.7), rgba(50, 50, 50, 0.9))'};
    border-color: rgba(255, 255, 255, 0.25);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
    transform: translateY(-2px);
    
    &::before {
      width: 6px; /* Expand accent on hover */
    }
    
    ${QuestionIcon} {
      svg {
        animation-duration: 1s;
        filter: drop-shadow(0 0 6px ${props => props.$iconGlow || 'rgba(255, 255, 255, 0.7)'});
      }
    }
  }
  
  &:active {
    animation: ${props => css`${clickEffect} 0.3s ease-out`};
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  
  &.selected {
    animation: ${props => css`${selectedEffect} 4s ease infinite`};
  }
`;

const FollowUpButton = styled(QuestionButton)`
  margin-top: 12px;
  padding: 12px;
  font-size: 16px;
  opacity: 0.8;
  &:hover {
    opacity: 1;
  }
`;

const SeeMoreButton = styled(QuestionButton)`
  background: linear-gradient(135deg, rgba(0, 100, 150, 0.4), rgba(0, 80, 120, 0.5));
  border: 1px solid rgba(0, 136, 204, 0.3);
  margin-top: 30px; /* More spacing before this button */
  padding: 14px 18px;
  font-size: 16px;
  
  &:hover {
    background: linear-gradient(135deg, rgba(0, 120, 170, 0.5), rgba(0, 100, 140, 0.6));
    border-color: rgba(0, 136, 204, 0.5);
  }
  
  &::before {
    background: rgba(0, 136, 204, 0.7);
  }
`;

const AnimatedDiv = styled.div`
  margin-bottom: 12px;
  opacity: 0;
  animation: ${props => css`${fadeIn} 0.5s ease-out forwards`};
  animation-delay: ${props => props.$delay}s;
`;

const CollapseIconContainer = styled.div`
  position: absolute;
  left: ${props => props.$isCollapsed ? '10px' : '35%'};
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  transition: left 0.3s ease;

  @media (max-width: 768px) {
    position: fixed;
    left: 50%;
    top: ${props => props.$isCollapsed ? 'auto' : 'calc(40vh - 28px)'};
    bottom: ${props => props.$isCollapsed ? '20px' : 'auto'};
    transform: translateX(-50%) ${props => props.$isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)'};
    z-index: 1001;
  }
`;

const CollapseIcon = styled.div`
  width: 48px;
  height: 48px;
  background: rgba(0, 0, 0, 0.85);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: all 0.2s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);

  @media (max-width: 768px) {
    width: 56px;
    height: 56px;
    background: #1A1A1A;
    border-color: rgba(255, 255, 255, 0.2);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }

  svg {
    width: 24px;
    height: 24px;
    transform: rotate(${props => props.$isCollapsed ? '0deg' : '180deg'});
    transition: transform 0.3s ease;
  }

  &:hover {
    background: ${props => props.$isCollapsed ? 'rgba(0, 0, 0, 0.95)' : '#2A2A2A'};
    border-color: rgba(255, 255, 255, 0.3);
  }
`;

const LoadingMessage = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  color: rgba(255, 255, 255, 0.7);
`;

const LoadingStep = styled.div`
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

// New styled components for visualizations
const VisualizationCard = styled.div`
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

const CardHeader = styled.div`
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

const ModelCard = styled.div`
  background: #1A1A1A;
  border-radius: 8px;
  padding: 12px;
  margin: 8px 0;
  border-left: 3px solid ${props => props.$color};
`;

const ModelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const ModelName = styled.div`
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

const ModelStats = styled.div`
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

const ChartContainer = styled.div`
  height: 200px;
  width: 100%;
  margin: 16px 0;

  @media (max-width: 768px) {
    height: 160px;
    margin: 12px 0;
  }
`;

const ChartLegend = styled.div`
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

const InsightText = styled.p`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  font-style: italic;
  margin: 8px 0 0 0;
`;

// Adding a custom ModelSelect dropdown component
const ModelSelectContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: ${props => props.$bgColor || '#0088cc'};
  border-radius: 8px;
  padding: 4px 8px;
  transition: background-color 0.3s ease;
  position: relative;
  overflow: hidden;
  
  ${props => props.$isLoading && css`
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(
        90deg, 
        ${props => props.$bgColor}10,
        ${props => props.$bgColor}40,
        ${props => props.$bgColor}10
      );
      animation: ${css`${shimmer} 1.5s infinite`};
      background-size: 200% 100%;
    }
  `}
`;

// Update AIBadge to use theme color
const AIBadge = styled.div`
  display: flex;
  align-items: center;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.9);
  background: ${props => props.$bgColor ? `${props.$bgColor}30` : 'rgba(0, 136, 204, 0.2)'};
  padding: 2px 5px;
  border-radius: 3px;
  margin-left: 5px;
  border: 1px solid ${props => props.$bgColor ? `${props.$bgColor}40` : 'rgba(0, 136, 204, 0.3)'};
  
  svg {
    width: 10px;
    height: 10px;
    margin-right: 3px;
  }
`;

// Create a model loading indicator component
const ModelLoadingIndicator = styled.div`
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: ${props => props.$bgColor || 'white'};
  opacity: ${props => props.$isLoading ? 1 : 0};
  transition: opacity 0.3s ease;
  
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
    animation: ${props => props.$isLoading ? css`${moveGradient} 1.5s infinite ease-in-out` : 'none'};
  }
`;

// Create a LoadingDots component
const LoadingDots = styled.div`
  display: ${props => props.$isLoading ? 'flex' : 'none'};
  align-items: center;
  margin-left: 6px;
`;

const LoadingDot = styled.div`
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: white;
  margin-right: 2px;
  opacity: 0.2;
  animation: ${props => css`${loadingDotsAnimation} 1.4s infinite`};
  animation-delay: ${props => props.$delay || '0s'};
`;

const ModelIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-right: 2px;
  animation: ${props => props.$isLoading ? css`${modelIconPulse} 1s ease-in-out infinite` : 'none'};
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

const ModelOptionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
`;

const ModelSelect = styled.select`
  background-color: transparent;
  color: white;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 6px;
  padding-right: 20px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  appearance: none;
  position: relative;
  z-index: 1;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 4px center;
  
  &:focus {
    outline: none;
  }
  
  &.model-loading {
    animation: ${css`${modelLoadingAnimation} 0.5s ease-out`};
  }
`;

// Update model options to include styled content
const StyledOption = styled.option`
  background-color: ${props => props.$bgColor || '#1A1A1A'};
  color: white;
  padding: 8px 12px;
  font-weight: 500;
`;

const AIChatPanel = ({ messages, setMessages, handleQuestion, map, initialCollapsed = true }) => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [selectedModel, setSelectedModel] = useState('claude3');
  const [modelLoading, setModelLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const panelInitializedRef = useRef(false);

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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      await handlePanelQuestion(inputValue.trim(), map, setMessages, setIsLoading);
      setInputValue('');
    }
  };

  const handleModelChange = (e) => {
    const newModel = e.target.value;
    setModelLoading(true);
    setSelectedModel(newModel);
    console.log('Model changed to:', newModel);
    
    // Simulate loading the new model
    setTimeout(() => {
      setModelLoading(false);
    }, 1200);
  };

  // Helper function to get the icon for each model
  const getModelIcon = (modelId) => {
    switch(modelId) {
      case 'gpt4':
        return <Sparkle />;
      case 'claude3':
        return <Brain />;
      case 'llama3':
        return <Zap />;
      case 'deepseek':
        return <Cpu />;
      default:
        return <Sparkle />;
    }
  };

  // Helper function to apply the model color theme to elements
  const getModelTheme = () => {
    return MODEL_COLORS[selectedModel] || MODEL_COLORS.claude3;
  };

  // Add a safe question handler for predefined questions
  const handlePredefinedQuestion = async (questionText) => {
    console.log('Handling predefined question:', questionText);
    
    // When user clicks a question, open the panel if it's closed
    if (isCollapsed) {
      setIsCollapsed(false);
    }
    
    try {
      // Check if map exists, otherwise use mock data
      if (!map) {
        console.log('Map reference not available, using mock data');
      }
      
      // Special case for urban impact question
      if (questionText === "Where could minimal changes create maximum impact?") {
        console.log('Calling handleUrbanImpactQuestion with map:', map);
        // Pass the map object directly - it could be a ref or direct object
        const mapObj = map && (map.current || map);
        await handleUrbanImpactQuestion(mapObj, setMessages, setIsLoading);
        return;
      }
      
      // For hardcoded questions like "Where are the major flood-prone areas?", 
      // we can directly use the mock response if available
      if (questionText === "Where are the major flood-prone areas?" && 
          MOCK_RESPONSES && MOCK_RESPONSES[questionText]) {
        setMessages(prev => [
          ...prev,
          { isUser: true, content: questionText },
          { isUser: false, content: JSON.parse(MOCK_RESPONSES[questionText].content[0].text) }
        ]);
        return;
      }
      
      await handlePanelQuestion(questionText, map, setMessages, setIsLoading);
    } catch (error) {
      console.error('Error handling predefined question:', error);
      setMessages(prev => [
        ...prev, 
        { isUser: true, content: questionText },
        { 
          isUser: false, 
          content: { 
            preGraphText: "Sorry, I encountered an error processing your request.", 
            postGraphText: "Please try again or select another question." 
          } 
        }
      ]);
    }
  };

  return (
    <>
      <Panel 
        $isCollapsed={isCollapsed}
        style={{ willChange: 'transform' }}
      >
        <ChatHeader>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', width: '100%' }}>
            <ModelSelectContainer 
              $bgColor={getModelTheme()} 
              $isLoading={modelLoading}
              className={modelLoading ? 'loading' : ''}
            >
              <ModelIcon $isLoading={modelLoading}>
                {getModelIcon(selectedModel)}
              </ModelIcon>
              <ModelSelect 
                value={selectedModel} 
                onChange={handleModelChange}
                className={modelLoading ? 'model-loading' : ''}
              >
                <StyledOption value="gpt4" $bgColor={MODEL_COLORS.gpt4 + '30'}>
                  GPT-4
                </StyledOption>
                <StyledOption value="claude3" $bgColor={MODEL_COLORS.claude3 + '30'}>
                  Claude 3
                </StyledOption>
                <StyledOption value="llama3" $bgColor={MODEL_COLORS.llama3 + '30'}>
                  Llama 3
                </StyledOption>
                <StyledOption value="deepseek" $bgColor={MODEL_COLORS.deepseek + '30'}>
                  DeepSeek
                </StyledOption>
              </ModelSelect>
              <AIBadge $bgColor={getModelTheme()}>
                <Sparkles />
                AI-p11owered
              </AIBadge>
              <LoadingDots $isLoading={modelLoading}>
                <LoadingDot $delay="0s" />
                <LoadingDot $delay="0.2s" />
                <LoadingDot $delay="0.4s" />
              </LoadingDots>
              <ModelLoadingIndicator $isLoading={modelLoading} $bgColor={getModelTheme()} />
            </ModelSelectContainer>
          </div>
        </ChatHeader>

        <ChatMessages>
          {messages.length === 0 ? (
            <>
              <InitialPrompt>
                <div style={{ 
                  fontSize: '26px', 
                  marginBottom: '14px', 
                  fontWeight: 700,
                  textShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
                  fontFamily: "'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
                  lineHeight: 1.3
                }}>
                  Navigate LA's urban complexity: <span style={{ fontWeight: 800, color: '#fffdfa' }}>Identifying strategic intervention points</span> for walkable futures
                </div>
              </InitialPrompt>

              <AnimatedDiv $delay={0.2}>
                <QuestionButton 
                  onClick={() => handlePredefinedQuestion("Find neighborhoods primed for value explosion")}
                  $accentColor={getModelTheme()}
                  $iconGlow={getModelTheme()}
                  $bgGradient={`linear-gradient(135deg, ${getModelTheme()}10, ${getModelTheme()}20)`}
                  $hoverBgGradient={`linear-gradient(135deg, ${getModelTheme()}15, ${getModelTheme()}30, ${getModelTheme()}10)`}
                >
                  <QuestionIcon $animationType="pulse" $color={getModelTheme()}>
                    <Rocket strokeWidth={1.5} />
                  </QuestionIcon>
                  <span>Find neighborhoods primed for value explosion</span>
                </QuestionButton>
              </AnimatedDiv>

              <AnimatedDiv $delay={0.4}>
                <QuestionButton 
                  onClick={() => handlePredefinedQuestion("Where could minimal changes create maximum impact?")}
                  $accentColor={getModelTheme()}
                  $iconGlow={getModelTheme()}
                  $bgGradient={`linear-gradient(135deg, ${getModelTheme()}10, ${getModelTheme()}20)`}
                  $hoverBgGradient={`linear-gradient(135deg, ${getModelTheme()}15, ${getModelTheme()}30, ${getModelTheme()}10)`}
                >
                  <QuestionIcon $animationType="rotate" $color={getModelTheme()}>
                    <Wand2 strokeWidth={1.5} />
                  </QuestionIcon>
                  <span>Where could minimal changes create maximum impact?</span>
                </QuestionButton>
              </AnimatedDiv>

              <AnimatedDiv $delay={0.6}>
                <QuestionButton 
                  onClick={() => handlePredefinedQuestion("Which neighborhoods would transform with just one policy change?")}
                  $accentColor={getModelTheme()}
                  $iconGlow={getModelTheme()}
                  $bgGradient={`linear-gradient(135deg, ${getModelTheme()}10, ${getModelTheme()}20)`}
                  $hoverBgGradient={`linear-gradient(135deg, ${getModelTheme()}15, ${getModelTheme()}30, ${getModelTheme()}10)`}
                >
                  <QuestionIcon $animationType="rotate" $color={getModelTheme()}>
                    <Wand2 strokeWidth={1.5} />
                  </QuestionIcon>
                  <span>Which neighborhoods would transform with just one policy change?</span>
                </QuestionButton>
              </AnimatedDiv>
              
              <AnimatedDiv $delay={0.8}>
                <QuestionButton 
                  onClick={() => handlePredefinedQuestion("Map housing opportunity gaps near job centers")}
                  $accentColor={getModelTheme()}
                  $iconGlow={getModelTheme()}
                  $bgGradient={`linear-gradient(135deg, ${getModelTheme()}10, ${getModelTheme()}20)`}
                  $hoverBgGradient={`linear-gradient(135deg, ${getModelTheme()}15, ${getModelTheme()}30, ${getModelTheme()}10)`}
                >
                  <QuestionIcon $animationType="pulse" $color={getModelTheme()}>
                    <Home strokeWidth={1.5} />
                  </QuestionIcon>
                  <span>Map housing opportunity gaps near job centers</span>
                </QuestionButton>
              </AnimatedDiv>
              
              <AnimatedDiv $delay={1.0}>
                <SeeMoreButton 
                  onClick={() => handlePredefinedQuestion("Show me more policy optimization opportunities")}
                  $bgGradient={`linear-gradient(135deg, ${getModelTheme()}10, ${getModelTheme()}20)`}
                  $hoverBgGradient={`linear-gradient(135deg, ${getModelTheme()}15, ${getModelTheme()}30, ${getModelTheme()}10)`}
                >
                  <QuestionIcon $animationType="bounce" $color={getModelTheme()}>
                    <ChevronRight strokeWidth={1.5} />
                  </QuestionIcon>
                  <span>See more options</span>
                </SeeMoreButton>
              </AnimatedDiv>
            </>
          ) : (
            <>
              {messages.map((msg, i) => (
                <Message key={i}>
                  <MessageHeader>
                    <Avatar />
                    <Sender>{msg.isUser ? 'You' : 'ATLAS'}</Sender>
                  </MessageHeader>
                  <MessageContent>
                    {msg.isUser ? msg.content : (
                      <>
                        {/* Processing Step */}
                        {msg.content.processingStep && (
                          <div className="flex items-center p-2 bg-gray-800 bg-opacity-50 rounded-lg mb-1 animate-pulse">
                            <span className="text-xl mr-3">{msg.content.icon}</span>
                            <span className="text-gray-200">{msg.content.text}</span>
                          </div>
                        )}

                        {/* Commercial Info case (existing) */}
                        {msg.content.action === "showCommercialCluster" && (
                          <div className="bg-gray-900 rounded-xl overflow-hidden shadow-xl border border-gray-800 w-full max-w-3xl">
                            {/* Commercial Info Header */}
                            <div className="p-4 border-b border-gray-800">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Building className="w-5 h-5 text-gray-400" />
                                  <h2 className="text-xl font-bold text-white">{msg.content.clusterData.name}</h2>
                                </div>
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4 text-red-500" />
                                  <span className="text-red-500 font-medium text-sm">High Risk Zone</span>
                                </div>
                              </div>
                              <div className="text-sm text-gray-400">
                                {msg.content.clusterData.type} | {msg.content.clusterData.properties} properties | {msg.content.clusterData.sqft} sq ft
                              </div>
                            </div>

                            {/* Recovery Timeline */}
                            <div className="p-4 border-b border-gray-800">
                              <h3 className="font-bold text-white mb-3 flex items-center">
                                <Clock className="w-5 h-5 mr-2" />
                                AI Recovery Timeline
                              </h3>
                              
                              <div className="bg-gray-800 rounded-lg p-3 mb-4 text-gray-300 text-sm">
                                <p>Modeling a <span className="text-white font-bold">Category 4</span> hurricane scenario with sustained winds of <span className="text-white font-bold">130 mph</span> and rainfall of <span className="text-white font-bold">40+ inches</span> over <span className="text-white font-bold">4 days</span>. Initial impact shows <span className="text-white font-bold">65%</span> of the area experiencing power outages and flood depths averaging <span className="text-white font-bold">2.8 feet</span> above ground level, comparable to Hurricane Harvey conditions.</p>
                              </div>
                              
                              <div className="h-64 w-full mb-4">
                                <div className="text-gray-300 text-sm font-semibold mb-4 text-center">Recovery Projection scenario 102</div>
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart 
                                    data={[
                                      { time: 0, Infrastructure: 100, Environmental: 100, Operational: 100 },
                                      { time: 6, Infrastructure: 35, Environmental: 45, Operational: 60 },
                                      { time: 12, Infrastructure: 30, Environmental: 40, Operational: 55 },
                                      { time: 24, Infrastructure: 40, Environmental: 45, Operational: 65 },
                                      { time: 48, Infrastructure: 55, Environmental: 50, Operational: 75 },
                                      { time: 72, Infrastructure: 70, Environmental: 60, Operational: 85 },
                                      { time: 96, Infrastructure: 80, Environmental: 65, Operational: 90 },
                                      { time: 120, Infrastructure: 85, Environmental: 70, Operational: 95 },
                                      { time: 168, Infrastructure: 90, Environmental: 80, Operational: 98 },
                                      { time: 240, Infrastructure: 95, Environmental: 90, Operational: 100 }
                                    ]}
                                    margin={{ top: 10, right: 15, left: 5, bottom: 20 }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis 
                                      dataKey="time" 
                                      stroke="#9ca3af"
                                      tickFormatter={(value) => `${value}h`}
                                      tick={{ fontSize: 10 }}
                                      label={{ 
                                        value: 'Hours Since Impact', 
                                        position: 'insideBottom',
                                        fill: '#9ca3af',
                                        fontSize: 11,
                                        dy: 10,
                                        offset: -5
                                      }}
                                    />
                                    <YAxis 
                                      stroke="#9ca3af"
                                      tick={{ fontSize: 10 }}
                                      tickCount={5}
                                      tickFormatter={(value) => `${value}%`}
                                      axisLine={false}
                                      tickLine={false}
                                      label={{ 
                                        value: 'System Functionality', 
                                        angle: -90, 
                                        position: 'center',
                                        fill: '#9ca3af',
                                        fontSize: 11,
                                        dx: -25
                                      }}
                                    />
                                    <Tooltip 
                                      contentStyle={{ 
                                        backgroundColor: '#1f2937', 
                                        border: '1px solid #374151', 
                                        color: '#e5e7eb',
                                        fontSize: 11,
                                        padding: '8px'
                                      }}
                                      formatter={(value, name) => [`${value}%`, name]}
                                      labelFormatter={(value) => `Hour ${value}`}
                                    />
                                    <Legend 
                                      verticalAlign="bottom" 
                                      height={36}
                                      wrapperStyle={{
                                        fontSize: '11px',
                                        paddingTop: '15px',
                                        marginBottom: '-25px'
                                      }}
                                    />
                                    <Area
                                      type="monotone"
                                      dataKey="Infrastructure"
                                      stroke={milestoneCategories.Infrastructure.color}
                                      fill={milestoneCategories.Infrastructure.color}
                                      fillOpacity={0.2}
                                      name="Infrastructure"
                                      strokeWidth={2}
                                    />
                                    <Area
                                      type="monotone"
                                      dataKey="Environmental"
                                      stroke={milestoneCategories.Environmental.color}
                                      fill={milestoneCategories.Environmental.color}
                                      fillOpacity={0.2}
                                      name="Environmental"
                                      strokeWidth={2}
                                    />
                                    <Area
                                      type="monotone"
                                      dataKey="Operational"
                                      stroke={milestoneCategories.Operational.color}
                                      fill={milestoneCategories.Operational.color}
                                      fillOpacity={0.2}
                                      name="Operational"
                                      strokeWidth={2}
                                    />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                            
                            {/* Model Conclusions */}
                            <div className="p-4 pt-8 pb-8 border-b border-gray-800">
                              <h3 className="font-bold text-white mb-3">LLM Recovery Predictions</h3>
                              <div className="space-y-3">
                                {msg.content.modelConclusions.map(model => (
                                  <div 
                                    key={model.id} 
                                    className="bg-gray-800 rounded-lg p-3 border border-gray-700"
                                    style={{ borderLeftColor: model.color, borderLeftWidth: '3px' }}
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center">
                                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: model.color }}></div>
                                        <span className="text-white font-bold">{model.name}</span>
                                      </div>
                                      <div className="flex items-center">
                                        <span className="text-gray-400 text-sm mr-2">Risk Score:</span>
                                        <span 
                                          className="text-sm font-bold rounded-lg px-2 py-0.5" 
                                          style={{ backgroundColor: `${model.color}30`, color: model.color }}
                                        >
                                          {model.riskScore}
                                        </span>
                                        <span className="text-white font-medium ml-3">{model.recoveryTime}</span>
                                      </div>
                                    </div>
                                    <p className="text-sm text-gray-300 italic">"{model.uniqueFinding}"</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            {/* Risk Factors Chart */}
                            <div className="p-4 border-b border-gray-800">
                              <h3 className="font-bold text-white mb-3 flex items-center">
                                <BarChart2 className="w-5 h-5 mr-2" />
                                Risk Factor Analysis
                              </h3>
                              
                              <div className="h-80 w-full mb-2">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart
                                    data={msg.content.riskFactorData}
                                    layout="vertical"
                                    barGap={2}
                                    barSize={8}
                                  >
                                    <defs>
                                      {msg.content.llmModels.map(model => (
                                        <linearGradient key={model.id} id={`gradient-${model.id}`} x1="0" y1="0" x2="1" y2="0">
                                          <stop offset="0%" stopColor={`${model.color}40`} />
                                          <stop offset="100%" stopColor={model.color} />
                                        </linearGradient>
                                      ))}
                                    </defs>
                                    <CartesianGrid 
                                      strokeDasharray="3 3" 
                                      stroke="#374151" 
                                      horizontal={true}
                                    />
                                    <XAxis 
                                      type="number" 
                                      domain={[0, 100]} 
                                      stroke="#9ca3af"
                                      tickLine={false}
                                      axisLine={false}
                                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                                      label={{ 
                                        value: 'Risk Impact Score (%)', 
                                        position: 'bottom',
                                        fill: '#e5e7eb',
                                        fontSize: 13,
                                        dy: 15
                                      }}
                                    />
                                    <YAxis 
                                      dataKey="factor" 
                                      type="category" 
                                      stroke="#9ca3af"
                                      tickLine={false}
                                      axisLine={false}
                                      tick={(props) => {
                                        const factor = msg.content.riskFactorData.find(d => d.factor === props.payload.value);
                                        const category = factor?.category;
                                        const categoryColor = milestoneCategories[category]?.color;
                                        return (
                                          <g transform={`translate(${props.x},${props.y})`}>
                                            <rect
                                              x={-135}
                                              y={-10}
                                              width={130}
                                              height={20}
                                              fill={`${categoryColor}15`}
                                              rx={4}
                                            />
                                            <text
                                              x={-15}
                                              y={0}
                                              dy={4}
                                              textAnchor="end"
                                              fill="#e5e7eb"
                                              fontSize={13}
                                              fontWeight={500}
                                            >
                                              {props.payload.value}
                                            </text>
                                            <text
                                              x={-125}
                                              y={0}
                                              dy={4}
                                              textAnchor="start"
                                              fill={categoryColor}
                                              fontSize={12}
                                              fontWeight={600}
                                            >
                                              {category}
                                            </text>
                                          </g>
                                        );
                                      }}
                                      width={140}
                                    />
                                    <Legend
                                      verticalAlign="top"
                                      align="right"
                                      iconType="circle"
                                      wrapperStyle={{
                                        paddingBottom: '10px'
                                      }}
                                    />
                                    <Tooltip 
                                      cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                      contentStyle={{ 
                                        backgroundColor: '#1f2937', 
                                        border: '1px solid #374151',
                                        borderRadius: '6px',
                                        color: '#f3f4f6'
                                      }}
                                      itemStyle={{ color: '#e5e7eb', fontSize: '12px' }}
                                      labelStyle={{ color: '#e5e7eb', fontWeight: 600, marginBottom: '8px' }}
                                      formatter={(value, name, props) => {
                                        const data = props.payload;
                                        const model = msg.content.llmModels.find(m => m.name === name);
                                        return [
                                          <>
                                            <div style={{ 
                                              display: 'flex', 
                                              alignItems: 'center', 
                                              gap: '8px',
                                              padding: '4px 8px',
                                              background: `${model.color}15`,
                                              borderRadius: '4px',
                                              marginBottom: '4px'
                                            }}>
                                              <div style={{
                                                width: '3px',
                                                height: '16px',
                                                background: model.color,
                                                borderRadius: '2px'
                                              }} />
                                              <span style={{ 
                                                color: model.color,
                                                fontWeight: 600
                                              }}>
                                                {value}% Impact
                                              </span>
                                            </div>
                                          </>,
                                          name
                                        ];
                                      }}
                                      labelFormatter={(label) => {
                                        const factor = msg.content.riskFactorData.find(d => d.factor === label);
                                        const category = factor?.category;
                                        const categoryColor = milestoneCategories[category]?.color;
                                        return (
                                          <div>
                                            <div style={{ 
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '8px',
                                              marginBottom: '8px'
                                            }}>
                                              <div style={{
                                                width: '4px',
                                                height: '20px',
                                                background: categoryColor,
                                                borderRadius: '2px'
                                              }} />
                                              <div>
                                                <div style={{ 
                                                  fontSize: '14px',
                                                  fontWeight: 600,
                                                  color: categoryColor
                                                }}>
                                                  {category}
                                                </div>
                                                <div style={{ 
                                                  fontSize: '13px',
                                                  color: '#e5e7eb'
                                                }}>
                                                  {label}
                                                </div>
                                              </div>
                                            </div>
                                            <div style={{
                                              padding: '8px',
                                              background: '#374151',
                                              borderRadius: '4px',
                                              marginTop: '8px'
                                            }}>
                                              <div style={{ 
                                                fontSize: '12px',
                                                color: '#9ca3af',
                                                marginBottom: '4px'
                                              }}>
                                                {factor?.description}
                                              </div>
                                              <div style={{ 
                                                fontSize: '12px',
                                                color: '#d1d5db',
                                                fontStyle: 'italic'
                                              }}>
                                                {factor?.impact}
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      }}
                                    />
                                    {msg.content.llmModels.map(model => (
                                      <Bar
                                        key={model.id}
                                        dataKey={model.name}
                                        fill={`url(#gradient-${model.id})`}
                                        radius={[0, 4, 4, 0]}
                                        name={model.name}
                                      />
                                    ))}
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                            
                            {/* More Details Bar */}
                            <div className="p-4 bg-gray-800 flex justify-between items-center">
                              <div className="text-gray-300">
                                <span className="text-white font-bold">Prediction Range:</span> 20-36 day recovery
                              </div>
                              <button className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-blue-700 transition-colors">
                                <span>Full Analysis</span>
                                <ArrowRight className="w-4 h-4 ml-1" />
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {/* Urban Impact Analysis case */}
                        {msg.content.graphData && (
                          <div className="bg-gray-900 rounded-xl overflow-hidden shadow-xl border border-gray-800 w-full max-w-3xl mb-4">
                            {/* Header */}
                            <div className="p-4 border-b border-gray-800">
                              <div className="flex items-center gap-2 mb-2">
                                <Wand2 className="w-5 h-5 text-cyan-400" />
                                <h2 className="text-xl font-bold text-white">Urban Impact Analysis</h2>
                              </div>
                              <p className="text-gray-300 text-sm">
                                {msg.content.preGraphText}
                              </p>
                            </div>

                            {/* Priority Matrix Graph */}
                            <div className="p-4 border-b border-gray-800">
                              <h3 className="font-bold text-white mb-3">Impact vs. Effort Matrix</h3>
                              <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <ScatterChart
                                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis 
                                      type="number" 
                                      dataKey="effort" 
                                      name="Effort" 
                                      unit="%" 
                                      domain={[0, 100]} 
                                      label={{ 
                                        value: 'Implementation Effort', 
                                        position: 'bottom',
                                        fill: '#9ca3af',
                                        fontSize: 12 
                                      }}
                                    />
                                    <YAxis 
                                      type="number" 
                                      dataKey="impact" 
                                      name="Impact" 
                                      unit="%" 
                                      domain={[0, 100]} 
                                      label={{ 
                                        value: 'Community Impact', 
                                        angle: -90, 
                                        position: 'insideLeft',
                                        fill: '#9ca3af',
                                        fontSize: 12 
                                      }}
                                    />
                                    <ZAxis 
                                      type="category" 
                                      dataKey="name" 
                                      range={[50, 500]} 
                                      name="Intervention" 
                                    />
                                    <Tooltip 
                                      cursor={{ strokeDasharray: '3 3' }}
                                      contentStyle={{ 
                                        backgroundColor: '#1f2937', 
                                        border: '1px solid #374151',
                                        borderRadius: '6px',
                                        color: '#f3f4f6'
                                      }}
                                      formatter={(value, name) => [`${value}%`, name]}
                                      labelFormatter={(value) => `${value}`}
                                    />
                                    <Scatter 
                                      data={msg.content.graphData.impactGraphs[0].data.filter(d => d.category === "Pedestrian")} 
                                      fill="#3b82f6" 
                                      name="Pedestrian" 
                                    />
                                    <Scatter 
                                      data={msg.content.graphData.impactGraphs[0].data.filter(d => d.category === "Green")} 
                                      fill="#10b981" 
                                      name="Green Space" 
                                    />
                                    <Scatter 
                                      data={msg.content.graphData.impactGraphs[0].data.filter(d => d.category === "Bike")} 
                                      fill="#f97316" 
                                      name="Bike" 
                                    />
                                    <Scatter 
                                      data={msg.content.graphData.impactGraphs[0].data.filter(d => d.category === "Transit")} 
                                      fill="#8b5cf6" 
                                      name="Transit" 
                                    />
                                    <Scatter 
                                      data={msg.content.graphData.impactGraphs[0].data.filter(d => d.category === "Traffic")} 
                                      fill="#ef4444" 
                                      name="Traffic" 
                                    />
                                    <Scatter 
                                      data={msg.content.graphData.impactGraphs[0].data.filter(d => d.category === "Safety" || d.category === "Aesthetic")} 
                                      fill="#f59e0b" 
                                      name="Other" 
                                    />
                                    <Legend />
                                  </ScatterChart>
                                </ResponsiveContainer>
                              </div>
                            </div>

                            {/* Benefits Breakdown */}
                            <div className="p-4 border-b border-gray-800">
                              <h3 className="font-bold text-white mb-3">Benefits Breakdown</h3>
                              <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={Object.entries(msg.content.graphData.impactGraphs[1].data).map(([name, value]) => ({ name, value }))}
                                      cx="50%"
                                      cy="50%"
                                      labelLine={false}
                                      outerRadius={80}
                                      fill="#8884d8"
                                      dataKey="value"
                                      nameKey="name"
                                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    >
                                      <Cell key="economic" fill="#3b82f6" />
                                      <Cell key="health" fill="#10b981" />
                                      <Cell key="safety" fill="#f97316" />
                                      <Cell key="environmental" fill="#8b5cf6" />
                                      <Cell key="community" fill="#ef4444" />
                                    </Pie>
                                    <Tooltip 
                                      formatter={(value) => [`${value}%`, 'Improvement']}
                                      contentStyle={{ 
                                        backgroundColor: '#1f2937', 
                                        border: '1px solid #374151',
                                        borderRadius: '6px',
                                        color: '#f3f4f6'
                                      }}
                                    />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                            </div>

                            {/* Intervention Details */}
                            <div className="p-4">
                              <h3 className="font-bold text-white mb-3">Top Interventions</h3>
                              <div className="space-y-4">
                                {msg.content.graphData.interventionDetails.map((intervention, idx) => (
                                  <div key={idx} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                                    <div className="flex justify-between items-center mb-2">
                                      <h4 className="font-bold text-white">{intervention.name}</h4>
                                      <span className="text-sm bg-gray-700 px-2 py-1 rounded text-gray-300">
                                        {intervention.cost}
                                      </span>
                                    </div>
                                    <p className="text-gray-300 text-sm mb-2">{intervention.description}</p>
                                    <div className="text-sm text-gray-400">
                                      <div className="flex items-center gap-1 mb-1">
                                        <Clock className="w-4 h-4" />
                                        <span>{intervention.timeframe}</span>
                                      </div>
                                      <div className="flex flex-wrap gap-2 mt-2">
                                        {intervention.benefits.map((benefit, bidx) => (
                                          <span key={bidx} className="bg-gray-700 px-2 py-1 rounded-full text-xs text-cyan-300">
                                            {benefit}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* For regular text responses */}
                        {!msg.content.action && !msg.content.graphData && !msg.content.processingStep && (
                          <div>
                            {msg.content.preGraphText && <p>{msg.content.preGraphText}</p>}
                            {msg.content.postGraphText && <p>{msg.content.postGraphText}</p>}
                          </div>
                        )}

                        {/* Follow-up suggestions */}
                        {msg.content.followUpSuggestions && msg.content.followUpSuggestions.length > 0 && (
                          <div style={{ marginTop: '20px' }}>
                            {msg.content.followUpSuggestions.map((action, index) => (
                              <FollowUpButton 
                                key={index}
                                onClick={() => handlePredefinedQuestion(action.prompt || action.text)}
                              >
                                {action.text}
                              </FollowUpButton>
                            ))}
                          </div>
                        )}

                        {/* Quick Actions */}
                        {msg.content.quickActions && msg.content.quickActions.length > 0 && (
                          <div style={{ marginTop: '20px' }}>
                            {msg.content.quickActions.map((action, index) => (
                              <FollowUpButton 
                                key={index}
                                onClick={() => handlePredefinedQuestion(action.prompt || action.text)}
                              >
                                {action.text}
                              </FollowUpButton>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </MessageContent>
                </Message>
              ))}

              {isLoading && (
                <Message>
                  <MessageHeader>
                    <Avatar />
                    <Sender>ATLAS</Sender>
                  </MessageHeader>
                  <MessageContent>
                    <LoadingMessage>
                      <LoadingStep $delay={300}>
                        <span className="icon">🏙️</span>
                        <span className="text">Analyzing neighborhood walkability...</span>
                        <span className="dots" />
                      </LoadingStep>
                      <LoadingStep $delay={600}>
                        <span className="icon">🚇</span>
                        <span className="text">Processing transit connectivity data...</span>
                        <span className="dots" />
                      </LoadingStep>
                      <LoadingStep $delay={900}>
                        <span className="icon">📍</span>
                        <span className="text">Mapping essential services proximity...</span>
                        <span className="dots" />
                      </LoadingStep>
                    </LoadingMessage>
                  </MessageContent>
                </Message>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </ChatMessages>
      </Panel>

      <CollapseIconContainer 
        $isCollapsed={isCollapsed}
        style={{ willChange: 'transform' }}
      >
        <CollapseIcon 
          onClick={handleCollapseToggle}
          title={isCollapsed ? "Expand panel" : "Collapse panel"}
          $isCollapsed={isCollapsed}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/>
          </svg>
        </CollapseIcon>
      </CollapseIconContainer>
    </>
  );
};

export default AIChatPanel; 