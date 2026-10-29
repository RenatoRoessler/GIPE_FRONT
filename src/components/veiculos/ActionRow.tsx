"use client";

import styled from "styled-components";

// Linha de ações rápidas (botões em pílula) que quebra de linha em telas estreitas.
export const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[3]}px;

  /* Sem permissão para nenhuma ação, a linha fica vazia e não ocupa espaço. */
  &:empty {
    display: none;
  }
`;
