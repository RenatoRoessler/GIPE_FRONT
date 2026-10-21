"use client";

import styled from "styled-components";

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

export const Actions = styled.div`
  padding-top: ${({ theme }) => theme.space[1]}px;
`;
