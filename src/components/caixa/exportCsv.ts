import { parseApiDate } from "@/lib/date";
import type { Movimento, TipoMovimento } from "@/types/caixa";
import { formaPagamentoLabel } from "./format";

const SEPARADOR = ";";
const BOM = "\uFEFF";

const ROTULO_TIPO: Record<TipoMovimento, string> = { entrada: "Entrada", saida: "Saída", sangria: "Sangria" };

export function rotuloTipoMovimento(tipo: TipoMovimento): string {
  return ROTULO_TIPO[tipo];
}

// Campo com ; aspas ou quebra de linha vai entre aspas, com as aspas dobradas.
function campo(valor: string): string {
  return /[;"\r\n]/.test(valor) ? `"${valor.replace(/"/g, '""')}"` : valor;
}

// Vírgula decimal e sem separador de milhar, para a planilha ler como número.
function decimal(valor: number): string {
  return valor.toFixed(2).replace(".", ",");
}

function dataHoraCsv(iso: string): string {
  const data = parseApiDate(iso);
  if (!data) {
    return "";
  }
  const dois = (n: number) => String(n).padStart(2, "0");
  return `${dois(data.getDate())}/${dois(data.getMonth() + 1)}/${data.getFullYear()} ${dois(data.getHours())}:${dois(data.getMinutes())}`;
}

const CABECALHO = ["Data/hora", "Tipo", "Forma de pagamento", "Turno", "Usuário", "Motivo", "Valor"];

// Saídas e sangrias saem com sinal negativo. BOM UTF-8 para o Excel abrir os acentos.
export function movimentosParaCsv(movimentos: Movimento[]): string {
  const linhas = movimentos.map((movimento) =>
    [
      dataHoraCsv(movimento.dataHora),
      rotuloTipoMovimento(movimento.tipo),
      movimento.formaPagamento === null ? "" : formaPagamentoLabel(movimento.formaPagamento),
      movimento.turnoId === null ? "" : String(movimento.turnoId),
      movimento.usuario,
      movimento.motivo ?? "",
      decimal(movimento.tipo === "entrada" ? movimento.valor : -movimento.valor),
    ]
      .map(campo)
      .join(SEPARADOR),
  );
  return `${BOM}${[CABECALHO.join(SEPARADOR), ...linhas].join("\r\n")}\r\n`;
}

// Baixa o conteúdo como arquivo: Blob + link temporário.
export function baixarCsv(nome: string, conteudo: string): void {
  const url = URL.createObjectURL(new Blob([conteudo], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = nome.endsWith(".csv") ? nome : `${nome}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
