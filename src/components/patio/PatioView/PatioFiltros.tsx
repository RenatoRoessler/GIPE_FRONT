"use client";

import { useId, useState } from "react";
import { useTecladoCampo } from "@/components/teclado/useTecladoCampo";
import { TECLADO_ALFA } from "@/lib/teclado/tipos";
import type { PatioEstatisticas, PatioFiltroTipo } from "@/types/patio";
import { rotuloCategoria } from "../patio";
import { BarraFiltros, BuscaCampo, Chip, Chips, FiltrosBotao, LimparFiltros, LinhaBusca, LinhaChips, PainelFiltros, SomenteLeitor } from "./PatioView.styles";

export const BUSCA_ID = "patio-busca";

export interface PatioFiltrosProps {
  busca: string;
  onBuscaChange: (valor: string) => void;
  // O tipo é escolhido no bloco "Por tipo"; aqui só conta como filtro ativo e é desfeito em "Limpar filtros".
  tipo: PatioFiltroTipo;
  categoria: number | "todas";
  onCategoriaChange: (valor: number | "todas") => void;
  onLimparFiltros: () => void;
  // Contagens do pátio inteiro: os chips mostram a proporção e servem de filtro.
  estatisticas: PatioEstatisticas;
}

function LupaIcone() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

export function PatioFiltros({
  busca,
  onBuscaChange,
  tipo,
  categoria,
  onCategoriaChange,
  onLimparFiltros,
  estatisticas,
}: PatioFiltrosProps) {
  const painelId = useId();
  const tecladoBusca = useTecladoCampo(TECLADO_ALFA);
  // No celular o painel começa recolhido; no computador está sempre aberto (CSS).
  const [aberto, setAberto] = useState(false);
  const ativos = [tipo !== "todos", categoria !== "todas"].filter(Boolean).length;
  // Um filtro ativo cujo grupo esvaziou (o último saiu) continua na tela para poder ser desfeito.
  const categorias =
    categoria === "todas" || estatisticas.porCategoria.some((item) => item.categoria === categoria)
      ? estatisticas.porCategoria
      : [...estatisticas.porCategoria, { categoria, rotulo: rotuloCategoria(categoria), valor: 0 }];

  return (
    <BarraFiltros>
      <LinhaBusca>
        <BuscaCampo>
          <LupaIcone />
          <SomenteLeitor>Buscar por placa, modelo ou ticket</SomenteLeitor>
          <input
            id={BUSCA_ID}
            type="search"
            value={busca}
            onChange={(event) => onBuscaChange(event.target.value)}
            placeholder="Placa, modelo ou ticket"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            {...tecladoBusca}
          />
        </BuscaCampo>
        <FiltrosBotao type="button" variant="secondary" aria-expanded={aberto} aria-controls={painelId} onClick={() => setAberto((valor) => !valor)}>
          {ativos > 0 ? `Filtros ${ativos}` : "Filtros"}
        </FiltrosBotao>
      </LinhaBusca>

      <PainelFiltros id={painelId} $aberto={aberto}>
        <LinhaChips>
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
        </LinhaChips>

        {ativos > 0 && (
          <LimparFiltros type="button" variant="secondary" size="sm" onClick={onLimparFiltros}>
            Limpar filtros
          </LimparFiltros>
        )}
      </PainelFiltros>
    </BarraFiltros>
  );
}
