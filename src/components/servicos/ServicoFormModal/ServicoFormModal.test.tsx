import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import type { Servico } from "@/types/servico";

const api = vi.hoisted(() => ({ criarServico: vi.fn(), atualizarServico: vi.fn(), listServicos: vi.fn() }));
vi.mock("@/lib/api/services/servico", () => api);

import { ServicoFormModal } from "./ServicoFormModal";
import { valoresIniciais } from "./valores";

const EXISTENTE: Servico = {
  id: 7,
  nome: "Lavagem completa",
  descricao: "Externa",
  duracaoMinutos: 60,
  tempoPermitidoMinutos: 180,
  ativo: true,
  precos: [
    { categoria: 2, descricao: "Carro pequeno", valorCentavos: 4010 },
    { categoria: 99, descricao: "Todas", valorCentavos: 5000 },
  ],
};

// jsdom não implementa <dialog>.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

const onClose = vi.fn();
const onSaved = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

describe("valoresIniciais", () => {
  it("vazio para um serviço novo, sem compartilhar o objeto de preços", () => {
    const a = valoresIniciais();
    a.precos[1] = "x";

    expect(valoresIniciais().precos[1]).toBe("");
    expect(valoresIniciais()).toMatchObject({ nome: "", precoTodas: "" });
  });

  it("na edição leva os dados do serviço, com os valores em reais com vírgula", () => {
    expect(valoresIniciais(EXISTENTE)).toMatchObject({
      nome: "Lavagem completa",
      descricao: "Externa",
      duracaoMinutos: "60",
      tempoPermitidoMinutos: "180",
      precoTodas: "50,00",
    });
    expect(valoresIniciais(EXISTENTE).precos[2]).toBe("40,10");
    expect(valoresIniciais(EXISTENTE).precos[1]).toBe("");
  });

  it("tempo e duração ausentes ficam vazios", () => {
    expect(valoresIniciais({ ...EXISTENTE, duracaoMinutos: null, tempoPermitidoMinutos: null })).toMatchObject({ duracaoMinutos: "", tempoPermitidoMinutos: "" });
  });
});

describe("ServicoFormModal", () => {
  it("serviço novo: mostra os campos, os preços por categoria e não avisa sobre edição", () => {
    renderWithProviders(<ServicoFormModal onClose={onClose} onSaved={onSaved} />);

    expect(screen.getByRole("dialog", { name: "Novo serviço" })).toBeInTheDocument();
    for (const rotulo of ["Nome", "Duração estimada (min)", "Tempo permitido (min)", "Todas as categorias", "Moto", "Carro pequeno", "Carro médio", "Caminhonete", "Caminhão", "Carro grande"]) {
      expect(screen.getByLabelText(rotulo)).toBeInTheDocument();
    }
    expect(screen.queryByText(/Editar não altera/)).not.toBeInTheDocument();
  });

  it("não envia sem nome nem preço e mostra os dois avisos", async () => {
    renderWithProviders(<ServicoFormModal onClose={onClose} onSaved={onSaved} />);

    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("Informe o nome do serviço.")).toBeInTheDocument();
    expect(screen.getByText("Informe ao menos um preço.")).toBeInTheDocument();
    expect(api.criarServico).not.toHaveBeenCalled();
  });

  it("rejeita preço zero", async () => {
    renderWithProviders(<ServicoFormModal onClose={onClose} onSaved={onSaved} />);

    await userEvent.type(screen.getByLabelText("Nome"), "Cera");
    await userEvent.type(screen.getByLabelText("Todas as categorias"), "0");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText(/Informe um valor maior que zero/)).toBeInTheDocument();
    expect(api.criarServico).not.toHaveBeenCalled();
  });

  it("o campo de minutos só aceita dígitos: a vírgula digitada é descartada", async () => {
    renderWithProviders(<ServicoFormModal onClose={onClose} onSaved={onSaved} />);

    await userEvent.type(screen.getByLabelText("Duração estimada (min)"), "4,5a");

    expect(screen.getByLabelText("Duração estimada (min)")).toHaveValue("45");
  });

  it("cadastra mandando os valores em reais, só as categorias preenchidas e tempo permitido 0 como null", async () => {
    api.criarServico.mockResolvedValue({ ...EXISTENTE, id: 9 });
    renderWithProviders(<ServicoFormModal onClose={onClose} onSaved={onSaved} />);

    await userEvent.type(screen.getByLabelText("Nome"), "  Cera  ");
    await userEvent.type(screen.getByLabelText("Tempo permitido (min)"), "0");
    await userEvent.type(screen.getByLabelText("Todas as categorias"), "50");
    await userEvent.type(screen.getByLabelText("Moto"), "20,50");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith("Serviço criado.", expect.objectContaining({ id: 9 })));
    expect(api.criarServico).toHaveBeenCalledWith({
      nome: "Cera",
      descricao: null,
      duracaoMinutos: null,
      tempoPermitidoMinutos: null,
      precos: [
        { categoria: 1, valor: 20.5 },
        { categoria: 99, valor: 50 },
      ],
    });
  });

  it("edição: vem preenchida, avisa que não altera veículos e grava com PUT", async () => {
    api.atualizarServico.mockResolvedValue(EXISTENTE);
    renderWithProviders(<ServicoFormModal servico={EXISTENTE} onClose={onClose} onSaved={onSaved} />);

    expect(screen.getByRole("dialog", { name: "Editar serviço" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toHaveValue("Lavagem completa");
    expect(screen.getByLabelText("Carro pequeno")).toHaveValue("40,10");
    expect(screen.getByText(/Editar não altera os serviços que já foram acrescentados/)).toBeInTheDocument();

    await userEvent.clear(screen.getByLabelText("Nome"));
    await userEvent.type(screen.getByLabelText("Nome"), "Lavagem premium");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith("Serviço atualizado.", EXISTENTE));
    expect(api.atualizarServico).toHaveBeenCalledWith(7, expect.objectContaining({ nome: "Lavagem premium", precos: expect.arrayContaining([{ categoria: 2, valor: 40.1 }]) }));
  });

  it("o erro do back (nome repetido) aparece no topo, mantém o que foi digitado e não fecha", async () => {
    api.criarServico.mockRejectedValue(new ApiError("validation", "Já existe um serviço ativo com esse nome."));
    renderWithProviders(<ServicoFormModal onClose={onClose} onSaved={onSaved} />);

    await userEvent.type(screen.getByLabelText("Nome"), "Lavagem");
    await userEvent.type(screen.getByLabelText("Todas as categorias"), "50");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Já existe um serviço ativo com esse nome.");
    expect(screen.getByLabelText("Nome")).toHaveValue("Lavagem");
    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeEnabled();
  });

  it("durante o envio trava os botões e mostra Salvando...", async () => {
    api.criarServico.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<ServicoFormModal onClose={onClose} onSaved={onSaved} />);

    await userEvent.type(screen.getByLabelText("Nome"), "Cera");
    await userEvent.type(screen.getByLabelText("Todas as categorias"), "50");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByRole("button", { name: "Salvando..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
  });

  it("Cancelar fecha sem gravar", async () => {
    renderWithProviders(<ServicoFormModal onClose={onClose} onSaved={onSaved} />);

    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(api.criarServico).not.toHaveBeenCalled();
  });
});
