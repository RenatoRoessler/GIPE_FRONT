"use client";

import styled from "styled-components";

// Cabeçalho da fila: hora e atualização, resumo por status e busca, um abaixo do outro.
export const Cabecalho = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
  margin-bottom: ${({ theme }) => theme.space[3]}px;
`;

export const Topo = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]}px;
`;

export const Eyebrow = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-family: ${({ theme }) => theme.fontFamilies.mono};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-variant-numeric: tabular-nums;
`;

// Rótulo de cada aba no celular: a contagem em cima e o nome embaixo, para o nome nunca quebrar em várias linhas.
export const AbaConteudo = styled.span`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: ${({ theme }) => theme.space[1]}px 0;
  line-height: 1.1;
`;

export const AbaContagem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]}px;
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-variant-numeric: tabular-nums;
`;

export const AbaNome = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

// Marca a aba que tem serviço passado da previsão; o texto da aba também diz isso (a cor só reforça).
export const PontoAtraso = styled.span`
  width: 8px;
  height: 8px;
  flex: none;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.danger};
`;

export const Busca = styled.div`
  max-width: 360px;
`;

export const Atualizado = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

export const Colunas = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.space[3]}px;
  min-width: 0;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-items: start;
  }
`;

export const Coluna = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
  min-width: 0;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    max-height: calc(100dvh - ${({ theme }) => theme.layout.stickyTop} - ${({ theme }) => theme.space[7]}px);
    overflow-y: auto;
    padding: ${({ theme }) => theme.space[2]}px;
    border-radius: ${({ theme }) => theme.radii.lg};
    background-color: ${({ theme }) => theme.colors.surfaceMuted};
  }
`;

export const TituloColuna = styled.h3`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;

export const Vazio = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.md};
`;

export const Estado = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[2]}px;
  margin-bottom: ${({ theme }) => theme.space[3]}px;
`;

// Aviso da troca de status, com a chance de desfazer um engano.
export const Desfazer = styled.div`
  position: fixed;
  left: 50%;
  bottom: calc(${({ theme }) => theme.layout.bottomNavReserved} + env(safe-area-inset-bottom, 0px) + ${({ theme }) => theme.space[3]}px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[3]}px;
  width: calc(100vw - ${({ theme }) => theme.space[4] * 2}px);
  max-width: 360px;
  padding: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px;
  transform: translateX(-50%);
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ theme }) => theme.colors.success};
  color: ${({ theme }) => theme.colors.onSuccess};
  box-shadow: ${({ theme }) => theme.shadows.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

export const BotaoDesfazer = styled.button`
  min-height: ${({ theme }) => theme.layout.touchTarget};
  padding: 0 ${({ theme }) => theme.space[2]}px;
  border: none;
  background: transparent;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  text-decoration: underline;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }
`;

export const VisuallyHidden = styled.p`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
`;
