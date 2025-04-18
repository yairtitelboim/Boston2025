import React from 'react';
import { ModelSelectContainer, ModelSelect, StyledOption, AIBadge } from '../StyledComponents';
import { Sparkles } from 'lucide-react';
import { MODEL_COLORS } from '../mockData';

const ModelSelector = ({ selectedModel, handleModelChange }) => {
  return (
    <ModelSelectContainer $bgColor={MODEL_COLORS[selectedModel]}>
      <ModelSelect value={selectedModel} onChange={handleModelChange}>
        <StyledOption value="tourist" $bgColor={MODEL_COLORS.tourist + '30'}>
          Tourist Guide
        </StyledOption>
        <StyledOption value="local" $bgColor={MODEL_COLORS.local + '30'}>
          Local Expert
        </StyledOption>
        <StyledOption value="business" $bgColor={MODEL_COLORS.business + '30'}>
          Business Travel
        </StyledOption>
        <StyledOption value="family" $bgColor={MODEL_COLORS.family + '30'}>
          Family Planner
        </StyledOption>
      </ModelSelect>
      <AIBadge $bgColor={MODEL_COLORS[selectedModel]}>
        <Sparkles />
        AI Guide
      </AIBadge>
    </ModelSelectContainer>
  );
};

export default ModelSelector; 