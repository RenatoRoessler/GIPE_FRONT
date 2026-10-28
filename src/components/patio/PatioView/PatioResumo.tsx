"use client";

import type { PatioFiltroTipo, PatioOcupacao, PatioVeiculo } from "@/types/patio";
import { contagemPorTipo, type TipoPatio } from "../patio";
import { Barra, BarraPreenchimento, Bloco, Bola, DetalheVagas, Livres, Ocupacao, Rotulo, TipoLinha, Tipos } from "./PatioView.styles";

const TIPOS: { tipo: TipoPatio; rotulo: string; filtro: Exclude<PatioFiltroTipo, "todos"> }[] = [
  { tipo: "avulso", rotulo: "Avulso", filtro: "avulsos" },
  { tipo: "mensal", rotulo: "Mensal", filtro: "mensalistas" },
];

export interface PatioResumoProps {
  // O pátio inteiro: os números não mudam com a busca e os filtros.
  veiculos: PatioVeiculo[];
  // Null enquanto as vagas não chegam ou quando a empresa não cadastrou nenhuma.
  ocupacao: PatioOcupacao | null;
  tipo: PatioFiltroTipo;
  onTipoChange: (tipo: PatioFiltroTipo) => void;
}

// Dois blocos: quanto do pátio está ocupado e quantos veículos há de cada tipo (cada tipo é também um filtro).
export function PatioResumo({ veiculos, ocupacao, tipo, onTipoChange }: PatioResumoProps) {
  const contagem = contagemPorTipo(veiculos);
  const ocupadas = veiculos.length;
  const capacidade = ocupacao ? ocupacao.carros.vagas + ocupacao.motos.vagas : 0;
  const livres = Math.max(capacidade - ocupadas, 0);

  // Só os tipos presentes (ou ativos, para poderem ser desfeitos); pátio vazio mostra "Avulso 0".
  const filtroAtivo = TIPOS.find((item) => item.filtro === tipo);
  let visiveis = TIPOS.filter((item) => contagem[item.tipo] > 0 || item === filtroAtivo);
  if (visiveis.length === 0) visiveis = [TIPOS[0]];

  return (
    <>
      <Bloco aria-label="Vagas ocupadas">
        <Rotulo>{ocupacao ? "Vagas ocupadas" : "No pátio"}</Rotulo>
        <Ocupacao>
          <b>{ocupadas}</b>
          {ocupacao && <span>{`/${capacidade}`}</span>}
        </Ocupacao>
        {ocupacao && (
          <>
            <Barra role="img" aria-label={`${ocupacao.percentual}% ocupado`}>
              <BarraPreenchimento $percentual={ocupacao.percentual} />
            </Barra>
            <Livres>{`${livres} ${livres === 1 ? "livre" : "livres"}`}</Livres>
            <DetalheVagas>{`Carros ${ocupacao.carros.ocupadas}/${ocupacao.carros.vagas} · Motos ${ocupacao.motos.ocupadas}/${ocupacao.motos.vagas}`}</DetalheVagas>
          </>
        )}
      </Bloco>

      <Bloco aria-label="Veículos por tipo">
        <Rotulo>Por tipo</Rotulo>
        <Tipos role="group" aria-label="Filtrar por tipo">
          {visiveis.map((item) => {
            const total = contagem[item.tipo];
            return (
              <TipoLinha
                key={item.tipo}
                type="button"
                $ativo={tipo === item.filtro}
                aria-pressed={tipo === item.filtro}
                aria-label={`Filtrar por ${item.rotulo}, ${total} ${total === 1 ? "veículo" : "veículos"}`}
                onClick={() => onTipoChange(tipo === item.filtro ? "todos" : item.filtro)}
              >
                <Bola $tipo={item.tipo} aria-hidden="true" />
                <span>{item.rotulo}</span>
                <b>{total}</b>
              </TipoLinha>
            );
          })}
        </Tipos>
      </Bloco>
    </>
  );
}
