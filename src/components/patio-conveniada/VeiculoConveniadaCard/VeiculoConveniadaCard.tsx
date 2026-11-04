"use client";

import { formatDateTime } from "@/components/caixa/format";
import { corDoVeiculo, rotuloCategoria } from "@/components/patio/patio";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { VeiculoConveniada } from "@/types/patioConveniada";
import { frasePermanencia, permanenciaLonga } from "../patioConveniada";
import { Cartao, Detalhe, Legenda, Linha, Local, Permanencia, Placa, Rodape, Selos, Veiculo } from "./VeiculoConveniadaCard.styles";

export interface VeiculoConveniadaCardProps {
  veiculo: VeiculoConveniada;
}

// Só informação: a conveniada não tem ticket nem ação de saída. O leitor de tela ouve uma frase só; o detalhe visual é decorativo.
export function VeiculoConveniadaCard({ veiculo }: VeiculoConveniadaCardProps) {
  const cor = corDoVeiculo(veiculo.cor).texto;
  const longa = permanenciaLonga(veiculo);

  return (
    <Cartao aria-label={frasePermanencia(veiculo)}>
      <div aria-hidden="true">
        <Linha>
          <Placa>{veiculo.placa}</Placa>
          <Permanencia>{veiculo.permanencia || "—"}</Permanencia>
        </Linha>
        <Linha>
          <Veiculo>{`${veiculo.modelo || "—"} · ${cor} · ${rotuloCategoria(veiculo.categoria)}`}</Veiculo>
          <Legenda>permanência</Legenda>
        </Linha>
      </div>
      <div aria-hidden="true">
        <Local>{veiculo.estacionamento || "—"}</Local>
      </div>
      <Rodape aria-hidden="true">
        <Selos>
          <StatusBadge tone="conveniado">Convênio</StatusBadge>
          {longa && <StatusBadge tone="warn">Mais de 3 dias</StatusBadge>}
        </Selos>
        <Detalhe>{`Entrada ${formatDateTime(veiculo.dataEntrada)}`}</Detalhe>
        <Detalhe>{`Carimbo ${formatDateTime(veiculo.dataValidacao)}${veiculo.usuarioConveniada ? ` · por ${veiculo.usuarioConveniada}` : ""}`}</Detalhe>
        {veiculo.rotatividade && <Detalhe>{`Tabela ${veiculo.rotatividade}`}</Detalhe>}
      </Rodape>
    </Cartao>
  );
}
