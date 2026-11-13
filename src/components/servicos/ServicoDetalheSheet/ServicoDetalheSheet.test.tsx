import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import { STATUS_SERVICO, type ServicoDoVeiculo } from "@/types/servico";

const api = vi.hoisted(() => ({ atualizarStatusServico: vi.fn(), cancelarServico: vi.fn(), listFila: vi.fn() }));
vi.mock("@/lib/api/services/servico", () => api);

const sessao = vi.hoisted(() => ({ atual: { user: { name: "Ana", perfil: 1 }, isLoading: false } }));
vi.mock("@/contexts/CurrentUserContext", () => ({ useCurrentUser: () => sessao.atual }));

vi.mock("@/hooks/useMediaQuery", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/hooks/useMediaQuery")>()),
  useIsMobile: () => false,
}));

import { ServicoDetalheSheet } from "./ServicoDetalheSheet";

// jsdom não implementa <dialog>.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

const servico = (status: ServicoDoVeiculo["status"], extra: Partial<ServicoDoVeiculo> = {}): ServicoDoVeiculo => ({
  id: 11,
  servicoId: 7,
  nome: "Lavagem simples",
  valorCentavos: 3000,
  tempoPermitidoMinutos: null,
  status,
  motivoCancelamento: null,
  adicionadoEm: "2026-11-11T21:10:00",
  adicionadoPor: "Everton",
  previsaoEm: null,
  prontoEm: null,
  ...extra,
});

function renderizar(item: ServicoDoVeiculo) {
  const onClose = vi.fn();
  const onAviso = vi.fn();
  renderWithProviders(<ServicoDetalheSheet idPatio={7} placa="SUX7J06" servico={item} onClose={onClose} onAviso={onAviso} />);
  return { onClose, onAviso };
}

beforeEach(() => {
  vi.clearAllMocks();
  sessao.atual = { user: { name: "Ana", perfil: 1 }, isLoading: false };
  api.atualizarStatusServico.mockResolvedValue(undefined);
  api.cancelarServico.mockResolvedValue({ valorServicosCentavos: 0, tempoPermitidoMinutos: null, livreAte: null, servicos: [] });
  api.listFila.mockResolvedValue([]);
});

describe("ServicoDetalheSheet", () => {
  it("mostra o nome, o valor e quem adicionou e quando", () => {
    renderizar(servico(STATUS_SERVICO.EmExecucao));

    expect(screen.getByRole("dialog", { name: "Lavagem simples" })).toBeInTheDocument();
    expect(screen.getByText("R$ 30,00")).toBeInTheDocument();
    expect(screen.getByText(/adicionado às 21:10 por Everton/)).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Em andamento" })).toBeChecked();
  });

  it("omite o que o back não mandou", () => {
    renderizar(servico(STATUS_SERVICO.Aguardando, { adicionadoEm: null, adicionadoPor: null }));

    expect(screen.queryByText(/adicionado/)).not.toBeInTheDocument();
  });

  it("troca o status e avisa", async () => {
    const { onAviso } = renderizar(servico(STATUS_SERVICO.Aguardando));

    await userEvent.click(screen.getByRole("radio", { name: "Pronto" }));

    await waitFor(() => expect(api.atualizarStatusServico).toHaveBeenCalledWith(7, 11, STATUS_SERVICO.Pronto));
    await waitFor(() => expect(onAviso).toHaveBeenCalledWith("Serviço pronto."));
  });

  it("escolher o status que já é não chama a API", async () => {
    renderizar(servico(STATUS_SERVICO.Aguardando));

    await userEvent.click(screen.getByRole("radio", { name: "Na fila" }));

    expect(api.atualizarStatusServico).not.toHaveBeenCalled();
  });

  it("mostra o erro quando o back recusa a troca", async () => {
    api.atualizarStatusServico.mockRejectedValue(new ApiError("server", "Falha ao atualizar."));
    renderizar(servico(STATUS_SERVICO.Aguardando));

    await userEvent.click(screen.getByRole("radio", { name: "Em andamento" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Falha ao atualizar.");
  });

  it("remover serviço da fila pede o motivo, cancela, fecha e avisa", async () => {
    const { onClose, onAviso } = renderizar(servico(STATUS_SERVICO.Aguardando));

    await userEvent.click(screen.getByRole("button", { name: "Remover serviço" }));
    const dialogo = await screen.findByLabelText("Motivo");
    await userEvent.type(dialogo, "Engano");
    await userEvent.click(within(dialogo.closest("dialog") as HTMLElement).getByRole("button", { name: "Cancelar serviço" }));

    await waitFor(() => expect(api.cancelarServico).toHaveBeenCalledWith(7, 11, "Engano"));
    await waitFor(() => expect(onAviso).toHaveBeenCalledWith("Serviço removido."));
    expect(onClose).toHaveBeenCalled();
  });

  it.each([STATUS_SERVICO.EmExecucao, STATUS_SERVICO.Pronto])("com o serviço em %s não oferece remover e explica", (status) => {
    renderizar(servico(status));

    expect(screen.queryByRole("button", { name: "Remover serviço" })).not.toBeInTheDocument();
    expect(screen.getByText("Só é possível remover serviço que ainda está na fila.")).toBeInTheDocument();
  });

  it("o Lavador troca o status, mas não remove", () => {
    sessao.atual = { user: { name: "Leo", perfil: 9 }, isLoading: false };
    renderizar(servico(STATUS_SERVICO.Aguardando));

    expect(screen.getByRole("radio", { name: "Pronto" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Remover serviço" })).not.toBeInTheDocument();
  });

  it("perfil sem permissão de serviços só vê o status", () => {
    sessao.atual = { user: { name: "Zé", perfil: 6 }, isLoading: false };
    renderizar(servico(STATUS_SERVICO.Aguardando));

    expect(screen.getByRole("radio", { name: "Pronto" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Remover serviço" })).not.toBeInTheDocument();
  });
});
