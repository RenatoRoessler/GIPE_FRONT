export const ABAS = [
  { id: "movimentos", label: "Movimentos" },
  { id: "linha-do-tempo", label: "Linha do tempo" },
  { id: "graficos", label: "Gráficos" },
] as const;

export type AbaId = (typeof ABAS)[number]["id"];

// Movimentos é a aba padrão: qualquer valor desconhecido na URL cai nela.
export function parseAba(value: string | null): AbaId {
  return ABAS.some((aba) => aba.id === value) ? (value as AbaId) : "movimentos";
}

// Endereço de cada aba: a padrão fica sem parâmetro.
export function abaUrl(aba: AbaId): string {
  return aba === "movimentos" ? "/caixa" : `/caixa?aba=${aba}`;
}
