"use client";

import styled from "styled-components";
import { StyledInput } from "@/components/ui/Input/Input.styles";

// Mesma aparência do campo de texto, em várias linhas e só com redimensionamento vertical.
export const StyledTextarea = styled(StyledInput)`
  min-height: calc(${({ theme }) => theme.layout.touchTarget} * 2);
  line-height: 1.4;
  resize: vertical;
`;

export const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
`;

export const Counter = styled.span<{ $excedido: boolean }>`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-variant-numeric: tabular-nums;
  color: ${({ theme, $excedido }) => ($excedido ? theme.colors.danger : theme.colors.textMuted)};
  font-weight: ${({ theme, $excedido }) => ($excedido ? theme.fontWeights.bold : theme.fontWeights.regular)};
`;
