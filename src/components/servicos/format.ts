import { formatBRL } from "@/lib/money";
import { formatMinutos } from "@/components/precos/format";

// 4010 -> "R$ 40,10". Os valores do módulo ficam em centavos até aqui.
export function formatCentavos(centavos: number): string {
  return formatBRL(centavos / 100);
}

// 45 -> "45 min"; 90 -> "90 min · 1 h 30 min". Sem valor, "—".
export function formatDuracao(minutos: number | null): string {
  if (minutos === null) return "—";
  return minutos < 60 ? formatMinutos(minutos) : `${minutos} min · ${formatMinutos(minutos)}`;
}

// Tempo permitido nulo quer dizer que a permanência é cobrada normalmente.
export function formatTempoPermitido(minutos: number | null): string {
  return minutos === null ? "Sem tempo permitido" : formatDuracao(minutos);
}
