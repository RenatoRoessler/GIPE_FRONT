import { DIAS_SEMANA_PRECO, type PrecoRegraView } from "@/types/preco";
import { formatDataIso, formatHora } from "./format";

export type TipoLinhaSemana = "sem_cobranca" | "dia_inteiro" | "intervalo";

export interface TrechoSemana {
  inicio: string | null;
  fim: string | null;
  // Frações do dia (0 a 1) para o trilho de 24 h.
  de: number;
  ate: number;
  inativo: boolean;
  periodo?: string;
}

export interface LinhaSemana {
  dia: { codigo: number; label: string };
  tipo: TipoLinhaSemana;
  trechos: TrechoSemana[];
  // Todas as regras do dia estão desativadas.
  inativa: boolean;
  // Texto equivalente ao trilho: "06:00–22:00", "Dia inteiro" ou "Sem cobrança".
  texto: string;
}

const MINUTOS_NO_DIA = 24 * 60;

// "06:30:00" -> 390; "24:00" -> 1440; inválido -> null.
function paraMinutos(value: string | null): number | null {
  const match = value === null ? null : /^(\d{1,2}):(\d{2})/.exec(value);
  if (!match) {
    return null;
  }
  return Math.min(Number(match[1]) * 60 + Number(match[2]), MINUTOS_NO_DIA);
}

// "de 01/12/2025 a 31/01/2026", "a partir de 01/12/2025" ou "até 31/01/2026".
function descreverPeriodo(inicio: string | null, fim: string | null): string | undefined {
  if (inicio && fim) {
    return `de ${formatDataIso(inicio)} a ${formatDataIso(fim)}`;
  }
  if (inicio) {
    return `a partir de ${formatDataIso(inicio)}`;
  }
  if (fim) {
    return `até ${formatDataIso(fim)}`;
  }
  return undefined;
}

function criarTrecho(regra: PrecoRegraView): TrechoSemana {
  const inicio = paraMinutos(regra.horaInicio);
  const fim = paraMinutos(regra.horaFim);
  // Horário nulo = cobrança o dia inteiro (premissa do PRD).
  const diaInteiro = inicio === null || fim === null;
  const de = diaInteiro ? 0 : inicio / MINUTOS_NO_DIA;
  const ate = diaInteiro ? 1 : Math.max(fim / MINUTOS_NO_DIA, de);

  return {
    inicio: diaInteiro ? null : formatHora(regra.horaInicio),
    fim: diaInteiro ? null : formatHora(regra.horaFim),
    de,
    ate,
    inativo: !regra.ativo,
    periodo: descreverPeriodo(regra.dataInicio, regra.dataFim),
  };
}

function textoDoTrecho(trecho: TrechoSemana): string {
  return trecho.inicio === null ? "Dia inteiro" : `${trecho.inicio}–${trecho.fim}`;
}

// Sempre 7 linhas, de domingo a sábado, na ordem de DIAS_SEMANA_PRECO.
export function montarSemana(regras: PrecoRegraView[]): LinhaSemana[] {
  return DIAS_SEMANA_PRECO.map((dia) => {
    const trechos = regras
      .filter((regra) => regra.diaSemana === dia.codigo)
      .map(criarTrecho)
      .sort((a, b) => a.de - b.de);

    if (trechos.length === 0) {
      return { dia: { codigo: dia.codigo, label: dia.label }, tipo: "sem_cobranca", trechos: [], inativa: false, texto: "Sem cobrança" };
    }

    const diaInteiro = trechos.every((trecho) => trecho.inicio === null);
    return {
      dia: { codigo: dia.codigo, label: dia.label },
      tipo: diaInteiro ? "dia_inteiro" : "intervalo",
      trechos,
      inativa: trechos.every((trecho) => trecho.inativo),
      texto: trechos.map(textoDoTrecho).join(", "),
    };
  });
}
