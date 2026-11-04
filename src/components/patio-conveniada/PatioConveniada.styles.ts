"use client";

import styled from "styled-components";

export const Conteudo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]}px;
  width: 100%;
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  margin: 0 auto;
`;

export const Topo = styled.header`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
`;

export const Titulo = styled.h1`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.subtitle};
  font-weight: ${({ theme }) => theme.fontWeights.extrabold};
  letter-spacing: ${({ theme }) => theme.typography.displayTracking};
  line-height: 1.1;
`;

export const Subtitulo = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

// Resumo e busca: empilhados no celular, lado a lado a partir de `lg`.
export const Painel = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.space[3]}px;
  align-items: start;

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
`;

export const Busca = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  min-width: 0;
`;

export const Atualizacao = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

export const Indicadores = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]}px ${({ theme }) => theme.space[3]}px;
`;

export const Grade = styled.ul<{ $atualizando: boolean }>`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.space[2]}px;
  margin: 0;
  padding: 0;
  list-style: none;
  opacity: ${({ $atualizando }) => ($atualizando ? 0.6 : 1)};

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: ${({ theme }) => theme.space[3]}px;
  }

  @media (prefers-reduced-motion: no-preference) {
    transition: opacity 0.15s ease;
  }
`;

export const Vazio = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]}px;
  padding: ${({ theme }) => theme.space[5]}px ${({ theme }) => theme.space[4]}px;
  text-align: center;

  b {
    font-size: ${({ theme }) => theme.fontSizes.lg};
    font-weight: ${({ theme }) => theme.fontWeights.extrabold};
  }

  p {
    max-width: 320px;
    margin: 0;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }
`;

// Vaga vazia: retângulo aberto embaixo, como no pátio do lojista.
export const VagaIcone = styled.span`
  width: 56px;
  height: 48px;
  border: 4px solid ${({ theme }) => theme.colors.border};
  border-bottom: 0;
  border-radius: ${({ theme }) => theme.radii.md} ${({ theme }) => theme.radii.md} 0 0;
`;

export const EsqueletoLinha = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space[2]}px;
`;

export const MaisBotao = styled.div`
  display: flex;
  justify-content: center;
`;
