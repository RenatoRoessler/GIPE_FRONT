"use client";

import styled from "styled-components";

export const Section = styled.fieldset`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
  margin: 0;
  padding: 0;
  border: none;
  min-width: 0;
`;

export const SectionTitle = styled.legend`
  padding: 0;
  margin-bottom: ${({ theme }) => theme.space[3]}px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;
