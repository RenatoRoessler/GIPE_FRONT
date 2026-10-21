"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { PatioFiltroTipo } from "@/types/patio";
import { CATEGORIA_VEICULO_OPTIONS } from "@/types/veiculo";
import { BarraFiltros, BuscaCampo, FiltrosGrade, LimparFiltros } from "./PatioView.styles";

export const BUSCA_ID = "patio-busca";

export interface PatioFiltrosProps {
  busca: string;
  onBuscaChange: (valor: string) => void;
  tipo: PatioFiltroTipo;
  onTipoChange: (valor: PatioFiltroTipo) => void;
  categoria: number | "todas";
  onCategoriaChange: (valor: number | "todas") => void;
  onLimparFiltros: () => void;
}

export function PatioFiltros({
  busca,
  onBuscaChange,
  tipo,
  onTipoChange,
  categoria,
  onCategoriaChange,
  onLimparFiltros,
}: PatioFiltrosProps) {
  const filtrando = tipo !== "todos" || categoria !== "todas";

  return (
    <BarraFiltros>
      <BuscaCampo>
        <Input
          id={BUSCA_ID}
          label="Buscar por placa, modelo ou ticket"
          value={busca}
          onChange={(event) => onBuscaChange(event.target.value)}
          autoComplete="off"
          placeholder="Placa, modelo ou ticket"
        />
      </BuscaCampo>
      <FiltrosGrade>
        <Select label="Tipo" value={tipo} onChange={(event) => onTipoChange(event.target.value as PatioFiltroTipo)}>
          <option value="todos">Todos</option>
          <option value="mensalistas">Mensalistas</option>
          <option value="avulsos">Avulsos</option>
        </Select>
        <Select
          label="Categoria"
          value={String(categoria)}
          onChange={(event) => onCategoriaChange(event.target.value === "todas" ? "todas" : Number(event.target.value))}
        >
          <option value="todas">Todas</option>
          {CATEGORIA_VEICULO_OPTIONS.map((opcao) => (
            <option key={opcao.value} value={opcao.value}>
              {opcao.label}
            </option>
          ))}
        </Select>
      </FiltrosGrade>
      {filtrando && (
        <LimparFiltros type="button" variant="secondary" size="sm" onClick={onLimparFiltros}>
          Limpar filtros
        </LimparFiltros>
      )}
    </BarraFiltros>
  );
}
