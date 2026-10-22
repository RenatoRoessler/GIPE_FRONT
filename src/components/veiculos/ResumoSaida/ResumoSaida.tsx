"use client";

import { formatDateTime } from "@/components/caixa/format";
import { formatMinutos } from "@/components/precos/format";
import { PlateDisplay } from "@/components/ui/PlateDisplay";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatBRL } from "@/lib/money";
import type { SaidaConsulta } from "@/types/saida";
import { CardMensalista } from "../CardMensalista";
import { getCategoriaVeiculoLabel, valorACobrar } from "../saida";
import { Notice, OldValue, ValueAmount, ValueLabel, ValuePanel, VisuallyHidden } from "../Saida.styles";
import { Card, Rows, VehicleLine, VehicleMeta, VehicleName, VehicleText } from "./ResumoSaida.styles";

export interface ResumoSaidaProps {
  // Nulo enquanto nenhum veículo foi identificado.
  consulta: SaidaConsulta | null;
  carregando?: boolean;
  // Valor exibido antes de a reconsulta trazer outro; mostra o aviso de mudança.
  valorAnterior?: number | null;
}

const SEM_DADO = "—";

export function ResumoSaida({ consulta, carregando = false, valorAnterior = null }: ResumoSaidaProps) {
  if (carregando) {
    return (
      <Card role="status" aria-busy="true" aria-label="Buscando veículo">
        <Skeleton height="48px" />
        <Skeleton height="96px" />
        <Skeleton height="72px" />
        <VisuallyHidden>Buscando veículo…</VisuallyHidden>
      </Card>
    );
  }

  const veiculo = consulta ? [consulta.modelo, consulta.cor].filter(Boolean).join(" · ") : "";

  return (
    <Card aria-label="Resumo da saída">
      <VehicleLine>
        <PlateDisplay value={consulta?.placa ?? ""} size="sm" />
        <VehicleText>
          <VehicleName>{veiculo || SEM_DADO}</VehicleName>
          <VehicleMeta>{consulta ? getCategoriaVeiculoLabel(consulta.categoria) : SEM_DADO}</VehicleMeta>
        </VehicleText>
      </VehicleLine>

      {consulta?.mensalista && <CardMensalista contexto="saida" nome={consulta.mensalistaNome} />}

      <Rows>
        <div>
          <dt>Entrada</dt>
          <dd>{consulta ? formatDateTime(consulta.dataHoraEntrada) : SEM_DADO}</dd>
        </div>
        <div>
          <dt>Permanência</dt>
          <dd>{consulta ? formatMinutos(consulta.minutosPermanencia) : SEM_DADO}</dd>
        </div>
      </Rows>

      {consulta && valorAnterior !== null && (
        <Notice role="alert">
          O valor mudou de {formatBRL(valorAnterior)} para {formatBRL(valorACobrar(consulta))} (permanência de{" "}
          {formatMinutos(consulta.minutosPermanencia)}). Confira e confirme novamente.
        </Notice>
      )}

      <ValuePanel>
        <ValueLabel>Valor a cobrar</ValueLabel>
        <ValueAmount>
          {consulta && valorAnterior !== null && (
            <>
              <OldValue aria-hidden="true">{formatBRL(valorAnterior)}</OldValue>
              <VisuallyHidden>era {formatBRL(valorAnterior)}, agora </VisuallyHidden>
            </>
          )}
          {!consulta ? SEM_DADO : valorACobrar(consulta) === 0 ? "Nada a cobrar" : formatBRL(valorACobrar(consulta))}
        </ValueAmount>
      </ValuePanel>
    </Card>
  );
}
