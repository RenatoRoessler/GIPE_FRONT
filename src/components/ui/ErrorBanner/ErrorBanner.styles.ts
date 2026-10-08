"use client";

import styled from "styled-components";

export const ErrorBanner = styled.div`
  padding: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px;
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: rgba(229, 72, 77, 0.08);
  border: 1px solid ${({ theme }) => theme.colors.danger};
  color: ${({ theme }) => theme.colors.danger};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;
