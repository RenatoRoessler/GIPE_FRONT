"use client";

import styled from "styled-components";

export const Lista = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const Subtitulo = styled.span<{ $tom: "danger" | "success" }>`
  font-family: ${({ theme }) => theme.fontFamilies.mono};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${({ theme, $tom }) => ($tom === "danger" ? theme.colors.danger : theme.colors.success)};
`;

export const SemDivergencias = styled.p`
  margin: 0;
  padding: ${({ theme }) => theme.space[5]}px ${({ theme }) => theme.space[3]}px;
  border: 1.5px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};

  &:focus {
    outline: none;
  }
`;
