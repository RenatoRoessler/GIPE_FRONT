"use client";

import styled from "styled-components";

export const Screen = styled.main`
  position: relative;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.space[4]}px;
  overflow: hidden;
  background-color: ${({ theme }) => theme.colors.background};
`;
