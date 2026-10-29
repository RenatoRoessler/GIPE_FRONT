import { parseApiDate } from "@/lib/date";
import { FORMA_PAGAMENTO, type FormaPagamentoId, type Movimento } from "@/types/caixa";

export function arredondar(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

// Proporção (0 a 100) para a largura de barras. Valor ausente, NaN ou maior zerado vira 0: largura "NaN%" quebraria o estilo.
export function proporcao(valor: number, maior: number): number {
  if (!Number.isFinite(valor) || !Number.isFinite(maior) || maior <= 0 || valor <= 0) {
    return 0;
  }
  return Math.min(100, (valor / maior) * 100);
}

// quantidade = número de movimentos de entrada da forma (um por ticket cobrado).
export type TotalForma = { formaPagamento: FormaPagamentoId; entradas: number; saidas: number; quantidade: number };

// Sangria é saída em dinheiro, mesmo que o movimento não traga a forma. Dinheiro vem primeiro, depois pelo código.
export function totaisPorForma(movimentos: Movimento[]): TotalForma[] {
  const porForma = new Map<FormaPagamentoId, TotalForma>();
  for (const movimento of movimentos) {
    const forma = movimento.formaPagamento ?? (movimento.tipo === "sangria" ? FORMA_PAGAMENTO.Dinheiro : null);
    if (forma === null) {
      continue;
    }
    const total = porForma.get(forma) ?? { formaPagamento: forma, entradas: 0, saidas: 0, quantidade: 0 };
    const valor = Number.isFinite(movimento.valor) ? movimento.valor : 0;
    if (movimento.tipo === "entrada") {
      total.entradas += valor;
      total.quantidade += 1;
    } else {
      total.saidas += valor;
    }
    porForma.set(forma, total);
  }
  return [...porForma.values()]
    .map((total) => ({ ...total, entradas: arredondar(total.entradas), saidas: arredondar(total.saidas) }))
    .sort((a, b) => a.formaPagamento - b.formaPagamento);
}

export type TotalHora = { hora: number; entradas: number; saidas: number };

// 24 posições na hora local (a API manda data sem fuso e a tela a trata como horário local).
export function totaisPorHora(movimentos: Movimento[]): TotalHora[] {
  const horas: TotalHora[] = Array.from({ length: 24 }, (_, hora) => ({ hora, entradas: 0, saidas: 0 }));
  for (const movimento of movimentos) {
    const data = parseApiDate(movimento.dataHora);
    if (!data) {
      continue;
    }
    const alvo = horas[data.getHours()];
    const valor = Number.isFinite(movimento.valor) ? movimento.valor : 0;
    if (movimento.tipo === "entrada") {
      alvo.entradas += valor;
    } else {
      alvo.saidas += valor;
    }
  }
  return horas.map((item) => ({ ...item, entradas: arredondar(item.entradas), saidas: arredondar(item.saidas) }));
}

// Hora com mais entradas; empate fica com a mais cedo. Sem entradas, null.
export function picoDeEntradas(horas: TotalHora[]): { hora: number; valor: number } | null {
  let pico: { hora: number; valor: number } | null = null;
  for (const item of horas) {
    if (item.entradas > 0 && (pico === null || item.entradas > pico.valor)) {
      pico = { hora: item.hora, valor: item.entradas };
    }
  }
  return pico;
}
