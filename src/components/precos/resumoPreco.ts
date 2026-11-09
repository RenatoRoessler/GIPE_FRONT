import type { PrecoView } from "@/types/preco";
import { formatBRL, formatMinutos } from "./format";

// Resumo de uma linha do que a tabela cobra, para itens da lista e miniplacas: o primeiro degrau e a diária.
// Ex.: "R$ 15,00 até 1 h · diária R$ 100,00".
export function resumoPreco(preco: PrecoView): string {
  const primeira = [...preco.faixas].sort((a, b) => a.minutosLimite - b.minutosLimite)[0];
  const diaria = preco.valorDiaria > 0 ? `diária ${formatBRL(preco.valorDiaria)}` : null;

  if (!primeira) {
    return diaria ? `Só ${diaria}` : "Sem valores";
  }
  const degrau = `${formatBRL(primeira.valor)} até ${formatMinutos(primeira.minutosLimite)}`;
  return diaria ? `${degrau} · ${diaria}` : degrau;
}
