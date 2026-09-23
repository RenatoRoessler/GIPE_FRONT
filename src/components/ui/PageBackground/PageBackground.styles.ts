"use client";

import styled from "styled-components";

export const Screen = styled.div`
  position: relative;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.space[4]}px;
  overflow: hidden;
  background: linear-gradient(
    340deg,
    ${({ theme }) => theme.colors.background} 0%,
    ${({ theme }) => theme.colors.primarySoft} 55%,
    ${({ theme }) => theme.colors.primarySofter} 100%
  );
`;
