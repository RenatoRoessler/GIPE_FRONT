import { Plano, PlanoVendido, TipoPlanoAdesao } from "@/types/plano";

// Mesma tabela do site (murel-site); mudar um valor exige mudar nos dois lugares.
export const PLANO_MENSAL: Plano = {
  tipo: TipoPlanoAdesao.Mensal,
  nome: "Mensal",
  centavosPorMes: 9990,
  centavosLancamento: 6990,
  mesesDeLancamento: 12,
};

export const PLANOS: readonly Plano[] = [PLANO_MENSAL];

// 1º de julho de 2027, 00:00 em Brasília: "assine até 30/06/2027" vale o dia 30 inteiro.
export const FIM_DO_LANCAMENTO = new Date("2027-07-01T00:00:00-03:00");
export const ROTULO_FIM_DO_LANCAMENTO = "30/06/2027";

export function lancamentoVigente(agora: number = Date.now(), fim: Date = FIM_DO_LANCAMENTO): boolean {
  return agora < fim.getTime();
}

const reais = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatarReais(centavos: number): string {
  // O Intl separa o símbolo do número com espaço sem quebra; normaliza para espaço comum.
  return reais.format(centavos / 100).replace(/ /g, " ");
}

export function valorPorMes(plano: Plano, agora: number = Date.now()): number {
  return lancamentoVigente(agora) ? plano.centavosLancamento : plano.centavosPorMes;
}

export function descreverCondicao(plano: Plano, agora: number = Date.now()): string {
  if (!lancamentoVigente(agora)) return "Cobrado todo mês";

  const lancamento = formatarReais(plano.centavosLancamento);
  const tabela = formatarReais(plano.centavosPorMes);
  return `${lancamento}/mês nos primeiros ${plano.mesesDeLancamento} meses; depois, ${tabela}/mês.`;
}

// Só o texto exato "0" abre o teste grátis; os demais valores seguem a regra de lerPlanoDaUrl.
export function ehTesteGratisNaUrl(valor: string | null): boolean {
  return valor === "0";
}

export function descricaoDoTeste(): string {
  return "Teste grátis · 30 dias";
}

// Só o texto exato "1" vale; qualquer outra coisa é ignorada, sem erro.
export function lerPlanoDaUrl(valor: string | null): PlanoVendido | undefined {
  return valor === "1" ? TipoPlanoAdesao.Mensal : undefined;
}
