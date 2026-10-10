// Aceita "15", "15,5", "15.50" e "1.234,56"; devolve NaN para texto inválido ou vazio.
export function parseMoney(value: string): number {
  const text = value.trim().replace(/^R\$\s*/, "");
  if (text === "") {
    return Number.NaN;
  }
  const normalized = text.includes(",") ? text.replace(/\./g, "").replace(",", ".") : text;
  return /^\d+(\.\d+)?$/.test(normalized) ? Number(normalized) : Number.NaN;
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatBRL(value: number): string {
  return brl.format(value).replace(/ /g, " ");
}
