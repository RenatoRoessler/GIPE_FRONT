"use client";

import styled from "styled-components";

export const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]}px;
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
`;

// Voltar, título e situação da tabela, no alto da página.
export const Cabecalho = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
`;

export const TitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
`;

export const StateBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[3]}px;
`;

export const SubtitleRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};
`;

export const UnsavedNote = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

// Painel de conclusão e resumo da tabela. No celular e no tablet o painel vira a barra fixa acima do menu e o
// resumo desce para o fim da página (o wrapper some do layout); em telas grandes os dois ficam juntos, ao lado das seções,
// e rolam por dentro se não couberem na altura da janela.
export const Lateral = styled.div`
  display: contents;

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.space[3]}px;
    position: sticky;
    top: ${({ theme }) => theme.layout.stickyTop};
    max-height: calc(100vh - ${({ theme }) => theme.layout.stickyTop} - ${({ theme }) => theme.space[3]}px);
    overflow-y: auto;

    /* O sticky do painel passa a ser o do wrapper. */
    & > aside {
      position: static;
    }
  }
`;
