import { formatMinutos } from "@/components/precos/format";
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
// `incluirDescricao` faz a busca casar também a descrição (a lista larga busca por ela; a do celular, só pelo nome).
export function filtrarServicos(
  servicos: Servico[],
  { situacao, q, incluirDescricao = false }: { situacao: SituacaoFiltro; q: string; incluirDescricao?: boolean },
): Servico[] {
  const busca = normalizarBusca(q);
  return servicos.filter((servico) => {
    if (situacao === "ativos" && !servico.ativo) return false;
    if (situacao === "inativos" && servico.ativo) return false;
    if (busca === "") return true;
    if (normalizarBusca(servico.nome).includes(busca)) return true;
    return incluirDescricao && normalizarBusca(servico.descricao ?? "").includes(busca);
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
  // Duração prevista e tempo grátis no pátio desta categoria; nulos quando o back não os mandou.
  duracaoMinutos: number | null;
  tempoPermitidoMinutos: number | null;
}

// Preço de cada categoria. A 99 vale para as que não têm preço próprio, então quem só tem a 99 mostra uma linha única
// e, com preços próprios, as categorias sem o seu mostram o valor geral marcado como tal.
export function linhasDePreco(servico: Servico): LinhaDePreco[] {
  const todas = servico.precos.find((preco) => preco.categoria === CATEGORIA_TODAS)?.valorCentavos ?? null;
  const proprios = servico.precos.filter((preco) => preco.categoria !== CATEGORIA_TODAS);

  if (proprios.length === 0) {
    return todas === null
      ? []
      : [{ categoria: CATEGORIA_TODAS, rotulo: CATEGORIA_ROTULO[CATEGORIA_TODAS], valorCentavos: todas, geral: false, duracaoMinutos: null, tempoPermitidoMinutos: null }];
  }

  return CATEGORIAS_SERVICO.map((categoria) => {
    const propio = proprios.find((preco) => preco.categoria === categoria);
    return {
      categoria,
      rotulo: CATEGORIA_ROTULO[categoria],
      valorCentavos: propio?.valorCentavos ?? todas,
      geral: propio === undefined && todas !== null,
      duracaoMinutos: propio?.duracaoMinutos ?? null,
      tempoPermitidoMinutos: propio?.tempoPermitidoMinutos ?? null,
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

// Duração prevista do serviço para a categoria de um veículo, nula quando o back não a mandou.
export function duracaoParaCategoria(servico: Servico, categoria: number): number | null {
  return servico.precos.find((preco) => preco.categoria === categoria)?.duracaoMinutos ?? servico.duracaoMinutos;
}

export interface FaixaDePreco {
  minimoCentavos: number;
  maximoCentavos: number;
  // Todas as categorias custam o mesmo: não há "a partir de".
  unico: boolean;
}

// Menor e maior preço entre as categorias que o serviço atende. Nulo sem nenhum preço.
export function faixaDePreco(servico: Servico): FaixaDePreco | null {
  const valores = linhasDePreco(servico).flatMap((linha) => (linha.valorCentavos === null ? [] : [linha.valorCentavos]));
  if (valores.length === 0) return null;
  const minimoCentavos = Math.min(...valores);
  const maximoCentavos = Math.max(...valores);
  return { minimoCentavos, maximoCentavos, unico: minimoCentavos === maximoCentavos };
}

// Minutos que valem para cada preço: o da categoria, quando o back o manda, ou o do serviço.
function minutosPorPreco(servico: Servico, campo: "duracaoMinutos" | "tempoPermitidoMinutos"): number[] {
  const padrao = servico[campo];
  if (servico.precos.length === 0) return padrao === null ? [] : [padrao];
  return servico.precos.flatMap((preco) => {
    const minutos = preco[campo] ?? padrao;
    return minutos === null ? [] : [minutos];
  });
}

export interface FaixaDeDuracao {
  minimo: number;
  maximo: number;
}

// Menor e maior duração prevista entre as categorias. Nulo sem previsão.
export function faixaDeDuracao(servico: Servico): FaixaDeDuracao | null {
  const duracoes = minutosPorPreco(servico, "duracaoMinutos").filter((minutos) => minutos > 0);
  return duracoes.length === 0 ? null : { minimo: Math.min(...duracoes), maximo: Math.max(...duracoes) };
}

// "até 2 h grátis", ou nulo quando a permanência é cobrada normalmente.
export function gratisDoServico(servico: Servico): string | null {
  const maior = Math.max(0, ...minutosPorPreco(servico, "tempoPermitidoMinutos"));
  return maior > 0 ? `até ${formatMinutos(maior)} grátis` : null;
}

export interface CategoriaAtendida {
  categoria: number;
  rotulo: string;
  atende: boolean;
}

// As seis categorias, na ordem do formulário, e se o serviço atende cada uma. Preço de "Todas" atende as seis.
export function categoriasAtendidas(servico: Servico): CategoriaAtendida[] {
  const todas = servico.precos.some((preco) => preco.categoria === CATEGORIA_TODAS);
  return CATEGORIAS_SERVICO.map((categoria) => ({
    categoria,
    rotulo: CATEGORIA_ROTULO[categoria],
    atende: todas || servico.precos.some((preco) => preco.categoria === categoria),
  }));
}

export interface ResumoDoCatalogo {
  ativos: number;
  comTempoGratis: number;
}

// Chips do topo da lista: só serviços ativos contam.
export function resumirCatalogo(servicos: Servico[]): ResumoDoCatalogo {
  const ativos = servicos.filter((servico) => servico.ativo);
  return { ativos: ativos.length, comTempoGratis: ativos.filter((servico) => gratisDoServico(servico) !== null).length };
}

// "30 min a 1 h · até 2 h grátis" ou "1 h · cobra permanência": a linha de tempos do item da lista. Sem duração prevista,
// só a parte da permanência.
export function resumoDeTempos(servico: Servico): string {
  const faixa = faixaDeDuracao(servico);
  const duracao =
    faixa === null ? null : faixa.minimo === faixa.maximo ? formatMinutos(faixa.minimo) : `${formatMinutos(faixa.minimo)} a ${formatMinutos(faixa.maximo)}`;
  return [duracao, gratisDoServico(servico) ?? "cobra permanência"].filter(Boolean).join(" · ");
}

// Exemplos de veículos de cada categoria, para o administrador não ter de adivinhar onde "Carro grande" começa.
export const EXEMPLOS_DA_CATEGORIA: Record<number, string> = {
  2: "Mobi, Kwid, HB20",
  3: "Onix, Corolla, Compass",
  4: "Hilux, S10, Ranger",
  6: "SW4, Commander",
};
