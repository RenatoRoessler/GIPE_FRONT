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

// 40 -> "cerca de 40 min"; 60 -> "cerca de 1h"; 90 -> "cerca de 1h30". Sem valor, vazio: quem usa omite o trecho.
export function formatDuracaoNatural(minutos: number | null): string {
  if (minutos === null || minutos <= 0) return "";
  if (minutos < 60) return `cerca de ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto === 0 ? `cerca de ${horas}h` : `cerca de ${horas}h${String(resto).padStart(2, "0")}`;
}

// Serviço sem custo aparece como "Grátis", não como "R$ 0,00".
export function formatCentavosOuGratis(centavos: number): string {
  return centavos === 0 ? "Grátis" : formatCentavos(centavos);
}
