import { PERIODO_DASHBOARD, type PeriodoDashboard } from "@/types/dashboard";
import { MESES, capitalizar, dataCurta, diaSemanaCurto } from "./format";

// Período da Visão Geral. Todas as funções recebem as datas por parâmetro (nunca `new Date()` aqui dentro) e trabalham em
// meia-noite local, para os testes serem determinísticos.
export const TIPOS_PERIODO = ["dia", "semana", "mes"] as const;
export type TipoPeriodo = (typeof TIPOS_PERIODO)[number];

export const TIPO_PERIODO_PADRAO: TipoPeriodo = "dia";

export const TIPO_PARA_API: Record<TipoPeriodo, PeriodoDashboard> = {
  dia: PERIODO_DASHBOARD.Dia,
  semana: PERIODO_DASHBOARD.Semana,
  mes: PERIODO_DASHBOARD.Mes,
};

export type LimitesDoPeriodo = { inicio: Date; fim: Date };

export function inicioDoDia(data: Date): Date {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

export function somarDias(data: Date, dias: number): Date {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate() + dias);
}

export function mesmoDia(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// Dia; semana de segunda a domingo; mês do primeiro ao último dia. Os dois extremos inclusos.
export function limitesDoPeriodo(tipo: TipoPeriodo, data: Date): LimitesDoPeriodo {
  const dia = inicioDoDia(data);
  if (tipo === "dia") return { inicio: dia, fim: dia };
  if (tipo === "semana") {
    const inicio = somarDias(dia, -((dia.getDay() + 6) % 7));
    return { inicio, fim: somarDias(inicio, 6) };
  }
  return { inicio: new Date(dia.getFullYear(), dia.getMonth(), 1), fim: new Date(dia.getFullYear(), dia.getMonth() + 1, 0) };
}

// Um dia, uma semana ou um mês para a frente (`passos` positivo) ou para trás. No mês parte do dia 1, para não pular
// meses curtos (31 de março menos um mês cairia em março de novo).
export function deslocar(tipo: TipoPeriodo, data: Date, passos: number): Date {
  const dia = inicioDoDia(data);
  if (tipo === "dia") return somarDias(dia, passos);
  if (tipo === "semana") return somarDias(dia, passos * 7);
  return new Date(dia.getFullYear(), dia.getMonth() + passos, 1);
}

// O período que contém hoje: a seta › fica desligada nele e "Voltar para hoje" some.
export function ehPeriodoAtual(tipo: TipoPeriodo, data: Date, hoje: Date): boolean {
  const { inicio, fim } = limitesDoPeriodo(tipo, data);
  const dia = inicioDoDia(hoje);
  return dia >= inicio && dia <= fim;
}

// A seta ‹ para no período que contém o início do uso. Empresa nova (sem início do uso) não tem para onde voltar.
export function podeVoltar(tipo: TipoPeriodo, data: Date, inicioUso: Date | null): boolean {
  if (!inicioUso) return false;
  const { fim } = limitesDoPeriodo(tipo, deslocar(tipo, data, -1));
  return fim >= inicioDoDia(inicioUso);
}

// "Hoje · 19 nov", "Ontem · 18 nov", "Qua · 11 nov", "Esta semana · 16 – 22 nov", "9 – 15 nov", "26 out – 1 nov" e
// "Outubro 2026". O ano só aparece no dia e na semana quando é diferente do de `hoje`; o mês sempre o traz.
export function rotuloDoPeriodo(tipo: TipoPeriodo, data: Date, hoje: Date): string {
  const { inicio, fim } = limitesDoPeriodo(tipo, data);
  if (tipo === "dia") {
    if (mesmoDia(inicio, hoje)) return `Hoje · ${dataCurta(inicio, hoje)}`;
    if (mesmoDia(somarDias(inicio, 1), hoje)) return `Ontem · ${dataCurta(inicio, hoje)}`;
    return `${capitalizar(diaSemanaCurto(inicio))} · ${dataCurta(inicio, hoje)}`;
  }
  if (tipo === "semana") {
    // Mesmo mês e mesmo ano: só o número do dia na ponta inicial ("16 – 22 nov").
    const mesmoMes = inicio.getMonth() === fim.getMonth() && inicio.getFullYear() === fim.getFullYear();
    const faixa = `${mesmoMes ? inicio.getDate() : dataCurta(inicio, hoje)} – ${dataCurta(fim, hoje)}`;
    return ehPeriodoAtual("semana", data, hoje) ? `Esta semana · ${faixa}` : faixa;
  }
  return `${capitalizar(MESES[inicio.getMonth()])} ${inicio.getFullYear()}`;
}
