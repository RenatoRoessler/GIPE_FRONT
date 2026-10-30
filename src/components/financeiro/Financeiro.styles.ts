"use client";

import styled from "styled-components";
import { TableRow } from "@/components/ui/Table";

// Mesmo padrão visual das listas de Preços e de Mensalistas.
export const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]}px;
`;

export const Header = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[3]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`;

// Conteúdo de uma aba: blocos empilhados.
export const Conteudo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]}px;
`;

// Filtros de uma lista: empilhados no celular, em linha a partir de `md`.
export const Filtros = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-end;
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

  /* No celular a tabela vira uma lista de itens: sem moldura e sem rolagem lateral. */
  @media (max-width: calc(${({ theme }) => theme.breakpoints.md} - 1px)) {
    border: none;
    border-radius: 0;
    overflow-x: visible;
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

export const Primary = styled.span`
  display: block;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

// Linha secundária dentro de uma célula (favorecido, documento...).
export const SubText = styled.span`
  display: block;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
`;

export const RowActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.space[3]}px;
`;

// Ação de linha só com ícone: o nome acessível vem do aria-label e do title de quem usa.
export const IconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: transparent;
  color: ${({ theme }) => theme.colors.link};
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primarySoft};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

// Seção de uma lista (Receitas, Despesas): subtítulo e a tabela dela.
export const Secao = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
`;

export const SecaoTitulo = styled.h2`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

// Subcategoria: recuada e com o marcador "↳".
export const NomeFilha = styled.span`
  display: block;
  padding-left: ${({ theme }) => theme.space[4]}px;
  font-weight: ${({ theme }) => theme.fontWeights.regular};

  &::before {
    content: "↳ ";
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

// Categoria pai que aparece só porque uma filha passou no filtro.
export const NomeContexto = styled(Primary)`
  color: ${({ theme }) => theme.colors.textMuted};
`;

// Valor de um lançamento: verde na entrada, vermelho na saída (o sinal escrito vem junto); riscado quando cancelado.
export const ValorLancamento = styled.span<{ $sentido: "entrada" | "saida" | "neutro"; $cancelado: boolean }>`
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-variant-numeric: tabular-nums;
  color: ${({ $sentido, $cancelado, theme }) =>
    $cancelado ? theme.colors.textMuted : $sentido === "entrada" ? theme.colors.success : $sentido === "saida" ? theme.colors.danger : theme.colors.text};
  text-decoration: ${({ $cancelado }) => ($cancelado ? "line-through" : "none")};
`;

// Linha de lançamento cancelada: todo o texto fica discreto.
export const LinhaDeLancamento = styled(TableRow)<{ $cancelado: boolean }>`
  color: ${({ $cancelado, theme }) => ($cancelado ? theme.colors.textMuted : "inherit")};
`;

// A descrição abre o detalhe, sem aparência de botão; é também o alvo de toque principal da linha no celular.
export const DescricaoBotao = styled.button`
  display: block;
  max-width: 100%;
  min-height: 24px;
  padding: 0;
  border: none;
  background: none;
  color: inherit;
  font: inherit;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  text-align: left;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
    border-radius: ${({ theme }) => theme.radii.sm};
  }

  @media (max-width: calc(${({ theme }) => theme.breakpoints.md} - 1px)) {
    min-height: 44px;
  }
`;

export const Selos = styled.span`
  display: inline-flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[1]}px;
  margin-top: ${({ theme }) => theme.space[1]}px;
`;
