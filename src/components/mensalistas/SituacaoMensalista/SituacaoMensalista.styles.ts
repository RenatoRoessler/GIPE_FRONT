"use client";

import styled from "styled-components";
import { Button } from "@/components/ui/Button";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[1]}px;
`;

export const BadgeRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]}px;
`;

// Linha secundária: data do aceite, validade do link, próximo passo.
export const Detail = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
`;

// O botão secundário tem o fundo da página e sumiria numa lista: ganha um contorno.
export const AcaoSecundaria = styled(Button)`
  box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.border};
`;

export const Actions = styled.div`
  padding-top: ${({ theme }) => theme.space[1]}px;

  /* Na lista do celular a situação corre em linha: a ação vai sozinha para a linha de baixo. */
  @media (max-width: calc(${({ theme }) => theme.breakpoints.md} - 1px)) {
    flex-basis: 100%;
  }
`;
