import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import type { Turno } from "@/types/caixa";

const sessao = vi.hoisted(() => ({
  atual: { user: { name: "Maria", perfil: 4 } as { name: string; perfil: number | null } | null, isLoading: false },
}));
vi.mock("@/contexts/CurrentUserContext", () => ({ useCurrentUser: () => sessao.atual }));
vi.mock("@/lib/api/services/empresa", () => ({ getEmpresa: vi.fn() }));

import { getEmpresa } from "@/lib/api/services/empresa";
import { ResumoFechamento } from "./ResumoFechamento";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

const encerrado: Turno = {
  turnoId: 7,
  caixaId: 2,
  usuarioId: 1,
  usuario: "Ana",
  usuarioIdFechamento: 1,
  dataHoraInicio: "2026-10-23T08:00:00",
  dataHoraFim: "2026-10-23T18:00:00",
  valorFundoCaixa: 100,
  status: 2,
  saldoCaixa: 400,
  totalEntradas: null,
  totalSaidas: null,
  totalSaida: null,
  saldoCaixaInformado: 390,
  totalDiferenca: -10,
  observacao: "Faltou troco",
  disponivelSangria: null,
  formasPagamento: [
    { formaPagamento: 1, entradas: 300, saidas: 0, valorEsperado: 300, valorInformado: 290, diferenca: -10 },
    { formaPagamento: 2, entradas: 100, saidas: 0, valorEsperado: 100, valorInformado: 100, diferenca: 0 },
  ],
};

beforeEach(() => {
  vi.mocked(getEmpresa).mockReset();
  sessao.atual = { user: { name: "Maria", perfil: 4 }, isLoading: false };
});

describe("ResumoFechamento", () => {
  it("fechamento: título, esperado, informado e diferença por forma, com a palavra além da cor", () => {
    renderWithProviders(<ResumoFechamento tipo="fechamento" turno={encerrado} onConcluir={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: "Caixa fechado" })).toBeInTheDocument();
    const linhas = screen.getAllByRole("row").slice(1);
    expect(linhas).toHaveLength(3);
    expect(linhas[0]).toHaveTextContent("Dinheiro");
    expect(linhas[0]).toHaveTextContent("R$ 300,00");
    expect(linhas[0]).toHaveTextContent("R$ 290,00");
    expect(linhas[0]).toHaveTextContent("Falta");
    expect(linhas[1]).toHaveTextContent("Sem diferença");
    expect(linhas[2]).toHaveTextContent("Total");
    expect(linhas[2]).toHaveTextContent("R$ 400,00");
    expect(screen.getByText("Observação: Faltou troco")).toBeInTheDocument();
  });

  it("passagem: título próprio e quem assume o turno", () => {
    renderWithProviders(<ResumoFechamento tipo="passagem" turno={encerrado} novoResponsavel="Beto" onConcluir={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: "Turno passado" })).toBeInTheDocument();
    expect(screen.getByText(/assume Beto/)).toBeInTheDocument();
  });

  it("leva o foco para o título do resumo", () => {
    renderWithProviders(<ResumoFechamento tipo="fechamento" turno={encerrado} onConcluir={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Resumo do turno de Ana" })).toHaveFocus();
  });

  it("Concluir avisa quem abriu o resumo", async () => {
    const onConcluir = vi.fn();
    renderWithProviders(<ResumoFechamento tipo="fechamento" turno={encerrado} onConcluir={onConcluir} />);

    await userEvent.click(screen.getByRole("button", { name: "Concluir" }));

    expect(onConcluir).toHaveBeenCalledTimes(1);
  });

  it("baixa o comprovante com o tipo, o turno e a empresa, e mostra Gerando… enquanto espera", async () => {
    let terminar: () => void = () => {};
    const gerarPdf = vi.fn(() => new Promise<void>((resolve) => (terminar = resolve)));
    const empresa = { razaoSocial: "Estacionamento Central", cnpj: "66326569000150" };
    renderWithProviders(<ResumoFechamento tipo="fechamento" turno={encerrado} empresa={empresa} onConcluir={vi.fn()} gerarPdf={gerarPdf} />);

    await userEvent.click(screen.getByRole("button", { name: "Baixar comprovante (PDF)" }));

    expect(gerarPdf).toHaveBeenCalledWith({ tipo: "fechamento", turno: encerrado, novoResponsavel: null, empresa });
    expect(screen.getByRole("button", { name: "Gerando…" })).toBeDisabled();

    terminar();
    expect(await screen.findByRole("button", { name: "Baixar comprovante (PDF)" })).toBeEnabled();
  });

  it("falha ao gerar o PDF avisa e mantém o resumo na tela", async () => {
    const gerarPdf = vi.fn().mockRejectedValue(new Error("falhou"));
    renderWithProviders(<ResumoFechamento tipo="fechamento" turno={encerrado} onConcluir={vi.fn()} gerarPdf={gerarPdf} />);

    await userEvent.click(screen.getByRole("button", { name: "Baixar comprovante (PDF)" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível gerar o comprovante");
    expect(screen.getByRole("heading", { name: "Resumo do turno de Ana" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Baixar comprovante (PDF)" })).toBeEnabled();
  });

  it("só o Administrador busca a empresa para o cabeçalho do PDF", async () => {
    vi.mocked(getEmpresa).mockResolvedValue({ company: { razaoSocial: "Central", cnpj: "66326569000150" } } as never);
    const gerarPdf = vi.fn().mockResolvedValue(undefined);

    sessao.atual = { user: { name: "Maria", perfil: 4 }, isLoading: false };
    const { unmount } = renderWithProviders(<ResumoFechamento tipo="fechamento" turno={encerrado} onConcluir={vi.fn()} gerarPdf={gerarPdf} />);
    await userEvent.click(screen.getByRole("button", { name: "Baixar comprovante (PDF)" }));
    expect(getEmpresa).not.toHaveBeenCalled();
    expect(gerarPdf).toHaveBeenCalledWith(expect.objectContaining({ empresa: null }));
    unmount();

    sessao.atual = { user: { name: "Admin", perfil: 1 }, isLoading: false };
    renderWithProviders(<ResumoFechamento tipo="fechamento" turno={encerrado} onConcluir={vi.fn()} gerarPdf={gerarPdf} />);
    await waitFor(() => expect(getEmpresa).toHaveBeenCalledTimes(1));
    await userEvent.click(screen.getByRole("button", { name: "Baixar comprovante (PDF)" }));
    expect(gerarPdf).toHaveBeenLastCalledWith(expect.objectContaining({ empresa: { razaoSocial: "Central", cnpj: "66326569000150" } }));
  });
});
