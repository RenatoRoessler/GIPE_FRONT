"use client";

import type { DashboardCategoria, PeriodoDashboard } from "@/types/dashboard";
import { linhasDeCategoria, rotuloDasSaidas, totalDeCategorias } from "../apresentacao";
import { brlCompacto } from "../format";
import { PainelDashboard } from "../PainelDashboard";
import { Linha, Linhas, Nome, Numeros, Preenchimento, Quantidade, Rodape, Trilho, Valor, Vazio } from "./PorCategoria.styles";

export interface PorCategoriaProps {
  categorias: DashboardCategoria[];
  // Só o tipo do período: dá o rótulo ("saídas do dia", "da semana" ou "do mês").
  periodo: PeriodoDashboard;
}

// Saídas e valor do estacionamento avulso por categoria de veículo (o lava-rápido não entra aqui). O trilho é só um reforço:
// quantidade e valor estão escritos em cada linha.
export function PorCategoria({ categorias, periodo }: PorCategoriaProps) {
  const linhas = linhasDeCategoria(categorias);
  const total = totalDeCategorias(linhas);

  return (
    <PainelDashboard titulo={`Por categoria · ${rotuloDasSaidas(periodo)}`}>
      {linhas.length === 0 ? (
        <Vazio>Aparece quando houver saídas no período.</Vazio>
      ) : (
        <>
          <Linhas>
            {linhas.map((linha) => (
              <Linha key={linha.categoria}>
                <Nome title={linha.categoria}>{linha.categoria}</Nome>
                <Trilho aria-hidden="true">
                  <Preenchimento $proporcao={linha.proporcao} />
                </Trilho>
                <Numeros>
                  <Quantidade>{linha.saidas.toLocaleString("pt-BR")}</Quantidade>
                  <Valor>{brlCompacto(linha.valor)}</Valor>
                </Numeros>
              </Linha>
            ))}
          </Linhas>
          <Rodape>
            <span>{total.saidas.toLocaleString("pt-BR")} saídas</span>
            <span>{brlCompacto(total.valor)} em estacionamento avulso</span>
          </Rodape>
        </>
      )}
    </PainelDashboard>
  );
}
