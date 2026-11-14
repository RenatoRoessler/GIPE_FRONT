import { describe, expect, it } from "vitest";
import { fromFilaResponse, fromServicoResponse, fromServicosDoComprovante, fromServicosDoVeiculoResponse, fromServicosResponse } from "./servico.mapper";

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
        { categoria: 2, descricao: "Carro pequeno", valorCentavos: 4010, duracaoMinutos: null, tempoPermitidoMinutos: null },
        { categoria: 99, descricao: "Todas", valorCentavos: 5000, duracaoMinutos: null, tempoPermitidoMinutos: null },
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

const SEM_MOMENTOS = { adicionadoEm: null, adicionadoPor: null, previsaoEm: null, prontoEm: null };

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
        { id: 11, servicoId: 7, nome: "Lavagem", valorCentavos: 4000, tempoPermitidoMinutos: 60, status: 2, motivoCancelamento: null, ...SEM_MOMENTOS },
        { id: 12, servicoId: 8, nome: "Cera", valorCentavos: 5050, tempoPermitidoMinutos: null, status: 4, motivoCancelamento: "Cliente desistiu", ...SEM_MOMENTOS },
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
      { patioServicoId: 1, idPatio: 30, nomeServico: "Lavagem", status: 1, placa: "ABC1D23", modelo: "Onix", cor: "Branco", categoria: "Carro pequeno", prisma: "12", entradaEm: "2026-11-11T14:20:00", criadoEm: null, iniciadoEm: null, prontoEm: null, duracaoMinutos: null },
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

describe("momentos do serviço do veículo", () => {
  it("lê quem adicionou, quando, a previsão e a hora em que ficou pronto", () => {
    const [servico] = fromServicosDoVeiculoResponse({
      servicos: [
        {
          patioServicoId: 1,
          nome: "Lavagem",
          status: 3,
          adicionadoEm: "2026-11-11T21:10:00",
          adicionadoPor: "Everton",
          previsaoEm: "2026-11-11T22:20:00",
          prontoEm: "2026-11-11T21:40:00",
        },
      ],
    }).servicos;

    expect(servico).toMatchObject({ adicionadoEm: "2026-11-11T21:10:00", adicionadoPor: "Everton", previsaoEm: "2026-11-11T22:20:00", prontoEm: "2026-11-11T21:40:00" });
  });

  it("aceita os nomes alternativos", () => {
    const [servico] = fromServicosDoVeiculoResponse({
      servicos: [{ patioServicoId: 1, nome: "Cera", status: 2, dataCriacao: "2026-11-11T21:10:00", usuarioNome: "Ana", previsaoConclusao: "2026-11-11T22:00:00", concluidoEm: "2026-11-11T21:50:00" }],
    }).servicos;

    expect(servico).toMatchObject({ adicionadoEm: "2026-11-11T21:10:00", adicionadoPor: "Ana", previsaoEm: "2026-11-11T22:00:00", prontoEm: "2026-11-11T21:50:00" });
  });
});

describe("fromServicosDoComprovante", () => {
  it("lê os serviços, converte o valor para centavos e deixa de fora o cancelado", () => {
    expect(
      fromServicosDoComprovante([
        { nome: "Lavagem simples", valor: 30, status: 2, previsaoEm: "2026-11-11T22:20:00" },
        { nome: "Aspiração interna", valor: 20.5, status: 3, prontoEm: "2026-11-11T21:40:00" },
        { nome: "Cera", valor: 80, status: 4 },
      ]),
    ).toEqual([
      { nome: "Lavagem simples", valorCentavos: 3000, status: 2, previsaoEm: "2026-11-11T22:20:00", prontoEm: null },
      { nome: "Aspiração interna", valorCentavos: 2050, status: 3, previsaoEm: null, prontoEm: "2026-11-11T21:40:00" },
    ]);
  });

  it("descarta item inválido e aceita ausência", () => {
    expect(fromServicosDoComprovante([{ nome: "X", status: 9 }, { valor: 1, status: 1 }, null, "x"])).toEqual([]);
    expect(fromServicosDoComprovante(undefined)).toEqual([]);
  });
});

describe("tempos por categoria e da fila", () => {
  it("lê duração e tempo permitido do preço da categoria; ausente ou 0 vira null", () => {
    const servico = fromServicoResponse({
      servicoId: 1,
      nome: "Lavagem",
      precos: [
        { categoria: 2, valor: 40, duracaoMinutos: 30, tempoPermitidoMinutos: 60 },
        { categoria: 3, valor: 50, tempoPermitidoMinutos: 0 },
      ],
    });
    expect(servico?.precos[0]).toMatchObject({ duracaoMinutos: 30, tempoPermitidoMinutos: 60 });
    expect(servico?.precos[1]).toMatchObject({ duracaoMinutos: null, tempoPermitidoMinutos: null });
  });

  it("lê os tempos do item da fila e aceita os nomes alternativos", () => {
    const base = { patioServicoId: 5, idPatio: 9, nomeServico: "Cera", status: 2, placa: "ABC1D23" };
    const [item] = fromFilaResponse([
      { ...base, dataCriacao: "2026-11-14T10:00:00", dataHoraInicio: "2026-11-14T10:10:00", dataHoraPronto: "2026-11-14T10:40:00", duracaoMinutos: 30 },
    ]);
    expect(item).toMatchObject({ criadoEm: "2026-11-14T10:00:00", iniciadoEm: "2026-11-14T10:10:00", prontoEm: "2026-11-14T10:40:00", duracaoMinutos: 30 });
    const [alternativo] = fromFilaResponse([{ ...base, criadoEm: "a", inicioEm: "b", prontoEm: "c" }]);
    expect(alternativo).toMatchObject({ criadoEm: "a", iniciadoEm: "b", prontoEm: "c" });
  });

  it("item da fila sem os tempos fica com nulos, sem erro", () => {
    const [item] = fromFilaResponse([{ patioServicoId: 5, idPatio: 9, nomeServico: "Cera", status: 1, placa: "ABC1D23" }]);
    expect(item).toMatchObject({ criadoEm: null, iniciadoEm: null, prontoEm: null, duracaoMinutos: null });
  });
});

// Respostas reais do back (swagger de 11/11/2026), com os campos como ele os manda.
describe("respostas reais do back", () => {
  it("fila: a categoria vem como número e a tela mostra o nome; os tempos vêm com os nomes do back", () => {
    const [aguardando, pronto] = fromFilaResponse([
      { patioServicoId: 3, patioId: 117, placa: "KQY8H84", modelo: "", cor: "", categoria: 3, prisma: 123, dataHoraEntrada: "2026-11-11T11:05:11.837072", servicoId: 1, nome: "Lavagem", duracaoMinutos: 30, status: 1, statusDescricao: "Aguardando", dataCriacao: "2026-11-13T09:48:17.378766", dataHoraInicio: null, dataHoraPronto: null },
      { patioServicoId: 2, patioId: 119, placa: "ZPW8C05", modelo: "", cor: "", categoria: 4, prisma: 5, dataHoraEntrada: "2026-11-11T12:08:57.227369", servicoId: 1, nome: "Lavagem", duracaoMinutos: 30, status: 3, statusDescricao: "Pronto", dataCriacao: "2026-11-12T20:46:07.384501", dataHoraInicio: "2026-11-13T07:42:47.570541", dataHoraPronto: "2026-11-13T09:48:35.111189" },
    ]);

    expect(aguardando).toMatchObject({ idPatio: 117, nomeServico: "Lavagem", categoria: "Carro médio", prisma: "123", modelo: null, cor: null, entradaEm: "2026-11-11T11:05:11.837072", criadoEm: "2026-11-13T09:48:17.378766", iniciadoEm: null, prontoEm: null, duracaoMinutos: 30 });
    expect(pronto).toMatchObject({ categoria: "Caminhonete", iniciadoEm: "2026-11-13T07:42:47.570541", prontoEm: "2026-11-13T09:48:35.111189" });
  });

  it("fila: a descrição da categoria, quando vem, vale mais; categoria desconhecida fica como veio", () => {
    const base = { patioServicoId: 1, patioId: 10, nome: "Cera", status: 1, placa: "ABC1D23" };
    const [comDescricao, desconhecida] = fromFilaResponse([{ ...base, categoria: 2, categoriaDescricao: "Carro pequeno" }, { ...base, categoria: 42 }]);

    expect(comDescricao.categoria).toBe("Carro pequeno");
    expect(desconhecida.categoria).toBe("42");
  });

  it("serviços do veículo: a hora de pronto vem de dataHoraPronto e a previsão é o início somado à duração", () => {
    const resposta = fromServicosDoVeiculoResponse({
      patioId: 119,
      dataHoraEntrada: "2026-11-11T12:08:57.227369",
      valorServicos: 100.0,
      tempoPermitidoMinutos: 60,
      livreAte: "2026-11-11T13:08:57.227369",
      servicos: [
        { patioServicoId: 2, patioId: 119, servicoId: 1, nome: "Lavagem", valor: 100.0, tempoPermitidoMinutos: 60, duracaoMinutos: 30, status: 3, statusDescricao: "Pronto", dataCriacao: "2026-11-12T20:46:07.384501", dataHoraInicio: "2026-11-13T07:42:47", dataHoraPronto: "2026-11-13T09:48:35.111189", motivoCancelamento: null },
        { patioServicoId: 3, patioId: 119, servicoId: 2, nome: "Cera", valor: 20.0, tempoPermitidoMinutos: null, duracaoMinutos: null, status: 1, dataCriacao: "2026-11-12T20:46:07", dataHoraInicio: null, dataHoraPronto: null },
      ],
    });

    expect(resposta.servicos[0]).toMatchObject({ valorCentavos: 10000, prontoEm: "2026-11-13T09:48:35.111189", previsaoEm: "2026-11-13T08:12:47", adicionadoEm: "2026-11-12T20:46:07.384501" });
    expect(resposta.servicos[1]).toMatchObject({ previsaoEm: null, prontoEm: null });
  });

  it("serviços do veículo: um previsaoEm explícito do back vale mais que o calculado", () => {
    const { servicos } = fromServicosDoVeiculoResponse({
      servicos: [{ patioServicoId: 1, nome: "Cera", valor: 20, status: 2, previsaoEm: "2026-11-13T10:00:00", dataHoraInicio: "2026-11-13T07:42:47", duracaoMinutos: 30 }],
    });

    expect(servicos[0].previsaoEm).toBe("2026-11-13T10:00:00");
  });

  it("serviços do veículo: a soma atravessa a meia-noite sem errar a data", () => {
    const { servicos } = fromServicosDoVeiculoResponse({
      servicos: [{ patioServicoId: 1, nome: "Cera", valor: 20, status: 2, dataHoraInicio: "2026-11-13T23:50:00", duracaoMinutos: 30 }],
    });

    expect(servicos[0].previsaoEm).toBe("2026-11-14T00:20:00");
  });

  it("catálogo: os tempos de cada categoria vêm no preço e o serviço não tem tempos próprios", () => {
    const servico = fromServicoResponse({
      servicoId: 1,
      nome: "Lavagem",
      descricao: "teste",
      ativo: true,
      precos: [{ categoria: 1, categoriaDescricao: "Moto", valor: 50.0, duracaoMinutos: 30, tempoPermitidoMinutos: 60 }, { categoria: 2, categoriaDescricao: "Carro pequeno", valor: 100.0, duracaoMinutos: null, tempoPermitidoMinutos: null }],
      usuarioId: 47,
      dataCriacao: "2026-11-12T17:31:38.514171",
    });

    expect(servico).toMatchObject({ duracaoMinutos: null, tempoPermitidoMinutos: null });
    expect(servico?.precos).toEqual([
      { categoria: 1, descricao: "Moto", valorCentavos: 5000, duracaoMinutos: 30, tempoPermitidoMinutos: 60 },
      { categoria: 2, descricao: "Carro pequeno", valorCentavos: 10000, duracaoMinutos: null, tempoPermitidoMinutos: null },
    ]);
  });
});
