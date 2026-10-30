"use client";

import styled from "styled-components";

export const Controles = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
  }
`;

// Os blocos do fluxo; opaco enquanto um novo período carrega, sem trocar de lugar.
export const Blocos = styled.div<{ $refreshing: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]}px;
  opacity: ${({ $refreshing }) => ($refreshing ? 0.6 : 1)};
  transition: opacity 0.15s ease;
`;

export const Cartao = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
  min-width: 0;
  padding: ${({ theme }) => theme.space[4]}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.surface};
`;

export const Rotulo = styled.h2`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textMuted};
`;

// O saldo é a resposta da tela. Negativo vai para `danger`, junto com o sinal "−" escrito.
export const Destaque = styled.p<{ $negativo: boolean }>`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.display};
  font-size: ${({ theme }) => theme.typography.displaySize};
  font-weight: ${({ theme }) => theme.typography.displayWeight};
  letter-spacing: ${({ theme }) => theme.typography.displayTracking};
  text-transform: ${({ theme }) => theme.typography.displayTransform};
  font-variant-numeric: tabular-nums;
  color: ${({ $negativo, theme }) => ($negativo ? theme.colors.danger : theme.colors.accent)};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.fontSizes.xxl};
  }
`;

export const Apoio = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: ${({ theme }) => theme.space[1]}px ${({ theme }) => theme.space[4]}px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};

  strong {
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    color: ${({ theme }) => theme.colors.text};
    font-variant-numeric: tabular-nums;
  }
`;

export const Total = styled.span<{ $lado: "entrada" | "saida" }>`
  display: inline-flex;
  align-items: baseline;
  gap: ${({ theme }) => theme.space[1]}px;

  svg {
    align-self: center;
    width: 12px;
    height: 12px;
    color: ${({ $lado, theme }) => ($lado === "entrada" ? theme.colors.success : theme.colors.danger)};
  }
`;

export const Periodo = styled.span`
  margin-left: auto;
`;

export const Lados = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.space[4]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
  }
`;

export const LadoTopo = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]}px;
`;

export const LadoTitulo = styled.h2`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

export const LadoTotal = styled.span<{ $lado: "entrada" | "saida" }>`
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-variant-numeric: tabular-nums;
  color: ${({ $lado, theme }) => ($lado === "entrada" ? theme.colors.success : theme.colors.danger)};
`;

export const Grupo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  padding-top: ${({ theme }) => theme.space[3]}px;
  border-top: 1px dashed ${({ theme }) => theme.colors.border};
`;

// Nome à esquerda e valor à direita; a barra de proporção vem logo abaixo.
export const Linha = styled.div<{ $nivel: 0 | 1 }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
  padding-left: ${({ $nivel, theme }) => ($nivel === 1 ? `${theme.space[4]}px` : "0")};
`;

export const LinhaTopo = styled.div<{ $destaque?: boolean }>`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[3]}px;
  font-weight: ${({ $destaque, theme }) => ($destaque ? theme.fontWeights.semibold : theme.fontWeights.regular)};
`;

export const Nome = styled.span`
  min-width: 0;
  overflow-wrap: anywhere;
`;

export const Valor = styled.span`
  flex-shrink: 0;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-variant-numeric: tabular-nums;
`;

// Trilho e preenchimento são decorativos (aria-hidden): o percentual está em texto ao lado.
export const Barra = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
`;

export const Trilho = styled.div`
  flex: 1;
  height: 6px;
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme }) => theme.colors.surfaceMuted};
  overflow: hidden;
`;

export const Preenchimento = styled.div<{ $lado: "entrada" | "saida"; $percentual: number }>`
  width: ${({ $percentual }) => ($percentual > 0 ? Math.max(2, Math.min(100, $percentual)) : 0)}%;
  height: 100%;
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ $lado, theme }) => ($lado === "entrada" ? theme.colors.success : theme.colors.danger)};
`;

export const Percentual = styled.span`
  min-width: 4.5ch;
  text-align: right;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-variant-numeric: tabular-nums;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Vazio = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[2]}px;
`;

export const Nota = styled.p`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[2]}px;
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};

  svg {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    margin-top: 2px;
  }
`;
