"use client";

import styled from "styled-components";
import { Button } from "@/components/ui/Button";
import { TableRow } from "@/components/ui/Table";

// Mesmo padrão visual da lista de Gestão de Preços (PrecosList.styles.ts).
export const Page = styled.div<{ $reservaFab?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]}px;

  /* No celular o botão flutuante cobriria o último item: o conteúdo ganha uma folga do tamanho dele. */
  @media (max-width: calc(${({ theme }) => theme.breakpoints.md} - 1px)) {
    padding-bottom: ${({ $reservaFab }) => ($reservaFab ? "88px" : "0")};
  }
`;

// Cadastro de novo mensalista na agenda: botão no cabeçalho em tela larga e flutuante no celular, ao alcance do polegar.
export const NovoNoCabecalho = styled(Button)`
  @media (max-width: calc(${({ theme }) => theme.breakpoints.md} - 1px)) {
    display: none;
  }
`;

export const NovoFlutuante = styled(Button)`
  position: fixed;
  right: max(${({ theme }) => theme.space[3]}px, env(safe-area-inset-right, 0px));
  /* Acima da barra de navegação inferior (que já inclui a área segura). */
  bottom: calc(${({ theme }) => theme.space[3]}px + ${({ theme }) => theme.layout.bottomNavHeight} + env(safe-area-inset-bottom, 0px));
  z-index: 10;
  min-height: 48px;
  padding-inline: ${({ theme }) => theme.space[4]}px;
  border-radius: ${({ theme }) => theme.radii.full};
  box-shadow: ${({ theme }) => theme.shadows.md};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    display: none;
  }
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

// Linha de ferramentas da aba: busca (se houver) à esquerda e ação primária à direita.
export const Toolbar = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
  }
`;

export const SearchBox = styled.div`
  width: 100%;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    max-width: 360px;
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

  /* No celular a tabela vira uma lista de itens (ver ListaRow): sem moldura e sem rolagem lateral. */
  @media (max-width: calc(${({ theme }) => theme.breakpoints.md} - 1px)) {
    border: none;
    border-radius: 0;
    overflow-x: visible;

    table,
    tbody {
      display: block;
    }
  }
`;

// Linha da lista: no computador é a linha da tabela; abaixo de `breakpoints.md` vira um item de quatro faixas, sem os
// rótulos de cartão (data-label) e sem as colunas que só pesam no celular (documento, e-mail e telefone).
export const ListaRow = styled(TableRow)`
  @media (max-width: calc(${({ theme }) => theme.breakpoints.md} - 1px)) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      "nome acoes"
      "tipo valor"
      "situacao veiculos";
    align-items: center;
    gap: ${({ theme }) => theme.space[1]}px ${({ theme }) => theme.space[3]}px;
    padding: ${({ theme }) => theme.space[3]}px ${({ theme }) => theme.space[1]}px;

    & > td {
      display: block;
      min-width: 0;
      padding: 0;
      text-align: left;

      &::before {
        content: none;
      }
    }

    & > td[data-label="Nome"] {
      grid-area: nome;

      /* E-mail e telefone ficam para a edição: no celular a linha mostra o que decide a ação. */
      span {
        display: none;
      }
    }

    & > td[data-label="Ações"] {
      grid-area: acoes;
    }

    & > td[data-label="Tipo"] {
      grid-area: tipo;
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      justify-content: flex-start;
      gap: 0 ${({ theme }) => theme.space[2]}px;

      span + span::before {
        content: "·";
        margin-right: ${({ theme }) => theme.space[2]}px;
      }
    }

    /* O dia de vencimento está na ficha: na linha do celular ele só disputaria espaço. */
    & > td[data-label="Vencimento"] {
      display: none;
    }

    & > td[data-label="Situação"] {
      grid-area: situacao;
      padding-top: ${({ theme }) => theme.space[1]}px;

      /* Trilha e selo na mesma linha, o detalhe e a ação embaixo. */
      > div {
        flex-direction: row;
        flex-wrap: wrap;
        align-items: center;
        gap: ${({ theme }) => theme.space[1]}px ${({ theme }) => theme.space[2]}px;

        > div {
          flex-basis: auto;
        }
      }

      /* Alvo de toque de 44px na ação da situação (Receber, Reenviar). */
      button {
        min-height: 44px;
      }
    }

    & > td[data-label="Veículos"] {
      grid-area: veiculos;
      justify-self: end;
    }

    & > td[data-label="Mensalidade"] {
      grid-area: valor;
      font-size: ${({ theme }) => theme.fontSizes.sm};
      font-weight: ${({ theme }) => theme.fontWeights.medium};
      text-align: right;
    }

    & > td[data-label="Documento"] {
      display: none;
    }
  }
`;

// O nome abre a ficha, sem aparência de botão; é também o alvo de toque principal da linha no celular.
export const NomeLink = styled.button`
  display: block;
  max-width: 100%;
  min-height: 24px;
  padding: 0;
  border: none;
  background: none;
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

export const Primary = styled.span`
  display: block;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

// Linha secundária dentro de uma célula (e-mail, categoria...).
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

// Placas da linha como um único botão: abre a ficha com os veículos.
export const VeiculosTrigger = styled.button`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]}px;
  min-height: 44px;
  padding: ${({ theme }) => theme.space[1]}px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: transparent;
  color: inherit;
  cursor: pointer;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primarySoft};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

// Redundante no celular, onde o nome da linha já abre a ficha.
export const VerFichaIcone = styled(IconButton)`
  @media (max-width: calc(${({ theme }) => theme.breakpoints.md} - 1px)) {
    display: none;
  }
`;
