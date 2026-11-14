import { STATUS_SERVICO, type ItemFila, type StatusServico } from "@/types/servico";
import { STATUS_DA_FILA } from "./status";

// Tudo aqui devolve nulo (ou falso) quando falta dado: o back ainda não confirmou os tempos do item, e a tela nunca
// estima um tempo que ele não mandou.

const MS_POR_MINUTO = 60_000;

const dois = (numero: number) => String(numero).padStart(2, "0");

// O instante no formato do back: horário local, sem fuso ("2026-11-13T07:42:47"). Serve para a tela mostrar o início ou o
// pronto de um serviço na hora da troca de status, antes de o back confirmar com o horário dele.
export function instanteLocal(data: Date = new Date()): string {
  return `${data.getFullYear()}-${dois(data.getMonth() + 1)}-${dois(data.getDate())}T${dois(data.getHours())}:${dois(data.getMinutes())}:${dois(data.getSeconds())}`;
}

function instante(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const tempo = new Date(iso).getTime();
  return Number.isNaN(tempo) ? null : tempo;
}

function minutosDesde(iso: string | null | undefined, agora: number): number | null {
  const inicio = instante(iso);
  return inicio === null ? null : Math.max(0, Math.floor((agora - inicio) / MS_POR_MINUTO));
}

// Há quantos minutos o serviço entrou na fila.
export function tempoNaFila(item: ItemFila, agora: number): number | null {
  return minutosDesde(item.criadoEm, agora);
}

// Há quantos minutos o serviço foi iniciado.
export function decorridoEmExecucao(item: ItemFila, agora: number): number | null {
  return minutosDesde(item.iniciadoEm, agora);
}

// Há quantos minutos o serviço ficou pronto.
export function prontoHa(item: ItemFila, agora: number): number | null {
  return minutosDesde(item.prontoEm, agora);
}

// Início somado à duração prevista.
export function previsaoDeTermino(item: ItemFila): Date | null {
  const inicio = instante(item.iniciadoEm);
  const duracao = item.duracaoMinutos;
  if (inicio === null || !duracao || duracao <= 0) return null;
  return new Date(inicio + duracao * MS_POR_MINUTO);
}

// 0 a 100, para a barra de progresso. Nulo sem início ou sem duração prevista.
export function progresso(item: ItemFila, agora: number): number | null {
  const decorrido = decorridoEmExecucao(item, agora);
  const duracao = item.duracaoMinutos;
  if (decorrido === null || !duracao || duracao <= 0) return null;
  return Math.min(100, Math.round((decorrido / duracao) * 100));
}

// Só serviço em andamento, com início e duração conhecidos, passa da previsão.
export function minutosAtrasado(item: ItemFila, agora: number): number {
  if (item.status !== STATUS_SERVICO.EmExecucao) return 0;
  const decorrido = decorridoEmExecucao(item, agora);
  const duracao = item.duracaoMinutos;
  if (decorrido === null || !duracao || duracao <= 0) return 0;
  return Math.max(0, decorrido - duracao);
}

export function atrasado(item: ItemFila, agora: number): boolean {
  return minutosAtrasado(item, agora) > 0;
}

// Quantos outros serviços o mesmo veículo tem na fila carregada.
export function outrosNoCarro(itens: ItemFila[], item: ItemFila): number {
  return itens.filter((outro) => outro.idPatio === item.idPatio && outro.patioServicoId !== item.patioServicoId).length;
}

function soAlfanumerico(texto: string): string {
  return texto.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

// Placa por trecho (sem hífen e sem diferença de caixa) ou prisma exato. Busca vazia mantém tudo.
export function filtrarFila(itens: ItemFila[], busca: string): ItemFila[] {
  const termo = soAlfanumerico(busca);
  if (termo === "") return itens;
  return itens.filter((item) => soAlfanumerico(item.placa).includes(termo) || (item.prisma !== null && soAlfanumerico(item.prisma) === termo));
}

export interface ResumoDaFila {
  porStatus: Record<(typeof STATUS_DA_FILA)[number], number>;
  atrasados: number;
}

export function resumirFila(itens: ItemFila[], agora: number): ResumoDaFila {
  const contar = (status: StatusServico) => itens.filter((item) => item.status === status).length;
  return {
    porStatus: {
      [STATUS_SERVICO.Aguardando]: contar(STATUS_SERVICO.Aguardando),
      [STATUS_SERVICO.EmExecucao]: contar(STATUS_SERVICO.EmExecucao),
      [STATUS_SERVICO.Pronto]: contar(STATUS_SERVICO.Pronto),
    },
    atrasados: itens.filter((item) => atrasado(item, agora)).length,
  };
}
