import { formatBRL } from "@/lib/money";
import { TIPO_LANCAMENTO, type TipoLancamento } from "@/types/financeiro";

const MENOS = "−";

const MESES_CURTOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"] as const;
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"] as const;
const DIAS_DA_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

// Valor sempre com o sentido escrito: "+" nas entradas, "−" nas saídas. Sem tipo, o valor aparece sem sinal.
export function formatValorComSinal(valor: number, tipo: TipoLancamento | null): string {
  const texto = formatBRL(Math.abs(valor));
  if (tipo === TIPO_LANCAMENTO.Entrada) {
    return `+ ${texto}`;
  }
  return tipo === TIPO_LANCAMENTO.Saida ? `${MENOS} ${texto}` : texto;
}

// Saldo: o negativo leva o sinal "−" escrito, para a cor não ser o único sinal.
export function formatSaldo(valor: number): string {
  return valor < 0 ? `${MENOS} ${formatBRL(Math.abs(valor))}` : formatBRL(valor);
}

export function rotuloTipo(tipo: TipoLancamento): string {
  return tipo === TIPO_LANCAMENTO.Entrada ? "Entrada" : "Saída";
}

// "Despesas fixas › Energia"; categoria principal aparece só com o nome.
export function nomeDaCategoria(categoria: string, pai: string | null): string {
  return pai ? `${pai} › ${categoria}` : categoria;
}

type DataParts = { ano: number; mes: number; dia: number };

// Lê "AAAA-MM-DD" por partes: new Date("2026-10-01") é UTC e voltaria um dia no fuso do Brasil.
function partes(data: string): DataParts | null {
  const encontrada = /^(\d{4})-(\d{2})-(\d{2})/.exec(data);
  return encontrada ? { ano: Number(encontrada[1]), mes: Number(encontrada[2]), dia: Number(encontrada[3]) } : null;
}

const doisDigitos = (valor: number) => String(valor).padStart(2, "0");

// "2026-10-22" vira "22/10/2026".
export function formatDataBr(data: string): string {
  const p = partes(data);
  return p ? `${doisDigitos(p.dia)}/${doisDigitos(p.mes)}/${p.ano}` : "—";
}

// "2026-10-22" vira "22/10".
export function formatDiaMes(data: string): string {
  const p = partes(data);
  return p ? `${doisDigitos(p.dia)}/${doisDigitos(p.mes)}` : "—";
}

// "out/26", para o eixo e para as linhas do agrupamento mensal.
export function rotuloMes(data: string): string {
  const p = partes(data);
  return p ? `${MESES_CURTOS[p.mes - 1]}/${doisDigitos(p.ano % 100)}` : "—";
}

// "Outubro de 2026".
export function rotuloMesExtenso(data: string): string {
  const p = partes(data);
  if (!p) {
    return "—";
  }
  const nome = MESES[p.mes - 1];
  return `${nome.charAt(0).toUpperCase()}${nome.slice(1)} de ${p.ano}`;
}

// "Qua, 22/10/2026": o dia da semana vem de uma data em UTC, que não muda com o fuso.
export function rotuloDiaCompleto(data: string): string {
  const p = partes(data);
  if (!p) {
    return "—";
  }
  const diaDaSemana = new Date(Date.UTC(p.ano, p.mes - 1, p.dia)).getUTCDay();
  return `${DIAS_DA_SEMANA[diaDaSemana]}, ${formatDataBr(data)}`;
}

// "01/10 a 31/10/2026"; entre anos diferentes, os dois anos aparecem.
export function periodoPorExtenso(de: string, ate: string): string {
  const inicio = partes(de);
  const fim = partes(ate);
  if (!inicio || !fim) {
    return "";
  }
  return inicio.ano === fim.ano ? `${formatDiaMes(de)} a ${formatDataBr(ate)}` : `${formatDataBr(de)} a ${formatDataBr(ate)}`;
}

// Fatia de um total: "99,6%". Valor mínimo diferente de zero aparece como "<0,1%", para não virar "0,0%".
export function formatPercentual(valor: number): string {
  if (!Number.isFinite(valor) || valor <= 0) {
    return "0%";
  }
  if (valor < 0.1) {
    return "<0,1%";
  }
  return `${(Math.round(valor * 10) / 10).toFixed(1).replace(".", ",").replace(/,0$/, "")}%`;
}
