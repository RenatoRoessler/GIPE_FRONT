"use client";

import { useQuery } from "@tanstack/react-query";
import { EMPRESA_QUERY_KEY } from "@/components/empresa/MinhaEmpresa/EmpresaForm";
import { getEmpresa } from "@/lib/api/services/empresa";
import { filtrarFormasAceitas, type FormaSaida } from "./saida";

export type MeiosPagamento =
  | { status: "carregando" }
  | { status: "erro"; mensagem: string; refetch: () => void }
  // Todos desligados: configuração que o cadastro não deixa salvar, mas que a API pode devolver.
  | { status: "vazio" }
  | { status: "pronto"; opcoes: FormaSaida[] };

// Lê da empresa quais meios de pagamento a saída pode oferecer. Revalida a cada abertura do modal (staleTime 0),
// mostrando antes o que já estava em cache.
export function useMeiosPagamento(): MeiosPagamento {
  const query = useQuery({
    queryKey: EMPRESA_QUERY_KEY,
    queryFn: getEmpresa,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  // Com dados em cache, uma falha ao revalidar não derruba a saída: vale a última configuração conhecida.
  if (query.data) {
    const opcoes = filtrarFormasAceitas(query.data.payments);
    return opcoes.length > 0 ? { status: "pronto", opcoes } : { status: "vazio" };
  }
  if (query.isError) {
    return { status: "erro", mensagem: query.error.message, refetch: () => void query.refetch() };
  }
  return { status: "carregando" };
}
