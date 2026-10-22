"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createPortal } from "react-dom";
import { EMPRESA_QUERY_KEY } from "@/components/empresa/MinhaEmpresa/EmpresaForm";
import { NotaFiscalModal } from "@/components/notas/NotaFiscalModal";
import { NOTAS_PENDENTES_KEY } from "@/components/notas/notasKeys";
import { Button } from "@/components/ui/Button";
import { getEmpresa } from "@/lib/api/services/empresa";
import { formatCNPJ } from "@/lib/cnpj";
import type { SaidaConsulta, SaidaRegistrada } from "@/types/saida";
import { ReciboConteudo, type ReciboData } from "./ReciboConteudo";
import { Actions, NotaSolicitada, PrintStyles, Success } from "../Recibo.styles";

export type SaidaResultado = {
  saida: SaidaRegistrada;
  // Só em dinheiro; calculados no cliente a partir do valor informado pelo operador.
  recebido: number | null;
  troco: number | null;
  emitidoEm: string;
};

export interface ReciboSaidaStepProps {
  consulta: SaidaConsulta;
  resultado: SaidaResultado;
  onConcluir: () => void;
}

export function ReciboSaidaStep({ consulta, resultado, onConcluir }: ReciboSaidaStepProps) {
  const queryClient = useQueryClient();
  const [notaAberta, setNotaAberta] = useState(false);
  const [notaSolicitada, setNotaSolicitada] = useState(false);

  // Mesma consulta da etapa de pagamento (cacheada). Se falhar, o recibo sai sem os dados da empresa.
  const { data: empresa } = useQuery({
    queryKey: EMPRESA_QUERY_KEY,
    queryFn: getEmpresa,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { saida } = resultado;
  // A nota só vale para saída com cobrança e com o código do recibo (é ele que liga a nota à empresa e ao valor).
  const podeGerarNota = Boolean(saida.tokenRecibo) && !consulta.mensalista && saida.valor > 0;
  const data: ReciboData = {
    empresaNome: empresa ? empresa.company.nomeFantasia || empresa.company.razaoSocial || undefined : undefined,
    empresaCnpj: empresa?.company.cnpj ? formatCNPJ(empresa.company.cnpj) : undefined,
    emitidoEm: resultado.emitidoEm,
    placa: saida.placa,
    modelo: consulta.modelo,
    cor: consulta.cor,
    categoria: consulta.categoria,
    codigoTicket: consulta.codigoTicket,
    tabela: consulta.rotatividadeDescricao,
    dataHoraEntrada: saida.dataHoraEntrada,
    dataHoraSaida: saida.dataHoraSaida,
    minutosPermanencia: saida.minutosPermanencia,
    formaPagamento: saida.formaPagamento,
    valor: saida.valor,
    recebido: resultado.recebido,
    troco: resultado.troco,
    mensalista: consulta.mensalista,
    link: saida.tokenRecibo ? `${window.location.origin}/recibo/${encodeURIComponent(saida.tokenRecibo)}` : null,
  };

  return (
    <>
      <Success role="status">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12.5l3 3 5-6" />
        </svg>
        Saída registrada
      </Success>
      <ReciboConteudo data={data} />
      <Actions>
        {podeGerarNota &&
          (notaSolicitada ? (
            <NotaSolicitada role="status">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M8 12.5l3 3 5-6" />
              </svg>
              Nota fiscal solicitada
            </NotaSolicitada>
          ) : (
            <Button type="button" variant="secondary" aria-haspopup="dialog" onClick={() => setNotaAberta(true)}>
              Gerar nota fiscal
            </Button>
          ))}
        <Button type="button" variant="secondary" onClick={onConcluir}>
          Concluir
        </Button>
        <Button type="button" onClick={() => window.print()}>
          Imprimir
        </Button>
      </Actions>
      {notaAberta && saida.tokenRecibo && (
        <NotaFiscalModal
          token={saida.tokenRecibo}
          valor={saida.valor}
          placa={saida.placa}
          onClose={() => setNotaAberta(false)}
          onSolicitada={() => {
            setNotaSolicitada(true);
            void queryClient.invalidateQueries({ queryKey: NOTAS_PENDENTES_KEY });
          }}
        />
      )}
      <PrintStyles />
      {createPortal(
        <div id="recibo-print-root">
          <ReciboConteudo data={data} />
        </div>,
        document.body,
      )}
    </>
  );
}
