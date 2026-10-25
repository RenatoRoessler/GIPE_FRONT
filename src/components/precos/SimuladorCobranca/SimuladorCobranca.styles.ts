"use client";

import styled from "styled-components";

export const Bloco = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
  padding: ${({ theme }) => theme.space[4]}px;
  border: 2px solid ${({ theme }) => theme.colors.text};
  border-radius: ${({ theme }) => theme.radii.lg};
`;

export const Titulo = styled.h3`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.display};
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

export const Controles = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.space[3]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: minmax(0, 220px) minmax(0, 1fr);
    align-items: end;
  }
`;

export const Permanencia = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
`;

export const PermanenciaLabel = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

export const PermanenciaLinha = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]}px;

  input[type="range"] {
    flex: 1;
    min-width: 0;
    min-height: 44px;
    accent-color: ${({ theme }) => theme.colors.primary};
  }
`;

export const Minutos = styled.input`
  width: 84px;
  padding: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[2]}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  font-variant-numeric: tabular-nums;
  text-align: right;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

export const Equivalencia = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  font-variant-numeric: tabular-nums;
`;

export const Resultado = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: ${({ theme }) => theme.space[1]}px ${({ theme }) => theme.space[3]}px;
`;

export const Valor = styled.strong`
  font-family: ${({ theme }) => theme.fontFamilies.mono};
  font-size: ${({ theme }) => theme.typography.displaySize};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  line-height: 1;
  font-variant-numeric: tabular-nums;
`;

export const ValorBruto = styled.s`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  font-variant-numeric: tabular-nums;
`;

export const Explicacao = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.md};
`;

export const SemValor = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Aviso = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Anuncio = styled.p`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;
