"use client";

import styled from "styled-components";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  min-width: 0;
`;

export const Label = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

export const Control = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]}px;
  min-height: 56px;
  padding: 0 ${({ theme }) => theme.space[2]}px;
  border: 1.5px solid ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.surface};
`;

export const StepButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: transparent;
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  cursor: pointer;

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.primarySoft};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }

  &:disabled {
    color: ${({ theme }) => theme.colors.textMuted};
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

export const Value = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: ${({ theme }) => theme.space[1]}px;
  flex: 1;
  min-width: 0;
  border-radius: ${({ theme }) => theme.radii.sm};
  color: ${({ theme }) => theme.colors.text};

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

export const Number = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.extrabold};
`;

export const Hint = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-family: ${({ theme }) => theme.fontFamilies.mono};
  font-size: ${({ theme }) => theme.fontSizes.xs};
`;
