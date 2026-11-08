"use client";

import styled from "styled-components";

// Mesmo padrão visual das listas de Empresas conveniadas e Mensalistas; a Table já vira cartões no celular.
export const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]}px;
`;

export const Header = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: ${({ theme }) => theme.space[3]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`;

// Os filtros só ficam lado a lado a partir de `lg`: antes disso a situação precisa da largura toda para os quatro rótulos caberem.
export const Filtros = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    flex-direction: row;
    align-items: flex-end;

    > :first-child {
      flex: 0 0 280px;
    }

    > :last-child {
      flex: 1 1 auto;
      min-width: 0;
    }
  }
`;

export const TableArea = styled.div<{ $refreshing: boolean }>`
  display: flex;
  flex-direction: column;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  overflow-x: auto;
  opacity: ${({ $refreshing }) => ($refreshing ? 0.6 : 1)};
  transition: opacity 0.15s ease;
`;

export const Primary = styled.span`
  display: block;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

export const Valor = styled.span`
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-variant-numeric: tabular-nums;
`;

// O número da fatura é o link de verdade da linha (teclado e leitor de tela); o resto da linha repete o clique para o mouse.
export const NumeroLink = styled.a`
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.accent};
  text-decoration: underline;
  text-underline-offset: 3px;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
    border-radius: ${({ theme }) => theme.radii.sm};
  }
`;

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]}px;
  padding: ${({ theme }) => theme.space[6]}px ${({ theme }) => theme.space[4]}px;
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  text-align: center;
`;

export const ErrorArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[2]}px;
`;

export const SkeletonRows = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
  padding: ${({ theme }) => theme.space[3]}px;
`;

// Formulário dos modais de emitir e pagar: campos um abaixo do outro.
export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
`;

// Detalhe: o extrato (herói) e o ciclo lado a lado a partir de `lg`; abaixo, as saídas.
export const DetalheGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.space[4]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: minmax(0, 1fr) minmax(280px, 360px);
    align-items: start;
  }
`;

export const Cartao = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
  padding: ${({ theme }) => theme.space[4]}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.surface};
`;

export const CartaoTitulo = styled.h2`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};
`;

export const TituloLinha = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
`;

// O valor a cobrar é o herói do extrato. Cancelada: apagado e riscado, para não parecer uma cobrança viva.
export const ValorHeroi = styled.p<{ $cancelada: boolean }>`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.display};
  font-size: ${({ theme }) => theme.fontSizes.xxl};
  font-weight: ${({ theme }) => theme.typography.displayWeight};
  letter-spacing: ${({ theme }) => theme.typography.displayTracking};
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
  color: ${({ theme, $cancelada }) => ($cancelada ? theme.colors.textMuted : theme.colors.accent)};
  text-decoration: ${({ $cancelada }) => ($cancelada ? "line-through" : "none")};
`;

export const Apoio = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Acoes = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: row;
  }
`;

// Linha do tempo vertical do ciclo de vida da fatura.
export const Ciclo = styled.ol`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export type PassoEstado = "feito" | "pendente" | "cancelado";

export const Passo = styled.li`
  display: grid;
  grid-template-columns: ${({ theme }) => theme.space[3]}px minmax(0, 1fr);
  column-gap: ${({ theme }) => theme.space[2]}px;
  align-items: start;
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

export const Marca = styled.span<{ $estado: PassoEstado }>`
  width: ${({ theme }) => theme.space[3]}px;
  height: ${({ theme }) => theme.space[3]}px;
  margin-top: 2px;
  border-radius: ${({ theme }) => theme.radii.full};
  border: 2px solid
    ${({ theme, $estado }) => ($estado === "feito" ? theme.colors.success : $estado === "cancelado" ? theme.colors.textMuted : theme.colors.borderStrong)};
  background-color: ${({ theme, $estado }) => ($estado === "feito" ? theme.colors.success : $estado === "cancelado" ? theme.colors.textMuted : "transparent")};
`;

export const PassoTitulo = styled.span`
  display: block;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};
`;

// Linha secundária dentro de uma célula ou de um passo (modelo, quem fez, quando).
export const SubText = styled.span`
  display: block;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
`;

export const Mudo = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-variant-numeric: tabular-nums;
`;

// A parte da conveniada é o que se cobra e o que soma na fatura: a coluna em destaque.
export const ValorConveniada = styled.span`
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};
  font-variant-numeric: tabular-nums;
`;

export const Rodape = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]}px;
  padding: ${({ theme }) => theme.space[3]}px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

export const AvisoCancelada = styled.p`
  margin: 0;
  padding: ${({ theme }) => theme.space[4]}px;
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.textMuted};
`;

// Resumo no topo do modal de pagamento: o que está sendo baixado.
export const Resumo = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]}px;
  padding: ${({ theme }) => theme.space[3]}px;
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ theme }) => theme.colors.surfaceMuted};
`;

export const ResumoRotulo = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const ResumoValor = styled.span`
  font-family: ${({ theme }) => theme.typography.display};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.typography.displayWeight};
  font-variant-numeric: tabular-nums;
  color: ${({ theme }) => theme.colors.accent};
`;
