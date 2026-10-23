"use client";

import styled from "styled-components";

export const Celula = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: ${({ theme }) => theme.space[1]}px;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    align-items: flex-start;
  }
`;

export const Trilho = styled.span`
  display: block;
  width: 100%;
  min-width: 80px;
  height: 4px;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme }) => theme.colors.border};
`;

export const Preenchimento = styled.span<{ $percentual: number }>`
  display: block;
  width: ${({ $percentual }) => $percentual}%;
  height: 100%;
  background-color: ${({ theme }) => theme.colors.success};
`;
