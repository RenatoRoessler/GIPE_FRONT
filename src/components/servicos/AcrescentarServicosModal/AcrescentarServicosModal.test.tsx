import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import type { Servico } from "@/types/servico";

const api = vi.hoisted(() => ({ listServicos: vi.fn(), acrescentarServicos: vi.fn() }));
vi.mock("@/lib/api/services/servico", () => api);

import { AcrescentarServicosModal } from "./AcrescentarServicosModal";

// jsdom não implementa <dialog>.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

const servico = (id: number, nome: string, precos: Servico["precos"], extra: Partial<Servico> = {}): Servico => ({
  id,
  nome,
  descricao: null,
  duracaoMinutos: null,
  tempoPermitidoMinutos: null,
  ativo: true,
  precos,
  ...extra,
});

const preco = (categoria: number, valorCentavos: number) => ({ categoria, descricao: "x", valorCentavos });

function renderizar() {
  const onClose = vi.fn();
  const onAcrescentado = vi.fn();
  renderWithProviders(<AcrescentarServicosModal idPatio={7} placa="SUX7J06" categoria={3} categoriaRotulo="Carro médio" onClose={onClose} onAcrescentado={onAcrescentado} />);
  return { onClose, onAcrescentado };
}

beforeEach(() => {
  vi.clearAllMocks();
  api.listServicos.mockResolvedValue([
    servico(1, "Lavagem simples", [preco(3, 3000)], { descricao: "Externa", duracaoMinutos: 40 }),
    servico(2, "Aspiração interna", [preco(3, 2000)]),
    servico(3, "Calibragem de pneus", [preco(3, 0)]),
    servico(4, "Moto", [preco(1, 5000)]),
    servico(5, "Antigo", [preco(3, 9000)], { ativo: false }),
  ]);
  api.acrescentarServicos.mockResolvedValue(undefined);
});

describe("AcrescentarServicosModal", () => {
  it("mostra a placa, a categoria e os serviços ativos com preço, duração e Grátis", async () => {
    renderizar();

    expect(await screen.findByText("Externa · cerca de 40 min")).toBeInTheDocument();
    expect(screen.getByText("SUX7J06")).toBeInTheDocument();
    expect(screen.getByText(/Carro médio · preços desta categoria/)).toBeInTheDocument();
    expect(screen.getByText("R$ 30,00")).toBeInTheDocument();
    expect(screen.getByText("Grátis")).toBeInTheDocument();
    expect(screen.queryByText("Antigo")).not.toBeInTheDocument();
    // O que não atende a categoria fica desabilitado.
    expect(screen.getByRole("checkbox", { name: /Moto/ })).toBeDisabled();
  });

  it("sem seleção, o botão fica desabilitado", async () => {
    renderizar();
    await screen.findByText("Lavagem simples");

    expect(screen.getByRole("button", { name: "Adicionar ao ticket" })).toBeDisabled();
    expect(screen.getByText("0 serviços selecionados")).toBeInTheDocument();
  });

  it("soma o que foi escolhido no resumo e no botão, e confirma", async () => {
    const { onAcrescentado } = renderizar();
    await screen.findByText("Lavagem simples");

    await userEvent.click(screen.getByRole("checkbox", { name: /Lavagem simples/ }));
    expect(screen.getByText("1 serviço selecionado")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("checkbox", { name: /Aspiração interna/ }));

    expect(screen.getByText("2 serviços selecionados")).toBeInTheDocument();
    expect(screen.getAllByText("+ R$ 50,00")).not.toHaveLength(0);
    await userEvent.click(screen.getByRole("button", { name: "Adicionar ao ticket · + R$ 50,00" }));

    await waitFor(() => expect(api.acrescentarServicos).toHaveBeenCalledWith(7, [1, 2]));
    await waitFor(() => expect(onAcrescentado).toHaveBeenCalledWith(2));
  });

  it("a busca filtra por nome sem acento e a seleção sobrevive a ela", async () => {
    renderizar();
    await screen.findByText("Lavagem simples");
    await userEvent.click(screen.getByRole("checkbox", { name: /Lavagem simples/ }));

    await userEvent.type(screen.getByLabelText("Buscar serviço"), "aspiracao");

    expect(screen.queryByText("Lavagem simples")).not.toBeInTheDocument();
    expect(screen.getByText("Aspiração interna")).toBeInTheDocument();
    expect(screen.getByText("1 serviço selecionado")).toBeInTheDocument();
  });

  it("busca sem resultado oferece limpar", async () => {
    renderizar();
    await screen.findByText("Lavagem simples");

    await userEvent.type(screen.getByLabelText("Buscar serviço"), "zzz");
    expect(screen.getByText("Nenhum serviço encontrado.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Limpar busca" }));
    expect(screen.getByText("Lavagem simples")).toBeInTheDocument();
  });

  it("catálogo sem serviço ativo diz isso", async () => {
    api.listServicos.mockResolvedValue([servico(5, "Antigo", [preco(3, 9000)], { ativo: false })]);
    renderizar();

    expect(await screen.findByText("Nenhum serviço ativo no catálogo.")).toBeInTheDocument();
  });

  it("erro ao carregar o catálogo permite tentar de novo", async () => {
    api.listServicos.mockRejectedValueOnce(new ApiError("server", "Falha ao carregar."));
    renderizar();

    expect(await screen.findByRole("alert")).toHaveTextContent("Falha ao carregar.");
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByText("Lavagem simples")).toBeInTheDocument();
  });

  it("erro ao enviar mostra a mensagem do back e mantém a seleção", async () => {
    api.acrescentarServicos.mockRejectedValue(new ApiError("validation", "Serviço já está no veículo."));
    const { onAcrescentado } = renderizar();
    await screen.findByText("Lavagem simples");
    await userEvent.click(screen.getByRole("checkbox", { name: /Lavagem simples/ }));
    await userEvent.click(screen.getByRole("button", { name: /Adicionar ao ticket/ }));

    const alerta = await screen.findByRole("alert");
    expect(within(alerta).getByText("Serviço já está no veículo.")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /Lavagem simples/ })).toBeChecked();
    expect(onAcrescentado).not.toHaveBeenCalled();
  });

  it("fechar não adiciona nada", async () => {
    const { onClose } = renderizar();
    await screen.findByText("Lavagem simples");

    await userEvent.click(screen.getByRole("button", { name: "Fechar" }));

    expect(onClose).toHaveBeenCalled();
    expect(api.acrescentarServicos).not.toHaveBeenCalled();
  });
});
