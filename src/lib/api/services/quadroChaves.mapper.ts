import type { ChaveEscolhida, LinhaQuadro, PosicaoQuadro, QuadroChaves } from "@/types/quadroChaves";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toNumber(value: unknown): number | null {
  const number = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  return typeof number === "number" && Number.isFinite(number) ? number : null;
}

function toText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function fromPosicao(raw: unknown): PosicaoQuadro | null {
  if (!isRecord(raw)) return null;
  const patioQuadroChaveId = toNumber(raw.patioQuadroChaveId);
  const coluna = toNumber(raw.coluna);
  if (patioQuadroChaveId === null || coluna === null) return null;
  return { patioQuadroChaveId, coluna, disponivel: raw.disponivel !== false };
}

function fromLinha(raw: unknown): LinhaQuadro | null {
  if (!isRecord(raw)) return null;
  const colunas = Array.isArray(raw.colunas)
    ? raw.colunas.map(fromPosicao).filter((posicao): posicao is PosicaoQuadro => posicao !== null)
    : [];
  return { linha: toText(raw.linha), colunas };
}

// Tolerante: um campo ausente ou fora do formato não derruba a tela. Quadro sem id é descartado.
export function fromQuadroResponse(raw: unknown): QuadroChaves | null {
  if (!isRecord(raw)) return null;
  const patioQuadroId = toNumber(raw.patioQuadroId);
  if (patioQuadroId === null) return null;
  const linhas = Array.isArray(raw.linhas)
    ? raw.linhas.map(fromLinha).filter((linha): linha is LinhaQuadro => linha !== null)
    : [];
  return { patioQuadroId, nome: toText(raw.nome), linhas };
}

export function fromQuadrosResponse(raw: unknown): QuadroChaves[] {
  return Array.isArray(raw)
    ? raw.map(fromQuadroResponse).filter((quadro): quadro is QuadroChaves => quadro !== null)
    : [];
}

export function fromChaveEscolhidaResponse(raw: unknown): ChaveEscolhida {
  const data = isRecord(raw) ? raw : {};
  return {
    patioId: toNumber(data.patioId) ?? 0,
    placa: toText(data.placa),
    patioQuadroId: toNumber(data.patioQuadroId) ?? 0,
    quadro: toText(data.quadro),
    patioQuadroChaveId: toNumber(data.patioQuadroChaveId) ?? 0,
    linha: toText(data.linha),
    coluna: toNumber(data.coluna) ?? 0,
  };
}
