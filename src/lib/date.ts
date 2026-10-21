// A API devolve data/hora sem fuso (microssegundos incluídos); trata como horário local.
export function parseApiDate(iso: string | null | undefined): Date | null {
  if (!iso) {
    return null;
  }
  const date = new Date(iso.replace(/(\.\d{3})\d+/, "$1"));
  return Number.isNaN(date.getTime()) ? null : date;
}
