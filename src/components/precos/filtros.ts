import { getSituacao } from "@/lib/api/services/preco.mapper";
import type { PrecoView, SituacaoPreco } from "@/types/preco";

export type FiltroSituacao = "todas" | SituacaoPreco;

export const FILTRO_SITUACAO_OPTIONS: { value: FiltroSituacao; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "vigente", label: "Vigente" },
  { value: "agendada", label: "Agendada" },
  { value: "encerrada", label: "Encerrada" },
  { value: "inativa", label: "Inativa" },
];

const SITUACOES = new Set<string>(FILTRO_SITUACAO_OPTIONS.map((option) => option.value));

// Valor vindo da URL: qualquer coisa fora da lista vira "todas".
export function parseFiltroSituacao(value: string | null | undefined): FiltroSituacao {
  return value && SITUACOES.has(value) ? (value as FiltroSituacao) : "todas";
}

// Minúsculas, sem acento e sem espaços nas pontas: "Promoção " e "promocao" se encontram.
export function normalizarTexto(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

export interface FiltroPrecos {
  q: string;
  situacao: FiltroSituacao;
}

export function filtrarPrecos(precos: PrecoView[], { q, situacao }: FiltroPrecos, agora: Date): PrecoView[] {
  const busca = normalizarTexto(q);

  return precos.filter((preco) => {
    if (situacao !== "todas" && getSituacao(preco.ativo, preco.inicioVigencia, preco.fimVigencia, agora) !== situacao) {
      return false;
    }
    return busca === "" || normalizarTexto(preco.descricao).includes(busca);
  });
}

const CONTAGEM: Record<SituacaoPreco, [string, string]> = {
  vigente: ["vigente", "vigentes"],
  agendada: ["agendada", "agendadas"],
  encerrada: ["encerrada", "encerradas"],
  inativa: ["inativa", "inativas"],
};

// "7 tabelas" para todas; "3 vigentes" quando há filtro de situação.
export function contarPrecos(total: number, situacao: FiltroSituacao): string {
  if (situacao === "todas") {
    return `${total} ${total === 1 ? "tabela" : "tabelas"}`;
  }
  const [singular, plural] = CONTAGEM[situacao];
  return `${total} ${total === 1 ? singular : plural}`;
}
