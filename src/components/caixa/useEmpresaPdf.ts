"use client";

import { useQuery } from "@tanstack/react-query";
import { useCan } from "@/hooks/useCan";
import { getEmpresa } from "@/lib/api/services/empresa";
import { AREA } from "@/lib/permissoes";
import type { EmpresaPdf } from "./pdf/modelos";

// Razão social e CNPJ para o cabeçalho dos PDFs. GET /Empresa é só do Administrador: para os outros perfis o
// cabeçalho sai sem os dados da empresa, em vez de gerar uma chamada que a API recusaria.
export function useEmpresaPdf(): EmpresaPdf {
  const podeLer = useCan(AREA.Empresa);
  const { data } = useQuery({
    queryKey: ["empresa"],
    queryFn: getEmpresa,
    enabled: podeLer,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  return data?.company.razaoSocial ? { razaoSocial: data.company.razaoSocial, cnpj: data.company.cnpj } : null;
}
