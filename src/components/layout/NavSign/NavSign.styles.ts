"use client";

import styled, { css } from "styled-components";

const STEEL_POST_HEIGHT = "26px";

// Anel escuro externo do foco (como no modelo), para o contorno amarelo ler bem em qualquer fundo.
const FOCUS_RING = "#14202E";

export const Sign = styled.a<{ $active: boolean; $variant: "gantry" | "panel" }>`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]}px;
  padding: 12px 14px;
  border: 3px solid ${({ theme }) => theme.colors.signEdge};
  border-radius: ${({ theme }) => theme.radii.md};
  outline: 2px solid ${({ theme }) => theme.colors.primary};
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.onSign};
  box-shadow: ${({ theme }) => theme.shadows.glow};
  font-family: ${({ theme }) => theme.typography.display};
  font-weight: 600;
  font-size: 24px;
  line-height: 1;
  letter-spacing: ${({ theme }) => theme.typography.displayTracking};
  text-transform: ${({ theme }) => theme.typography.displayTransform};
  text-decoration: none;
  cursor: pointer;

  svg {
    width: 34px;
    height: 34px;
    flex-shrink: 0;
    stroke-width: 2.4;
  }

  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryHover};
  }

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.warn};
    outline-offset: 2px;
    box-shadow: 0 0 0 5px ${FOCUS_RING};
  }

  @media (prefers-reduced-motion: no-preference) {
    transition: background-color 0.15s ease, border-color 0.15s ease;
  }

  ${({ $variant, theme }) =>
    $variant === "gantry"
      ? css`
          flex: 1 0 150px;
          min-height: 92px;

          &::before,
          &::after {
            content: "";
            position: absolute;
            top: -${STEEL_POST_HEIGHT};
            width: 5px;
            height: ${STEEL_POST_HEIGHT};
            background-color: ${theme.colors.steel};
          }

          &::before {
            left: 22%;
          }

          &::after {
            right: 22%;
          }
        `
      : css`
          flex-direction: row;
          align-items: center;
          justify-content: flex-start;
          gap: ${theme.space[3]}px;
          min-height: 56px;
          width: 100%;
        `}

  ${({ $active, theme }) =>
    $active &&
    css`
      border-color: ${theme.colors.primary};
      outline-color: ${theme.colors.signEdge};
      background-color: ${theme.colors.signEdge};
      color: ${theme.colors.primary};

      &:hover {
        background-color: ${theme.colors.signEdge};
      }
    `}
`;
