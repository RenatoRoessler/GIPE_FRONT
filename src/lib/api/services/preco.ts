import type { Paginado } from "@/lib/api/types";
import type { PrecoFormValues, PrecoView } from "@/types/preco";
import { api } from "../client";
import { ApiError } from "../errors";
import { fromPrecoResponse, toPrecoPayload, type PrecoDto } from "./preco.mapper";

export async function listPrecos(params: {
  pagina: number;
  tamanhoPagina: number;
}): Promise<Paginado<PrecoView>> {
  const { data } = await api.get<Paginado<Partial<PrecoDto>>>("/rotatividade", { params });
  return { ...data, items: (data.items ?? []).map(fromPrecoResponse) };
}

// Tamanho das páginas usadas na carga completa. [A CONFIRMAR] o máximo que a API aceita.
export const TAMANHO_PAGINA_CARGA = 50;

// Carrega todas as tabelas, na ordem da API. A tela de preços busca, filtra e pagina em memória porque a API
// só aceita `pagina` e `tamanhoPagina`; se um dia aceitar busca no servidor, a troca é só aqui e em `usePrecos`.
export async function listAllPrecos(): Promise<PrecoView[]> {
  const first = await listPrecos({ pagina: 1, tamanhoPagina: TAMANHO_PAGINA_CARGA });
  if (first.totalPages <= 1) {
    return first.items;
  }

  const restantes = await Promise.all(
    Array.from({ length: first.totalPages - 1 }, (_, index) =>
      listPrecos({ pagina: index + 2, tamanhoPagina: TAMANHO_PAGINA_CARGA }),
    ),
  );
  return [first, ...restantes].flatMap((page) => page.items);
}

// Não existe endpoint de consulta por id: a listagem já traz a tabela completa (horários, faixas e categorias),
// então o registro é localizado na carga completa. Sempre busca no servidor (dados atuais, não cache).
export async function getPreco(id: number): Promise<PrecoView> {
  const todas = await listAllPrecos();
  const found = todas.find((preco) => preco.rotatividadeId === id);
  if (!found) {
    throw new ApiError("not_found", "Tabela de preço não encontrada.", 404);
  }
  return found;
}

export async function createPreco(values: PrecoFormValues): Promise<void> {
  await api.post("/rotatividade", toPrecoPayload(values));
}

export async function updatePreco(id: number, values: PrecoFormValues): Promise<void> {
  await api.put(`/rotatividade/${id}`, toPrecoPayload(values));
}
