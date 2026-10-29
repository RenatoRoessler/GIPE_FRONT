import type { Carimbo } from "@/types/carimbo";

type Registro = Record<string, unknown>;

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function num(value: unknown): number {
  return typeof value === "number" ? value : 0;
}

// Tolerante a campos ausentes: a tela mostra "—" no que não vier.
export function fromCarimboResponse(raw: unknown): Carimbo {
  const dto: Registro = typeof raw === "object" && raw !== null ? (raw as Registro) : {};

  return {
    estacionamento: text(dto.estacionamento),
    placa: text(dto.placa),
    modelo: text(dto.modelo),
    cor: text(dto.cor),
    categoria: num(dto.categoria),
    dataHoraEntrada: text(dto.dataHoraEntrada),
    rotatividadeId: num(dto.rotatividadeId),
    rotatividade: text(dto.rotatividade),
    dataHoraConveniada: text(dto.dataHoraConveniada),
  };
}
