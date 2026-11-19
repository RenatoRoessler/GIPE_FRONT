import { formatarMinutos } from "@/components/patio/patio";
import { formatBRL } from "@/lib/money";

// Formatação da Visão Geral. Valor que não se aplica (nulo) nunca vira "R$ 0" nem "0%": vira o travessão `SEM_VALOR`.
export const SEM_VALOR = "—";

export const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"] as const;
export const MESES_CURTOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"] as const;
export const DIAS_SEMANA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"] as const;
export const DIAS_SEMANA_CURTOS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"] as const;

export function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

const reaisInteiros = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function ehNumero(valor: number | null | undefined): valor is number {
  return typeof valor === "number" && Number.isFinite(valor);
}

// Mesmo espaço comum de `formatBRL`. "R$ 1.403,50" com centavos e "R$ 2.591" sem eles (arredondado). Nulo, indefinido e NaN viram o travessão.
export function brl(valor: number | null | undefined, { centavos = false }: { centavos?: boolean } = {}): string {
  if (!ehNumero(valor)) return SEM_VALOR;
  return centavos ? formatBRL(valor) : reaisInteiros.format(valor).replace(/ /g, " ");
}

// Para valores de pendência: "R$ 250" quando é inteiro e "R$ 1,50" quando tem centavos (arredondar esconderia o valor).
export function brlCompacto(valor: number | null | undefined): string {
  if (!ehNumero(valor)) return SEM_VALOR;
  return brl(valor, { centavos: !Number.isInteger(valor) });
}

// Módulo e sem casas: a seta (▲/▼) mostra o sentido, então -100 vira "100%".
export function percentual(valor: number | null | undefined): string {
  return ehNumero(valor) ? `${Math.abs(Math.round(valor))}%` : SEM_VALOR;
}

// "18 nov", e "18 nov 2025" quando o ano é diferente do de `hoje`.
export function dataCurta(data: Date, hoje: Date): string {
  const ano = data.getFullYear() === hoje.getFullYear() ? "" : ` ${data.getFullYear()}`;
  return `${data.getDate()} ${MESES_CURTOS[data.getMonth()]}${ano}`;
}

export function diaSemanaCurto(data: Date): string {
  return DIAS_SEMANA_CURTOS[data.getDay()];
}

// "outubro", e "outubro de 2025" quando o ano é diferente do de `hoje`.
export function nomeDoMes(data: Date, hoje: Date): string {
  const ano = data.getFullYear() === hoje.getFullYear() ? "" : ` de ${data.getFullYear()}`;
  return `${MESES[data.getMonth()]}${ano}`;
}

// "quinta, 19 de novembro".
export function dataPorExtenso(data: Date): string {
  return `${capitalizar(DIAS_SEMANA[data.getDay()])}, ${data.getDate()} de ${MESES[data.getMonth()]}`;
}

// "1h 52min", "45min" e "2d 3h". Nulo vira o travessão.
export function permanencia(minutos: number | null | undefined): string {
  return ehNumero(minutos) ? formatarMinutos(Math.max(0, Math.round(minutos))) : SEM_VALOR;
}

// "09:05", a hora local de um instante ISO sem fuso.
export function horaCurta(data: Date): string {
  return `${String(data.getHours()).padStart(2, "0")}:${String(data.getMinutes()).padStart(2, "0")}`;
}
