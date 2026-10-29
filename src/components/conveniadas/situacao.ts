import type { SituacaoFiltro } from "@/types/conveniada";

export const LISTA_URL = "/empresas-conveniadas";

export const SITUACOES: readonly { value: SituacaoFiltro; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "ativos", label: "Ativos" },
  { value: "encerrados", label: "Encerrados" },
];

// Valor ausente ou desconhecido na URL vira "todos".
export function parseSituacao(value: string | null): SituacaoFiltro {
  return SITUACOES.find((situacao) => situacao.value === value)?.value ?? "todos";
}

// "todos" é o padrão e não vai para a URL.
export function situacaoUrl(situacao: SituacaoFiltro): string {
  return situacao === "todos" ? LISTA_URL : `${LISTA_URL}?situacao=${situacao}`;
}
