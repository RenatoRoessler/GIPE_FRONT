"use client";

import styled from "styled-components";

// Frase da marca: o trecho em destaque usa a cor de destaque do tema.
const Frase = styled.p`
  align-self: center;
  margin: 0 0 ${({ theme }) => theme.space[2]}px;
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: -0.02em;

  em {
    color: ${({ theme }) => theme.colors.accent};
    font-style: normal;
  }
`;

export function Tagline() {
  return (
    <Frase>
      Seu pátio <em>sob controle.</em>
    </Frase>
  );
}
