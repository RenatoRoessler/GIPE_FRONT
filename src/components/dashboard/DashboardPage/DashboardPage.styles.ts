"use client";

import styled from "styled-components";

// Erro de carregamento: o aviso e a ação de tentar de novo, um sobre o outro.
export const AreaErro = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[3]}px;
`;
