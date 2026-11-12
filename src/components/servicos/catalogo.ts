import { CATEGORIA_ROTULO, CATEGORIA_TODAS, CATEGORIAS_SERVICO, type Servico } from "@/types/servico";

export type SituacaoFiltro = "ativos" | "inativos" | "todos";

export const SITUACOES: { id: SituacaoFiltro; label: string }[] = [
  { id: "ativos", label: "Ativos" },
  { id: "inativos", label: "Inativos" },
  { id: "todos", label: "Todos" },
];

export function ehSituacao(valor: string): valor is SituacaoFiltro {
  return SITUACOES.some((situacao) => situacao.id === valor);
}

// Sem acento e sem diferença de caixa: "lavagem" acha "Lavagem Técnica" e "polimento" acha "Polimênto".
export function normalizarBusca(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

// O back devolve o catálogo inteiro (dezenas de serviços por empresa): situação e busca são filtros locais, para a
// contagem e a seleção não dependerem de uma nova chamada.
export function filtrarServicos(servicos: Servico[], { situacao, q }: { situacao: SituacaoFiltro; q: string }): Servico[] {
  const busca = normalizarBusca(q);
  return servicos.filter((servico) => {
    if (situacao === "ativos" && !servico.ativo) return false;
    if (situacao === "inativos" && servico.ativo) return false;
    return busca === "" || normalizarBusca(servico.nome).includes(busca);
  });
}

// Id do serviço no endereço: só inteiro positivo em texto; o resto vira `null`, sem erro.
export function lerServicoDaUrl(valor: string | null): number | null {
  return valor !== null && /^[1-9]\d*$/.test(valor) ? Number(valor) : null;
}

export interface LinhaDePreco {
  categoria: number;
  rotulo: string;
  // Nulo: o serviço não atende a categoria.
  valorCentavos: number | null;
  // O valor vem do preço de "Todas as categorias", não de um preço próprio da categoria.
  geral: boolean;
}

// Preço de cada categoria. A 99 vale para as que não têm preço próprio, então quem só tem a 99 mostra uma linha única
// e, com preços próprios, as categorias sem o seu mostram o valor geral marcado como tal.
export function linhasDePreco(servico: Servico): LinhaDePreco[] {
  const todas = servico.precos.find((preco) => preco.categoria === CATEGORIA_TODAS)?.valorCentavos ?? null;
  const proprios = servico.precos.filter((preco) => preco.categoria !== CATEGORIA_TODAS);

  if (proprios.length === 0) {
    return todas === null ? [] : [{ categoria: CATEGORIA_TODAS, rotulo: CATEGORIA_ROTULO[CATEGORIA_TODAS], valorCentavos: todas, geral: false }];
  }

  return CATEGORIAS_SERVICO.map((categoria) => {
    const propio = proprios.find((preco) => preco.categoria === categoria);
    return {
      categoria,
      rotulo: CATEGORIA_ROTULO[categoria],
      valorCentavos: propio?.valorCentavos ?? todas,
      geral: propio === undefined && todas !== null,
    };
  });
}

// Preço do serviço para a categoria de um veículo: o próprio da categoria ou, na falta dele, o de "Todas". Nulo quando o
// serviço não atende a categoria.
export function precoParaCategoria(servico: Servico, categoria: number): number | null {
  const propio = servico.precos.find((preco) => preco.categoria === categoria);
  const todas = servico.precos.find((preco) => preco.categoria === CATEGORIA_TODAS);
  return (propio ?? todas)?.valorCentavos ?? null;
}
