import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import { STATUS_SERVICO, type ItemFila } from "@/types/servico";

const api = vi.hoisted(() => ({ listFila: vi.fn(), atualizarStatusServico: vi.fn(), cancelarServico: vi.fn() }));
vi.mock("@/lib/api/services/servico", () => api);

const sessao = vi.hoisted(() => ({ atual: { user: { name: "Ana", perfil: 1 }, isLoading: false } }));
vi.mock("@/contexts/CurrentUserContext", () => ({ useCurrentUser: () => sessao.atual }));

const navegacao = vi.hoisted(() => ({ replace: vi.fn(), params: new URLSearchParams(), celular: false }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: navegacao.replace }),
  usePathname: () => "/servicos",
  useSearchParams: () => navegacao.params,
}));
vi.mock("@/hooks/useMediaQuery", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/hooks/useMediaQuery")>()),
  useIsMobile: () => navegacao.celular,
}));

import { FilaServicos, statusDaUrl, textoAtualizado } from "./FilaServicos";

const item = (patioServicoId: number, nomeServico: string, status: ItemFila["status"], placa: string, extra: Partial<ItemFila> = {}): ItemFila => ({
  patioServicoId,
  idPatio: 100 + patioServicoId,
  nomeServico,
  status,
  placa,
  modelo: "Gol",
  cor: "Prata",
  categoria: "Carro pequeno",
  prisma: null,
  entradaEm: null,
  ...extra,
});

const FILA = [
  item(1, "Lavagem completa", STATUS_SERVICO.Aguardando, "ABC1D23", { prisma: "12" }),
  item(2, "Polimento", STATUS_SERVICO.Aguardando, "DEF4G56"),
  item(3, "Cera", STATUS_SERVICO.EmExecucao, "GHI7J89"),
  item(4, "Higienização", STATUS_SERVICO.Pronto, "JKL0M12"),
];

// jsdom não implementa <dialog>.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  navegacao.params = new URLSearchParams();
  navegacao.celular = false;
  sessao.atual = { user: { name: "Ana", perfil: 1 }, isLoading: false };
  api.listFila.mockResolvedValue(FILA);
  api.atualizarStatusServico.mockResolvedValue(undefined);
  api.cancelarServico.mockResolvedValue(undefined);
});

describe("statusDaUrl e textoAtualizado", () => {
  it("usa a coluna do endereço ou Aguardando", () => {
    expect(statusDaUrl("3")).toBe(STATUS_SERVICO.Pronto);
    expect(statusDaUrl("4")).toBe(STATUS_SERVICO.Aguardando);
    expect(statusDaUrl(null)).toBe(STATUS_SERVICO.Aguardando);
  });

  it("diz há quanto tempo a fila foi atualizada", () => {
    expect(textoAtualizado(0, 5000)).toBeNull();
    expect(textoAtualizado(1000, 13_000)).toBe("Atualizado há 12 s");
    expect(textoAtualizado(1000, 181_000)).toBe("Atualizado há 3 min");
  });
});

describe("FilaServicos: desktop", () => {
  it("mostra o esqueleto enquanto carrega", () => {
    api.listFila.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<FilaServicos />);

    expect(screen.getByRole("status", { name: "Carregando a fila" })).toBeInTheDocument();
  });

  it("mostra as três colunas, cada uma com nome e contagem", async () => {
    renderWithProviders(<FilaServicos />);

    const aguardando = await screen.findByRole("region", { name: "Aguardando, 2 serviços" });
    expect(within(aguardando).getByText("Lavagem completa")).toBeInTheDocument();
    expect(within(aguardando).getByText("Prisma 12")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Em execução, 1 serviço" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Pronto, 1 serviço" })).toBeInTheDocument();
  });

  it("diz quando uma coluna está vazia", async () => {
    api.listFila.mockResolvedValue([item(1, "Cera", STATUS_SERVICO.Aguardando, "ABC1D23")]);
    renderWithProviders(<FilaServicos />);

    expect(await screen.findByText("Nenhum serviço em execução.")).toBeInTheDocument();
    expect(screen.getByText("Nenhum serviço pronto.")).toBeInTheDocument();
  });

  it("diz quando a fila toda está vazia", async () => {
    api.listFila.mockResolvedValue([]);
    renderWithProviders(<FilaServicos />);

    expect(await screen.findByText(/Nenhum serviço na fila\./)).toBeInTheDocument();
  });

  it("mostra o erro com a opção de tentar de novo", async () => {
    api.listFila.mockRejectedValue(new ApiError("server", "Falha ao carregar a fila."));
    renderWithProviders(<FilaServicos />);

    expect(await screen.findByText("Falha ao carregar a fila.")).toBeInTheDocument();
    api.listFila.mockResolvedValue(FILA);
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findByText("Lavagem completa")).toBeInTheDocument();
  });

  it("a ação principal depende do status do cartão", async () => {
    renderWithProviders(<FilaServicos />);
    await screen.findByText("Cera");

    expect(screen.getAllByRole("button", { name: "Iniciar" })).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Marcar como pronto" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Voltar para em execução" })).toBeInTheDocument();
  });
});

describe("FilaServicos: trocar o status", () => {
  it("envia a troca, avisa e oferece desfazer", async () => {
    renderWithProviders(<FilaServicos />);
    const aguardando = await screen.findByRole("region", { name: "Aguardando, 2 serviços" });

    await userEvent.click(within(aguardando).getAllByRole("button", { name: "Iniciar" })[0]);

    await waitFor(() => expect(api.atualizarStatusServico).toHaveBeenCalledWith(101, 1, STATUS_SERVICO.EmExecucao));
    expect(await screen.findByText("Serviço em execução.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Desfazer" })).toBeInTheDocument();
  });

  it("desfazer manda o serviço de volta ao status de antes", async () => {
    renderWithProviders(<FilaServicos />);
    const aguardando = await screen.findByRole("region", { name: "Aguardando, 2 serviços" });
    await userEvent.click(within(aguardando).getAllByRole("button", { name: "Iniciar" })[0]);

    await userEvent.click(await screen.findByRole("button", { name: "Desfazer" }));

    await waitFor(() => expect(api.atualizarStatusServico).toHaveBeenLastCalledWith(101, 1, STATUS_SERVICO.Aguardando));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Desfazer" })).not.toBeInTheDocument());
  });

  it("se o back recusar, o cartão volta e aparece o erro", async () => {
    api.atualizarStatusServico.mockRejectedValue(new ApiError("validation", "Serviço já foi cancelado."));
    renderWithProviders(<FilaServicos />);
    const aguardando = await screen.findByRole("region", { name: "Aguardando, 2 serviços" });

    await userEvent.click(within(aguardando).getAllByRole("button", { name: "Iniciar" })[0]);

    expect(await screen.findByText("Serviço já foi cancelado.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Desfazer" })).not.toBeInTheDocument();
  });

  it("voltar um serviço pronto não oferece desfazer", async () => {
    renderWithProviders(<FilaServicos />);
    await userEvent.click(await screen.findByRole("button", { name: "Voltar para em execução" }));

    await waitFor(() => expect(api.atualizarStatusServico).toHaveBeenCalledWith(104, 4, STATUS_SERVICO.EmExecucao));
    expect(await screen.findByText("Serviço em execução.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Desfazer" })).not.toBeInTheDocument();
  });
});

describe("FilaServicos: cancelar", () => {
  it("só o cartão Aguardando tem Cancelar", async () => {
    renderWithProviders(<FilaServicos />);
    await screen.findByText("Cera");

    expect(screen.getAllByRole("button", { name: "Cancelar serviço" })).toHaveLength(2);
  });

  it("o Lavador não cancela", async () => {
    sessao.atual = { user: { name: "Leo", perfil: 9 }, isLoading: false };
    renderWithProviders(<FilaServicos />);
    await screen.findByText("Cera");

    expect(screen.queryByRole("button", { name: "Cancelar serviço" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Iniciar" })).toHaveLength(2);
  });

  it("exige o motivo e cancela o serviço", async () => {
    renderWithProviders(<FilaServicos />);
    await screen.findByText("Cera");
    await userEvent.click(screen.getAllByRole("button", { name: "Cancelar serviço" })[0]);

    const dialogo = await screen.findByRole("dialog");
    const confirmar = within(dialogo).getByRole("button", { name: "Cancelar serviço" });
    expect(confirmar).toBeDisabled();

    await userEvent.type(within(dialogo).getByLabelText("Motivo"), "Cliente desistiu");
    await userEvent.click(confirmar);

    await waitFor(() => expect(api.cancelarServico).toHaveBeenCalledWith(101, 1, "Cliente desistiu"));
    expect(await screen.findByText("Serviço cancelado.")).toBeInTheDocument();
  });

  it("mostra o erro do back no diálogo e mantém o motivo", async () => {
    api.cancelarServico.mockRejectedValue(new ApiError("validation", "Serviço já iniciado."));
    renderWithProviders(<FilaServicos />);
    await screen.findByText("Cera");
    await userEvent.click(screen.getAllByRole("button", { name: "Cancelar serviço" })[0]);
    const dialogo = await screen.findByRole("dialog");

    await userEvent.type(within(dialogo).getByLabelText("Motivo"), "Engano");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Cancelar serviço" }));

    expect(await within(dialogo).findByText("Serviço já iniciado.")).toBeInTheDocument();
    expect(within(dialogo).getByLabelText("Motivo")).toHaveValue("Engano");
  });
});

describe("FilaServicos: celular", () => {
  beforeEach(() => {
    navegacao.celular = true;
  });

  it("mostra abas com a contagem e só a coluna escolhida", async () => {
    renderWithProviders(<FilaServicos />);

    expect(await screen.findByRole("tab", { name: "Aguardando (2)" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Em execução (1)" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Pronto (1)" })).toBeInTheDocument();
    expect(screen.getByText("Lavagem completa")).toBeInTheDocument();
    expect(screen.queryByText("Cera")).not.toBeInTheDocument();
  });

  it("abre na coluna do endereço e troca de aba pelo endereço", async () => {
    navegacao.params = new URLSearchParams("status=2");
    renderWithProviders(<FilaServicos />);

    expect(await screen.findByText("Cera")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: "Pronto (1)" }));

    expect(navegacao.replace).toHaveBeenCalledWith("/servicos?aba=fila&status=3", { scroll: false });
  });
});
