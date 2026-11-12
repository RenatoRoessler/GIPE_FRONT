import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../client", () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }));

import { api } from "../client";
import { ApiError } from "../errors";
import {
  acrescentarServicos,
  atualizarServico,
  atualizarStatusServico,
  cancelarServico,
  criarServico,
  getServico,
  inativarServico,
  listFila,
  listServicos,
  listServicosDoVeiculo,
} from "./servico";

const get = vi.mocked(api.get);
const post = vi.mocked(api.post);
const put = vi.mocked(api.put);
const del = vi.mocked(api.delete);

const payload = { nome: "Lavagem", descricao: null, duracaoMinutos: 60, tempoPermitidoMinutos: null, precos: [{ categoria: 99, valor: 50 }] };

beforeEach(() => {
  vi.resetAllMocks();
});

describe("catálogo de serviços", () => {
  it("lista todos, sem o parâmetro `ativo`", async () => {
    get.mockResolvedValue({ data: [{ servicoId: 1, nome: "Cera" }] });

    expect(await listServicos()).toHaveLength(1);
    expect(get).toHaveBeenCalledWith("/Servico", undefined);
  });

  it("filtra por ativo, inclusive `false`", async () => {
    get.mockResolvedValue({ data: [] });

    await listServicos(false);
    expect(get).toHaveBeenCalledWith("/Servico", { params: { ativo: false } });
    await listServicos(true);
    expect(get).toHaveBeenLastCalledWith("/Servico", { params: { ativo: true } });
  });

  it("lê um serviço", async () => {
    get.mockResolvedValue({ data: { servicoId: 4, nome: "Polimento" } });

    expect(await getServico(4)).toMatchObject({ id: 4, nome: "Polimento" });
    expect(get).toHaveBeenCalledWith("/Servico/4");
  });

  it("cadastra com POST e edita com PUT, mandando o corpo como está", async () => {
    post.mockResolvedValue({ data: { servicoId: 9, nome: "Lavagem" } });
    put.mockResolvedValue({ data: { servicoId: 9, nome: "Lavagem" } });

    expect(await criarServico(payload)).toMatchObject({ id: 9 });
    expect(post).toHaveBeenCalledWith("/Servico", payload);
    await atualizarServico(9, payload);
    expect(put).toHaveBeenCalledWith("/Servico/9", payload);
  });

  it("cadastro sem corpo na resposta devolve null", async () => {
    post.mockResolvedValue({ data: "" });
    expect(await criarServico(payload)).toBeNull();
  });

  it("inativa com DELETE, com ou sem corpo (200 e 204)", async () => {
    del.mockResolvedValueOnce({ data: { ok: true } }).mockResolvedValueOnce({ data: "" });

    await expect(inativarServico(3)).resolves.toBeUndefined();
    await expect(inativarServico(3)).resolves.toBeUndefined();
    expect(del).toHaveBeenCalledWith("/Servico/3");
  });

  it("o 400 do back sobe como ApiError de validação", async () => {
    post.mockRejectedValue(new ApiError("validation", "Já existe um serviço ativo com esse nome."));

    await expect(criarServico(payload)).rejects.toMatchObject({ kind: "validation", message: "Já existe um serviço ativo com esse nome." });
  });
});

describe("fila", () => {
  it("lê a fila inteira e filtra por um status", async () => {
    get.mockResolvedValue({ data: [] });

    await listFila();
    expect(get).toHaveBeenCalledWith("/Servico/fila", undefined);
    await listFila(2);
    expect(get).toHaveBeenLastCalledWith("/Servico/fila", { params: { status: 2 } });
  });
});

describe("serviços do veículo no pátio", () => {
  it("lista sem cancelados por padrão e com cancelados quando pedido", async () => {
    get.mockResolvedValue({ data: { servicos: [] } });

    await listServicosDoVeiculo(30);
    expect(get).toHaveBeenCalledWith("/patio/30/servico", undefined);
    await listServicosDoVeiculo(30, { incluirCancelados: true });
    expect(get).toHaveBeenLastCalledWith("/patio/30/servico", { params: { incluirCancelados: true } });
  });

  it("acrescenta com os ids e devolve os serviços do veículo", async () => {
    post.mockResolvedValue({ data: { valorServicos: 40, servicos: [{ patioServicoId: 1, nome: "Lavagem", valor: 40, status: 1 }] } });

    const veiculo = await acrescentarServicos(30, [1, 3]);

    expect(post).toHaveBeenCalledWith("/patio/30/servico", { servicoIds: [1, 3] });
    expect(veiculo.valorServicosCentavos).toBe(4000);
    expect(veiculo.servicos).toHaveLength(1);
  });

  it("troca o status e cancela com o motivo", async () => {
    put.mockResolvedValue({ data: { servicos: [] } });

    await atualizarStatusServico(30, 11, 2);
    expect(put).toHaveBeenCalledWith("/patio/30/servico/11/status", { status: 2 });
    await cancelarServico(30, 11, "Cliente desistiu");
    expect(put).toHaveBeenLastCalledWith("/patio/30/servico/11/cancelar", { motivo: "Cliente desistiu" });
  });

  it("cancelar um serviço que já começou sobe como ApiError de validação", async () => {
    put.mockRejectedValue(new ApiError("validation", "Só serviço Aguardando pode ser cancelado."));

    await expect(cancelarServico(30, 11, "x")).rejects.toMatchObject({ kind: "validation" });
  });
});
