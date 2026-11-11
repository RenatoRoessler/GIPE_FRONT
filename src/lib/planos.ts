import { PlanoAdesao, TipoPlanoAdesao } from "@/types/plano";

const reais = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatarReais(centavos: number): string {
  // O Intl separa o símbolo do número com espaço sem quebra; normaliza para espaço comum.
  return reais.format(centavos / 100).replace(/ /g, " ");
}

// As mesmas condições que o site promete para o teste.
export const CONDICOES_DO_TESTE = "Todas as funcionalidades, sem cartão de crédito e sem compromisso.";

// "2027-06-30" -> "30/06/2027". Sem `Date`: o fuso do navegador nunca muda o dia informado pelo back-end.
export function formatarDataPromocao(promocaoAte: string): string {
  const [ano, mes, dia] = promocaoAte.split("-");
  return `${dia}/${mes}/${ano}`;
}

export function descreverDuracao(meses: number): string {
  return meses === 1 ? "1 mês" : `${meses} meses`;
}

export function descreverCondicao(plano: PlanoAdesao): string {
  if (!plano.emPromocao) return "Cobrado todo mês";

  const atual = formatarReais(plano.centavosAtual);
  if (!plano.promocaoAte) return `${atual}/mês em promoção.`;

  const tabela = formatarReais(plano.centavosTabela);
  return `${atual}/mês até ${formatarDataPromocao(plano.promocaoAte)}; depois, ${tabela}/mês.`;
}

export function rotuloDoSelo(plano: PlanoAdesao): string | undefined {
  if (!plano.emPromocao) return undefined;
  return plano.promocaoAte ? `Promoção até ${formatarDataPromocao(plano.promocaoAte)}` : "Promoção";
}

// Nome acessível do cartão: tem que dizer tudo o que ele mostra, inclusive o "de ... por ..." do preço riscado.
export function descreverParaLeitor(plano: PlanoAdesao): string {
  if (plano.tipo === TipoPlanoAdesao.Trial) {
    return `${plano.nome}, ${descreverDuracao(plano.meses)}. ${CONDICOES_DO_TESTE}`;
  }

  const atual = formatarReais(plano.centavosAtual);
  if (!plano.emPromocao) return `${plano.nome}, ${atual} por mês, cobrado todo mês`;

  const tabela = formatarReais(plano.centavosTabela);
  const fim = plano.promocaoAte ? `promoção até ${formatarDataPromocao(plano.promocaoAte)}` : "em promoção";
  return `${plano.nome}, de ${tabela} por ${atual} por mês, ${fim}`;
}

// Sem o plano escolhido não há o que mostrar. O teste mostra a duração só quando o back-end informou.
export function descricaoNaCredencial(plano: PlanoAdesao | undefined, tipo: number | undefined): string | undefined {
  if (tipo === undefined) return undefined;
  if (tipo === TipoPlanoAdesao.Trial) {
    return plano ? `${descreverDuracao(plano.meses)} grátis` : "Mês grátis";
  }
  return plano ? `${plano.nome} · ${formatarReais(plano.centavosAtual)}/mês` : undefined;
}

export function planoDoTipo(planos: readonly PlanoAdesao[] | undefined, tipo: number | undefined): PlanoAdesao | undefined {
  if (tipo === undefined) return undefined;
  return planos?.find((plano) => plano.tipo === tipo);
}

// Só o texto exato "0" abre o teste grátis; os demais valores seguem a regra de lerPlanoDaUrl.
export function ehTesteGratisNaUrl(valor: string | null): boolean {
  return valor === "0";
}

// Só inteiro positivo em texto; qualquer outra coisa é ignorada, sem erro.
// Se o plano existe de fato é conferido depois, contra a lista do back-end.
export function lerPlanoDaUrl(valor: string | null): number | undefined {
  if (valor === null || !/^[1-9]\d*$/.test(valor)) return undefined;
  const tipo = Number(valor);
  return Number.isSafeInteger(tipo) ? tipo : undefined;
}
