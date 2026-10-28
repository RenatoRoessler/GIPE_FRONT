"use client";

import { formatDateTime } from "@/components/caixa/format";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { PatioVeiculo } from "@/types/patio";
import { corDoVeiculo, rotuloTipo } from "../patio";
import { CardCorpo, CardLink, CardLinha, CardRodape, Entrada, Legenda, Permanencia, Placa, Seta, Veiculo } from "./PatioView.styles";

export interface PatioCardProps {
  veiculo: PatioVeiculo;
  // Endereço do ticket, já com os filtros da lista.
  href: string;
}

function SetaIcone() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

// O card inteiro é um único link para o ticket: as ações do veículo (saída, chave, QR) ficam no detalhe.
export function PatioCard({ veiculo, href }: PatioCardProps) {
  const tipo = rotuloTipo(veiculo);
  const cor = corDoVeiculo(veiculo.cor).texto;

  return (
    <CardLink href={href} data-patio-card={veiculo.patioId} aria-label={`Ver ticket do veículo ${veiculo.placa}, ${tipo}, ${veiculo.permanencia} no pátio`}>
      <CardCorpo>
        <CardLinha>
          <Placa>{veiculo.placa}</Placa>
          <Permanencia>{veiculo.permanencia}</Permanencia>
        </CardLinha>
        <CardLinha>
          <Veiculo>{`${veiculo.modelo ?? "—"} · ${cor}`}</Veiculo>
          <Legenda>permanência</Legenda>
        </CardLinha>
        <CardRodape>
          <StatusBadge tone={veiculo.mensalista ? "mensal" : "avulso"}>{tipo}</StatusBadge>
          <Entrada>{`Entrada ${formatDateTime(veiculo.dataHoraEntrada)}`}</Entrada>
        </CardRodape>
      </CardCorpo>
      <Seta>
        <SetaIcone />
      </Seta>
    </CardLink>
  );
}
