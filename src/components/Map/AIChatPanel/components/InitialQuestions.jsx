import React, { useState, useEffect } from 'react';
import {
  InitialQuestionsContainer,
  LeftContainer,
  RightContainer,
  PlayButton,
  PlayIcon,
  TextContainer,
  Title,
  Subtitle,
  ModelBadge,
  TerminalContainer,
  TerminalLine,
  ActiveTerminalLine
} from '../StyledComponents';

const terminalLines = [
  "Initializing Boston Analysis System...",
  "Loading geographical data...",
  "Processing urban infrastructure...",
  "System ready for interaction."
];

const InitialQuestions = () => {
  const [isClaude, setIsClaude] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [isLineVisible, setIsLineVisible] = useState(true);
  const [showNextStep, setShowNextStep] = useState(false);

  const toggleModel = () => {
    setIsClaude(!isClaude);
  };

  const handlePlay = () => {
    setIsPlaying(true);
    setIsLoading(true);
    setCurrentLineIndex(0);
    setIsLineVisible(true);
    setShowNextStep(false);

    // Stop after 4 seconds and show next step message
    setTimeout(() => {
      setShowNextStep(true);
      setIsLoading(false);
    }, 4000);
  };

  useEffect(() => {
    if (!isPlaying) return;

    const showNextLine = () => {
      setIsLineVisible(false);
      setTimeout(() => {
        if (currentLineIndex < terminalLines.length - 1) {
          setCurrentLineIndex(prev => prev + 1);
          setIsLineVisible(true);
        }
      }, 200);
    };

    const timer = setTimeout(showNextLine, 1800);
    return () => clearTimeout(timer);
  }, [isPlaying, currentLineIndex]);

  return (
    <InitialQuestionsContainer>
      <LeftContainer>
        <PlayButton onClick={handlePlay} $isLoading={isLoading}>
          <PlayIcon $isLoading={isLoading} />
        </PlayButton>
      </LeftContainer>
      <RightContainer>
        {!isPlaying && !showNextStep ? (
          <TextContainer>
            <ModelBadge onClick={toggleModel} />
            <Title>Point of Interest</Title>
            <Subtitle>Boston Analysis</Subtitle>
          </TextContainer>
        ) : showNextStep ? (
          <TextContainer>
            <Title style={{ fontSize: '24px' }}>See next step...</Title>
          </TextContainer>
        ) : (
          <TerminalContainer $visible={isPlaying}>
            {isLineVisible && (
              <ActiveTerminalLine>
                {terminalLines[currentLineIndex]}
              </ActiveTerminalLine>
            )}
          </TerminalContainer>
        )}
      </RightContainer>
    </InitialQuestionsContainer>
  );
};

export default InitialQuestions; 