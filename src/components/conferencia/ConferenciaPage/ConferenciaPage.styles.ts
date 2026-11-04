"use client";

import styled from "styled-components";

export const Tela = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]}px;
  width: 100%;
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  margin: 0 auto;
`;

export const VisuallyHidden = styled.h1`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
`;

export const EsqueletoCartao = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
`;

export const Avisos = styled.div`
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
`;
