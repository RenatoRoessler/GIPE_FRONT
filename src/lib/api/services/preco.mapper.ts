import { parseMoney } from "@/lib/money";
import {
  TIPO_CATEGORIA_OPTIONS,
  TIPO_REGRA_OPTIONS,
  type PrecoFaixaView,
  type PrecoFormValues,
  type PrecoRegraView,
  type PrecoView,
  type SituacaoPreco,
  type TipoCategoria,
  type TipoRegra,
} from "@/types/preco";

interface RegraDto {
  diaSemana: number;
  horaInicio: string | null;
  horaFim: string | null;
  dataInicio: string | null;
  dataFim: string | null;
  ativo: boolean;
}

interface FaixaDto {
  minutosLimite: number;
  valor: number;
  percentualConveniada: number | null;
}

export interface PrecoDto {
  rotatividadeId: number;
  empresaConveniadaId: number | null;
  descricao: string;
  tipoRegra: number;
  inicioVigencia: string;
  fimVigencia: string | null;
  toleranciaEntradaMinutos: number;
  toleranciaAlteracaoFaixaMinutos: number;
  periodoDiaria: number;
  valorDiaria: number;
  valorAdicionalDiaria: number;
  ativo: boolean;
  regras: RegraDto[];
  faixaValores: FaixaDto[];
  categorias: { tipoCategoria: number }[];
}

export interface PrecoPayload {
  rotatividade: {
    empresaConveniadaId: null;
    descricao: string;
    inicioVigencia: string | null;
    fimVigencia: string | null;
    toleranciaEntradaMinutos: number;
    toleranciaAlteracaoFaixaMinutos: number;
    periodoDiaria: number;
    valorDiaria: number;
    valorAdicionalDiaria: number;
    tipoRegra: number;
    ativo: boolean;
  };
  regras: RegraDto[];
  faixaValores: FaixaDto[];
  categorias: { tipoCategoria: number }[];
}

const TIPOS_REGRA = new Set<number>(TIPO_REGRA_OPTIONS.map((option) => option.value));
const TIPOS_CATEGORIA = new Set<number>(TIPO_CATEGORIA_OPTIONS.map((option) => option.value));

export function fromPrecoResponse(dto: Partial<PrecoDto>): PrecoView {
  const regras: PrecoRegraView[] = (dto.regras ?? [])
    .map((regra) => ({
      diaSemana: regra.diaSemana,
      horaInicio: regra.horaInicio ?? null,
      horaFim: regra.horaFim ?? null,
      dataInicio: regra.dataInicio ?? null,
      dataFim: regra.dataFim ?? null,
      ativo: regra.ativo ?? true,
    }))
    .sort((a, b) => a.diaSemana - b.diaSemana);

  const faixas: PrecoFaixaView[] = (dto.faixaValores ?? [])
    .map((faixa) => ({
      minutosLimite: faixa.minutosLimite,
      valor: faixa.valor,
      percentualConveniada: faixa.percentualConveniada || null,
    }))
    .sort((a, b) => a.minutosLimite - b.minutosLimite);

  const categorias = (dto.categorias ?? [])
    .map((categoria) => categoria.tipoCategoria)
    .filter((tipo): tipo is TipoCategoria => TIPOS_CATEGORIA.has(tipo));

  const tipoRegra =
    dto.tipoRegra !== undefined && TIPOS_REGRA.has(dto.tipoRegra) ? (dto.tipoRegra as TipoRegra) : null;

  return {
    rotatividadeId: dto.rotatividadeId ?? 0,
    empresaConveniadaId: dto.empresaConveniadaId ?? null,
    descricao: dto.descricao ?? "",
    tipoRegra,
    inicioVigencia: dto.inicioVigencia ?? "",
    fimVigencia: dto.fimVigencia ?? null,
    toleranciaEntradaMinutos: dto.toleranciaEntradaMinutos ?? 0,
    toleranciaAlteracaoFaixaMinutos: dto.toleranciaAlteracaoFaixaMinutos ?? 0,
    periodoDiaria: dto.periodoDiaria ?? 0,
    valorDiaria: dto.valorDiaria ?? 0,
    valorAdicionalDiaria: dto.valorAdicionalDiaria ?? 0,
    ativo: dto.ativo ?? false,
    regras,
    faixas,
    categorias,
  };
}

// As datas da API não têm fuso: comparar como texto "YYYY-MM-DDTHH:mm:ss" evita deslocamento por fuso.
function toLocalIso(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function getSituacao(
  ativo: boolean,
  inicioVigencia: string,
  fimVigencia: string | null,
  agora: Date,
): SituacaoPreco {
  if (!ativo) {
    return "inativa";
  }
  const now = toLocalIso(agora);
  if (inicioVigencia && inicioVigencia.slice(0, 19) > now) {
    return "agendada";
  }
  if (fimVigencia && fimVigencia.slice(0, 19) < now) {
    return "encerrada";
  }
  return "vigente";
}

// "2026-10-15T00:00" -> "2026-10-15T00:00:00"; vazio -> null.
function toDateTime(value: string): string | null {
  const text = value.trim();
  if (text === "") {
    return null;
  }
  return text.length === 16 ? `${text}:00` : text;
}

function toTime(value: string): string | null {
  const text = value.trim();
  if (text === "") {
    return null;
  }
  return text.length === 5 ? `${text}:00` : text;
}

function toDate(value: string): string | null {
  const text = value.trim();
  return text === "" ? null : text;
}

export function toPrecoPayload(values: PrecoFormValues): PrecoPayload {
  const { info } = values;

  return {
    rotatividade: {
      empresaConveniadaId: null,
      descricao: info.descricao.trim(),
      inicioVigencia: toDateTime(info.inicioVigencia),
      fimVigencia: toDateTime(info.fimVigencia),
      toleranciaEntradaMinutos: Number(info.toleranciaEntradaMinutos),
      toleranciaAlteracaoFaixaMinutos: Number(info.toleranciaAlteracaoFaixaMinutos),
      periodoDiaria: Number(info.periodoDiaria),
      valorDiaria: parseMoney(info.valorDiaria),
      valorAdicionalDiaria: parseMoney(info.valorAdicionalDiaria),
      tipoRegra: Number(info.tipoRegra),
      ativo: info.ativo,
    },
    regras: values.horarios.map((horario) => ({
      diaSemana: Number(horario.diaSemana),
      horaInicio: toTime(horario.horaInicio),
      horaFim: toTime(horario.horaFim),
      dataInicio: toDate(horario.dataInicio),
      dataFim: toDate(horario.dataFim),
      ativo: horario.ativo,
    })),
    faixaValores: values.faixas.map((faixa) => ({
      minutosLimite: Number(faixa.minutosLimite),
      valor: parseMoney(faixa.valor),
      percentualConveniada:
        faixa.percentualConveniada.trim() === "" ? null : parseMoney(faixa.percentualConveniada),
    })),
    categorias: values.categorias.map((tipoCategoria) => ({ tipoCategoria })),
  };
}

function numberToText(value: number): string {
  return String(value).replace(".", ",");
}

// "2026-06-06T17:00:52.474" -> "2026-06-06T17:00" (formato do datetime-local).
function toInputDateTime(value: string | null): string {
  return value ? value.slice(0, 16) : "";
}

export function toPrecoFormValues(view: PrecoView): PrecoFormValues {
  return {
    info: {
      descricao: view.descricao,
      tipoRegra: String(view.tipoRegra ?? 1),
      inicioVigencia: toInputDateTime(view.inicioVigencia),
      fimVigencia: toInputDateTime(view.fimVigencia),
      toleranciaEntradaMinutos: String(view.toleranciaEntradaMinutos),
      toleranciaAlteracaoFaixaMinutos: String(view.toleranciaAlteracaoFaixaMinutos),
      periodoDiaria: String(view.periodoDiaria),
      valorDiaria: numberToText(view.valorDiaria),
      valorAdicionalDiaria: numberToText(view.valorAdicionalDiaria),
      ativo: view.ativo,
    },
    horarios: view.regras.map((regra) => ({
      diaSemana: String(regra.diaSemana),
      horaInicio: regra.horaInicio?.slice(0, 5) ?? "",
      horaFim: regra.horaFim?.slice(0, 5) ?? "",
      dataInicio: regra.dataInicio?.slice(0, 10) ?? "",
      dataFim: regra.dataFim?.slice(0, 10) ?? "",
      ativo: regra.ativo,
    })),
    faixas: view.faixas.map((faixa) => ({
      minutosLimite: String(faixa.minutosLimite),
      valor: numberToText(faixa.valor),
      percentualConveniada:
        faixa.percentualConveniada === null ? "" : numberToText(faixa.percentualConveniada),
    })),
    categorias: view.categorias,
  };
}
