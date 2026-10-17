"use client";

import styled from "styled-components";

// Campo transparente dentro da placa: o PlateDisplay faz o papel da caixa do input.
export const PlateInput = styled.input`
  width: 100%;
  min-width: 0;
  padding: 0 ${({ theme }) => theme.space[2]}px;
  border: none;
  background: transparent;
  color: inherit;
  text-align: center;
  font: inherit;
  font-family: ${({ theme }) => theme.typography.display};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  line-height: 1.2;
  letter-spacing: 0.08em;
  text-transform: uppercase;

  &:focus {
    outline: none;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.steel};
  }
`;

// O foco mostra um anel na placa inteira, já que o input não tem borda própria.
export const PlateFrame = styled.div`
  border-radius: ${({ theme }) => theme.radii.md};

  &:focus-within {
    outline: 3px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;
