export const ABAS = [
  { id: "mensalistas", label: "Mensalistas" },
  { id: "tipos", label: "Tipos de mensalidade" },
] as const;

export type AbaId = (typeof ABAS)[number]["id"];

// Valor ausente ou desconhecido na URL cai na aba de mensalistas.
export function parseAba(value: string | null): AbaId {
  return ABAS.some((aba) => aba.id === value) ? (value as AbaId) : "mensalistas";
}
