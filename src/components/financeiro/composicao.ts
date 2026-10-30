import { arredondar } from "@/components/caixa/agregados";
import { ORIGEM_FLUXO, TIPO_LANCAMENTO, type FluxoCategoria, type TipoLancamento } from "@/types/financeiro";

export type LinhaComposicao = {
  chave: string;
  nome: string;
  valor: number;
  // Fatia do total do lado (entradas ou saídas), de 0 a 100.
  percentual: number;
  // Preenchido nas categorias de lançamento: a linha leva aos lançamentos dessa categoria (e das filhas, se for pai).
  categoriaId: number | null;
  filhas: LinhaComposicao[];
};

export type GrupoComposicao = {
  chave: string;
  titulo: string;
  valor: number;
  percentual: number;
  // Vazio no rotativo e nas mensalidades, que são um valor só.
  linhas: LinhaComposicao[];
};

export type LadoComposicao = { total: number; grupos: GrupoComposicao[] };

export type Composicao = { entradas: LadoComposicao; saidas: LadoComposicao };

const TITULOS: Record<number, string> = {
  [ORIGEM_FLUXO.Rotativo]: "Estacionamento rotativo",
  [ORIGEM_FLUXO.Mensalidades]: "Mensalidades",
  [ORIGEM_FLUXO.Lancamento]: "Lançamentos",
};

function percentualDe(valor: number, total: number): number {
  return total > 0 ? Math.min(100, (valor / total) * 100) : 0;
}

const porValorDecrescente = (a: { valor: number }, b: { valor: number }) => b.valor - a.valor;

type CategoriaAcumulada = { id: number | null; nome: string; proprio: number; filhas: Map<string, { id: number | null; nome: string; valor: number }> };

// Lançamentos agrupados pela categoria principal: o pai soma o que foi lançado nele e o que foi lançado nas filhas.
function linhasDeLancamentos(itens: FluxoCategoria[], total: number): LinhaComposicao[] {
  const porPai = new Map<string, CategoriaAcumulada>();

  for (const item of itens) {
    const ehFilha = item.financeiroCategoriaPaiId !== null;
    const paiId = ehFilha ? item.financeiroCategoriaPaiId : item.financeiroCategoriaId;
    const chavePai = paiId !== null ? `id-${paiId}` : `nome-${item.categoria}`;
    const pai = porPai.get(chavePai) ?? {
      id: paiId,
      // Só as filhas vieram com valor: o nome do pai chega junto delas.
      nome: ehFilha ? (item.categoriaPai ?? "Sem categoria") : item.categoria,
      proprio: 0,
      filhas: new Map(),
    };

    if (ehFilha) {
      const chaveFilha = item.financeiroCategoriaId !== null ? `id-${item.financeiroCategoriaId}` : `nome-${item.categoria}`;
      const filha = pai.filhas.get(chaveFilha) ?? { id: item.financeiroCategoriaId, nome: item.categoria, valor: 0 };
      filha.valor += item.valor;
      pai.filhas.set(chaveFilha, filha);
    } else {
      pai.proprio += item.valor;
      pai.nome = item.categoria;
    }
    porPai.set(chavePai, pai);
  }

  return [...porPai.entries()]
    .map(([chave, pai]): LinhaComposicao => {
      const filhas = [...pai.filhas.entries()]
        .map(([chaveFilha, filha]): LinhaComposicao => ({
          chave: `${chave}/${chaveFilha}`,
          nome: filha.nome,
          valor: arredondar(filha.valor),
          percentual: percentualDe(filha.valor, total),
          categoriaId: filha.id,
          filhas: [],
        }))
        .filter((filha) => filha.valor !== 0)
        .sort(porValorDecrescente);
      const valor = arredondar(pai.proprio + filhas.reduce((soma, filha) => soma + filha.valor, 0));
      return { chave, nome: pai.nome, valor, percentual: percentualDe(valor, total), categoriaId: pai.id, filhas };
    })
    .filter((linha) => linha.valor !== 0)
    .sort(porValorDecrescente);
}

function montarLado(categorias: FluxoCategoria[], tipo: TipoLancamento): LadoComposicao {
  const doLado = categorias.filter((item) => item.tipo === tipo && item.valor !== 0);
  const total = arredondar(doLado.reduce((soma, item) => soma + item.valor, 0));
  const origens = [...new Set(doLado.map((item) => item.origem))].sort((a, b) => a - b);

  const grupos = origens.map((origem): GrupoComposicao => {
    const itens = doLado.filter((item) => item.origem === origem);
    const valor = arredondar(itens.reduce((soma, item) => soma + item.valor, 0));
    const ehLancamento = origem === ORIGEM_FLUXO.Lancamento;
    return {
      chave: `origem-${origem}`,
      // Origem que o front não conhece aparece com o nome que o back mandou.
      titulo: TITULOS[origem] ?? itens[0].categoria,
      valor,
      percentual: percentualDe(valor, total),
      linhas: ehLancamento ? linhasDeLancamentos(itens, total) : [],
    };
  });

  return { total, grupos };
}

// Rotativo, Mensalidades e Lançamentos, nessa ordem, em cada lado. Valor zerado não aparece.
export function montarComposicao(categorias: FluxoCategoria[]): Composicao {
  return {
    entradas: montarLado(categorias, TIPO_LANCAMENTO.Entrada),
    saidas: montarLado(categorias, TIPO_LANCAMENTO.Saida),
  };
}
