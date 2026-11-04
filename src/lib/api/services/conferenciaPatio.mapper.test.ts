import { describe, expect, it } from "vitest";
import { SITUACAO_ITEM } from "@/types/conferenciaPatio";
import {
  conferenciaAberta,
  itemConferido,
  itemPendente,
  leituraConferido,
  leituraSemEntrada,
  resumoComUltima,
  resumoSemConferencia,
} from "./conferenciaPatio.fixture";
import {
  fromConferenciaResponse,
  fromItemResponse,
  fromLeituraResponse,
  fromResumoResponse,
  fromSemEntradaResponse,
} from "./conferenciaPatio.mapper";

describe("fromResumoResponse", () => {
  it("lê o resumo sem conferência", () => {
    expect(fromResumoResponse(resumoSemConferencia)).toEqual(resumoSemConferencia);
  });

  it("lê a última conferência", () => {
    const resumo = fromResumoResponse(resumoComUltima);
    expect(resumo.ultimaConferencia).toMatchObject({ patioConferenciaId: 1, situacao: 2, totalConferidos: 1, usuarioFim: "Operador Teste" });
    expect(resumo.conferenciaAberta).toBeNull();
  });

  it("sem caixa aberto o id vem nulo", () => {
    expect(fromResumoResponse({ ...resumoSemConferencia, caixaIdAberto: null }).caixaIdAberto).toBeNull();
  });

  it("campos ausentes ou de tipo errado não quebram", () => {
    const resumo = fromResumoResponse({ totalVeiculos: "12", avulsos: "x", ultimaConferencia: "?", conferenciaAberta: {} });
    expect(resumo).toEqual({
      totalVeiculos: 12,
      avulsos: 0,
      mensais: 0,
      conveniados: 0,
      caixaIdAberto: null,
      ultimaConferencia: null,
      conferenciaAberta: null,
    });
  });
});

describe("fromItemResponse", () => {
  it("lê o item pendente com a chave", () => {
    expect(fromItemResponse(itemPendente)).toMatchObject({
      patioConferenciaItemId: 1,
      placa: "AAA1A11",
      situacao: SITUACAO_ITEM.Pendente,
      origem: null,
      chave: { posicao: "A1", quadro: "Quadro 1" },
    });
  });

  it("lê quem conferiu e a origem", () => {
    expect(fromItemResponse(itemConferido)).toMatchObject({ origem: 2, usuarioConferido: "Operador Teste", dataConferido: "2026-11-04T11:37:50.95185" });
  });

  it("normaliza a placa", () => {
    expect(fromItemResponse({ ...itemPendente, placa: "aaa-1a11" })?.placa).toBe("AAA1A11");
  });

  it("descarta o item sem identificador", () => {
    expect(fromItemResponse({ ...itemPendente, patioConferenciaItemId: undefined })).toBeNull();
  });

  it("modelo e cor vazios viram nulo; chave sem posição vira nula", () => {
    const item = fromItemResponse({ ...itemPendente, modelo: " ", cor: null, chave: { quadroChaveId: 1 } });
    expect(item).toMatchObject({ modelo: null, cor: null, chave: null });
  });
});

describe("fromSemEntradaResponse", () => {
  it("lê a placa lida sem ticket", () => {
    expect(fromSemEntradaResponse(leituraSemEntrada.semEntrada)).toMatchObject({ placa: "ZZZ9Z99", situacao: 1, patioId: null });
  });

  it("descarta a linha sem placa", () => {
    expect(fromSemEntradaResponse({ placa: "" })).toBeNull();
  });
});

describe("fromLeituraResponse", () => {
  it("leitura conferida traz o item", () => {
    const leitura = fromLeituraResponse(leituraConferido);
    expect(leitura.resultado).toBe(1);
    expect(leitura.item?.placa).toBe("BBB2B22");
    expect(leitura.semEntrada).toBeNull();
  });

  it("leitura sem entrada traz a linha", () => {
    const leitura = fromLeituraResponse(leituraSemEntrada);
    expect(leitura.resultado).toBe(3);
    expect(leitura.item).toBeNull();
    expect(leitura.semEntrada?.placa).toBe("ZZZ9Z99");
  });
});

describe("fromConferenciaResponse", () => {
  it("lê a conferência aberta", () => {
    const conferencia = fromConferenciaResponse(conferenciaAberta);
    expect(conferencia).toMatchObject({ patioConferenciaId: 1, caixaId: 4, metodo: 2, situacao: 1, usuarioInicio: "Operador Teste", dataFim: null });
    expect(conferencia.itens).toHaveLength(3);
    expect(conferencia.semEntrada).toHaveLength(1);
    expect(conferencia.ajustes).toEqual([]);
  });

  it("listas ausentes viram vazias e itens sem id são descartados", () => {
    const conferencia = fromConferenciaResponse({ patioConferenciaId: 7, itens: [{ placa: "AAA1A11" }, 3, null] });
    expect(conferencia.itens).toEqual([]);
    expect(conferencia.semEntrada).toEqual([]);
    expect(conferencia.ajustes).toEqual([]);
  });

  it("lê os ajustes com a descrição pronta", () => {
    const conferencia = fromConferenciaResponse({ ...conferenciaAberta, ajustes: [{ tipo: 1, placa: "aaa-1a11", motivo: 4, descricao: "Saída · outro" }] });
    expect(conferencia.ajustes).toEqual([{ tipo: 1, placa: "AAA1A11", motivo: 4, descricao: "Saída · outro" }]);
  });
});
