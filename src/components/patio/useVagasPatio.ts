"use client";

import { useQuery } from "@tanstack/react-query";
import { EMPRESA_QUERY_KEY } from "@/components/empresa/MinhaEmpresa/EmpresaForm";
import { getEmpresa } from "@/lib/api/services/empresa";
import type { PatioVagas } from "@/types/patio";

// Vagas de moto e de carro cadastradas na empresa; as vagas mudam raramente. Enquanto carrega, se falhar
// ou se não houver vagas cadastradas, devolve null: a tela só deixa de mostrar a ocupação.
export function useVagasPatio(): PatioVagas | null {
  const { data } = useQuery({
    queryKey: EMPRESA_QUERY_KEY,
    queryFn: getEmpresa,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
  if (!data) return null;
  const moto = Number(data.company.quantidadeVagasMoto);
  const carro = Number(data.company.quantidadeVagasCarro);
  if (!Number.isFinite(moto) || !Number.isFinite(carro) || moto + carro <= 0) return null;
  return { moto: Math.max(0, moto), carro: Math.max(0, carro) };
}
