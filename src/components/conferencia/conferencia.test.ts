import { describe, expect, it } from "vitest";
import { fromConferenciaResponse, fromLeituraResponse } from "@/lib/api/services/conferenciaPatio.mapper";
import { conferenciaAberta, itemConferido, itemNaoEncontrado, itemPendente, leituraConferido, leituraJaConferido, leituraSemEntrada } from "@/lib/api/services/conferenciaPatio.fixture";
import { SITUACAO_ITEM, SITUACAO_SEM_ENTRADA, type ItemConferencia } from "@/types/conferenciaPatio";
import {
  aplicarItem,
  aplicarLeitura,
  aplicarSemEntrada,
  calcularTotais,
  descartarSemEntradaLocal,
  descricaoLeitura,
  duracaoEntre,
  filtrarItens,
  itensNaoEncontrados,
  ordenarItens,
  pctProgresso,
  rotuloVeiculo,
  semEntradaPendentes,
  tipoDoCliente,
} from "./conferencia";

const conferencia = fromConferenciaResponse(conferenciaAberta);

function item(parcial: Partial<ItemConferencia>): ItemConferencia {
  return { ...conferencia.itens[0], ...parcial };
}

describe("tipoDoCliente", () => {
  it("conveniado vale mais que mensalista", () => {
    expect(tipoDoCliente({ mensalista: true, conveniado: true })).toBe("conveniado");
  });

  it("mensalista e avulso", () => {
    expect(tipoDoCliente({ mensalista: true, conveniado: false })).toBe("mensal");
    expect(tipoDoCliente({ mensalista: false, conveniado: false })).toBe("avulso");
  });
});

describe("calcularTotais", () => {
  it("segue as definições do servidor (confere com o `totais` da fixture)", () => {
    expect(calcularTotais(conferencia)).toEqual(conferenciaAberta.totais);
  });

  it("não conta baixados nem os que saíram", () => {
    const totais = calcularTotais({
      itens: [item({ situacao: SITUACAO_ITEM.Baixado }), item({ situacao: SITUACAO_ITEM.Saiu }), item({ situacao: SITUACAO_ITEM.Conferido })],
      semEntrada: [],
      ajustes: [],
    });
    expect(totais).toMatchObject({ total: 1, conferidos: 1, faltam: 0 });
  });

  it("sem entrada descartada ou resolvida não é divergência", () => {
    const base = conferencia.semEntrada[0];
    const totais = calcularTotais({
      itens: [],
      semEntrada: [
        { ...base, situacao: SITUACAO_SEM_ENTRADA.Pendente },
        { ...base, situacao: SITUACAO_SEM_ENTRADA.Descartada },
        { ...base, situacao: SITUACAO_SEM_ENTRADA.EntradaRegistrada },
      ],
      ajustes: [],
    });
    expect(totais).toMatchObject({ semEntrada: 1, divergencias: 1 });
  });

  it("conferência vazia", () => {
    expect(calcularTotais({ itens: [], semEntrada: [], ajustes: [] })).toEqual({
      total: 0,
      conferidos: 0,
      faltam: 0,
      naoEncontrados: 0,
      semEntrada: 0,
      divergencias: 0,
      ajustes: 0,
    });
  });

  it("conta os ajustes", () => {
    const ajustes = [{ tipo: 1, placa: null, motivo: 1, descricao: "x" }];
    expect(calcularTotais({ itens: [], semEntrada: [], ajustes }).ajustes).toBe(1);
  });
});

describe("listas", () => {
  it("separa não encontrados e sem entrada pendentes", () => {
    expect(itensNaoEncontrados(conferencia).map((i) => i.placa)).toEqual([itemNaoEncontrado.placa]);
    expect(semEntradaPendentes(conferencia).map((l) => l.placa)).toEqual(["ZZZ9Z99"]);
  });

  it("filtra faltam e conferidos", () => {
    expect(filtrarItens(conferencia.itens, "faltam").map((i) => i.placa)).toEqual([itemPendente.placa]);
    expect(filtrarItens(conferencia.itens, "conferidos").map((i) => i.placa)).toEqual([itemConferido.placa]);
  });
});

describe("ordenarItens", () => {
  it("faltam: a entrada mais antiga primeiro", () => {
    const itens = [
      item({ patioConferenciaItemId: 1, dataEntrada: "2026-10-20T10:00:00" }),
      item({ patioConferenciaItemId: 2, dataEntrada: "2026-10-15T10:00:00" }),
    ];
    expect(ordenarItens(itens, "faltam").map((i) => i.patioConferenciaItemId)).toEqual([2, 1]);
  });

  it("conferidos: o último conferido primeiro, sem alterar a lista original", () => {
    const itens = [
      item({ patioConferenciaItemId: 1, dataConferido: "2026-11-04T10:00:00" }),
      item({ patioConferenciaItemId: 2, dataConferido: "2026-11-04T11:00:00" }),
    ];
    expect(ordenarItens(itens, "conferidos").map((i) => i.patioConferenciaItemId)).toEqual([2, 1]);
    expect(itens.map((i) => i.patioConferenciaItemId)).toEqual([1, 2]);
  });
});

describe("pctProgresso", () => {
  it.each([
    [0, 0, 0],
    [0, 10, 0],
    [1, 3, 33],
    [34, 42, 81],
    [10, 10, 100],
    [12, 10, 100],
  ])("%i de %i = %i%%", (conferidos, total, esperado) => {
    expect(pctProgresso(conferidos, total)).toBe(esperado);
  });
});

describe("descricaoLeitura", () => {
  it("conferido mostra o modelo", () => {
    expect(descricaoLeitura(fromLeituraResponse(leituraConferido))).toEqual({ texto: "Conferido · Corolla", tom: "success" });
  });

  it("já conferido é discreto", () => {
    expect(descricaoLeitura(fromLeituraResponse(leituraJaConferido))).toEqual({ texto: "Já conferido antes", tom: "muted" });
  });

  it("sem entrada convida a registrar", () => {
    expect(descricaoLeitura(fromLeituraResponse(leituraSemEntrada))).toEqual({ texto: "Sem entrada · Registrar agora", tom: "danger" });
  });
});

describe("duracaoEntre", () => {
  it.each([
    ["2026-11-04T13:40:00", "2026-11-04T14:32:00", "52min"],
    ["2026-11-04T13:00:00", "2026-11-04T14:04:00", "1h 4min"],
    ["2026-11-04T10:00:00", "2026-11-06T13:00:00", "2d 3h"],
    ["2026-11-04T10:00:00", "2026-11-04T10:00:00", "0min"],
  ])("%s até %s = %s", (inicio, fim, esperado) => {
    expect(duracaoEntre(inicio, fim)).toBe(esperado);
  });

  it("data ausente ou inválida", () => {
    expect(duracaoEntre(null, "2026-11-04T10:00:00")).toBe("—");
    expect(duracaoEntre("2026-11-04T10:00:00", "")).toBe("—");
  });
});

describe("atualização do cache", () => {
  const novoItem = item({ patioConferenciaItemId: 99, placa: "NEW9N99" });

  it("troca o item existente pelo identificador", () => {
    const atualizada = aplicarItem(conferencia, { ...itemPendente, ...conferencia.itens[0], situacao: SITUACAO_ITEM.Conferido });
    expect(atualizada.itens).toHaveLength(conferencia.itens.length);
    expect(atualizada.itens[0].situacao).toBe(SITUACAO_ITEM.Conferido);
    expect(conferencia.itens[0].situacao).toBe(SITUACAO_ITEM.Pendente);
  });

  it("acrescenta o item que entrou depois do início", () => {
    expect(aplicarItem(conferencia, novoItem).itens.map((i) => i.placa)).toContain("NEW9N99");
  });

  it("a placa sem entrada lida de novo reaproveita a linha", () => {
    const descartada = descartarSemEntradaLocal(conferencia, "ZZZ9Z99");
    expect(descartada.semEntrada[0].situacao).toBe(SITUACAO_SEM_ENTRADA.Descartada);
    const denovo = aplicarSemEntrada(descartada, { ...conferencia.semEntrada[0], situacao: SITUACAO_SEM_ENTRADA.Pendente });
    expect(denovo.semEntrada).toHaveLength(1);
    expect(denovo.semEntrada[0].situacao).toBe(SITUACAO_SEM_ENTRADA.Pendente);
  });

  it("aplicarLeitura usa o item ou a linha conforme o resultado", () => {
    const conferido = aplicarLeitura(conferencia, fromLeituraResponse(leituraConferido));
    expect(conferido.itens.find((i) => i.placa === "BBB2B22")?.situacao).toBe(SITUACAO_ITEM.Conferido);
    const sem = aplicarLeitura({ ...conferencia, semEntrada: [] }, fromLeituraResponse(leituraSemEntrada));
    expect(sem.semEntrada.map((l) => l.placa)).toEqual(["ZZZ9Z99"]);
  });
});

describe("rotuloVeiculo", () => {
  it("junta modelo e cor, com a cor em caixa de título", () => {
    expect(rotuloVeiculo({ modelo: "Gol", cor: "PRATA" })).toBe("Gol · Prata");
    expect(rotuloVeiculo({ modelo: "Cobalt", cor: "rosa" })).toBe("Cobalt · Rosa");
  });

  it("modelo ou cor ausentes viram traço", () => {
    expect(rotuloVeiculo({ modelo: null, cor: null })).toBe("— · —");
    expect(rotuloVeiculo({ modelo: "Gol", cor: null })).toBe("Gol · —");
  });
});
