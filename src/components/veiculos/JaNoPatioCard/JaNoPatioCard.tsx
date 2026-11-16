"use client";

import { formatDateTime } from "@/components/caixa/format";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatBRL } from "@/lib/money";
import type { PatioVeiculo } from "@/types/patio";
import { getCategoriaVeiculoLabel } from "../saida";
import { Card, Rotulo, Rows, Title, Valor, Veiculo, VisuallyHidden } from "./JaNoPatioCard.styles";

export type ValorJaNoPatio = { status: "carregando" } | { status: "erro" } | { status: "pronto"; valor: number };

export interface JaNoPatioCardProps {
  veiculo: Pick<PatioVeiculo, "categoria" | "modelo" | "cor" | "dataHoraEntrada" | "permanencia">;
  // Valor da saída de agora; sem ele (erro) o cartão mostra só entrada e permanência.
  valor: ValorJaNoPatio;
}

// Placa digitada que já está no pátio: em vez de bloquear, mostra o que o operador procura para dar a saída.
export function JaNoPatioCard({ veiculo, valor }: JaNoPatioCardProps) {
  const descricao = [veiculo.modelo, veiculo.cor, getCategoriaVeiculoLabel(veiculo.categoria)].filter(Boolean).join(" · ");

  return (
    <Card aria-label="Veículo já no pátio">
      <Title>Este veículo já está no pátio</Title>
      {valor.status === "carregando" && (
        <Valor role="status" aria-busy="true">
          <Skeleton width="120px" height="28px" />
          <VisuallyHidden>Calculando o valor…</VisuallyHidden>
        </Valor>
      )}
      {valor.status === "pronto" && <Valor>{valor.valor > 0 ? formatBRL(valor.valor) : "Nada a cobrar"}</Valor>}
      <Veiculo>
        <Rotulo>Modelo</Rotulo> <span>{descricao}</span>
      </Veiculo>
      <Rows>
        <div>
          <dt>Entrada</dt>
          <dd>{formatDateTime(veiculo.dataHoraEntrada)}</dd>
        </div>
        <div>
          <dt>Permanência</dt>
          <dd>{veiculo.permanencia}</dd>
        </div>
      </Rows>
    </Card>
  );
}
