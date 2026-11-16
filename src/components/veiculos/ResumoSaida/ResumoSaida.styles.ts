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

// Entrada e permanência lado a lado, uma linha só: o pagamento cabe na tela do celular sem rolar.
export const Rows = styled.dl`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.surface};

  div {
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.space[1]}px;
    min-width: 0;
    padding: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px;
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }

  div + div {
    border-left: 1px solid ${({ theme }) => theme.colors.border};
  }

  dt {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: ${({ theme }) => theme.fontSizes.xs};
  }

  dd {
    margin: 0;
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;
  }
`;
