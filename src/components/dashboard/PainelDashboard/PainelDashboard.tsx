"use client";

import { useId, type HTMLAttributes, type ReactNode } from "react";
import { Cabecalho, Painel, Rotulo } from "./PainelDashboard.styles";

export interface PainelDashboardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  // Rótulo do bloco, em caixa alta. É também o nome acessível da região e um título (h2) da página.
  titulo: ReactNode;
  // Ao lado do rótulo: a legenda de um gráfico ou a marca "Fechado".
  acessorio?: ReactNode;
  // Padrão "fim" (rótulo à esquerda, acessório à direita); "inicio" o deixa logo depois do rótulo.
  posicaoAcessorio?: "inicio" | "fim";
  children?: ReactNode;
}

export function PainelDashboard({ titulo, acessorio, posicaoAcessorio = "fim", children, ...props }: PainelDashboardProps) {
  const tituloId = useId();

  return (
    <Painel aria-labelledby={tituloId} {...props}>
      <Cabecalho $acessorioAoLado={posicaoAcessorio === "inicio"}>
        <Rotulo id={tituloId}>{titulo}</Rotulo>
        {acessorio}
      </Cabecalho>
      {children}
    </Painel>
  );
}
