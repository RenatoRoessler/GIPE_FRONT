"use client";

import styled from "styled-components";

// Telas largas: lista e detalhe lado a lado, cada um rolando sozinho dentro da moldura. No celular, uma coluna por vez.
export const Moldura = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  min-width: 0;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.surface};
  overflow: hidden;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 320px minmax(0, 1fr);
    height: calc(100dvh - ${({ theme }) => theme.layout.stickyTop} - ${({ theme }) => theme.space[6]}px);
    min-height: 420px;
  }
`;

// Faixa do botão de cadastro, acima da moldura, alinhado à direita.
export const Barra = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: ${({ theme }) => theme.space[2]}px;
`;

export const ColunaLista = styled.section`
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    border-right: 1px solid ${({ theme }) => theme.colors.border};
  }
`;

export const Filtros = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  padding: ${({ theme }) => theme.space[3]}px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

export const Contagem = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

export const Itens = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
`;

export const ColunaDetalhe = styled.section`
  min-width: 0;
  min-height: 0;
  padding: ${({ theme }) => theme.space[4]}px;
  overflow-y: auto;
`;

export const Estado = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[2]}px;
  padding: ${({ theme }) => theme.space[4]}px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.md};

  p {
    margin: 0;
  }
`;

export const EsqueletoLista = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  padding: ${({ theme }) => theme.space[3]}px;
`;

export const Voltar = styled.div`
  padding: ${({ theme }) => theme.space[3]}px ${({ theme }) => theme.space[3]}px 0;
`;

export const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
`;
