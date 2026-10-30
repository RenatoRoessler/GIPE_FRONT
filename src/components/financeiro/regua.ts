import { AGRUPAMENTO_FLUXO, type AgrupamentoFluxo, type FluxoPeriodo } from "@/types/financeiro";
import { rotuloMes } from "./format";

// Acima disso, por dia, as colunas ficam finas demais: a tela oferece ver por mês.
export const LIMITE_PERIODO_LONGO = 92;

// Até esta quantidade de pontos a régua cabe na largura do celular; acima, ela rola na horizontal.
export const PONTOS_SEM_ROLAGEM = 31;

export type Escala = { min: number; max: number };

// A escala sempre inclui o zero: as entradas sobem a partir dele, as saídas descem, e o acumulado cruza a linha quando fica negativo.
export function escala(periodos: FluxoPeriodo[]): Escala {
  let min = 0;
  let max = 0;
  for (const periodo of periodos) {
    max = Math.max(max, periodo.entradas, periodo.saldoAcumulado);
    min = Math.min(min, 0 - periodo.saidas, periodo.saldoAcumulado);
  }
  return { min, max };
}

// Posição vertical em % a partir do topo da régua (0 = topo). Sem variação nenhuma, o zero fica no meio.
export function posicaoY(valor: number, { min, max }: Escala): number {
  const amplitude = max - min;
  return amplitude === 0 ? 50 : ((max - valor) / amplitude) * 100;
}

// Tamanho de uma haste (entradas ou saídas) em % da altura da régua.
export function alturaHaste(valor: number, { min, max }: Escala): number {
  const amplitude = max - min;
  return amplitude === 0 ? 0 : (Math.abs(valor) / amplitude) * 100;
}

export type Ponto = { x: number; y: number };

// Um ponto por coluna, no centro dela (x em % da largura), com o saldo acumulado na altura.
export function pontosAcumulado(periodos: FluxoPeriodo[], referencia: Escala): Ponto[] {
  return periodos.map((periodo, indice) => ({
    x: ((indice + 0.5) / periodos.length) * 100,
    y: posicaoY(periodo.saldoAcumulado, referencia),
  }));
}

// Texto para o atributo `points` de uma polyline em viewBox de 0 a 100.
export function pontosParaSvg(pontos: Ponto[]): string {
  return pontos.map((ponto) => `${ponto.x.toFixed(2)},${ponto.y.toFixed(2)}`).join(" ");
}

export type MarcaEixo = { indice: number; rotulo: string };

const diaDoMes = (data: string) => Number(data.slice(8, 10));

// Por dia, até 31 pontos: o dia 1 e os múltiplos de 5. Por dia, em períodos longos: o dia 1 de cada mês.
// Por mês: todos os meses.
export function marcasEixoX(periodos: FluxoPeriodo[], agrupamento: AgrupamentoFluxo): MarcaEixo[] {
  if (agrupamento === AGRUPAMENTO_FLUXO.Mes) {
    return periodos.map((periodo, indice) => ({ indice, rotulo: rotuloMes(periodo.data) }));
  }
  if (periodos.length <= PONTOS_SEM_ROLAGEM) {
    return periodos.flatMap((periodo, indice) => {
      const dia = diaDoMes(periodo.data);
      return dia === 1 || dia % 5 === 0 ? [{ indice, rotulo: String(dia).padStart(2, "0") }] : [];
    });
  }
  return periodos.flatMap((periodo, indice) => {
    if (diaDoMes(periodo.data) !== 1) {
      return [];
    }
    const [abreviado, ano] = rotuloMes(periodo.data).split("/");
    // O ano só aparece no começo e em janeiro, onde ele muda.
    return [{ indice, rotulo: indice === 0 || periodo.data.slice(5, 7) === "01" ? `${abreviado}/${ano}` : abreviado }];
  });
}

export type MarcaValor = { valor: number; posicao: number };

// Máximo, zero e, quando há saldo negativo, o mínimo.
export function marcasEixoY(referencia: Escala): MarcaValor[] {
  const valores = [...(referencia.max > 0 ? [referencia.max] : []), 0, ...(referencia.min < 0 ? [referencia.min] : [])];
  return valores.map((valor) => ({ valor, posicao: posicaoY(valor, referencia) }));
}

const compacto = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });

// "R$ 75 mil", "R$ 1,5 mi"; abaixo de mil, o valor inteiro. O negativo leva o sinal "−".
export function abreviar(valor: number): string {
  const texto = `R$ ${compacto.format(Math.abs(valor)).replace(/ /g, " ")}`;
  return valor < 0 ? `− ${texto}` : texto;
}

// O dia ou mês de maior entrada, para o resumo lido por leitores de tela. Null quando não houve entrada.
export function maiorEntrada(periodos: FluxoPeriodo[]): FluxoPeriodo | null {
  return periodos.reduce<FluxoPeriodo | null>((maior, periodo) => (periodo.entradas > 0 && (maior === null || periodo.entradas > maior.entradas) ? periodo : maior), null);
}

export function temMovimento(periodos: FluxoPeriodo[]): boolean {
  return periodos.some((periodo) => periodo.entradas !== 0 || periodo.saidas !== 0);
}
