"use client";

import styled from "styled-components";
import { Button } from "@/components/ui/Button";

// Só leitores de tela: o texto sai da vista sem sair da árvore de acessibilidade.
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

export const SubmitButton = styled(Button)`
  width: 100%;
  min-height: ${({ theme }) => theme.layout.touchTarget};
`;

// Resultado da busca dentro do cartão: não troca de tela, para o cliente corrigir a placa no mesmo lugar.
export const Aviso = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
  padding: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px;
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ theme }) => theme.colors.dangerSoft};
  color: ${({ theme }) => theme.colors.text};

  strong {
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.space[1]}px;
    color: ${({ theme }) => theme.colors.danger};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
  }

  p {
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }
`;
