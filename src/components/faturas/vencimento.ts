import { formatDataBr, formatDiaMes } from "@/components/financeiro/format";
import { SITUACAO_FATURA, type Fatura } from "@/types/fatura";

// Até quantos dias antes do vencimento a fatura aberta ganha ênfase na lista e no detalhe.
export const LIMITE_PERTO_DE_VENCER_DIAS = 3;

// Prazos oferecidos como atalho no modal de emissão.
export const ATALHOS_VENCIMENTO_DIAS = [7, 15, 30] as const;

const MS_POR_DIA = 24 * 60 * 60 * 1000;

// "2026-11-08" vira o instante UTC da meia-noite desse dia; sem horário de verão no meio da conta.
function diaUtc(data: string): number {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data);
  return partes ? Date.UTC(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3])) : Number.NaN;
}

// Dias de hoje até o vencimento (negativo = já passou). Datas inválidas dão NaN.
export function diasParaVencer(vencimento: string, hoje: string): number {
  return Math.round((diaUtc(vencimento) - diaUtc(hoje)) / MS_POR_DIA);
}

export type AvisoVencimento = {
  // vencida e hoje pedem atenção (perigo); proxima ganha ênfase; futura é neutra.
  tipo: "vencida" | "hoje" | "proxima" | "futura";
  texto: string;
};

function plural(dias: number): string {
  return dias === 1 ? "1 dia" : `${dias} dias`;
}

// Só fatura aberta recebe aviso: paga e cancelada devolvem null, o vencimento deixou de importar.
export function avisoVencimento(fatura: Pick<Fatura, "situacao" | "vencimento">, hoje: string): AvisoVencimento | null {
  if (fatura.situacao !== SITUACAO_FATURA.Aberta) {
    return null;
  }
  const dias = diasParaVencer(fatura.vencimento, hoje);
  if (Number.isNaN(dias)) {
    return null;
  }
  if (dias < -1) {
    return { tipo: "vencida", texto: `Vencida há ${plural(-dias)}` };
  }
  if (dias === -1) {
    return { tipo: "vencida", texto: "Vencida ontem" };
  }
  if (dias === 0) {
    return { tipo: "hoje", texto: "Vence hoje" };
  }
  if (dias <= LIMITE_PERTO_DE_VENCER_DIAS) {
    const quando = dias === 1 ? "Vence amanhã" : `Vence em ${plural(dias)}`;
    return { tipo: "proxima", texto: `${quando} · ${formatDiaMes(fatura.vencimento)}` };
  }
  return { tipo: "futura", texto: `Vence em ${formatDataBr(fatura.vencimento)}` };
}

// Hoje mais N dias, como AAAA-MM-DD.
export function vencimentoEm(hoje: string, dias: number): string {
  return new Date(diaUtc(hoje) + dias * MS_POR_DIA).toISOString().slice(0, 10);
}

// Qual atalho ("7", "15", "30") o vencimento digitado representa; "" quando nenhum.
export function atalhoSelecionado(vencimento: string, hoje: string): string {
  const dias = ATALHOS_VENCIMENTO_DIAS.find((atalho) => vencimentoEm(hoje, atalho) === vencimento);
  return dias === undefined ? "" : String(dias);
}
