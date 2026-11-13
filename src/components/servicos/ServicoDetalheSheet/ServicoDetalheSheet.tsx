"use client";

import { useState } from "react";
import { formatTime } from "@/components/caixa/format";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { OptionGroup } from "@/components/ui/OptionGroup";
import { useCan } from "@/hooks/useCan";
import { AREA } from "@/lib/permissoes";
import { STATUS_SERVICO, type ServicoDoVeiculo, type StatusServico } from "@/types/servico";
import { CancelarServicoDialog } from "../CancelarServicoDialog";
import { formatCentavos } from "../format";
import { avisoDeStatus, podeCancelar, STATUS_ROTULO } from "../status";
import { useAtualizarStatusServico } from "../useAtualizarStatusServico";
import { Explicacao, Remover, Resumo, Valor } from "./ServicoDetalheSheet.styles";

export interface ServicoDetalheSheetProps {
  idPatio: number;
  placa: string;
  // Sempre o serviço como está na lista agora: a troca de status aparece aqui na hora (atualização otimista).
  servico: ServicoDoVeiculo;
  onClose: () => void;
  // Recebe o aviso de sucesso (o ticket o mostra no seu Toast).
  onAviso: (mensagem: string) => void;
}

const OPCOES = [STATUS_SERVICO.Aguardando, STATUS_SERVICO.EmExecucao, STATUS_SERVICO.Pronto].map((status) => ({
  value: String(status),
  label: STATUS_ROTULO[status],
}));

// "adicionado às 21:10 por Everton"; cada parte some se o back não a mandou.
function quemEQuando(servico: ServicoDoVeiculo): string | null {
  const partes = [servico.adicionadoEm ? `adicionado às ${formatTime(servico.adicionadoEm)}` : null, servico.adicionadoPor ? `por ${servico.adicionadoPor}` : null];
  const texto = partes.filter(Boolean).join(" ");
  return texto === "" ? null : texto;
}

// Detalhe de um serviço do veículo: troca o status e, enquanto o serviço está na fila, permite removê-lo (cancelar com motivo).
// Trocar, atribuir ou observar um serviço não existem na API e ficam de fora.
export function ServicoDetalheSheet({ idPatio, placa, servico, onClose, onAviso }: ServicoDetalheSheetProps) {
  const podeTrocar = useCan(AREA.Servicos);
  const podeRemover = useCan(AREA.ServicosPatio);
  const trocar = useAtualizarStatusServico();
  const [removendo, setRemovendo] = useState(false);
  const origem = quemEQuando(servico);

  function mudarStatus(valor: string) {
    const destino = Number(valor) as StatusServico;
    if (destino === servico.status) return;
    trocar.mutate({ idPatio, patioServicoId: servico.id, destino }, { onSuccess: () => onAviso(avisoDeStatus(destino)) });
  }

  return (
    <>
      <BottomSheet open title={servico.nome} onClose={onClose}>
        <Resumo>
          <Valor>{formatCentavos(servico.valorCentavos)}</Valor>
          {origem && ` · ${origem}`}
        </Resumo>
        {trocar.isError && <ErrorBanner role="alert">{trocar.error.message}</ErrorBanner>}
        <OptionGroup legend="Status" options={OPCOES} value={String(servico.status)} onChange={mudarStatus} disabled={!podeTrocar || trocar.isPending} columns={3} />
        {podeRemover &&
          (podeCancelar(servico.status) ? (
            <Remover type="button" onClick={() => setRemovendo(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
              </svg>
              Remover serviço
            </Remover>
          ) : (
            <Explicacao>Só é possível remover serviço que ainda está na fila.</Explicacao>
          ))}
      </BottomSheet>
      {removendo && (
        <CancelarServicoDialog
          item={{ idPatio, placa, patioServicoId: servico.id, nomeServico: servico.nome }}
          onClose={() => setRemovendo(false)}
          onCancelado={() => {
            setRemovendo(false);
            onClose();
            onAviso("Serviço removido.");
          }}
        />
      )}
    </>
  );
}
