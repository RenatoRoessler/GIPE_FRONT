"use client";

import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { Blocos, Duas, Hero, Tres } from "../grade.styles";
import { Painel } from "../PainelDashboard/PainelDashboard.styles";
import { TextoOculto } from "../shared.styles";
import { Conteudo, Indicadores } from "./DashboardSkeleton.styles";

function Bloco({ alturas = ["14px", "40px", "14px"], children }: { alturas?: string[]; children?: ReactNode }) {
  return (
    <Painel as="div" aria-hidden="true">
      <Skeleton width="38%" height="12px" />
      <Conteudo>
        {alturas.map((altura, indice) => (
          <Skeleton key={indice} width={indice === 0 ? "62%" : "100%"} height={altura} />
        ))}
        {children}
      </Conteudo>
    </Painel>
  );
}

// A mesma grade da página, com blocos de carregamento no lugar dos painéis: nada pula de lugar quando os dados chegam. O
// cabeçalho (saudação e seletor) não faz parte dele, porque já pode ser usado antes da resposta.
export function DashboardSkeleton() {
  return (
    <Blocos role="status" aria-label="Carregando a visão geral">
      <TextoOculto>Carregando a visão geral…</TextoOculto>
      <Hero $solo={false}>
        <Bloco alturas={["44px", "16px", "48px"]} />
        <Bloco alturas={["36px", "8px", "14px"]} />
      </Hero>
      <Indicadores>
        <Bloco alturas={["32px", "12px"]} />
        <Bloco alturas={["32px", "12px"]} />
        <Bloco alturas={["32px", "12px"]} />
      </Indicadores>
      <Duas $solo={false}>
        <Bloco alturas={["170px", "12px"]} />
        <Bloco alturas={["36px", "36px", "36px"]} />
      </Duas>
      <Tres>
        <Bloco alturas={["12px", "88px"]} />
        <Bloco alturas={["12px", "88px"]} />
        <Bloco alturas={["88px", "12px"]} />
        <Bloco alturas={["120px", "56px"]} />
      </Tres>
    </Blocos>
  );
}
