"use client";

import NextLink from "next/link";
import styled from "styled-components";

// Contêiner: Tarifa e as demais partes se ajustam à largura da coluna do detalhe, não à da janela.
export const Detalhe = styled.article`
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]}px;
  min-width: 0;
`;

export const Cabecalho = styled.header`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[3]}px;
`;

export const Identificacao = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  min-width: 0;
`;

export const Titulo = styled.h2`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.display};
  font-size: ${({ theme }) => theme.typography.displaySize};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: ${({ theme }) => theme.typography.displayTracking};
  text-transform: ${({ theme }) => theme.typography.displayTransform};
  line-height: 1.1;
  overflow-wrap: anywhere;
`;

export const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  font-variant-numeric: tabular-nums;
`;

export const TipoNome = styled.span`
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-size: ${({ theme }) => theme.fontSizes.xs};
`;

// Mesma aparência do botão secundário (Button variant="secondary"): é um link para a edição, não uma ação da tela.
export const EditarLink = styled(NextLink)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.space[2]}px;
  flex-shrink: 0;
  min-height: 44px;
  padding: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[4]}px;
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: inset 0 0 0 1.5px ${({ theme }) => theme.colors.borderStrong};
  background-color: transparent;
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.extrabold};
  text-decoration: none;
  transition: background-color 0.15s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primarySoft};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

// Voltar para a lista: só no celular, onde lista e detalhe não aparecem juntos.
export const VoltarArea = styled.div`
  display: flex;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    display: none;
  }
`;

export const Tarifa = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.space[4]}px;
  align-items: start;

  @container (min-width: ${({ theme }) => theme.layout.formGridWide}) {
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  }
`;

export const Fatos = styled.dl`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.space[3]}px;
  margin: 0;

  div {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  dt {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    color: ${({ theme }) => theme.colors.textMuted};
  }

  dd {
    margin: 0;
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;
  }
`;

export const FatosEmColunas = styled(Fatos)`
  @container (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const Estado = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[3]}px;
`;

export const SkeletonBloco = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
`;
