"use client";

import styled from "styled-components";

export const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]}px;
  max-width: 1100px;
`;

export const TitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
`;

export const HeaderRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`;

export const StatusLine = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

export const ActionBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]}px;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    & > button {
      flex: 1 1 100%;
    }
  }
`;

export const Panel = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
  padding: ${({ theme }) => theme.space[4]}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.background};
`;

export const EmptyPanel = styled(Panel)`
  align-items: flex-start;
  background-color: ${({ theme }) => theme.colors.surface};
`;

export const PanelTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

export const CardGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.space[3]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: 1.4fr repeat(4, 1fr);
  }
`;

export const StatCard = styled.div<{ $highlight?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
  padding: ${({ theme }) => theme.space[3]}px;
  border: 1px solid ${({ theme, $highlight }) => ($highlight ? theme.colors.primary : theme.colors.border)};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme, $highlight }) => ($highlight ? theme.colors.primarySoft : theme.colors.surface)};
`;

export const StatLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

export const StatValue = styled.span<{ $large?: boolean; $tone?: "success" | "danger" }>`
  font-size: ${({ theme, $large }) => ($large ? theme.fontSizes.xl : theme.fontSizes.lg)};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-variant-numeric: tabular-nums;
  color: ${({ theme, $tone }) => ($tone ? theme.colors[$tone] : theme.colors.text)};
`;

export const InfoList = styled.dl`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[4]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: repeat(3, 1fr);
  }

  dt {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    color: ${({ theme }) => theme.colors.textMuted};
  }

  dd {
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    font-variant-numeric: tabular-nums;
  }
`;

export const StatusRow = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[2]}px;
`;

export const FieldStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
`;

export const Hint = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const DiferencaGroup = styled.span`
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.space[2]}px;
`;

export const TurnoBlock = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  padding-bottom: ${({ theme }) => theme.space[3]}px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

export const TurnoBlockHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]}px;
`;

export const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;
