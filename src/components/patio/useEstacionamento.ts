"use client";

import { useQuery } from "@tanstack/react-query";
import { EMPRESA_QUERY_KEY } from "@/components/empresa/MinhaEmpresa/EmpresaForm";
import { getEmpresa } from "@/lib/api/services/empresa";

// Nome do estacionamento para o topo do Pátio; compartilha a consulta (e o cache) de `useVagasPatio`.
// Enquanto carrega ou se falhar, devolve null e o subtítulo simplesmente não aparece.
export function useEstacionamento(): string | null {
  const { data } = useQuery({
    queryKey: EMPRESA_QUERY_KEY,
    queryFn: getEmpresa,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
  const nome = data?.company.nomeFantasia?.trim() || data?.company.razaoSocial?.trim();
  return nome ? nome : null;
}
