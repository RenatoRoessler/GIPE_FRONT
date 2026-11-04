"use client";

import styled from "styled-components";

export const Corpo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
`;

export const Contador = styled.p<{ $acima: boolean }>`
  margin: ${({ theme }) => theme.space[1]}px 0 0;
  text-align: right;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-variant-numeric: tabular-nums;
  color: ${({ theme, $acima }) => ($acima ? theme.colors.danger : theme.colors.textMuted)};
`;
