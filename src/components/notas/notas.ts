import type { NotaFiscal } from "@/types/notaFiscal";

export type TipoLista = "pendentes" | "lancadas";

// Datas ISO sem fuso se comparam como texto; sem data, a nota vai para o fim.
function porData(a: string | null, b: string | null, sentido: 1 | -1): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a < b ? -sentido : sentido;
}

// Pendentes: as que esperam há mais tempo primeiro.
export function ordenarPendentes(notas: NotaFiscal[]): NotaFiscal[] {
  return [...notas].sort((a, b) => porData(a.dataSolicitacao, b.dataSolicitacao, 1));
}

// Lançadas: as mais recentes primeiro (pela data do lançamento, ou da solicitação quando ela falta).
export function ordenarLancadas(notas: NotaFiscal[]): NotaFiscal[] {
  return [...notas].sort((a, b) => porData(a.dataLancamento ?? a.dataSolicitacao, b.dataLancamento ?? b.dataSolicitacao, -1));
}

export function ordenarNotas(notas: NotaFiscal[], tipo: TipoLista): NotaFiscal[] {
  return tipo === "pendentes" ? ordenarPendentes(notas) : ordenarLancadas(notas);
}

// Quantidade e total em reais (notas sem valor entram na contagem, não na soma), em centavos para não somar ponto flutuante.
export function resumirNotas(notas: NotaFiscal[]): { quantidade: number; total: number } {
  const centavos = notas.reduce((soma, nota) => soma + Math.round((nota.valor ?? 0) * 100), 0);
  return { quantidade: notas.length, total: centavos / 100 };
}

export type Colunas = {
  cliente: boolean;
  placa: boolean;
  valor: boolean;
  lancamento: boolean;
};

// O contrato das listas ainda não foi confirmado: só aparecem as colunas para as quais algum registro tem dado.
export function colunasVisiveis(notas: NotaFiscal[], tipo: TipoLista): Colunas {
  return {
    cliente: notas.some((nota) => nota.email !== null || nota.documento !== null),
    placa: notas.some((nota) => nota.placa !== null),
    valor: notas.some((nota) => nota.valor !== null),
    lancamento: tipo === "lancadas" && notas.some((nota) => nota.dataLancamento !== null),
  };
}

export function textoResumo({ quantidade }: { quantidade: number }, tipo: TipoLista): string {
  const nota = quantidade === 1 ? "nota" : "notas";
  if (tipo === "pendentes") {
    return `${quantidade} ${nota} ${quantidade === 1 ? "pendente" : "pendentes"}`;
  }
  return `${quantidade} ${nota} ${quantidade === 1 ? "lançada" : "lançadas"} no período`;
}
