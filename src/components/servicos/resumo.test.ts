import { describe, expect, it } from "vitest";
import { STATUS_SERVICO, type ServicoDoVeiculo, type ServicosDoVeiculo } from "@/types/servico";
import { avisoDePendentes, dividirValor, resumirServicos } from "./resumo";

const servico = (id: number, status: ServicoDoVeiculo["status"]): ServicoDoVeiculo => ({
  id,
  servicoId: id,
  nome: `Serviço ${id}`,
  valorCentavos: 3000,
  tempoPermitidoMinutos: null,
  status,
  motivoCancelamento: null,
  adicionadoEm: null,
  adicionadoPor: null,
  previsaoEm: null,
  prontoEm: null,
});

const dados = (servicos: ServicoDoVeiculo[], valorServicosCentavos = 5000): ServicosDoVeiculo => ({
  valorServicosCentavos,
  tempoPermitidoMinutos: null,
  livreAte: null,
  servicos,
});

describe("resumirServicos", () => {
  it("conta pendentes (na fila e em andamento) e prontos, e usa o subtotal do back", () => {
    const resumo = resumirServicos(dados([servico(1, STATUS_SERVICO.Aguardando), servico(2, STATUS_SERVICO.EmExecucao), servico(3, STATUS_SERVICO.Pronto)], 9000));
    expect(resumo).toMatchObject({ pendentes: 2, prontos: 1, subtotalCentavos: 9000 });
    expect(resumo.ativos).toHaveLength(3);
  });

  it("deixa o cancelado de fora", () => {
    const resumo = resumirServicos(dados([servico(1, STATUS_SERVICO.Cancelado), servico(2, STATUS_SERVICO.Pronto)]));
    expect(resumo.ativos.map((item) => item.id)).toEqual([2]);
    expect(resumo.pendentes).toBe(0);
  });

  it("tudo cancelado ou sem dados não tem serviço nem pendência", () => {
    expect(resumirServicos(dados([servico(1, STATUS_SERVICO.Cancelado)], 0))).toMatchObject({ ativos: [], pendentes: 0, prontos: 0, subtotalCentavos: 0 });
    expect(resumirServicos(undefined)).toEqual({ ativos: [], pendentes: 0, prontos: 0, subtotalCentavos: 0 });
  });
});

describe("avisoDePendentes", () => {
  it("não avisa sem pendência", () => {
    expect(avisoDePendentes(0)).toBeNull();
  });

  it("usa singular e plural", () => {
    expect(avisoDePendentes(1)).toBe("1 serviço ainda não está pronto.");
    expect(avisoDePendentes(2)).toBe("2 serviços ainda não estão prontos.");
  });
});

describe("dividirValor", () => {
  it("separa a estadia dos serviços quando o valor até agora já os inclui", () => {
    expect(dividirValor(90, 5000)).toEqual({ estadiaCentavos: 4000, servicosCentavos: 5000, totalCentavos: 9000 });
  });

  it("não deixa a estadia ficar negativa se o valor for menor que o subtotal", () => {
    expect(dividirValor(30, 5000)).toEqual({ estadiaCentavos: 0, servicosCentavos: 5000, totalCentavos: 3000 });
  });

  it("não perde centavo com valores quebrados", () => {
    expect(dividirValor(90.1, 5000)).toEqual({ estadiaCentavos: 4010, servicosCentavos: 5000, totalCentavos: 9010 });
  });
});
