import type { PatioFiltroChave, PatioFiltros, PatioFiltroTipo } from "@/types/patio";

type Parametros = Pick<URLSearchParams, "get">;

export const PATIO_PATH = "/patio";
// Pedido de anúncio da saída: a lista o lê uma vez e o remove da URL.
export const PARAM_SAIU = "saiu";
// Marca que o comprovante foi aberto a partir do ticket: fechar volta no histórico em vez de empilhar outra entrada.
export const PARAM_DE = "de";
export const DE_TICKET = "ticket";

const TIPOS: PatioFiltroTipo[] = ["mensalistas", "avulsos"];
const CHAVES: PatioFiltroChave[] = ["fora", "dentro"];

// Valor ausente ou fora do formato vale "todos": um link antigo ou editado à mão não quebra a tela.
export function lerFiltros(params: Parametros): PatioFiltros {
  const tipo = params.get("tipo");
  const chave = params.get("chave");
  const categoria = Number(params.get("cat"));
  return {
    busca: params.get("q") ?? "",
    tipo: TIPOS.find((valor) => valor === tipo) ?? "todos",
    categoria: params.get("cat") !== null && Number.isInteger(categoria) && categoria >= 0 ? categoria : "todas",
    chave: CHAVES.find((valor) => valor === chave) ?? "todas",
  };
}

// Query string sem o "?" e sem os valores padrão; vazia quando não há filtro.
export function gravarFiltros(filtros: PatioFiltros): string {
  const params = new URLSearchParams();
  const busca = filtros.busca.trim();
  if (busca !== "") params.set("q", busca);
  if (filtros.tipo !== "todos") params.set("tipo", filtros.tipo);
  if (filtros.categoria !== "todas") params.set("cat", String(filtros.categoria));
  if (filtros.chave && filtros.chave !== "todas") params.set("chave", filtros.chave);
  return params.toString();
}

function comQuery(caminho: string, query: string): string {
  return query === "" ? caminho : `${caminho}?${query}`;
}

export function hrefDaLista(filtros: PatioFiltros): string {
  return comQuery(PATIO_PATH, gravarFiltros(filtros));
}

// O ticket leva os filtros da lista na URL para o "Voltar" devolver o operador ao mesmo recorte.
export function hrefDoTicket(patioId: number, filtros: PatioFiltros): string {
  return comQuery(`${PATIO_PATH}/${patioId}`, gravarFiltros(filtros));
}

export function hrefDoComprovante(patioId: number, query: string): string {
  return comQuery(`${PATIO_PATH}/${patioId}/comprovante`, query);
}

// Ticket cuja query já vem pronta (os filtros da lista que ele carrega).
export function hrefDoTicketComQuery(patioId: number, query: string): string {
  return comQuery(`${PATIO_PATH}/${patioId}`, query);
}
