"use client";

import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { DashboardPatio } from "@/types/dashboard";
import { percentual } from "../format";
import { PainelDashboard } from "../PainelDashboard";
import { Barra, Complemento, Linha, Numero, Total } from "./CardPatioAgora.styles";

export interface CardPatioAgoraProps {
  patio: DashboardPatio;
}

function quantidade(valor: number, singular: string, plural: string): string {
  return `${valor} ${valor === 1 ? singular : plural}`;
}

// O pátio neste instante (não do período escolhido): ocupação geral, por tipo de vaga e por tipo de cliente.
export function CardPatioAgora({ patio }: CardPatioAgoraProps) {
  const { ocupados, capacidade, carros, motos, avulsos, mensalistas } = patio;
  const comCapacidade = capacidade > 0;
  const mostrarCarros = carros.capacidade > 0 || carros.ocupados > 0;
  const mostrarMotos = motos.capacidade > 0 || motos.ocupados > 0;

  return (
    <PainelDashboard titulo="Pátio agora">
      <Total>
        <Numero>{ocupados}</Numero>
        <Complemento>{comCapacidade ? `de ${capacidade} vagas` : `${ocupados === 1 ? "veículo" : "veículos"} no pátio`}</Complemento>
      </Total>
      {comCapacidade && (
        <>
          <StatusBadge tone="info">{percentual((ocupados / capacidade) * 100)} ocupado</StatusBadge>
          <Barra>
            <ProgressBar value={ocupados} max={capacidade} tone="primary" aria-label="Ocupação do pátio" />
          </Barra>
        </>
      )}
      {(mostrarCarros || mostrarMotos) && (
        <Linha>
          {mostrarCarros && (
            <span>
              Carros {carros.ocupados}/{carros.capacidade}
            </span>
          )}
          {mostrarMotos && (
            <span>
              Motos {motos.ocupados}/{motos.capacidade}
            </span>
          )}
        </Linha>
      )}
      <Linha>
        <span>{quantidade(avulsos, "avulso", "avulsos")}</span>
        <span>{quantidade(mensalistas, "mensalista", "mensalistas")}</span>
      </Linha>
    </PainelDashboard>
  );
}
