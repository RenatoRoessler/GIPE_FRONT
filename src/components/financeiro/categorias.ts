import { TIPO_LANCAMENTO, type FinanceiroCategoria, type Lancamento, type TipoLancamento } from "@/types/financeiro";

export type Situacao = "ativas" | "inativas" | "todas";

export type NoCategoria = {
  categoria: FinanceiroCategoria;
  filhas: FinanceiroCategoria[];
  // A categoria pai não passou no filtro, mas aparece porque alguma filha passou.
  soContexto: boolean;
};

export type FiltroCategorias = { tipo?: TipoLancamento; situacao?: Situacao };

function passaNoFiltro(categoria: FinanceiroCategoria, { tipo, situacao = "todas" }: FiltroCategorias): boolean {
  if (tipo !== undefined && categoria.tipo !== tipo) {
    return false;
  }
  return situacao === "todas" || (situacao === "ativas" ? categoria.ativo : !categoria.ativo);
}

// A API manda cada pai seguido das filhas. Uma filha cujo pai não veio na lista é tratada como principal.
function agrupar(categorias: FinanceiroCategoria[]): { pais: FinanceiroCategoria[]; filhasDe: Map<number, FinanceiroCategoria[]> } {
  const ids = new Set(categorias.map((categoria) => categoria.financeiroCategoriaId));
  const filhasDe = new Map<number, FinanceiroCategoria[]>();
  const pais: FinanceiroCategoria[] = [];
  for (const categoria of categorias) {
    const paiId = categoria.financeiroCategoriaPaiId;
    if (paiId !== null && ids.has(paiId)) {
      filhasDe.set(paiId, [...(filhasDe.get(paiId) ?? []), categoria]);
    } else {
      pais.push(categoria);
    }
  }
  return { pais, filhasDe };
}

// Árvore de um nível para a aba Categorias, já filtrada por tipo e situação.
export function montarArvore(categorias: FinanceiroCategoria[], filtro: FiltroCategorias = {}): NoCategoria[] {
  const { pais, filhasDe } = agrupar(categorias);
  return pais.flatMap((pai): NoCategoria[] => {
    const filhas = (filhasDe.get(pai.financeiroCategoriaId) ?? []).filter((filha) => passaNoFiltro(filha, filtro));
    const passa = passaNoFiltro(pai, filtro);
    return passa || filhas.length > 0 ? [{ categoria: pai, filhas, soContexto: !passa }] : [];
  });
}

export function separarPorTipo(nos: NoCategoria[]): { receitas: NoCategoria[]; despesas: NoCategoria[] } {
  return {
    receitas: nos.filter((no) => no.categoria.tipo === TIPO_LANCAMENTO.Entrada),
    despesas: nos.filter((no) => no.categoria.tipo === TIPO_LANCAMENTO.Saida),
  };
}

export type OpcaoCategoria = { value: string; label: string };

export type FiltroOpcoes = {
  tipo?: TipoLancamento;
  // Padrão true: formulários só oferecem categorias ativas. O filtro da lista oferece todas, pois lançamentos antigos usam inativas.
  apenasAtivas?: boolean;
  // Categoria que fica na lista mesmo inativa (a do lançamento em edição).
  manterId?: number;
};

// Opções de select: cada pai seguido das filhas ("↳ Filha"). Filha cujo pai não está nas opções leva o nome do pai.
export function opcoesDeCategoria(categorias: FinanceiroCategoria[], { tipo, apenasAtivas = true, manterId }: FiltroOpcoes = {}): OpcaoCategoria[] {
  const entram = (categoria: FinanceiroCategoria) =>
    (tipo === undefined || categoria.tipo === tipo) && (!apenasAtivas || categoria.ativo || categoria.financeiroCategoriaId === manterId);
  const rotulo = (categoria: FinanceiroCategoria, prefixo: string) => `${prefixo}${categoria.nome}${categoria.ativo ? "" : " (inativa)"}`;

  const { pais, filhasDe } = agrupar(categorias);
  const opcoes: OpcaoCategoria[] = [];
  for (const pai of pais) {
    const paiEntra = entram(pai);
    if (paiEntra) {
      opcoes.push({ value: String(pai.financeiroCategoriaId), label: rotulo(pai, "") });
    }
    for (const filha of filhasDe.get(pai.financeiroCategoriaId) ?? []) {
      if (entram(filha)) {
        opcoes.push({ value: String(filha.financeiroCategoriaId), label: paiEntra ? rotulo(filha, "↳ ") : rotulo(filha, `${pai.nome} › `) });
      }
    }
  }
  return opcoes;
}

// Pais que a categoria pode escolher: ativos, do mesmo tipo, que não são subcategorias e não são ela mesma.
export function paisElegiveis(categorias: FinanceiroCategoria[], { tipo, categoriaId }: { tipo: TipoLancamento; categoriaId?: number }): FinanceiroCategoria[] {
  return categorias.filter(
    (categoria) =>
      categoria.ativo &&
      categoria.tipo === tipo &&
      categoria.financeiroCategoriaPaiId === null &&
      categoria.financeiroCategoriaId !== categoriaId,
  );
}

// Quem agrupa outras (ativas ou não) não pode virar subcategoria.
export function agrupaOutras(categorias: FinanceiroCategoria[], categoriaId: number): boolean {
  return categorias.some((categoria) => categoria.financeiroCategoriaPaiId === categoriaId);
}

export function tipoPorCategoria(categorias: FinanceiroCategoria[]): Map<number, TipoLancamento> {
  return new Map(categorias.map((categoria) => [categoria.financeiroCategoriaId, categoria.tipo]));
}

// O tipo do lançamento: o que veio na resposta ou, faltando, o da categoria dele. Null se nenhum dos dois for conhecido.
export function tipoDoLancamento(lancamento: Pick<Lancamento, "tipo" | "financeiroCategoriaId">, tipos: ReadonlyMap<number, TipoLancamento>): TipoLancamento | null {
  return lancamento.tipo ?? tipos.get(lancamento.financeiroCategoriaId) ?? null;
}
