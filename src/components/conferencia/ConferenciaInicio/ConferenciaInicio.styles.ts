"use client";

import styled from "styled-components";

export const Total = styled.div`
  display: flex;
  align-items: baseline;
  gap: ${({ theme }) => theme.space[2]}px;
`;

export const TotalNumero = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xxl};
  font-weight: ${({ theme }) => theme.fontWeights.extrabold};
  font-variant-numeric: tabular-nums;
  letter-spacing: ${({ theme }) => theme.typography.displayTracking};
  line-height: 1;
  color: ${({ theme }) => theme.colors.accent};
`;

export const Chips = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]}px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const Chip = styled.li`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]}px;
  padding: ${({ theme }) => theme.space[1]}px ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[1]}px ${({ theme }) => theme.space[1]}px;
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme }) => theme.colors.surfaceMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  white-space: nowrap;
`;

export const Divisor = styled.hr`
  width: 100%;
  margin: 0;
  border: 0;
  border-top: 1.5px dashed ${({ theme }) => theme.colors.border};
`;

export const Ultima = styled.dl`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[1]}px ${({ theme }) => theme.space[3]}px;
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};

  dt {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  dd {
    margin: 0;
    font-family: ${({ theme }) => theme.fontFamilies.mono};
    font-variant-numeric: tabular-nums;
    color: ${({ theme }) => theme.colors.text};
  }
`;

export const Dica = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;
