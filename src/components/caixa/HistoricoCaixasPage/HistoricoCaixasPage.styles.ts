"use client";

import styled from "styled-components";

export const FiltroForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: row;
    align-items: flex-start;
  }

  /* Alinha os botões aos campos (que têm rótulo em cima). */
  button {
    align-self: flex-start;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    button {
      margin-top: ${({ theme }) => theme.space[4]}px;
    }
  }
`;

export const Estado = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[2]}px;
  padding: ${({ theme }) => theme.space[4]}px;
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.surface};
`;

export const Esqueletos = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
`;
