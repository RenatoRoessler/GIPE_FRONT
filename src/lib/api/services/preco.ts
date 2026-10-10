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

const BUSCA_TAMANHO_PAGINA = 20;

// Não existe endpoint de consulta por id: a listagem já traz a tabela completa (horários, faixas e categorias),
// então a edição localiza o registro nela. Sempre busca no servidor (dados atuais, não cache); `paginaInicial`
// só define por onde começar, e as demais páginas são percorridas se o registro não estiver nela.
export async function getPreco(id: number, paginaInicial = 1): Promise<PrecoView> {
  const first = await listPrecos({ pagina: paginaInicial, tamanhoPagina: BUSCA_TAMANHO_PAGINA });
  const found = first.items.find((preco) => preco.rotatividadeId === id);
  if (found) {
    return found;
  }

  for (let pagina = 1; pagina <= first.totalPages; pagina += 1) {
    if (pagina === paginaInicial) {
      continue;
    }
    const result = await listPrecos({ pagina, tamanhoPagina: BUSCA_TAMANHO_PAGINA });
    const match = result.items.find((preco) => preco.rotatividadeId === id);
    if (match) {
      return match;
    }
  }

  throw new ApiError("not_found", "Tabela de preço não encontrada.", 404);
}

export async function createPreco(values: PrecoFormValues): Promise<void> {
  await api.post("/rotatividade", toPrecoPayload(values));
}

export async function updatePreco(id: number, values: PrecoFormValues): Promise<void> {
  await api.put(`/rotatividade/${id}`, toPrecoPayload(values));
}
