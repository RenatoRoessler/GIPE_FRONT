export const ABAS = [
  { id: "agenda", label: "Agenda" },
  { id: "lista", label: "Lista" },
  { id: "tipos", label: "Tipos de mensalidade" },
] as const;

export type AbaId = (typeof ABAS)[number]["id"];

export const LISTA_URL = "/mensalistas?aba=lista";

// A agenda é a aba padrão. Endereços antigos com `?pagina=N` e sem `aba` eram da lista, então continuam abrindo a lista.
export function parseAba(value: string | null, { temPagina = false }: { temPagina?: boolean } = {}): AbaId {
  if (ABAS.some((aba) => aba.id === value)) {
    return value as AbaId;
  }
  return temPagina ? "lista" : "agenda";
}

// Endereço de cada aba: a agenda, por ser a padrão, fica sem parâmetro.
export function abaUrl(aba: AbaId): string {
  return aba === "agenda" ? "/mensalistas" : `/mensalistas?aba=${aba}`;
}
