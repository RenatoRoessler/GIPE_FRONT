"use client";

import { useId } from "react";
import { Text } from "@/components/ui/Text";
import type { PatioChegadas } from "@/types/patio";
import { Coluna, Colunas, EixoHoras, Painel, PainelTitulo } from "./Graficos.styles";

export interface ChegadasPorHoraProps {
  chegadas: PatioChegadas;
}

export function ChegadasPorHora({ chegadas }: ChegadasPorHoraProps) {
  const tituloId = useId();
  const { horas, total, pico } = chegadas;
  const maior = Math.max(1, ...horas.map((item) => item.valor));
  const resumo =
    pico === null
      ? "Ninguém que chegou hoje está no pátio."
      : `Hoje: ${total} ${total === 1 ? "chegada ainda no pátio" : "chegadas ainda no pátio"}, pico às ${pico.hora}h com ${pico.valor}.`;

  return (
    <Painel aria-labelledby={tituloId}>
      <PainelTitulo id={tituloId}>Chegada de quem está no pátio</PainelTitulo>
      {pico !== null && (
        <>
          <Colunas role="img" aria-label={resumo}>
            {horas.map((item) => (
              <Coluna
                key={item.hora}
                $percentual={item.valor === 0 ? 0 : (item.valor / maior) * 100}
                $pico={item.hora === pico.hora}
                title={`${item.hora}h: ${item.valor}`}
              />
            ))}
          </Colunas>
          <EixoHoras aria-hidden="true">
            {horas.map((item) => (
              <span key={item.hora}>{item.hora % 2 === 0 ? item.hora : ""}</span>
            ))}
          </EixoHoras>
        </>
      )}
      <Text variant="muted">{resumo}</Text>
    </Painel>
  );
}
