const DATA = /^\d{4}-\d{2}-\d{2}$/;

export type HistoricoUrl = { de: string; ate: string; pagina: number };

// Data inválida na URL vira "sem limite", em vez de chegar à API.
export function lerData(valor: string | null): string {
  return valor !== null && DATA.test(valor) ? valor : "";
}

export function lerPagina(valor: string | null): number {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero >= 1 ? numero : 1;
}

// Endereço do histórico: o que está vazio ou é padrão (página 1) não vai na URL.
export function historicoUrl({ de, ate, pagina }: HistoricoUrl): string {
  const params = new URLSearchParams();
  if (de) params.set("de", de);
  if (ate) params.set("ate", ate);
  if (pagina > 1) params.set("pagina", String(pagina));
  const consulta = params.toString();
  return consulta ? `/caixa/historico?${consulta}` : "/caixa/historico";
}
