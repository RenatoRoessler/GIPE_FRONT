"use client";

import styled from "styled-components";

export const Campo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
  min-width: 0;
`;
