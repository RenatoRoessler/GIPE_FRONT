"use client";

import styled from "styled-components";

export const Title = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const List = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const Item = styled.li<{ $met: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme, $met }) => ($met ? theme.colors.success : theme.colors.textMuted)};
`;

export const Marker = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 16px;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

export const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;
