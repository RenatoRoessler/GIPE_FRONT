"use client";

import styled from "styled-components";

// Empilha os blocos da home com espaço entre eles.
export const DashboardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]}px;
`;
