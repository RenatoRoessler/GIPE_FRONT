// Leitura tolerante de campos de respostas da API: um campo ausente ou fora do formato vira `null` em vez de derrubar a tela.

export function toNumber(value: unknown): number | null {
  const number = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  return typeof number === "number" && Number.isFinite(number) ? number : null;
}

export function toText(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}
