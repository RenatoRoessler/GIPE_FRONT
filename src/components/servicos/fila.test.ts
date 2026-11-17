import { describe, expect, it } from "vitest";
import { STATUS_SERVICO, type ItemFila, type StatusServico } from "@/types/servico";
import {
  atrasado,
  decorridoEmExecucao,
  filtrarFila,
  instanteLocal,
  minutosAtrasado,
  ordenarColuna,
  outrosNoCarro,
  previsaoDeTermino,
  progresso,
  prontoHa,
  resumirFila,
  statusInicialDaFila,
  tempoNaFila,
} from "./fila";

const AGORA = new Date("2026-11-14T12:00:00Z").getTime();
const atras = (minutos: number) => new Date(AGORA - minutos * 60_000).toISOString();

const item = (extra: Partial<ItemFila> = {}): ItemFila => ({
  patioServicoId: 1,
  idPatio: 10,
  nomeServico: "Lavagem",
  status: STATUS_SERVICO.Aguardando as StatusServico,
  placa: "RTZ4E21",
  modelo: null,
  cor: null,
  categoria: null,
  prisma: "12",
  entradaEm: null,
  ...extra,
});

describe("tempos do item", () => {
  it("Na fila: há quanto tempo entrou", () => {
    expect(tempoNaFila(item({ criadoEm: atras(12) }), AGORA)).toBe(12);
  });

  it("sem o dado do back devolve nulo, nunca estima", () => {
    const vazio = item();
    expect(tempoNaFila(vazio, AGORA)).toBeNull();
    expect(decorridoEmExecucao(vazio, AGORA)).toBeNull();
    expect(prontoHa(vazio, AGORA)).toBeNull();
    expect(previsaoDeTermino(vazio)).toBeNull();
    expect(progresso(vazio, AGORA)).toBeNull();
  });

  it("data inválida conta como ausente e relógio adiantado não dá tempo negativo", () => {
    expect(tempoNaFila(item({ criadoEm: "x" }), AGORA)).toBeNull();
    expect(tempoNaFila(item({ criadoEm: atras(-5) }), AGORA)).toBe(0);
  });

  it("Pronto: há quanto tempo aguarda retirada", () => {
    expect(prontoHa(item({ status: STATUS_SERVICO.Pronto, prontoEm: atras(26) }), AGORA)).toBe(26);
  });

  it("Em andamento: previsão de término e progresso", () => {
    const emAndamento = item({ status: STATUS_SERVICO.EmExecucao, iniciadoEm: atras(30), duracaoMinutos: 60 });
    expect(decorridoEmExecucao(emAndamento, AGORA)).toBe(30);
    expect(previsaoDeTermino(emAndamento)?.getTime()).toBe(AGORA + 30 * 60_000);
    expect(progresso(emAndamento, AGORA)).toBe(50);
  });

  it("o progresso não passa de 100", () => {
    expect(progresso(item({ status: STATUS_SERVICO.EmExecucao, iniciadoEm: atras(90), duracaoMinutos: 60 }), AGORA)).toBe(100);
  });

  it("sem duração prevista não há previsão nem progresso", () => {
    const semDuracao = item({ status: STATUS_SERVICO.EmExecucao, iniciadoEm: atras(30), duracaoMinutos: null });
    expect(previsaoDeTermino(semDuracao)).toBeNull();
    expect(progresso(semDuracao, AGORA)).toBeNull();
  });
});

describe("atraso", () => {
  const emAndamento = (decorrido: number, duracao: number | null) =>
    item({ status: STATUS_SERVICO.EmExecucao, iniciadoEm: atras(decorrido), duracaoMinutos: duracao });

  it("passou da duração prevista", () => {
    expect(atrasado(emAndamento(80, 60), AGORA)).toBe(true);
    expect(minutosAtrasado(emAndamento(80, 60), AGORA)).toBe(20);
  });

  it("no limite exato da duração ainda não está atrasado", () => {
    expect(atrasado(emAndamento(60, 60), AGORA)).toBe(false);
    expect(atrasado(emAndamento(61, 60), AGORA)).toBe(true);
  });

  it("sem duração ou sem início não há atraso", () => {
    expect(atrasado(emAndamento(500, null), AGORA)).toBe(false);
    expect(atrasado(item({ status: STATUS_SERVICO.EmExecucao, duracaoMinutos: 30 }), AGORA)).toBe(false);
  });

  it("só serviço em andamento atrasa", () => {
    expect(atrasado({ ...emAndamento(80, 60), status: STATUS_SERVICO.Aguardando }, AGORA)).toBe(false);
    expect(atrasado({ ...emAndamento(80, 60), status: STATUS_SERVICO.Pronto }, AGORA)).toBe(false);
  });
});

describe("outrosNoCarro", () => {
  it("conta os outros serviços do mesmo veículo, sem contar o próprio", () => {
    const a = item({ patioServicoId: 1, idPatio: 10 });
    const b = item({ patioServicoId: 2, idPatio: 10 });
    const c = item({ patioServicoId: 3, idPatio: 11 });
    expect(outrosNoCarro([a, b, c], a)).toBe(1);
    expect(outrosNoCarro([a, b, c], c)).toBe(0);
  });
});

describe("filtrarFila", () => {
  const a = item({ patioServicoId: 1, placa: "RTZ4E21", prisma: "12" });
  const b = item({ patioServicoId: 2, placa: "QXA2B90", prisma: "7" });
  const c = item({ patioServicoId: 3, placa: "FGH8C33", prisma: null });
  const lista = [a, b, c];

  it("busca vazia mantém tudo", () => {
    expect(filtrarFila(lista, "  ")).toEqual(lista);
  });

  it("casa trecho da placa, ignorando caixa, hífen e espaço", () => {
    expect(filtrarFila(lista, "rtz-4e")).toEqual([a]);
    expect(filtrarFila(lista, "xa 2")).toEqual([b]);
  });

  it("prisma é exato: 1 não casa com 12", () => {
    expect(filtrarFila(lista, "12")).toEqual([a]);
    expect(filtrarFila(lista, "7")).toEqual([b]);
    // "1" aparece em placas, mas não casa com o prisma 12 de um carro sem "1" na placa.
    expect(filtrarFila([item({ placa: "ABC-DEF", prisma: "12" })], "1")).toEqual([]);
  });

  it("sem resultado devolve lista vazia", () => {
    expect(filtrarFila(lista, "zzz")).toEqual([]);
  });
});

describe("resumirFila", () => {
  it("conta por status e os atrasados", () => {
    const lista = [
      item({ patioServicoId: 1, status: STATUS_SERVICO.Aguardando }),
      item({ patioServicoId: 2, status: STATUS_SERVICO.EmExecucao, iniciadoEm: atras(80), duracaoMinutos: 60 }),
      item({ patioServicoId: 3, status: STATUS_SERVICO.EmExecucao, iniciadoEm: atras(10), duracaoMinutos: 60 }),
      item({ patioServicoId: 4, status: STATUS_SERVICO.Pronto }),
    ];
    expect(resumirFila(lista, AGORA)).toEqual({
      porStatus: { [STATUS_SERVICO.Aguardando]: 1, [STATUS_SERVICO.EmExecucao]: 2, [STATUS_SERVICO.Pronto]: 1 },
      atrasados: 1,
    });
  });
});

describe("instanteLocal", () => {
  it("escreve o horário local, sem fuso, no formato do back", () => {
    expect(instanteLocal(new Date(2026, 10, 3, 7, 5, 9))).toBe("2026-11-03T07:05:09");
    expect(instanteLocal(new Date(2026, 11, 31, 23, 59, 59))).toBe("2026-12-31T23:59:59");
  });

  it("o resultado volta a ser lido como o mesmo instante", () => {
    const data = new Date(2026, 10, 14, 15, 30, 5);
    expect(new Date(instanteLocal(data)).getTime()).toBe(data.getTime());
  });
});

describe("statusInicialDaFila", () => {
  const com = (status: StatusServico, extra: Partial<ItemFila> = {}) => item({ status, ...extra });

  it("com serviço atrasado abre em andamento, mesmo havendo gente na fila", () => {
    const atrasadoEmAndamento = com(STATUS_SERVICO.EmExecucao, { iniciadoEm: atras(80), duracaoMinutos: 60 });
    expect(statusInicialDaFila([com(STATUS_SERVICO.Aguardando), atrasadoEmAndamento])).toBe(STATUS_SERVICO.EmExecucao);
  });

  it("só em andamento abre em andamento", () => {
    expect(statusInicialDaFila([com(STATUS_SERVICO.EmExecucao)])).toBe(STATUS_SERVICO.EmExecucao);
  });

  it("em andamento vem antes de na fila e de pronto", () => {
    expect(statusInicialDaFila([com(STATUS_SERVICO.Pronto), com(STATUS_SERVICO.Aguardando), com(STATUS_SERVICO.EmExecucao)])).toBe(STATUS_SERVICO.EmExecucao);
  });

  it("sem nada em andamento abre na fila", () => {
    expect(statusInicialDaFila([com(STATUS_SERVICO.Pronto), com(STATUS_SERVICO.Aguardando)])).toBe(STATUS_SERVICO.Aguardando);
  });

  it("só pronto abre em pronto", () => {
    expect(statusInicialDaFila([com(STATUS_SERVICO.Pronto)])).toBe(STATUS_SERVICO.Pronto);
  });

  it("fila vazia abre na fila", () => {
    expect(statusInicialDaFila([])).toBe(STATUS_SERVICO.Aguardando);
  });
});

describe("ordenarColuna", () => {
  const andamento = (id: number, decorrido: number, duracao: number | null = 60) =>
    item({ patioServicoId: id, status: STATUS_SERVICO.EmExecucao, iniciadoEm: atras(decorrido), duracaoMinutos: duracao });

  it("coloca os atrasados primeiro, do mais atrasado para o menos", () => {
    const ordenados = ordenarColuna([andamento(1, 30), andamento(2, 70), andamento(3, 100)], AGORA);
    expect(ordenados.map((outro) => outro.patioServicoId)).toEqual([3, 2, 1]);
  });

  it("mantém a ordem original dos que não estão atrasados e dos empatados", () => {
    const ordenados = ordenarColuna([andamento(1, 10), andamento(2, 20), andamento(3, 70), andamento(4, 70), andamento(5, 5, null)], AGORA);
    expect(ordenados.map((outro) => outro.patioServicoId)).toEqual([3, 4, 1, 2, 5]);
  });

  it("não muda a lista recebida e não mexe nas colunas sem atraso", () => {
    const original = [item({ patioServicoId: 1 }), item({ patioServicoId: 2 })];
    const copia = [...original];
    expect(ordenarColuna(original, AGORA).map((outro) => outro.patioServicoId)).toEqual([1, 2]);
    expect(original).toEqual(copia);
  });
});
