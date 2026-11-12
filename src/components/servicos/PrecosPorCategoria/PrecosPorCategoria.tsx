"use client";

import type { Servico } from "@/types/servico";
import { linhasDePreco } from "../catalogo";
import { formatCentavos } from "../format";
import { Geral, Linha, Lista, NaoAtende, Rotulo, Valor, Vazio } from "./PrecosPorCategoria.styles";

export interface PrecosPorCategoriaProps {
  servico: Servico;
}

// Preço do serviço por categoria de veículo. Quem só tem o preço de "Todas as categorias" mostra uma linha; com preços
// próprios aparecem as seis categorias, e as sem preço próprio mostram o valor geral (marcado) ou "Não atende".
export function PrecosPorCategoria({ servico }: PrecosPorCategoriaProps) {
  const linhas = linhasDePreco(servico);

  if (linhas.length === 0) {
    return <Vazio>Este serviço não tem preço cadastrado.</Vazio>;
  }

  return (
    <Lista aria-label="Preços por categoria">
      {linhas.map((linha) => (
        <Linha key={linha.categoria}>
          <Rotulo>{linha.rotulo}</Rotulo>
          {linha.valorCentavos === null ? (
            <NaoAtende>Não atende</NaoAtende>
          ) : (
            <Valor>
              {formatCentavos(linha.valorCentavos)}
              {linha.geral && <Geral> · valor geral</Geral>}
            </Valor>
          )}
        </Linha>
      ))}
    </Lista>
  );
}
