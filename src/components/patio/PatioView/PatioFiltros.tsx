"use client";

import { Input } from "@/components/ui/Input";
import type { PatioEstatisticas, PatioFiltroTipo } from "@/types/patio";
import { rotuloCategoria } from "../patio";
import { BarraFiltros, BuscaCampo, Chip, Chips, LimparFiltros, ProporcaoBarra, Segmento } from "./PatioView.styles";

export const BUSCA_ID = "patio-busca";

export interface PatioFiltrosProps {
  busca: string;
  onBuscaChange: (valor: string) => void;
  tipo: PatioFiltroTipo;
  onTipoChange: (valor: PatioFiltroTipo) => void;
  categoria: number | "todas";
  onCategoriaChange: (valor: number | "todas") => void;
  onLimparFiltros: () => void;
  // Contagens do pátio inteiro: a barra e os chips mostram a proporção e servem de filtro.
  estatisticas: PatioEstatisticas;
}

export function PatioFiltros({
  busca,
  onBuscaChange,
  tipo,
  onTipoChange,
  categoria,
  onCategoriaChange,
  onLimparFiltros,
  estatisticas,
}: PatioFiltrosProps) {
  const filtrando = tipo !== "todos" || categoria !== "todas";
  const { mensalistas, avulsos, percentualMensalistas } = estatisticas;
  // Um filtro ativo cujo grupo esvaziou (o último saiu) continua na tela para poder ser desfeito.
  const categorias =
    categoria === "todas" || estatisticas.porCategoria.some((item) => item.categoria === categoria)
      ? estatisticas.porCategoria
      : [...estatisticas.porCategoria, { categoria, rotulo: rotuloCategoria(categoria), valor: 0 }];

  // Tocar no filtro que já está ativo o desfaz.
  const alternarTipo = (valor: Exclude<PatioFiltroTipo, "todos">) => onTipoChange(tipo === valor ? "todos" : valor);

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

      <ProporcaoBarra role="group" aria-label="Mensalistas e avulsos">
        {(mensalistas > 0 || tipo === "mensalistas") && (
          <Segmento
            type="button"
            $tipo="mensalistas"
            $valor={mensalistas}
            aria-pressed={tipo === "mensalistas"}
            onClick={() => alternarTipo("mensalistas")}
          >
            {`Mensalistas ${percentualMensalistas}% · ${mensalistas}`}
          </Segmento>
        )}
        {(avulsos > 0 || tipo === "avulsos") && (
          <Segmento type="button" $tipo="avulsos" $valor={avulsos} aria-pressed={tipo === "avulsos"} onClick={() => alternarTipo("avulsos")}>
            {`Avulsos ${estatisticas.total === 0 ? 0 : 100 - percentualMensalistas}% · ${avulsos}`}
          </Segmento>
        )}
      </ProporcaoBarra>

      <Chips role="group" aria-label="Categoria">
        {categorias.map((item) => (
          <Chip
            key={item.categoria}
            type="button"
            aria-pressed={categoria === item.categoria}
            onClick={() => onCategoriaChange(categoria === item.categoria ? "todas" : item.categoria)}
          >
            {item.rotulo}
            <strong>{item.valor}</strong>
          </Chip>
        ))}
      </Chips>

      {filtrando && (
        <LimparFiltros type="button" variant="secondary" size="sm" onClick={onLimparFiltros}>
          Limpar filtros
        </LimparFiltros>
      )}
    </BarraFiltros>
  );
}
