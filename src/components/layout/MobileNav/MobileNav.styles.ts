"use client";

import styled from "styled-components";

const FOCUS_RING = "#14202E";
const TOUCH_TARGET = "44px";

export const Trigger = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  min-height: ${TOUCH_TARGET};
  padding: 0 ${({ theme }) => theme.space[3]}px;
  border: 3px solid ${({ theme }) => theme.colors.signEdge};
  border-radius: ${({ theme }) => theme.radii.md};
  outline: 2px solid ${({ theme }) => theme.colors.primary};
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.onSign};
  font-family: ${({ theme }) => theme.typography.display};
  font-weight: 600;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  line-height: 1;
  letter-spacing: ${({ theme }) => theme.typography.displayTracking};
  text-transform: ${({ theme }) => theme.typography.displayTransform};
  cursor: pointer;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryHover};
  }

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.warn};
    outline-offset: 2px;
    box-shadow: 0 0 0 5px ${FOCUS_RING};
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: none;
  }
`;

export const Dialog = styled.dialog`
  position: fixed;
  inset: 0 0 auto 0;
  width: 100%;
  max-width: 100%;
  max-height: 100dvh;
  margin: 0;
  padding: 0;
  border: none;
  overflow-y: auto;
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};

  &::backdrop {
    background-color: rgba(20, 32, 46, 0.6);
  }

  @media (prefers-reduced-motion: no-preference) {
    &[open] {
      animation: slide-down 0.18s ease-out;
    }

    @keyframes slide-down {
      from {
        transform: translateY(-16px);
        opacity: 0;
      }
    }
  }
`;

export const Panel = styled.div`
  position: relative;
  padding: ${({ theme }) => theme.space[3]}px ${({ theme }) => theme.space[3]}px ${({ theme }) => theme.space[4]}px;
`;

export const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.space[3]}px;
`;

export const PanelTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.display};
  font-weight: 700;
  font-size: ${({ theme }) => theme.fontSizes.xl};
  letter-spacing: ${({ theme }) => theme.typography.displayTracking};
  text-transform: ${({ theme }) => theme.typography.displayTransform};
`;

export const CloseButton = styled.button`
  display: grid;
  place-items: center;
  width: ${TOUCH_TARGET};
  height: ${TOUCH_TARGET};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.warn};
    outline-offset: 2px;
  }
`;

export const Beam = styled.div`
  height: 10px;
  margin-bottom: ${({ theme }) => theme.space[3]}px;
  border-radius: 5px;
  background-color: ${({ theme }) => theme.colors.steel};
`;

export const SignList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
  list-style: none;
`;
