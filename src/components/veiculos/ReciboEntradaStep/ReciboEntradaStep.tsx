"use client";

import { useQuery } from "@tanstack/react-query";
import { createPortal } from "react-dom";
import { EMPRESA_QUERY_KEY } from "@/components/empresa/MinhaEmpresa/EmpresaForm";
import { Button } from "@/components/ui/Button";
import { getEmpresa } from "@/lib/api/services/empresa";
import { formatCNPJ } from "@/lib/cnpj";
import type { EntradaRegistrada } from "@/types/veiculo";
import { Actions, PrintStyles, Success } from "../Recibo.styles";
import { ReciboEntradaConteudo, type ReciboEntradaData } from "./ReciboEntradaConteudo";

export interface ReciboEntradaStepProps {
  entrada: EntradaRegistrada;
  onConcluir: () => void;
}

export function ReciboEntradaStep({ entrada, onConcluir }: ReciboEntradaStepProps) {
  // Mesma consulta do recibo de saída (cacheada). Se falhar, o comprovante sai sem os dados da empresa.
  const { data: empresa } = useQuery({
    queryKey: EMPRESA_QUERY_KEY,
    queryFn: getEmpresa,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const data: ReciboEntradaData = {
    empresaNome: empresa ? empresa.company.nomeFantasia || empresa.company.razaoSocial || undefined : undefined,
    empresaCnpj: empresa?.company.cnpj ? formatCNPJ(empresa.company.cnpj) : undefined,
    placa: entrada.placa,
    modelo: entrada.modelo,
    cor: entrada.cor,
    categoria: entrada.categoria,
    sequencial: entrada.sequencial,
    tabela: entrada.rotatividadeDescricao,
    dataHoraEntrada: entrada.dataHoraEntrada,
    link: `${window.location.origin}/comprovante/${entrada.patioId}/${entrada.placa}`,
  };

  return (
    <>
      <Success role="status">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12.5l3 3 5-6" />
        </svg>
        Entrada registrada
      </Success>
      <ReciboEntradaConteudo data={data} />
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
          <ReciboEntradaConteudo data={data} />
        </div>,
        document.body,
      )}
    </>
  );
}
