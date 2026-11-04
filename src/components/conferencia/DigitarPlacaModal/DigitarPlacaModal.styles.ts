"use client";

import styled from "styled-components";

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
`;

export const Placa = styled.div`
  width: min(220px, 100%);
  margin: 0 auto;
`;
