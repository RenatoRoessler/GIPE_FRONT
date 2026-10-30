"use client";

import { useId, type ReactNode } from "react";
import styled from "styled-components";

const Grupo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
  min-width: 0;
  container-type: inline-size;
`;

const Titulo = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textMuted};
`;

// A grade segue a largura do próprio formulário (e não da janela): 1 coluna quando estreito, 2 a partir de
// `breakpoints.sm` e 6 a partir de `layout.formGridWide`, onde cada campo ocupa a largura que o conteúdo pede.
const Grade = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.space[3]}px;

  @container (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @container (min-width: ${({ theme }) => theme.layout.formGridWide}) {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
`;

export interface FieldGroupProps {
  // Sem título, é só a grade (seções curtas que não precisam de subgrupos).
  titulo?: string;
  children: ReactNode;
}

// Subgrupo de campos dentro de uma seção (ex.: Identificação, Endereço).
export function FieldGroup({ titulo, children }: FieldGroupProps) {
  const id = useId();
  if (!titulo) {
    return (
      <Grupo>
        <Grade>{children}</Grade>
      </Grupo>
    );
  }
  return (
    <Grupo role="group" aria-labelledby={id}>
      <Titulo id={id}>{titulo}</Titulo>
      <Grade>{children}</Grade>
    </Grupo>
  );
}

// Campo dentro do FieldGroup: `$w` é quantas das 6 colunas ocupa na grade larga; `$w2`, quantas das 2 na média.
export const FieldCell = styled.div<{ $w: 1 | 2 | 3 | 4 | 6; $w2?: 1 | 2 }>`
  min-width: 0;

  @container (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-column: span ${({ $w2 = 1 }) => $w2};
  }

  @container (min-width: ${({ theme }) => theme.layout.formGridWide}) {
    grid-column: span ${({ $w }) => $w};
  }
`;

// Espaço entre subgrupos de uma mesma seção: maior que o espaço entre campos, para os grupos se lerem separados.
export const FieldGroups = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[5]}px;
`;
