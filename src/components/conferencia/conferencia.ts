import { parseApiDate } from "@/lib/date";
import {
  RESULTADO_LEITURA,
  SITUACAO_CONFERENCIA,
  SITUACAO_ITEM,
  SITUACAO_SEM_ENTRADA,
  type Conferencia,
  type FiltroLista,
  type ItemConferencia,
  type ResultadoLeitura,
  type SemEntrada,
  type TipoCliente,
} from "@/types/conferenciaPatio";

// Conveniado vale mais que mensalista: o veículo do conveniado também pode ter sido carimbado como mensal.
export function tipoDoCliente(item: Pick<ItemConferencia, "mensalista" | "conveniado">): TipoCliente {
  if (item.conveniado) {
    return "conveniado";
  }
  return item.mensalista ? "mensal" : "avulso";
}

export const NOME_TIPO_CLIENTE: Record<TipoCliente, string> = {
  avulso: "Avulso",
  mensal: "Mensal",
  conveniado: "Conveniado",
};

export type TotaisConferencia = {
  total: number;
  conferidos: number;
  faltam: number;
  naoEncontrados: number;
  semEntrada: number;
  divergencias: number;
  ajustes: number;
};

// Baixados e os que saíram pela saída normal não contam nos totais (mesma regra do servidor).
function contaNosTotais(item: ItemConferencia): boolean {
  return item.situacao !== SITUACAO_ITEM.Baixado && item.situacao !== SITUACAO_ITEM.Saiu;
}

export function semEntradaPendentes(conferencia: Pick<Conferencia, "semEntrada">): SemEntrada[] {
  return conferencia.semEntrada.filter((linha) => linha.situacao === SITUACAO_SEM_ENTRADA.Pendente);
}

export function itensNaoEncontrados(conferencia: Pick<Conferencia, "itens">): ItemConferencia[] {
  return conferencia.itens.filter((item) => item.situacao === SITUACAO_ITEM.NaoEncontrado);
}

export function calcularTotais(conferencia: Pick<Conferencia, "itens" | "semEntrada" | "ajustes">): TotaisConferencia {
  const validos = conferencia.itens.filter(contaNosTotais);
  const conferidos = validos.filter((item) => item.situacao === SITUACAO_ITEM.Conferido).length;
  const faltam = validos.filter((item) => item.situacao === SITUACAO_ITEM.Pendente).length;
  const naoEncontrados = validos.filter((item) => item.situacao === SITUACAO_ITEM.NaoEncontrado).length;
  const semEntrada = semEntradaPendentes(conferencia).length;
  return {
    total: validos.length,
    conferidos,
    faltam,
    naoEncontrados,
    semEntrada,
    divergencias: naoEncontrados + semEntrada,
    ajustes: conferencia.ajustes.length,
  };
}

export function filtrarItens(itens: ItemConferencia[], filtro: FiltroLista): ItemConferencia[] {
  const situacao = filtro === "faltam" ? SITUACAO_ITEM.Pendente : SITUACAO_ITEM.Conferido;
  return itens.filter((item) => item.situacao === situacao);
}

function tempo(iso: string | null): number {
  return parseApiDate(iso)?.getTime() ?? 0;
}

// Faltam: a entrada mais antiga primeiro (é o carro que está há mais tempo no pátio). Conferidos: o conferido por último primeiro.
export function ordenarItens(itens: ItemConferencia[], filtro: FiltroLista): ItemConferencia[] {
  const copia = [...itens];
  if (filtro === "conferidos") {
    return copia.sort((a, b) => tempo(b.dataConferido) - tempo(a.dataConferido) || a.patioConferenciaItemId - b.patioConferenciaItemId);
  }
  return copia.sort((a, b) => tempo(a.dataEntrada) - tempo(b.dataEntrada) || a.patioConferenciaItemId - b.patioConferenciaItemId);
}

export function pctProgresso(conferidos: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round((conferidos / total) * 100)));
}

export type TomLeitura = "success" | "muted" | "danger";

export function descricaoLeitura(leitura: Pick<ResultadoLeitura, "resultado" | "item">): { texto: string; tom: TomLeitura } {
  const modelo = leitura.item?.modelo;
  if (leitura.resultado === RESULTADO_LEITURA.Conferido) {
    return { texto: modelo ? `Conferido · ${modelo}` : "Conferido", tom: "success" };
  }
  if (leitura.resultado === RESULTADO_LEITURA.JaConferido) {
    return { texto: "Já conferido antes", tom: "muted" };
  }
  return { texto: "Sem entrada · Registrar agora", tom: "danger" };
}

// "52min", "1h 4min", "2d 3h": só a parte que importa para uma conferência.
export function duracaoEntre(inicio: string | null, fim: string | null): string {
  const de = parseApiDate(inicio);
  const ate = parseApiDate(fim);
  if (!de || !ate) {
    return "—";
  }
  const minutos = Math.max(0, Math.round((ate.getTime() - de.getTime()) / 60_000));
  const dias = Math.floor(minutos / 1440);
  const horas = Math.floor((minutos % 1440) / 60);
  const resto = minutos % 60;
  if (dias > 0) {
    return `${dias}d ${horas}h`;
  }
  if (horas > 0) {
    return `${horas}h ${resto}min`;
  }
  return `${resto}min`;
}

// ---- Atualização do cache da conferência aberta com a resposta de uma ação ----

// Troca o item pelo identificador; um item novo (um carro que entrou depois do início) é acrescentado.
export function aplicarItem(conferencia: Conferencia, item: ItemConferencia): Conferencia {
  const existe = conferencia.itens.some((atual) => atual.patioConferenciaItemId === item.patioConferenciaItemId);
  return {
    ...conferencia,
    itens: existe
      ? conferencia.itens.map((atual) => (atual.patioConferenciaItemId === item.patioConferenciaItemId ? item : atual))
      : [...conferencia.itens, item],
  };
}

// A linha de uma placa sem entrada é única por placa: lida de novo, volta a pendente na mesma linha.
export function aplicarSemEntrada(conferencia: Conferencia, linha: SemEntrada): Conferencia {
  const existe = conferencia.semEntrada.some((atual) => atual.placa === linha.placa);
  return {
    ...conferencia,
    semEntrada: existe
      ? conferencia.semEntrada.map((atual) => (atual.placa === linha.placa ? linha : atual))
      : [...conferencia.semEntrada, linha],
  };
}

export function aplicarLeitura(conferencia: Conferencia, leitura: ResultadoLeitura): Conferencia {
  let atualizada = conferencia;
  if (leitura.item) {
    atualizada = aplicarItem(atualizada, leitura.item);
  }
  if (leitura.semEntrada) {
    atualizada = aplicarSemEntrada(atualizada, leitura.semEntrada);
  }
  return atualizada;
}

export function descartarSemEntradaLocal(conferencia: Conferencia, placa: string): Conferencia {
  return {
    ...conferencia,
    semEntrada: conferencia.semEntrada.map((linha) =>
      linha.placa === placa ? { ...linha, situacao: SITUACAO_SEM_ENTRADA.Descartada } : linha,
    ),
  };
}

// "hoje 09:12 · Ana", "03/11 09:12 · Ana" e, quando o fechamento do caixa a encerrou, "· incompleta".
export function descreverEncerrada(
  encerrada: { dataFim: string; usuarioFim: string | null; situacao: number },
  agora: Date,
  formatarData: (iso: string) => string,
  formatarHora: (iso: string) => string,
): string {
  const fim = parseApiDate(encerrada.dataFim);
  const hoje = fim !== null && fim.toDateString() === agora.toDateString();
  const quando = fim === null ? "—" : `${hoje ? "hoje" : formatarData(encerrada.dataFim).slice(0, 5)} ${formatarHora(encerrada.dataFim)}`;
  const quem = encerrada.usuarioFim ? ` · ${encerrada.usuarioFim}` : "";
  const incompleta = encerrada.situacao === SITUACAO_CONFERENCIA.Incompleta ? " · incompleta" : "";
  return `${quando}${quem}${incompleta}`;
}

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

// "Gol · Prata": a cor da API vem em caixa livre ("PRATA", "rosa"); modelo ou cor ausentes viram traço.
export function rotuloVeiculo(item: Pick<ItemConferencia, "modelo" | "cor">): string {
  return `${item.modelo ?? "—"} · ${item.cor ? capitalizar(item.cor) : "—"}`;
}

export const ORIGEM_ROTULO: Record<number, string> = { 1: "câmera", 2: "manual", 3: "entrada registrada" };
