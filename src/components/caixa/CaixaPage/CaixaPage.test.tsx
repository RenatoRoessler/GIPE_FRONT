import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import type { Caixa, Movimento, Turno } from "@/types/caixa";

const caixa = vi.hoisted(() => ({ atual: {} as Record<string, unknown> }));
vi.mock("../useCaixa", () => ({ useCaixa: () => caixa.atual, CAIXA_KEY: ["caixa"] }));

const sessao = vi.hoisted(() => ({
  atual: { user: { name: "Maria", perfil: 1 } as { name: string; perfil: number | null } | null, isLoading: false },
}));
vi.mock("@/contexts/CurrentUserContext", () => ({ useCurrentUser: () => sessao.atual }));

import { CaixaPage } from "./CaixaPage";

const consulta = (extra: Record<string, unknown>) => ({
  isPending: false,
  isError: false,
  isFetching: false,
  data: undefined,
  error: null,
  refetch: vi.fn(),
  ...extra,
});

const aberto: Caixa = { caixaId: 1, dataHoraAbertura: "2026-10-23T08:00:00", valorFundoCaixa: 100, valorTotalEntrada: 500, valorTotalSaida: 120, saldoAtual: 380 };

const turno: Turno = {
  turnoId: 1,
  caixaId: 1,
  usuarioId: 1,
  usuario: "Ana",
  usuarioIdFechamento: null,
  dataHoraInicio: "2026-10-23T08:00:00",
  dataHoraFim: null,
  valorFundoCaixa: 100,
  status: 1,
  saldoCaixa: 380,
  totalEntradas: 500,
  totalSaidas: 120,
  totalSaida: null,
  saldoCaixaInformado: null,
  totalDiferenca: null,
  observacao: null,
  disponivelSangria: 300,
  formasPagamento: [{ formaPagamento: 1, entradas: 400, saidas: 100, valorEsperado: 300, valorInformado: null, diferenca: null }],
};

const movimento: Movimento = {
  movimentoId: 1,
  dataHora: "2026-10-23T09:00:00",
  tipo: "entrada",
  valor: 25,
  formaPagamento: 1,
  turnoId: 1,
  usuario: "Ana",
  motivo: null,
};

function caixaAberto(extra: Record<string, unknown> = {}) {
  caixa.atual = {
    caixaQuery: consulta({ data: aberto }),
    caixa: aberto,
    turnoQuery: consulta({ data: turno }),
    movimentosQuery: consulta({ data: [movimento] }),
    ...extra,
  };
}

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
  caixa.atual = {};
  sessao.atual = { user: { name: "Maria", perfil: 1 }, isLoading: false };
});

describe("CaixaPage: carregando e erros", () => {
  it("enquanto o caixa carrega mostra o esqueleto", () => {
    caixa.atual = { caixaQuery: consulta({ isPending: true }), caixa: null, turnoQuery: consulta({}), movimentosQuery: consulta({}) };
    renderWithProviders(<CaixaPage />);

    expect(screen.getByRole("status")).toHaveTextContent("Carregando caixa");
  });

  it("no 403 do caixa avisa da permissão e não oferece nova tentativa", () => {
    caixa.atual = { caixaQuery: consulta({ isError: true, error: new ApiError("forbidden") }), caixa: null, turnoQuery: consulta({}) };
    renderWithProviders(<CaixaPage />);

    expect(screen.getByRole("alert")).toHaveTextContent("Você não tem permissão para acessar esta página.");
    expect(screen.getByRole("link", { name: "Ir para o início" })).toHaveAttribute("href", "/dashboard");
    expect(screen.queryByRole("button", { name: "Tentar novamente" })).not.toBeInTheDocument();
  });

  it("no 403 do turno avisa da permissão", () => {
    caixaAberto({ turnoQuery: consulta({ isError: true, error: new ApiError("forbidden") }) });
    renderWithProviders(<CaixaPage />);

    expect(screen.getByRole("alert")).toHaveTextContent("Você não tem permissão para acessar esta página.");
  });

  it("em outros erros do caixa mostra a mensagem e oferece nova tentativa", async () => {
    const refetch = vi.fn();
    caixa.atual = { caixaQuery: consulta({ isError: true, error: new ApiError("server"), refetch }), caixa: null, turnoQuery: consulta({}) };
    renderWithProviders(<CaixaPage />);

    expect(screen.getByRole("alert")).toHaveTextContent("Erro no servidor. Tente novamente em instantes.");
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});

describe("CaixaPage: caixa aberto", () => {
  it("oferece o link Ver movimentos para a tela de movimentos", () => {
    caixaAberto();
    renderWithProviders(<CaixaPage />);

    // Em tela pequena o link fica display:none (o jsdom não aplica o breakpoint e o tira da árvore de acessibilidade): acha-se pelo texto.
    expect(screen.getByText("Ver movimentos").closest("a")).toHaveAttribute("href", "/caixa/movimentos");
    expect(screen.getByText("Ver Histórico").closest("a")).toHaveAttribute("href", "/caixa/historico");
  });

  it("para quem não vê o histórico oferece só os movimentos", () => {
    sessao.atual = { user: { name: "Caio", perfil: 4 }, isLoading: false };
    caixaAberto();
    renderWithProviders(<CaixaPage />);

    expect(screen.getByText("Ver movimentos")).toBeInTheDocument();
    expect(screen.queryByText("Ver Histórico")).not.toBeInTheDocument();
  });

  it("mostra a pilha de cartões na ordem do design, sem abas nem histórico", () => {
    caixaAberto();
    renderWithProviders(<CaixaPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Caixa" })).toBeInTheDocument();
    const ordem = [
      screen.getByRole("region", { name: "Abertura do caixa" }),
      screen.getByRole("region", { name: "Valor em caixa" }),
      screen.getByRole("region", { name: "Fundo de caixa" }),
      screen.getByRole("region", { name: "Dinheiro na gaveta" }),
      screen.getByRole("region", { name: "Por forma de pagamento" }),
      screen.getByRole("button", { name: "Fechar caixa" }),
    ];
    for (let i = 0; i < ordem.length - 1; i += 1) {
      expect(ordem[i].compareDocumentPosition(ordem[i + 1]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Histórico de turnos/ })).not.toBeInTheDocument();
  });

  it("erro nos movimentos não derruba a página: os outros cartões continuam", () => {
    caixaAberto({ movimentosQuery: consulta({ isError: true, error: new ApiError("server") }) });
    renderWithProviders(<CaixaPage />);

    expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
    expect(screen.getByRole("region", { name: "Fundo de caixa" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Dinheiro na gaveta" })).toHaveTextContent("R$ 400,00");
  });

  it("sem turno as ações ficam desabilitadas", () => {
    caixaAberto({ turnoQuery: consulta({ data: null }) });
    renderWithProviders(<CaixaPage />);

    expect(screen.getByRole("button", { name: "Sangria" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Fechar caixa" })).toBeDisabled();
  });

  it("Sangria abre o modal de retirada", async () => {
    caixaAberto();
    renderWithProviders(<CaixaPage />);

    await userEvent.click(screen.getByRole("button", { name: "Sangria" }));

    expect(await screen.findByRole("heading", { name: "Retirada de valor" })).toBeInTheDocument();
  });

  it("Fechar caixa abre o modal de fechamento", async () => {
    caixaAberto();
    renderWithProviders(<CaixaPage />);

    await userEvent.click(screen.getByRole("button", { name: "Fechar caixa" }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("Manobrista tem Trocar turno, que abre a passagem de turno", async () => {
    sessao.atual = { user: { name: "X", perfil: 3 }, isLoading: false };
    caixaAberto();
    renderWithProviders(<CaixaPage />);

    expect(screen.queryByRole("button", { name: "Sangria" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Trocar turno" }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });
});

describe("CaixaPage: caixa fechado", () => {
  it("mostra o aviso de caixa fechado, sem cartões nem ações", () => {
    caixa.atual = { caixaQuery: consulta({ data: null }), caixa: null, turnoQuery: consulta({}), movimentosQuery: consulta({}) };
    renderWithProviders(<CaixaPage />);

    expect(screen.getByRole("button", { name: "Abrir caixa" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Caixas anteriores" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Valor em caixa" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Fechar caixa" })).not.toBeInTheDocument();
    expect(screen.queryByText("Ver movimentos")).not.toBeInTheDocument();
  });
});
