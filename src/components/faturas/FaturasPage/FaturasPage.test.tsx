import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import type { Conveniada } from "@/types/conveniada";

const replace = vi.fn();
let params: Record<string, string> = {};

const push = vi.fn();
const router = { push, replace };
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useSearchParams: () => ({ get: (key: string) => params[key] ?? null }),
}));
vi.mock("@/lib/api/services/fatura", () => ({
  emitirFatura: vi.fn(),
  listFaturas: vi.fn().mockResolvedValue({ items: [], page: 1, pageSize: 20, totalRecords: 0, totalPages: 0 }),
}));
vi.mock("@/lib/api/services/conveniada", () => ({ listConveniadas: vi.fn() }));

import { listConveniadas } from "@/lib/api/services/conveniada";
import { emitirFatura, listFaturas } from "@/lib/api/services/fatura";
import { fatura } from "../fixtures";
import { FaturasPage } from "./FaturasPage";

// jsdom não implementa <dialog>.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

const conveniada = (id: number, nomeFantasia: string, ativo = true): Conveniada => ({
  empresaConvenioId: id,
  empresaConveniadaId: id,
  empresaGuid: `g${id}`,
  razaoSocial: `${nomeFantasia} LTDA`,
  nomeFantasia,
  cnpj: "11222333000181",
  telefone: "11987654321",
  endereco: { logradouro: "", numero: "", bairro: "", cidade: "", estado: "", cep: "" },
  ativo,
  dataCriacao: "2026-03-12T10:00:00",
});

beforeEach(() => {
  replace.mockReset();
  push.mockReset();
  params = {};
  vi.mocked(listFaturas).mockClear();
  vi.mocked(listConveniadas).mockResolvedValue([conveniada(53, "Auto Peças"), conveniada(54, "Transportes", false)]);
});

describe("FaturasPage", () => {
  it("abre com título, Todas as conveniadas e todas as situações", async () => {
    renderWithProviders(<FaturasPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Faturas" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Emitir fatura" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Todas" })).toBeChecked();
    expect(screen.getByLabelText("Conveniada")).toHaveValue("");
    await waitFor(() => expect(listFaturas).toHaveBeenCalledWith({ empresaConveniadaId: null, situacao: null, pagina: 1 }));
  });

  it("o filtro de conveniada traz as de convênio encerrado, marcadas", async () => {
    renderWithProviders(<FaturasPage />);

    expect(await screen.findByRole("option", { name: "Auto Peças" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Transportes (encerrado)" })).toBeInTheDocument();
  });

  it("lê os filtros da URL", async () => {
    params = { conveniada: "53", situacao: "paga", pagina: "2" };
    renderWithProviders(<FaturasPage />);

    expect(screen.getByRole("radio", { name: "Pagas" })).toBeChecked();
    await waitFor(() => expect(screen.getByLabelText("Conveniada")).toHaveValue("53"));
    await waitFor(() => expect(listFaturas).toHaveBeenCalledWith({ empresaConveniadaId: 53, situacao: 2, pagina: 2 }));
  });

  it("trocar a situação atualiza a URL e volta à página 1", async () => {
    params = { conveniada: "53", pagina: "3" };
    const user = userEvent.setup();
    renderWithProviders(<FaturasPage />);

    await user.click(screen.getByRole("radio", { name: "Abertas" }));
    expect(replace).toHaveBeenCalledWith("/faturas?conveniada=53&situacao=aberta", { scroll: false });
  });

  it("trocar a conveniada atualiza a URL e voltar a Todas a remove", async () => {
    const user = userEvent.setup();
    renderWithProviders(<FaturasPage />);

    await screen.findByRole("option", { name: "Auto Peças" });
    await user.selectOptions(screen.getByLabelText("Conveniada"), "53");
    expect(replace).toHaveBeenCalledWith("/faturas?conveniada=53", { scroll: false });

    replace.mockClear();
    params = { conveniada: "53" };
    await user.selectOptions(screen.getByLabelText("Conveniada"), "");
    expect(replace).toHaveBeenCalledWith("/faturas", { scroll: false });
  });

  it("Emitir fatura abre o modal e, ao emitir, leva ao detalhe da fatura com a marca de emissão", async () => {
    vi.mocked(emitirFatura).mockResolvedValue({ fatura: { convenioFaturaId: 12 }, itens: [] } as never);
    const user = userEvent.setup();
    renderWithProviders(<FaturasPage />);

    await user.click(screen.getByRole("button", { name: "Emitir fatura" }));
    const modal = screen.getByRole("dialog", { name: "Emitir fatura" });
    await user.selectOptions(await within(modal).findByLabelText("Conveniada"), "53");
    await user.click(within(modal).getByRole("button", { name: "Emitir fatura" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/faturas/12?emitida=1"));
  });
});

const VAZIO = { items: [], page: 1, pageSize: 20, totalRecords: 0, totalPages: 0 };

function celular() {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({ matches: true, media: query, addEventListener: () => {}, removeEventListener: () => {} })),
  );
}

describe("FaturasPage no celular", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.mocked(listFaturas).mockResolvedValue(VAZIO);
  });

  it("tira o botão do cabeçalho e mostra o botão flutuante quando há faturas", async () => {
    celular();
    vi.mocked(listFaturas).mockResolvedValue({ items: [fatura()], page: 1, pageSize: 20, totalRecords: 1, totalPages: 1 });
    renderWithProviders(<FaturasPage />);

    await screen.findByText("#12");
    expect(screen.getAllByRole("button", { name: "Emitir fatura" })).toHaveLength(1);
    expect(screen.getByLabelText("Conveniada")).toHaveDisplayValue("Todas as conveniadas");
  });

  it("o botão flutuante abre o modal de emissão", async () => {
    celular();
    vi.mocked(listFaturas).mockResolvedValue({ items: [fatura()], page: 1, pageSize: 20, totalRecords: 1, totalPages: 1 });
    const user = userEvent.setup();
    renderWithProviders(<FaturasPage />);

    await screen.findByText("#12");
    await user.click(screen.getByRole("button", { name: "Emitir fatura" }));
    expect(screen.getByRole("dialog", { name: "Emitir fatura" })).toBeInTheDocument();
  });

  it("no vazio sem filtro só o aviso traz o botão de emitir", async () => {
    celular();
    renderWithProviders(<FaturasPage />);

    await screen.findByText("Nenhuma fatura emitida ainda.");
    expect(screen.getAllByRole("button", { name: "Emitir fatura" })).toHaveLength(1);
  });

  it("no vazio com filtro o botão flutuante continua disponível", async () => {
    celular();
    params = { situacao: "paga" };
    renderWithProviders(<FaturasPage />);

    await screen.findByText("Nenhuma fatura encontrada com esses filtros.");
    expect(screen.getByRole("button", { name: "Emitir fatura" })).toBeInTheDocument();
  });
});
