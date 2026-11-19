"use client";

import styled from "styled-components";

// Texto só para leitores de tela: complementa o que a cor, a seta ou o desenho já dizem para quem enxerga.
export const TextoOculto = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;
