"use client";

import styled from "styled-components";

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
`;

// O que falta para registrar. No rodapé em coluna (celular) o último filho fica no topo, logo acima do botão principal;
// em linha (a partir de `sm`) ele vai para a esquerda, longe dos botões.
export const Pendencia = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-align: center;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    order: -1;
    margin-right: auto;
    align-self: center;
    text-align: left;
  }
`;

// Resumo da entrada que acabou de ser registrada, acima do quadro de chaves.
export const Confirmacao = styled.p`
  margin: 0 0 ${({ theme }) => theme.space[3]}px;
  color: ${({ theme }) => theme.colors.success};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-variant-numeric: tabular-nums;
`;

// Placa que já está no pátio: bloqueia o registro e leva ao ticket dela.
export const JaNoPatio = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[1]}px;
  padding: ${({ theme }) => theme.space[3]}px;
  border: 1px solid ${({ theme }) => theme.colors.danger};
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ theme }) => theme.colors.dangerSoft};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};

  p {
    margin: 0;
  }
`;
