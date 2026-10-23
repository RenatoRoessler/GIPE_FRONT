import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import type { Caixa, Movimento, Turno } from "@/types/caixa";

const caixa = vi.hoisted(() => ({ atual: {} as Record<string, unknown> }));
vi.mock("../useCaixa", () => ({ useCaixa: () => caixa.atual, CAIXA_KEY: ["caixa"] }));

const nav = vi.hoisted(() => ({ aba: null as string | null, replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: nav.replace }),
  useSearchParams: () => new URLSearchParams(nav.aba ? { aba: nav.aba } : {}),
}));

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
    turnosQuery: consulta({ data: [turno] }),
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
  nav.aba = null;
  nav.replace.mockReset();
  sessao.atual = { user: { name: "Maria", perfil: 1 }, isLoading: false };
});

describe("CaixaPage: erro de permissão", () => {
  it("no 403 do caixa avisa da permissão e não oferece nova tentativa", () => {
    caixa.atual = { caixaQuery: consulta({ isError: true, error: new ApiError("forbidden") }), caixa: null, turnoQuery: consulta({}) };
    renderWithProviders(<CaixaPage />);

    expect(screen.getByRole("alert")).toHaveTextContent("Você não tem permissão para acessar esta página.");
    expect(screen.getByRole("link", { name: "Ir para o início" })).toHaveAttribute("href", "/dashboard");
    expect(screen.queryByRole("button", { name: "Tentar novamente" })).not.toBeInTheDocument();
  });

  it("em outros erros do caixa mostra a mensagem e oferece nova tentativa", () => {
    caixa.atual = { caixaQuery: consulta({ isError: true, error: new ApiError("server") }), caixa: null, turnoQuery: consulta({}) };
    renderWithProviders(<CaixaPage />);

    expect(screen.getByRole("alert")).toHaveTextContent("Erro no servidor. Tente novamente em instantes.");
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument();
  });
});

describe("CaixaPage: caixa aberto", () => {
  it("abre com a gaveta, o turno atual e as abas, na ordem do design", () => {
    caixaAberto();
    renderWithProviders(<CaixaPage />);

    const ordem = [
      screen.getByText("Na gaveta agora"),
      screen.getByRole("heading", { name: "Turno atual" }),
      screen.getByRole("tablist", { name: "Atividade do caixa" }),
    ];
    for (let i = 0; i < ordem.length - 1; i += 1) {
      expect(ordem[i].compareDocumentPosition(ordem[i + 1]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
    expect(screen.queryByText("Saldo")).not.toBeInTheDocument();
  });

  it("as três abas existem e Movimentos é a padrão", () => {
    caixaAberto();
    renderWithProviders(<CaixaPage />);

    const abas = within(screen.getByRole("tablist")).getAllByRole("tab");
    expect(abas.map((aba) => aba.textContent)).toEqual(["Movimentos", "Linha do tempo", "Gráficos"]);
    expect(screen.getByRole("tab", { name: "Movimentos" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("button", { name: /Todos/ })).toBeInTheDocument();
  });

  it("a aba vem da URL e valor desconhecido cai em Movimentos", () => {
    caixaAberto();
    nav.aba = "graficos";
    const { unmount } = renderWithProviders(<CaixaPage />);
    expect(screen.getByRole("tab", { name: "Gráficos" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("region", { name: "Por forma de pagamento" })).toBeInTheDocument();
    unmount();

    nav.aba = "outra";
    renderWithProviders(<CaixaPage />);
    expect(screen.getByRole("tab", { name: "Movimentos" })).toHaveAttribute("aria-selected", "true");
  });

  it("trocar de aba atualiza a URL; Movimentos fica sem parâmetro", async () => {
    caixaAberto();
    const user = userEvent.setup();
    renderWithProviders(<CaixaPage />);

    await user.click(screen.getByRole("tab", { name: "Linha do tempo" }));
    expect(nav.replace).toHaveBeenLastCalledWith("/caixa?aba=linha-do-tempo", { scroll: false });

    await user.click(screen.getByRole("tab", { name: "Movimentos" }));
    expect(nav.replace).toHaveBeenLastCalledWith("/caixa", { scroll: false });
  });

  it("a linha do tempo mostra a abertura do caixa", () => {
    caixaAberto();
    nav.aba = "linha-do-tempo";
    renderWithProviders(<CaixaPage />);

    expect(screen.getByText("Caixa aberto", { selector: "p" })).toBeInTheDocument();
  });

  it("erro nos movimentos não derruba a página: gaveta e turno continuam", () => {
    caixaAberto({ movimentosQuery: consulta({ isError: true, error: new ApiError("server") }) });
    renderWithProviders(<CaixaPage />);

    expect(screen.getByText("Na gaveta agora")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Erro no servidor");
  });

  it("movimentos ainda carregando mostram o estado de espera na aba", () => {
    caixaAberto({ movimentosQuery: consulta({ isPending: true }) });
    renderWithProviders(<CaixaPage />);

    expect(screen.getByRole("status")).toHaveTextContent("Carregando movimentos");
  });

  it("a retirada abre pelo botão da gaveta", async () => {
    caixaAberto();
    const user = userEvent.setup();
    renderWithProviders(<CaixaPage />);

    await user.click(screen.getByRole("button", { name: "Retirada" }));

    expect(await screen.findByRole("heading", { name: "Retirada de valor" })).toBeInTheDocument();
  });
});

describe("CaixaPage: caixa fechado", () => {
  it("mostra o aviso de caixa fechado, sem gaveta nem abas", () => {
    caixa.atual = { caixaQuery: consulta({ data: null }), caixa: null, turnoQuery: consulta({}), movimentosQuery: consulta({}), turnosQuery: consulta({}) };
    renderWithProviders(<CaixaPage />);

    expect(screen.getByRole("button", { name: "Abrir caixa" })).toBeInTheDocument();
    expect(screen.queryByText("Na gaveta agora")).not.toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });
});
