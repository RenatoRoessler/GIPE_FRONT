"use client";

import { useQuery } from "@tanstack/react-query";
import { createPortal } from "react-dom";
import { EMPRESA_QUERY_KEY } from "@/components/empresa/MinhaEmpresa/EmpresaForm";
import { Button } from "@/components/ui/Button";
import { getEmpresa } from "@/lib/api/services/empresa";
import { formatCNPJ } from "@/lib/cnpj";
import type { SaidaConsulta, SaidaRegistrada } from "@/types/saida";
import { ReciboConteudo, type ReciboData } from "./ReciboConteudo";
import { Actions, PrintStyles, Success } from "../Recibo.styles";

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
  // Mesma consulta da etapa de pagamento (cacheada). Se falhar, o recibo sai sem os dados da empresa.
  const { data: empresa } = useQuery({
    queryKey: EMPRESA_QUERY_KEY,
    queryFn: getEmpresa,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { saida } = resultado;
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
        <Button type="button" variant="secondary" onClick={onConcluir}>
          Concluir
        </Button>
        <Button type="button" onClick={() => window.print()}>
          Imprimir
        </Button>
      </Actions>
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
