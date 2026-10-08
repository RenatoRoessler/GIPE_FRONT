"use client";

import styled from "styled-components";

export const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
`;

export const Item = styled.section<{ $hasError: boolean }>`
  border: 1px solid
    ${({ theme, $hasError }) => ($hasError ? theme.colors.danger : theme.colors.border)};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.background};
  overflow: hidden;
`;

export const Heading = styled.h2`
  margin: 0;
  font-size: inherit;
  font-weight: inherit;
`;

export const Trigger = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[3]}px;
  width: 100%;
  min-height: 56px;
  padding: ${({ theme }) => theme.space[3]}px ${({ theme }) => theme.space[4]}px;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  text-align: left;
  cursor: pointer;

  &:hover {
    background-color: ${({ theme }) => theme.colors.surface};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: -2px;
  }
`;

export const TitleGroup = styled.span`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
  min-width: 0;
`;

export const Title = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

export const Summary = styled.span<{ $hasError: boolean }>`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme, $hasError }) => ($hasError ? theme.colors.danger : theme.colors.textMuted)};
`;

export const Chevron = styled.svg<{ $open: boolean }>`
  flex-shrink: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  transform: rotate(${({ $open }) => ($open ? "180deg" : "0deg")});

  @media (prefers-reduced-motion: no-preference) {
    transition: transform 0.15s ease;
  }
`;

export const Panel = styled.div`
  padding: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[4]}px
    ${({ theme }) => theme.space[4]}px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  &[hidden] {
    display: none;
  }
`;
