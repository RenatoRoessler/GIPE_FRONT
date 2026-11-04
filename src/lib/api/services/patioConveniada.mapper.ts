import type { VeiculoConveniada } from "@/types/patioConveniada";
import { toNumber, toText } from "./mapperUtils";

type Registro = Record<string, unknown>;

function texto(value: unknown): string {
  return toText(value)?.trim() ?? "";
}

function numero(value: unknown): number {
  return toNumber(value) ?? 0;
}

function fromItem(raw: unknown): VeiculoConveniada | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }
  const dto = raw as Registro;
  const patioConvenioId = toNumber(dto.patioConvenioId);
  if (patioConvenioId === null) {
    return null;
  }
  return {
    patioConvenioId,
    empresaId: numero(dto.empresaId),
    estacionamento: texto(dto.estacionamento),
    placa: texto(dto.placa),
    modelo: texto(dto.modelo),
    cor: texto(dto.cor),
    categoria: numero(dto.categoria),
    dataEntrada: texto(dto.dataEntrada),
    dataValidacao: texto(dto.dataValidacao),
    usuarioIdConveniada: numero(dto.usuarioIdConveniada),
    usuarioConveniada: texto(dto.usuarioConveniada),
    rotatividadeId: numero(dto.rotatividadeId),
    rotatividade: texto(dto.rotatividade),
    minutosPermanencia: numero(dto.minutosPermanencia),
    permanencia: texto(dto.permanencia),
  };
}

// Tolerante: resposta que não é lista vira lista vazia, e item sem identificador é descartado. A ordem do back é mantida.
export function fromPatioConveniadaResponse(raw: unknown): VeiculoConveniada[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.flatMap((item) => {
    const veiculo = fromItem(item);
    return veiculo ? [veiculo] : [];
  });
}
