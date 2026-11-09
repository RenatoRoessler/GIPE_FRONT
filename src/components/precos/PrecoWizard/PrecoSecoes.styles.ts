"use client";

import styled from "styled-components";

// Campos de uma seção, um abaixo do outro.
export const Conteudo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]}px;
  padding-top: ${({ theme }) => theme.space[3]}px;
`;

export const ErrosSecao = styled.ul`
  margin: ${({ theme }) => theme.space[1]}px 0 0;
  padding-left: ${({ theme }) => theme.space[4]}px;
`;

// Bloco recolhível com o editor de horários por linha, ao lado da grade da seção "Quando vale".
export const AjusteFino = styled.details`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.space[3]}px;

  > summary {
    min-height: ${({ theme }) => theme.layout.touchTarget};
    display: flex;
    align-items: center;
    cursor: pointer;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
  }

  &[open] > summary {
    margin-bottom: ${({ theme }) => theme.space[3]}px;
  }
`;

export const Continuar = styled.div`
  display: flex;

  & > button {
    width: 100%;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    justify-content: flex-end;

    & > button {
      width: auto;
    }
  }
`;

// Resumo de uma seção alterada: o valor salvo riscado e o novo em destaque.
export const Mudancas = styled.span`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
`;

export const Antes = styled.del`
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Depois = styled.strong`
  color: ${({ theme }) => theme.colors.text};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;
