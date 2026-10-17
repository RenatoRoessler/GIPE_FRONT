"use client";

import styled from "styled-components";

export const Painel = styled.aside`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
  min-width: 0;

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    position: sticky;
    top: ${({ theme }) => theme.space[3]}px;
    align-self: start;
  }
`;

export const Caixa = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  padding: ${({ theme }) => theme.space[3]}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.background};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

export const Titulo = styled.h2`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.display};
  font-size: ${({ theme }) => theme.fontSizes.md};
  text-transform: ${({ theme }) => theme.typography.displayTransform};
  letter-spacing: ${({ theme }) => theme.typography.displayTracking};
  color: ${({ theme }) => theme.colors.text};
`;

export const Progresso = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.space[1]}px;
`;

export const Segmento = styled.span<{ $completo: boolean }>`
  height: 6px;
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme, $completo }) => ($completo ? theme.colors.success : theme.colors.surface)};
  transition: background-color 0.2s ease;
`;

export const Lista = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

export const Item = styled.li`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[2]}px;
  min-width: 0;
`;

export const Marca = styled.span<{ $ok: boolean }>`
  flex-shrink: 0;
  width: 16px;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme, $ok }) => ($ok ? theme.colors.success : theme.colors.textMuted)};
`;

export const Conteudo = styled.span`
  min-width: 0;
  overflow-wrap: anywhere;
  color: ${({ theme }) => theme.colors.text};

  strong {
    font-weight: ${({ theme }) => theme.fontWeights.bold};
  }
`;

export const Alterado = styled.span`
  margin-left: ${({ theme }) => theme.space[1]}px;
  padding: 0 ${({ theme }) => theme.space[2]}px;
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme }) => theme.colors.warn};
  color: ${({ theme }) => theme.colors.onWarn};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

export const MudancasLista = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
  margin: ${({ theme }) => theme.space[1]}px 0 0;
  padding: 0;
  list-style: none;
  font-size: ${({ theme }) => theme.fontSizes.xs};
`;

export const SoParaLeitor = styled.p`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;
