export const ABAS = [
  { id: "pendentes", label: "Pendentes" },
  { id: "lancadas", label: "Lançadas" },
] as const;

export type AbaId = (typeof ABAS)[number]["id"];

// As pendentes são a aba padrão: qualquer valor desconhecido na URL cai nela.
export function parseAba(value: string | null): AbaId {
  return ABAS.some((aba) => aba.id === value) ? (value as AbaId) : "pendentes";
}

// Endereço de cada aba: a padrão fica sem parâmetro.
export function abaUrl(aba: AbaId): string {
  return aba === "pendentes" ? "/notas-fiscais" : `/notas-fiscais?aba=${aba}`;
}
