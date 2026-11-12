"use client";

import { useState } from "react";
import { formatTime } from "@/components/caixa/format";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Switch } from "@/components/ui/Switch";
import { useCan } from "@/hooks/useCan";
import { AREA } from "@/lib/permissoes";
import { STATUS_SERVICO } from "@/types/servico";
import { AcrescentarServicosModal } from "../AcrescentarServicosModal";
import { CancelarServicoDialog } from "../CancelarServicoDialog";
import { formatCentavos, formatDuracao } from "../format";
import { podeCancelar, STATUS_ROTULO, STATUS_TOM } from "../status";
import { useServicosDoVeiculo, useServicosHabilitados } from "../useServicosDoVeiculo";
import { Cabecalho, Cancelar, Linha, Lista, Motivo, Nome, Principal, Resumo, Secao, Titulo, Valor, Vazio } from "./ServicosDoVeiculo.styles";

export interface ServicosDoVeiculoProps {
  idPatio: number;
  placa: string;
  // Categoria do veículo, para o preço e para o que ele aceita ao acrescentar.
  categoria: number;
  // Recebe o aviso de sucesso (o ticket o mostra no seu Toast).
  onAviso: (mensagem: string) => void;
}

// Serviços do veículo dentro do ticket do Pátio: o que foi pedido, quanto vale e até quando a permanência é livre.
// Só existe quando a empresa liga os serviços na configuração.
export function ServicosDoVeiculo({ idPatio, placa, categoria, onAviso }: ServicosDoVeiculoProps) {
  const habilitado = useServicosHabilitados();
  const podeGerir = useCan(AREA.ServicosPatio);
  const [mostrarCancelados, setMostrarCancelados] = useState(false);
  const [acrescentando, setAcrescentando] = useState(false);
  const [cancelando, setCancelando] = useState<{ patioServicoId: number; nomeServico: string } | null>(null);
  const servicos = useServicosDoVeiculo(idPatio, mostrarCancelados, habilitado);

  if (!habilitado) return null;

  const dados = servicos.data;
  const resumo = dados
    ? [
        `Serviços ${formatCentavos(dados.valorServicosCentavos)}`,
        dados.tempoPermitidoMinutos === null ? null : `tempo permitido ${formatDuracao(dados.tempoPermitidoMinutos)}`,
        dados.livreAte ? `livre até ${formatTime(dados.livreAte)}` : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : null;

  function corpo() {
    if (servicos.isPending) {
      return (
        <div role="status" aria-label="Carregando os serviços do veículo">
          <Skeleton height="44px" />
        </div>
      );
    }
    if (servicos.isError) {
      return (
        <>
          <ErrorBanner role="alert">{servicos.error.message}</ErrorBanner>
          <Button variant="secondary" size="sm" onClick={() => void servicos.refetch()}>
            Tentar novamente
          </Button>
        </>
      );
    }
    if (servicos.data.servicos.length === 0) {
      return <Vazio>Nenhum serviço neste veículo.</Vazio>;
    }
    return (
      <Lista aria-label={`Serviços de ${placa}`}>
        {servicos.data.servicos.map((servico) => {
          const cancelado = servico.status === STATUS_SERVICO.Cancelado;
          return (
            <Linha key={servico.id} $cancelado={cancelado}>
              <Principal>
                <Nome $cancelado={cancelado}>{servico.nome}</Nome>
                <StatusBadge tone={STATUS_TOM[servico.status]}>{STATUS_ROTULO[servico.status]}</StatusBadge>
                <Valor>{formatCentavos(servico.valorCentavos)}</Valor>
              </Principal>
              {cancelado && servico.motivoCancelamento && <Motivo>Motivo: {servico.motivoCancelamento}</Motivo>}
              {podeGerir && podeCancelar(servico.status) && (
                <Cancelar type="button" onClick={() => setCancelando({ patioServicoId: servico.id, nomeServico: servico.nome })}>
                  Cancelar serviço
                </Cancelar>
              )}
            </Linha>
          );
        })}
      </Lista>
    );
  }

  return (
    <Secao aria-label="Serviços do veículo">
      <Cabecalho>
        <Titulo>Serviços</Titulo>
        {podeGerir && (
          <Button variant="secondary" size="sm" onClick={() => setAcrescentando(true)}>
            Acrescentar serviços
          </Button>
        )}
      </Cabecalho>
      {resumo && <Resumo>{resumo}</Resumo>}
      {corpo()}
      <Switch label="Mostrar cancelados" checked={mostrarCancelados} onCheckedChange={setMostrarCancelados} />
      {acrescentando && (
        <AcrescentarServicosModal
          idPatio={idPatio}
          categoria={categoria}
          onClose={() => setAcrescentando(false)}
          onAcrescentado={(quantidade) => {
            setAcrescentando(false);
            onAviso(quantidade === 1 ? "Serviço acrescentado." : "Serviços acrescentados.");
          }}
        />
      )}
      {cancelando && (
        <CancelarServicoDialog
          item={{ idPatio, placa, ...cancelando }}
          onClose={() => setCancelando(null)}
          onCancelado={() => {
            setCancelando(null);
            onAviso("Serviço cancelado.");
          }}
        />
      )}
    </Secao>
  );
}
