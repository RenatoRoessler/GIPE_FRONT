"use client";

import styled from "styled-components";

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]}px;
`;

// Ação "Continuar" no fim de cada bloco recolhível da primeira etapa.
export const BlocoAcoes = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: ${({ theme }) => theme.space[3]}px;
`;

export const ErroAcoes = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[2]}px;
`;
