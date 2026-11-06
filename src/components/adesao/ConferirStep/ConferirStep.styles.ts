"use client";

import styled from "styled-components";

export const Secoes = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
`;

export const Secao = styled.section`
  padding: ${({ theme }) => theme.space[3]}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.surface};
`;

// Realce só decorativo: o significado está no título e no texto, nunca só na cor.
// `primary` é só preenchimento (tokens.test.ts); a borda usa `accent`.
export const SecaoTeste = styled(Secao)`
  border-color: ${({ theme }) => theme.colors.accent};
  background-color: ${({ theme }) => theme.colors.primarySoft};
`;

export const FraseTeste = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

export const Garantias = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px ${({ theme }) => theme.space[3]}px;
  margin: ${({ theme }) => theme.space[1]}px 0 0;
  padding: 0;
  list-style: none;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: row;
    flex-wrap: wrap;
  }
`;

export const Garantia = styled.li`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]}px;
  min-height: ${({ theme }) => theme.layout.touchTarget};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};

  svg {
    flex: none;
    color: ${({ theme }) => theme.colors.success};
  }
`;

export const SecaoCabecalho =styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]}px;
  margin-bottom: ${({ theme }) => theme.space[2]}px;
`;

export const SecaoTitulo = styled.h3`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.extrabold};
  letter-spacing: -0.01em;
`;

export const Editar = styled.button`
  min-height: ${({ theme }) => theme.layout.touchTarget};
  padding: 0 ${({ theme }) => theme.space[2]}px;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.link};
  font: inherit;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  text-decoration: underline;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

export const Lista = styled.dl`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px;
  margin: 0;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: max-content minmax(0, 1fr);
  }
`;

export const Termo = styled.dt`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Detalhe = styled.dd`
  margin: 0;
  overflow-wrap: anywhere;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;

// Texto de apoio e link do documento: empilhados no celular, lado a lado quando há espaço.
export const LinhaAceite = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
  margin-bottom: ${({ theme }) => theme.space[2]}px;

  a {
    display: inline-flex;
    align-items: center;
    min-height: ${({ theme }) => theme.layout.touchTarget};
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: ${({ theme }) => theme.space[1]}px ${({ theme }) => theme.space[3]}px;
  }
`;

export const Apoio = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;
