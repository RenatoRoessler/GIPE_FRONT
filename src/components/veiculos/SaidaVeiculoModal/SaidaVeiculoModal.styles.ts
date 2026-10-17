"use client";

import styled, { keyframes } from "styled-components";

// Mobile: uma coluna na ordem da operação (ler, conferir, pagar). Desktop: leitura à esquerda, resumo e pagamento à direita.
export const Layout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.space[4]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
  }
`;

export const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]}px;
  min-width: 0;
`;

const entrada = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

// Cada fase remonta com `key`, então o fade roda a cada troca de fase.
export const FaseConteudo = styled.div`
  animation: ${entrada} 150ms ease-out;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

// Título da fase: oculto, mas focável. Recebe o foco ao trocar de fase e, por isso, é lido pelo leitor de tela.
export const FaseTitulo = styled.h3`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;

  &:focus {
    outline: none;
  }
`;

// Explica por que o botão de confirmar está desabilitado enquanto os meios de pagamento carregam.
export const NotaRodape = styled.span`
  align-self: center;
  margin-right: auto;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;
