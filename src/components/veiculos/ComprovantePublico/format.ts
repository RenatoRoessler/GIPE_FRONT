// Usa os minutos (número) em vez da string da API para controlar o formato: "1h 05min".
export function formatPermanencia(minutos: number): string {
  const total = Number.isFinite(minutos) && minutos > 0 ? Math.floor(minutos) : 0;
  const horas = Math.floor(total / 60);
  const resto = String(total % 60).padStart(2, "0");
  return `${horas}h ${resto}min`;
}
