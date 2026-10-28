"use client";

import type { PatioFiltros, PatioVeiculo } from "@/types/patio";
import { hrefDoTicket } from "../patioUrl";
import { PatioCard } from "./PatioCard";
import { Grade } from "./PatioView.styles";

export interface PatioListaProps {
  veiculos: PatioVeiculo[];
  // Os filtros atuais vão na URL do ticket para o "Voltar" devolver o operador ao mesmo recorte.
  filtros: PatioFiltros;
  comQuadros: boolean;
  atualizando: boolean;
}

export function PatioLista({ veiculos, filtros, comQuadros, atualizando }: PatioListaProps) {
  return (
    <Grade $atualizando={atualizando} aria-label="Veículos no pátio" aria-busy={atualizando}>
      {veiculos.map((veiculo) => (
        <li key={veiculo.patioId}>
          <PatioCard veiculo={veiculo} href={hrefDoTicket(veiculo.patioId, filtros)} comQuadros={comQuadros} />
        </li>
      ))}
    </Grade>
  );
}
