"use client";

import styled from "styled-components";

export const Card = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
`;

export const VehicleLine = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]}px;
`;

export const VehicleText = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: ${({ theme }) => theme.space[1]}px;
`;

export const VehicleName = styled.span`
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  overflow-wrap: anywhere;
`;

export const VehicleMeta = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Rows = styled.dl`
  display: flex;
  flex-direction: column;
  padding: 0 ${({ theme }) => theme.space[3]}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.surface};

  div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${({ theme }) => theme.space[3]}px;
    padding: ${({ theme }) => theme.space[2]}px 0;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }

  div:last-child {
    border-bottom: 0;
  }

  dt {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  dd {
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
`;
