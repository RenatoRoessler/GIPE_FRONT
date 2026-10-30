"use client";

import styled from "styled-components";
import { Link } from "@/components/ui/Link";
import type { CorForma } from "./resumo";

export const Pilha = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
`;

export const Cartao = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  min-width: 0;
  padding: ${({ theme }) => theme.space[4]}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.surface};
`;

export const CartaoTopo = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]}px;
`;

export const Rotulo = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Apoio = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};

  strong {
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    color: ${({ theme }) => theme.colors.text};
    font-variant-numeric: tabular-nums;
  }
`;

export const Destaque = styled.p`
  font-family: ${({ theme }) => theme.typography.display};
  font-size: ${({ theme }) => theme.typography.displaySize};
  font-weight: ${({ theme }) => theme.typography.displayWeight};
  letter-spacing: ${({ theme }) => theme.typography.displayTracking};
  text-transform: ${({ theme }) => theme.typography.displayTransform};
  font-variant-numeric: tabular-nums;
  color: ${({ theme }) => theme.colors.accent};
`;

export const Valor = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-variant-numeric: tabular-nums;
  color: ${({ theme }) => theme.colors.text};
`;

export const Dupla = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.space[3]}px;
`;

export const Erro = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[2]}px;
`;

export const BarraEmpilhada = styled.div`
  display: flex;
  height: 12px;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme }) => theme.colors.border};
`;

// As quatro formas principais vêm de `colors.pagamento`; as demais usam `colors.steel`.
function corDaForma(theme: { colors: { steel: string; pagamento: Record<string, string> } }, cor: CorForma): string {
  return cor === "steel" ? theme.colors.steel : theme.colors.pagamento[cor];
}

export const Trecho = styled.span<{ $cor: CorForma; $percentual: number }>`
  flex: 0 0 ${({ $percentual }) => $percentual}%;
  background-color: ${({ theme, $cor }) => corDaForma(theme, $cor)};
`;

export const ListaFormas = styled.ul`
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const LinhaForma = styled.li`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  padding: ${({ theme }) => theme.space[2]}px 0;

  & + & {
    border-top: 1px dashed ${({ theme }) => theme.colors.border};
  }
`;

export const Amostra = styled.span<{ $cor: CorForma }>`
  width: 10px;
  height: 10px;
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme, $cor }) => corDaForma(theme, $cor)};
`;

export const NomeForma = styled.span`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: ${({ theme }) => theme.space[1]}px ${({ theme }) => theme.space[2]}px;
  min-width: 0;
  color: ${({ theme }) => theme.colors.text};

  small {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

export const Acoes = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]}px;

  & > button {
    flex: 1 1 140px;
    min-height: 48px;
  }

  & > button:last-child {
    flex-basis: 100%;
  }
`;

// Coluna única de cartões, como nos mockups de celular; nas telas grandes não estica.
export const Tela = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
  width: 100%;
  max-width: 720px;
  margin-inline: auto;
`;

// Navegação para a conferência dos movimentos; só em tela grande.
export const VerMovimentos = styled(Link)`
  display: none;
  align-self: flex-end;
  align-items: center;
  padding: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[4]}px;
  border-radius: ${({ theme }) => theme.radii.lg};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.extrabold};
  text-decoration: none;
  box-shadow: inset 0 0 0 1.5px ${({ theme }) => theme.colors.borderStrong};

  &:hover {
    background-color: ${({ theme }) => theme.colors.primarySoft};
    text-decoration: none;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: inline-flex;
  }
`;
