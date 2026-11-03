import { Plano, PlanoVendido, TipoPlanoAdesao } from "@/types/plano";

// Mesma tabela do site (murel-site); mudar um valor exige mudar nos dois lugares.
export const PLANOS: readonly Plano[] = [
  { tipo: TipoPlanoAdesao.Mensal, nome: "Mensal", meses: 1, centavosPorMes: 14990 },
  { tipo: TipoPlanoAdesao.Trimestral, nome: "Trimestral", meses: 3, centavosPorMes: 13490 },
  { tipo: TipoPlanoAdesao.Semestral, nome: "Semestral", meses: 6, centavosPorMes: 11990 },
  { tipo: TipoPlanoAdesao.Anual, nome: "Anual", meses: 12, centavosPorMes: 7990, recomendado: true },
];

const PLANO_MENSAL = PLANOS[0];

const reais = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatarReais(centavos: number): string {
  // O Intl separa o símbolo do número com espaço sem quebra; normaliza para espaço comum.
  return reais.format(centavos / 100).replace(/ /g, " ");
}

export interface CondicoesPlano {
  totalCentavos: number;
  economiaCentavos: number;
  economiaPercentual: number;
}

export function calcularCondicoes(plano: Plano): CondicoesPlano {
  const totalCentavos = plano.centavosPorMes * plano.meses;
  const semDesconto = PLANO_MENSAL.centavosPorMes * plano.meses;
  const economiaCentavos = semDesconto - totalCentavos;

  return {
    totalCentavos,
    economiaCentavos,
    economiaPercentual: Math.round((economiaCentavos / semDesconto) * 100),
  };
}

export function descreverTotal(plano: Plano): string {
  if (plano.meses === 1) return "Cobrado todo mês";

  const { totalCentavos } = calcularCondicoes(plano);
  const total = formatarReais(totalCentavos);
  return plano.meses === 12 ? `${total} em uma cobrança única` : `${total} por ${plano.meses} meses`;
}

export function descreverEconomia(plano: Plano): string | undefined {
  const { economiaCentavos, economiaPercentual } = calcularCondicoes(plano);
  if (economiaCentavos <= 0) return undefined;
  return `Economia de ${formatarReais(economiaCentavos)} (${economiaPercentual}%)`;
}

export function buscarPlano(tipo: PlanoVendido): Plano {
  return PLANOS.find((plano) => plano.tipo === tipo) ?? PLANO_MENSAL;
}

// Só o texto exato "0" abre o teste grátis; os demais valores seguem a regra de lerPlanoDaUrl.
export function ehTesteGratisNaUrl(valor: string | null): boolean {
  return valor === "0";
}

export function descricaoDoTeste(): string {
  return "Teste grátis · 30 dias";
}

// Só os textos exatos "1" a "4" valem; qualquer outra coisa é ignorada, sem erro.
export function lerPlanoDaUrl(valor: string | null): PlanoVendido | undefined {
  if (valor === null || !/^[1-4]$/.test(valor)) return undefined;
  return Number(valor) as PlanoVendido;
}
