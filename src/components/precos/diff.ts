import { formatBRL, parseMoney } from "@/lib/money";
import {
  DIAS_SEMANA_PRECO,
  TIPO_REGRA_OPTIONS,
  type PrecoFaixaValues,
  type PrecoFormValues,
  type PrecoHorarioValues,
  type PrecoInfoValues,
  type TipoCategoria,
} from "@/types/preco";
import { formatDataHoraInput, formatMinutos, getCategoriaLabel } from "./format";

export interface InfoChange {
  campo: keyof PrecoInfoValues;
  rotulo: string;
  antes: string;
  depois: string;
}

export interface ListDiff {
  adicionadas: string[];
  removidas: string[];
}

export interface PrecoDiff {
  info: InfoChange[];
  horarios: ListDiff;
  faixas: ListDiff;
  categorias: ListDiff;
  hasChanges: boolean;
}

const INFO_LABELS: Record<keyof PrecoInfoValues, string> = {
  descricao: "Descrição",
  tipoRegra: "Tipo de regra",
  inicioVigencia: "Início da vigência",
  fimVigencia: "Fim da vigência",
  toleranciaEntradaMinutos: "Tolerância de entrada",
  toleranciaAlteracaoFaixaMinutos: "Tolerância de alteração de faixa",
  periodoDiaria: "Período da diária",
  valorDiaria: "Valor da diária",
  valorAdicionalDiaria: "Valor adicional da diária",
  ativo: "Situação",
};

const MONEY_FIELDS = new Set<keyof PrecoInfoValues>(["valorDiaria", "valorAdicionalDiaria"]);
const INTEGER_FIELDS = new Set<keyof PrecoInfoValues>([
  "toleranciaEntradaMinutos",
  "toleranciaAlteracaoFaixaMinutos",
  "periodoDiaria",
]);

// Valor comparável: "50" e "50,00" são o mesmo preço; espaços nas pontas não contam.
function comparable(campo: keyof PrecoInfoValues, value: PrecoInfoValues[keyof PrecoInfoValues]): string {
  if (typeof value === "boolean") {
    return String(value);
  }
  if (MONEY_FIELDS.has(campo)) {
    const parsed = parseMoney(value);
    return Number.isNaN(parsed) ? value.trim() : String(parsed);
  }
  if (INTEGER_FIELDS.has(campo)) {
    return /^\d+$/.test(value.trim()) ? String(Number(value)) : value.trim();
  }
  return value.trim();
}

function display(campo: keyof PrecoInfoValues, value: PrecoInfoValues[keyof PrecoInfoValues]): string {
  if (typeof value === "boolean") {
    return value ? "Ativo" : "Inativo";
  }
  const text = value.trim();
  switch (campo) {
    case "tipoRegra":
      return TIPO_REGRA_OPTIONS.find((option) => String(option.value) === text)?.label ?? (text || "—");
    case "inicioVigencia":
      return text ? formatDataHoraInput(text) : "—";
    case "fimVigencia":
      return text ? formatDataHoraInput(text) : "sem fim";
    case "valorDiaria":
    case "valorAdicionalDiaria": {
      const parsed = parseMoney(text);
      return Number.isNaN(parsed) ? text || "—" : formatBRL(parsed);
    }
    case "toleranciaEntradaMinutos":
    case "toleranciaAlteracaoFaixaMinutos":
    case "periodoDiaria":
      return /^\d+$/.test(text) ? formatMinutos(Number(text)) : text || "—";
    default:
      return text || "—";
  }
}

interface Row {
  key: string;
  label: string;
}

function horarioRow(horario: PrecoHorarioValues): Row {
  const dia = DIAS_SEMANA_PRECO.find((item) => String(item.codigo) === horario.diaSemana)?.label ?? "—";
  const periodo =
    horario.dataInicio || horario.dataFim
      ? ` (${horario.dataInicio || "…"} a ${horario.dataFim || "…"})`
      : "";
  return {
    key: JSON.stringify([
      horario.diaSemana,
      horario.horaInicio,
      horario.horaFim,
      horario.dataInicio,
      horario.dataFim,
      horario.ativo,
    ]),
    label: `${dia}: ${horario.horaInicio || "—"} às ${horario.horaFim || "—"}${periodo}${horario.ativo ? "" : " (inativo)"}`,
  };
}

function faixaRow(faixa: PrecoFaixaValues): Row {
  const minutos = /^\d+$/.test(faixa.minutosLimite.trim()) ? Number(faixa.minutosLimite) : null;
  const valor = parseMoney(faixa.valor);
  const percentual = faixa.percentualConveniada.trim() === "" ? null : parseMoney(faixa.percentualConveniada);
  return {
    key: JSON.stringify([minutos ?? faixa.minutosLimite.trim(), Number.isNaN(valor) ? faixa.valor.trim() : valor, percentual]),
    label: `Até ${minutos === null ? "—" : formatMinutos(minutos)}: ${Number.isNaN(valor) ? "—" : formatBRL(valor)}${
      percentual === null || Number.isNaN(percentual) ? "" : ` (${percentual}% conveniada)`
    }`,
  };
}

function categoriaRow(tipo: TipoCategoria): Row {
  return { key: String(tipo), label: getCategoriaLabel(tipo) };
}

// Sem ids estáveis nas linhas, a comparação é por multiconjunto: uma linha editada vale uma removida + uma adicionada.
function diffRows(original: Row[], current: Row[]): ListDiff {
  const remaining = new Map<string, number>();
  for (const row of original) {
    remaining.set(row.key, (remaining.get(row.key) ?? 0) + 1);
  }

  const adicionadas: string[] = [];
  for (const row of current) {
    const count = remaining.get(row.key) ?? 0;
    if (count > 0) {
      remaining.set(row.key, count - 1);
    } else {
      adicionadas.push(row.label);
    }
  }

  const removidas: string[] = [];
  for (const row of original) {
    const count = remaining.get(row.key) ?? 0;
    if (count > 0) {
      remaining.set(row.key, count - 1);
      removidas.push(row.label);
    }
  }

  return { adicionadas, removidas };
}

function isEmpty(diff: ListDiff): boolean {
  return diff.adicionadas.length === 0 && diff.removidas.length === 0;
}

export function diffPreco(original: PrecoFormValues, current: PrecoFormValues): PrecoDiff {
  const campos = Object.keys(INFO_LABELS) as (keyof PrecoInfoValues)[];
  const info: InfoChange[] = campos
    .filter((campo) => comparable(campo, original.info[campo]) !== comparable(campo, current.info[campo]))
    .map((campo) => ({
      campo,
      rotulo: INFO_LABELS[campo],
      antes: display(campo, original.info[campo]),
      depois: display(campo, current.info[campo]),
    }));

  const horarios = diffRows(original.horarios.map(horarioRow), current.horarios.map(horarioRow));
  const faixas = diffRows(original.faixas.map(faixaRow), current.faixas.map(faixaRow));
  const categorias = diffRows(original.categorias.map(categoriaRow), current.categorias.map(categoriaRow));

  return {
    info,
    horarios,
    faixas,
    categorias,
    hasChanges: info.length > 0 || !isEmpty(horarios) || !isEmpty(faixas) || !isEmpty(categorias),
  };
}

export function hasChanges(original: PrecoFormValues, current: PrecoFormValues): boolean {
  return diffPreco(original, current).hasChanges;
}
