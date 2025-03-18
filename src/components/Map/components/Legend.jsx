import React from 'react';
import styled from 'styled-components';

const LegendContainer = styled.div`
  position: absolute;
  bottom: 24px;
  right: 24px;
  background: rgba(255, 255, 255, 0.9);
  padding: 12px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  max-width: 280px;
  z-index: 1000;
`;

const LegendTitle = styled.h3`
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
`;

const LegendSection = styled.div`
  margin-bottom: 16px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const ColorScale = styled.div`
  display: flex;
  align-items: center;
  margin-top: 4px;
`;

const ColorBox = styled.div`
  width: 24px;
  height: 24px;
  margin-right: 2px;
  background-color: ${props => props.$color};
`;

const ScaleLabels = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-top: 2px;
`;

const AmenityItem = styled.div`
  display: flex;
  align-items: center;
  margin-top: 4px;
  font-size: 12px;
`;

const AmenityDot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
  background-color: ${props => props.$color};
`;

const Legend = ({
  showDevelopmentPotential,
  showInfrastructureCapacity,
  showTransitAccess,
  showAmenities,
  showAdaptiveReuse
}) => {
  if (!showDevelopmentPotential && !showInfrastructureCapacity && 
      !showTransitAccess && !showAmenities && !showAdaptiveReuse) {
    return null;
  }

  return (
    <LegendContainer>
      {showDevelopmentPotential && (
        <LegendSection>
          <LegendTitle>Development Potential</LegendTitle>
          <ColorScale>
            <ColorBox $color="#fee5d9" />
            <ColorBox $color="#fcae91" />
            <ColorBox $color="#fb6a4a" />
            <ColorBox $color="#de2d26" />
            <ColorBox $color="#a50f15" />
          </ColorScale>
          <ScaleLabels>
            <span>Low</span>
            <span>High</span>
          </ScaleLabels>
        </LegendSection>
      )}

      {showInfrastructureCapacity && (
        <LegendSection>
          <LegendTitle>Infrastructure Capacity</LegendTitle>
          <ColorScale>
            <ColorBox $color="#edf8e9" />
            <ColorBox $color="#bae4b3" />
            <ColorBox $color="#74c476" />
            <ColorBox $color="#31a354" />
            <ColorBox $color="#006d2c" />
          </ColorScale>
          <ScaleLabels>
            <span>Limited</span>
            <span>Abundant</span>
          </ScaleLabels>
        </LegendSection>
      )}

      {showTransitAccess && (
        <LegendSection>
          <LegendTitle>Transit Access</LegendTitle>
          <ColorScale>
            <ColorBox $color="#f2f0f7" />
            <ColorBox $color="#cbc9e2" />
            <ColorBox $color="#9e9ac8" />
            <ColorBox $color="#756bb1" />
            <ColorBox $color="#54278f" />
          </ColorScale>
          <ScaleLabels>
            <span>Poor</span>
            <span>Excellent</span>
          </ScaleLabels>
        </LegendSection>
      )}

      {showAmenities && (
        <LegendSection>
          <LegendTitle>Amenities</LegendTitle>
          <AmenityItem>
            <AmenityDot $color="#1f77b4" />
            Grocery
          </AmenityItem>
          <AmenityItem>
            <AmenityDot $color="#ff7f0e" />
            School
          </AmenityItem>
          <AmenityItem>
            <AmenityDot $color="#2ca02c" />
            Park
          </AmenityItem>
          <AmenityItem>
            <AmenityDot $color="#d62728" />
            Healthcare
          </AmenityItem>
          <AmenityItem>
            <AmenityDot $color="#9467bd" />
            Retail
          </AmenityItem>
        </LegendSection>
      )}

      {showAdaptiveReuse && (
        <LegendSection>
          <LegendTitle>Adaptive Reuse Potential</LegendTitle>
          <ColorScale>
            <ColorBox $color="#eff3ff" />
            <ColorBox $color="#bdd7e7" />
            <ColorBox $color="#6baed6" />
            <ColorBox $color="#3182bd" />
            <ColorBox $color="#08519c" />
          </ColorScale>
          <ScaleLabels>
            <span>Low</span>
            <span>High</span>
          </ScaleLabels>
        </LegendSection>
      )}
    </LegendContainer>
  );
};

export default Legend; 