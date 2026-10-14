"use client";

import styled from "styled-components";

const TOUCH_TARGET = "44px";

export const StyledDiscButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]}px;
  min-height: ${TOUCH_TARGET};
  padding: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[4]}px ${({ theme }) => theme.space[2]}px
    ${({ theme }) => theme.space[2]}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.typography.display};
  font-weight: 600;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  letter-spacing: ${({ theme }) => theme.typography.displayTracking};
  text-transform: ${({ theme }) => theme.typography.displayTransform};
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.warn};
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    width: 100%;
  }
`;

export const Badge = styled.span`
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border: 3px solid ${({ theme }) => theme.colors.signEdge};
  border-radius: ${({ theme }) => theme.radii.full};
  outline: 2px solid ${({ theme }) => theme.colors.primary};
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.onSign};
  font-weight: 700;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  line-height: 1;
`;
