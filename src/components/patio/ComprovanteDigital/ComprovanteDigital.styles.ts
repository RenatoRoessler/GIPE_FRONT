"use client";

import styled from "styled-components";

// Tela cheia por cima do cabeçalho e do menu inferior (ambos z-index 20): o aparelho é entregue ao cliente.
export const Tela = styled.div`
  position: fixed;
  inset: 0;
  z-index: 30;
  overflow-y: auto;
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
`;

export const Coluna = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]}px;
  min-height: 100%;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  padding: calc(${({ theme }) => theme.space[3]}px + env(safe-area-inset-top, 0px)) ${({ theme }) => theme.space[4]}px
    calc(${({ theme }) => theme.space[4]}px + env(safe-area-inset-bottom, 0px));
`;

export const Topo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]}px;
  align-self: stretch;

  b {
    font-size: ${({ theme }) => theme.fontSizes.lg};
    font-weight: ${({ theme }) => theme.fontWeights.extrabold};
    letter-spacing: -0.01em;
  }
`;

export const Fechar = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 44px;
  height: 44px;
  margin-right: -${({ theme }) => theme.space[2]}px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.md};
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

export const DadosEstabelecimento = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  align-self: stretch;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.4;

  b {
    color: ${({ theme }) => theme.colors.text};
    font-family: ${({ theme }) => theme.fontFamilies.mono};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
  }
`;

export const Titulo = styled.h1`
  margin: ${({ theme }) => theme.space[1]}px 0 0;
  font-size: ${({ theme }) => theme.fontSizes.subtitle};
  font-weight: ${({ theme }) => theme.fontWeights.extrabold};
  letter-spacing: ${({ theme }) => theme.typography.displayTracking};

  &:focus {
    outline: none;
  }
`;

export const Identificacao = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]}px;
  text-align: center;
`;

export const Placa = styled.b`
  font-family: ${({ theme }) => theme.fontFamilies.mono};
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: 0.05em;
  line-height: 1.1;
`;

export const Veiculo = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  letter-spacing: 0.02em;
  text-transform: uppercase;
`;

export const Entrada = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-family: ${({ theme }) => theme.fontFamilies.mono};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

export const Instrucoes = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  align-self: stretch;
  padding: ${({ theme }) => theme.space[3]}px;
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.surface};
  box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.border};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.4;

  span:last-child {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

export const Rodape = styled.div`
  display: flex;
  flex-direction: column;
  align-self: stretch;
  margin-top: auto;
  padding-top: ${({ theme }) => theme.space[2]}px;
`;

export const Estado = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]}px;
  padding: ${({ theme }) => theme.space[5]}px 0;
  text-align: center;

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }
`;
