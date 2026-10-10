"use client";

import styled from "styled-components";

// "Placa tarifária": painel de sinalização com os degraus tempo → valor.
export const Plate = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
  padding: ${({ theme }) => theme.space[4]}px;
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.onSign};
  box-shadow: inset 0 0 0 2px ${({ theme }) => theme.colors.signEdge}, ${({ theme }) => theme.shadows.sm};
`;

export const PlateTitle = styled.h3`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.display};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  text-transform: ${({ theme }) => theme.typography.displayTransform};
  letter-spacing: ${({ theme }) => theme.typography.displayTracking};
`;

export const Steps = styled.ul`
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
  font-variant-numeric: tabular-nums;
`;

export const Step = styled.li`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[3]}px;
  padding: ${({ theme }) => theme.space[2]}px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.signEdge};
  font-size: ${({ theme }) => theme.fontSizes.md};

  &:last-child {
    border-bottom: none;
  }
`;

export const StepValue = styled.span`
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

export const DailyRate = styled.p`
  margin: 0;
  padding-top: ${({ theme }) => theme.space[2]}px;
  border-top: 2px solid ${({ theme }) => theme.colors.signEdge};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-variant-numeric: tabular-nums;
`;

export const EmptyText = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  opacity: 0.85;
`;
