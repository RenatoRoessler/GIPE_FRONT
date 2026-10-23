import type { Movimento, TipoMovimento, Turno } from "@/types/caixa";
import { formatTime } from "./format";

export type FiltroTipo = "todos" | TipoMovimento;

export type FiltroMovimentos = {
  tipo: FiltroTipo;
  // null = todos os turnos.
  turnoId: number | null;
};

export const FILTRO_PADRAO: FiltroMovimentos = { tipo: "todos", turnoId: null };

export const FILTROS_TIPO: { id: FiltroTipo; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "entrada", label: "Entradas" },
  { id: "saida", label: "Saídas" },
  { id: "sangria", label: "Sangrias" },
];

export function filtrarMovimentos(movimentos: Movimento[], filtro: FiltroMovimentos): Movimento[] {
  return movimentos.filter(
    (movimento) =>
      (filtro.tipo === "todos" || movimento.tipo === filtro.tipo) &&
      (filtro.turnoId === null || movimento.turnoId === filtro.turnoId),
  );
}

export function filtroAtivo(filtro: FiltroMovimentos): boolean {
  return filtro.tipo !== "todos" || filtro.turnoId !== null;
}

export function contarPorTipo(movimentos: Movimento[]): Record<FiltroTipo, number> {
  const contagem: Record<FiltroTipo, number> = { todos: movimentos.length, entrada: 0, saida: 0, sangria: 0 };
  for (const movimento of movimentos) {
    contagem[movimento.tipo] += 1;
  }
  return contagem;
}

export type PaginaLocal<T> = {
  itens: T[];
  page: number;
  totalPages: number;
  totalRecords: number;
  pageSize: number;
};

// A lista vem completa da API: a paginação é feita aqui. Página fora do intervalo é ajustada à última válida.
export function paginar<T>(lista: T[], page: number, pageSize: number): PaginaLocal<T> {
  const totalPages = Math.max(1, Math.ceil(lista.length / pageSize));
  const atual = Math.min(Math.max(1, page), totalPages);
  const inicio = (atual - 1) * pageSize;
  return { itens: lista.slice(inicio, inicio + pageSize), page: atual, totalPages, totalRecords: lista.length, pageSize };
}

// O mínimo que o filtro precisa saber de um turno (o caixa fechado não tem lista de turnos na API).
export type TurnoRef = Pick<Turno, "turnoId" | "usuario" | "dataHoraInicio">;

// "Maria · 08:00": identifica o turno no seletor de filtro.
export function rotuloTurno(turno: TurnoRef): string {
  return `${turno.usuario} · ${formatTime(turno.dataHoraInicio)}`;
}

export function opcoesDeTurno(turnos: TurnoRef[]): { value: number; label: string }[] {
  return turnos.map((turno) => ({ value: turno.turnoId, label: rotuloTurno(turno) }));
}

// Turnos que aparecem nos movimentos, do mais antigo ao mais recente; o início é o primeiro movimento do turno.
export function turnosDosMovimentos(movimentos: Movimento[]): TurnoRef[] {
  const porTurno = new Map<number, TurnoRef>();
  for (const movimento of movimentos) {
    if (movimento.turnoId === null) {
      continue;
    }
    const atual = porTurno.get(movimento.turnoId);
    if (!atual || movimento.dataHora < atual.dataHoraInicio) {
      porTurno.set(movimento.turnoId, { turnoId: movimento.turnoId, usuario: movimento.usuario, dataHoraInicio: movimento.dataHora });
    }
  }
  return [...porTurno.values()].sort((a, b) => (a.dataHoraInicio < b.dataHoraInicio ? -1 : a.dataHoraInicio > b.dataHoraInicio ? 1 : a.turnoId - b.turnoId));
}
