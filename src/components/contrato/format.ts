import { formatDate, formatTime } from "@/components/caixa/format";

// "21/10/26 às 14:32"; "—" quando não há data.
export function formatDataHora(iso: string | null): string {
  if (!iso) {
    return "—";
  }
  return `${formatDate(iso)} às ${formatTime(iso)}`;
}

// Identificação do texto aceito (SHA-256): grupos de 4 em maiúsculas. Abreviada, mostra só as pontas
// ("9F3A 1C07 … D9E2 C21B"); o mensalista compara com a que chega no e-mail de confirmação.
export function formatHash(hash: string, completo = false): string {
  const grupos = hash.toUpperCase().replace(/[^0-9A-F]/g, "").match(/.{1,4}/g) ?? [];
  if (completo || grupos.length <= 4) {
    return grupos.join(" ");
  }
  return `${grupos.slice(0, 2).join(" ")} … ${grupos.slice(-2).join(" ")}`;
}
