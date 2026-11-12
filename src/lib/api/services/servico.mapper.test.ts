import { describe, expect, it } from "vitest";
import { fromFilaResponse, fromServicoResponse, fromServicosDoVeiculoResponse, fromServicosResponse } from "./servico.mapper";

const servicoDto = {
  servicoId: 7,
  nome: "Lavagem completa",
  descricao: "Externa e interna",
  duracaoMinutos: 60,
  tempoPermitidoMinutos: 180,
  ativo: true,
  precos: [
    { categoria: 2, categoriaDescricao: "Carro pequeno", valor: 40.1 },
    { categoria: 99, categoriaDescricao: "Todas", valor: 50 },
  ],
};

describe("fromServicoResponse", () => {
  it("lê o serviço e converte os preços para centavos sem erro de ponto flutuante", () => {
    expect(fromServicoResponse(servicoDto)).toEqual({
      id: 7,
      nome: "Lavagem completa",
      descricao: "Externa e interna",
      duracaoMinutos: 60,
      tempoPermitidoMinutos: 180,
      ativo: true,
      precos: [
        { categoria: 2, descricao: "Carro pequeno", valorCentavos: 4010 },
        { categoria: 99, descricao: "Todas", valorCentavos: 5000 },
      ],
    });
  });

  it("aceita `id` no lugar de `servicoId`", () => {
    expect(fromServicoResponse({ id: 3, nome: "Cera" })).toMatchObject({ id: 3, nome: "Cera" });
  });

  it("tempo permitido 0 ou ausente vira null", () => {
    expect(fromServicoResponse({ ...servicoDto, tempoPermitidoMinutos: 0 })?.tempoPermitidoMinutos).toBeNull();
    expect(fromServicoResponse({ ...servicoDto, tempoPermitidoMinutos: undefined })?.tempoPermitidoMinutos).toBeNull();
  });

  it("campos ausentes têm padrão seguro: ativo, sem descrição e sem preços", () => {
    expect(fromServicoResponse({ servicoId: 1, nome: "Cera" })).toEqual({
      id: 1,
      nome: "Cera",
      descricao: null,
      duracaoMinutos: null,
      tempoPermitidoMinutos: null,
      ativo: true,
      precos: [],
    });
  });

  it("serviço inativo é lido como inativo", () => {
    expect(fromServicoResponse({ ...servicoDto, ativo: false })?.ativo).toBe(false);
  });

  it("sem descrição da categoria usa o nome conhecido", () => {
    expect(fromServicoResponse({ servicoId: 1, nome: "Cera", precos: [{ categoria: 1, valor: 10 }] })?.precos[0].descricao).toBe("Moto");
  });

  it("descarta o que não tem id ou nome e o preço inválido", () => {
    expect(fromServicoResponse({ nome: "Sem id" })).toBeNull();
    expect(fromServicoResponse({ servicoId: 1 })).toBeNull();
    expect(fromServicoResponse(null)).toBeNull();
    expect(fromServicoResponse({ servicoId: 1, nome: "Cera", precos: [{ categoria: 2 }, "x"] })?.precos).toEqual([]);
  });
});

describe("fromServicosResponse", () => {
  it("item inválido não derruba a lista", () => {
    expect(fromServicosResponse([servicoDto, { nome: "Sem id" }, null]).map((servico) => servico.id)).toEqual([7]);
  });

  it("resposta que não é lista vira lista vazia", () => {
    expect(fromServicosResponse(null)).toEqual([]);
    expect(fromServicosResponse({})).toEqual([]);
  });
});

describe("fromServicosDoVeiculoResponse", () => {
  it("lê as somas, o livre até e os serviços", () => {
    const veiculo = fromServicosDoVeiculoResponse({
      valorServicos: 90.5,
      tempoPermitidoMinutos: 120,
      livreAte: "2026-11-11T16:30:00",
      servicos: [
        { patioServicoId: 11, servicoId: 7, nome: "Lavagem", valor: 40, tempoPermitidoMinutos: 60, status: 2 },
        { patioServicoId: 12, servicoId: 8, nome: "Cera", valor: 50.5, status: 4, motivoCancelamento: "Cliente desistiu" },
      ],
    });

    expect(veiculo).toEqual({
      valorServicosCentavos: 9050,
      tempoPermitidoMinutos: 120,
      livreAte: "2026-11-11T16:30:00",
      servicos: [
        { id: 11, servicoId: 7, nome: "Lavagem", valorCentavos: 4000, tempoPermitidoMinutos: 60, status: 2, motivoCancelamento: null },
        { id: 12, servicoId: 8, nome: "Cera", valorCentavos: 5050, tempoPermitidoMinutos: null, status: 4, motivoCancelamento: "Cliente desistiu" },
      ],
    });
  });

  it("descarta serviço com status desconhecido e aceita resposta vazia", () => {
    expect(fromServicosDoVeiculoResponse({ servicos: [{ patioServicoId: 1, nome: "X", status: 9 }] }).servicos).toEqual([]);
    expect(fromServicosDoVeiculoResponse(null)).toEqual({ valorServicosCentavos: 0, tempoPermitidoMinutos: null, livreAte: null, servicos: [] });
  });
});

describe("fromFilaResponse", () => {
  const item = { patioServicoId: 1, idPatio: 30, nomeServico: "Lavagem", status: 1, placa: "ABC1D23", modelo: "Onix", cor: "Branco", categoria: "Carro pequeno", prisma: 12, entradaEm: "2026-11-11T14:20:00" };

  it("lê a lista única", () => {
    expect(fromFilaResponse([item])).toEqual([
      { patioServicoId: 1, idPatio: 30, nomeServico: "Lavagem", status: 1, placa: "ABC1D23", modelo: "Onix", cor: "Branco", categoria: "Carro pequeno", prisma: "12", entradaEm: "2026-11-11T14:20:00" },
    ]);
  });

  it("lê a fila agrupada por status, tomando o status do grupo quando o item não o traz", () => {
    const semStatus = { ...item, status: undefined };
    const fila = fromFilaResponse({ aguardando: [semStatus], emExecucao: [{ ...semStatus, patioServicoId: 2 }], pronto: [] });

    expect(fila.map((linha) => [linha.patioServicoId, linha.status])).toEqual([
      [1, 1],
      [2, 2],
    ]);
  });

  it("descarta o item sem placa, serviço ou status válido", () => {
    expect(fromFilaResponse([{ ...item, placa: null }, { ...item, status: 4 }, { ...item, nomeServico: "" }, "x"])).toEqual([
      expect.objectContaining({ status: 4 }),
    ]);
  });

  it("resposta fora do formato vira lista vazia", () => {
    expect(fromFilaResponse(null)).toEqual([]);
    expect(fromFilaResponse("x")).toEqual([]);
  });
});
