import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import type { Conveniada } from "@/types/conveniada";

vi.mock("@/lib/api/services/conveniada", () => ({ listConveniadas: vi.fn() }));

import { listConveniadas } from "@/lib/api/services/conveniada";
import { ConveniadasList } from "./ConveniadasList";

const listar = vi.mocked(listConveniadas);

const sul: Conveniada = {
  empresaConvenioId: 1,
  empresaConveniadaId: 10,
  empresaGuid: "g1",
  razaoSocial: "Auto Peças Sul LTDA",
  nomeFantasia: "Sul Peças",
  cnpj: "11222333000181",
  telefone: "11987654321",
  endereco: { logradouro: "Rua X", numero: "10", bairro: "Centro", cidade: "São Paulo", estado: "SP", cep: "01310-100" },
  ativo: true,
  dataCriacao: "2026-03-12T10:00:00",
};
const norte: Conveniada = { ...sul, empresaConvenioId: 2, nomeFantasia: "", razaoSocial: "Norte Ltda", ativo: false };

const onNova = vi.fn();
const onVerTodos = vi.fn();

function renderizar(situacao: "todos" | "ativos" | "encerrados" = "todos") {
  return renderWithProviders(<ConveniadasList situacao={situacao} onNova={onNova} onVerTodos={onVerTodos} />);
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("ConveniadasList", () => {
  it("mostra o carregamento antes da resposta", () => {
    listar.mockReturnValue(new Promise(() => {}));
    renderizar();
    expect(screen.getByRole("status", { name: "Carregando conveniadas" })).toBeInTheDocument();
  });

  it("lista uma linha por convênio com nome, CNPJ, contato, situação e data", async () => {
    listar.mockResolvedValue([sul, norte]);
    renderizar();

    expect(await screen.findByText("Sul Peças")).toBeInTheDocument();
    expect(screen.getByText("Auto Peças Sul LTDA")).toBeInTheDocument();
    expect(screen.getByText("11.222.333/0001-81")).toBeInTheDocument();
    expect(screen.getByText("(11) 98765-4321")).toBeInTheDocument();
    expect(screen.getByText("Rua X, 10 – Centro, São Paulo/SP")).toBeInTheDocument();
    expect(screen.getByText("Ativo")).toBeInTheDocument();
    expect(screen.getByText("Encerrado")).toBeInTheDocument();
    expect(screen.getByText("Norte Ltda")).toBeInTheDocument();
    expect(screen.getByText("12/03/2026", { selector: "td" })).toBeInTheDocument();
    expect(listar).toHaveBeenCalledWith("todos");
  });

  it("pede ao serviço a situação escolhida", async () => {
    listar.mockResolvedValue([sul]);
    renderizar("ativos");
    await screen.findByText("Sul Peças");
    expect(listar).toHaveBeenCalledWith("ativos");
  });

  it("sem convênios e sem filtro, convida a cadastrar a primeira", async () => {
    listar.mockResolvedValue([]);
    const user = userEvent.setup();
    renderizar();

    expect(await screen.findByText("Nenhuma empresa conveniada ainda.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Nova conveniada" }));
    expect(onNova).toHaveBeenCalled();
  });

  it("sem convênios no filtro, oferece ver todos", async () => {
    listar.mockResolvedValue([]);
    const user = userEvent.setup();
    renderizar("encerrados");

    expect(await screen.findByText("Nenhum convênio encerrado.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ver todos" }));
    expect(onVerTodos).toHaveBeenCalled();
  });

  it("no erro, mostra o aviso e tenta novamente", async () => {
    listar.mockRejectedValueOnce(new ApiError("server")).mockResolvedValue([sul]);
    const user = userEvent.setup();
    renderizar();

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar as conveniadas.");
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByText("Sul Peças")).toBeInTheDocument();
  });

  it("no 403, mostra só o aviso de permissão, sem tentar novamente", async () => {
    listar.mockRejectedValue(new ApiError("forbidden", undefined, 403));
    renderizar();

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Você não tem permissão"));
    expect(screen.queryByRole("button", { name: "Tentar novamente" })).not.toBeInTheDocument();
  });
});
