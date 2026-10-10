import { formatBRL } from "@/lib/money";
import {
  DIAS_SEMANA_PRECO,
  TIPO_CATEGORIA_OPTIONS,
  TIPO_REGRA_OPTIONS,
  type TipoCategoria,
  type TipoRegra,
} from "@/types/preco";

export { formatBRL };

// 90 -> "1 h 30 min"; 30 -> "30 min"; 120 -> "2 h".
export function formatMinutos(minutos: number): string {
  if (!Number.isFinite(minutos) || minutos < 0) {
    return "—";
  }
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (horas === 0) {
    return `${resto} min`;
  }
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
}

// "2026-06-06T17:00:52.474" -> "06/06/2026". Opera sobre a string: a API não envia fuso e Date deslocaria o dia.
export function formatDataIso(value: string | null): string {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : "—";
}

// "2026-10-15T08:30" -> "15/10/2026 08:30" (formato do datetime-local).
export function formatDataHoraInput(value: string): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  return match ? `${match[3]}/${match[2]}/${match[1]} ${match[4]}:${match[5]}` : "—";
}

export function formatVigencia(inicio: string, fim: string | null): string {
  return `${formatDataIso(inicio)} → ${fim ? formatDataIso(fim) : "sem fim"}`;
}

export function formatHora(value: string | null): string {
  return value ? value.slice(0, 5) : "";
}

export function getTipoRegraLabel(tipo: TipoRegra | null): string {
  return TIPO_REGRA_OPTIONS.find((option) => option.value === tipo)?.label ?? "—";
}

export function getCategoriaLabel(tipo: TipoCategoria): string {
  return TIPO_CATEGORIA_OPTIONS.find((option) => option.value === tipo)?.label ?? "—";
}

export function getDiaSemanaLabel(codigo: number): string {
  return DIAS_SEMANA_PRECO.find((dia) => dia.codigo === codigo)?.label ?? "—";
}
