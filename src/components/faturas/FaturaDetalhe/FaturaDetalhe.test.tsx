import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import { SITUACAO_FATURA } from "@/types/fatura";

const push = vi.fn();
const replace = vi.fn();
const back = vi.fn();
let params: Record<string, string> = {};
const router = { push, replace, back };
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useSearchParams: () => ({ get: (key: string) => params[key] ?? null }),
}));
vi.mock("@/lib/api/services/fatura", () => ({ getFatura: vi.fn(), pagarFatura: vi.fn(), cancelarFatura: vi.fn() }));

import { cancelarFatura, getFatura, pagarFatura } from "@/lib/api/services/fatura";
import { detalhe } from "../fixtures";
import { FaturaDetalhe } from "./FaturaDetalhe";

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
  vi.resetAllMocks();
  params = {};
});

function renderizar() {
  return renderWithProviders(<FaturaDetalhe id={12} />);
}

describe("FaturaDetalhe: estados", () => {
  it("enquanto carrega mostra o estado de carregamento", () => {
    vi.mocked(getFatura).mockReturnValue(new Promise(() => undefined));
    renderizar();

    expect(screen.getByRole("status", { name: "Carregando fatura" })).toBeInTheDocument();
  });

  it("fatura aberta: herói, ciclo, saídas e as duas ações", async () => {
    vi.mocked(getFatura).mockResolvedValue(detalhe({ observacao: "fechamento de outubro" }));
    renderizar();

    expect(await screen.findByRole("heading", { level: 1, name: /Fatura #12/ })).toBeInTheDocument();
    expect(getFatura).toHaveBeenCalledWith(12);
    expect(screen.getByText("Aberta")).toBeInTheDocument();
    expect(screen.getByText("Auto Peças Sul")).toBeInTheDocument();
    expect(screen.getByText("2 saídas · vence em 08/12/2026")).toBeInTheDocument();
    expect(screen.getByText("Obs.: fechamento de outubro")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Ciclo da fatura" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Saídas desta fatura" })).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Registrar pagamento" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar fatura" })).toBeInTheDocument();
  });

  it("o total do rodapé é igual ao valor do herói", async () => {
    vi.mocked(getFatura).mockResolvedValue(detalhe({ valorTotal: 1250 }));
    renderizar();

    await screen.findByRole("heading", { level: 1 });
    expect(screen.getByText("Total da fatura R$ 1.250,00")).toBeInTheDocument();
    // O herói é o único parágrafo que mostra só o valor.
    expect(screen.getByText("R$ 1.250,00", { selector: "p" })).toBeInTheDocument();
  });

  it("fatura paga: sem ações, com o pagamento no ciclo", async () => {
    vi.mocked(getFatura).mockResolvedValue(
      detalhe({ situacao: SITUACAO_FATURA.Paga, dataPagamento: "2026-11-12T09:00:00", usuarioPagamento: "Ana", formaPagamento: 2, valorPago: 1250 }),
    );
    renderizar();

    await screen.findByRole("heading", { level: 1 });
    // O selo e o passo do ciclo.
    expect(screen.getAllByText("Paga")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "Registrar pagamento" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancelar fatura" })).not.toBeInTheDocument();
    expect(screen.getByText(/Pago R\$ 1\.250,00/)).toBeInTheDocument();
  });

  it("fatura cancelada: sem ações, valor riscado e aviso no lugar da tabela", async () => {
    vi.mocked(getFatura).mockResolvedValue(
      detalhe({ situacao: SITUACAO_FATURA.Cancelada, dataCancelamento: "2026-11-13T15:30:00", usuarioCancelamento: "Beto" }, []),
    );
    renderizar();

    await screen.findByRole("heading", { level: 1 });
    expect(screen.getAllByText("Cancelada")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "Registrar pagamento" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancelar fatura" })).not.toBeInTheDocument();
    expect(screen.getByText("As saídas desta fatura voltaram a ficar em aberto e entram na próxima fatura.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText("R$ 1.250,00", { selector: "p" })).toHaveStyle({ textDecoration: "line-through" });
  });

  it("404 diz que a fatura não foi encontrada, sem tentar de novo", async () => {
    vi.mocked(getFatura).mockRejectedValue(new ApiError("not_found"));
    renderizar();

    expect(await screen.findByRole("heading", { level: 1, name: "Fatura não encontrada" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tentar novamente" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver todas as faturas" })).toHaveAttribute("href", "/faturas");
  });

  it("403 mostra o aviso de permissão, sem tentar de novo", async () => {
    vi.mocked(getFatura).mockRejectedValue(new ApiError("forbidden"));
    renderizar();

    await waitFor(() => expect(screen.queryByRole("status", { name: "Carregando fatura" })).not.toBeInTheDocument());
    expect(screen.getByText(/permiss/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tentar novamente" })).not.toBeInTheDocument();
  });

  it("outro erro mostra a mensagem e permite tentar de novo", async () => {
    vi.mocked(getFatura).mockRejectedValueOnce(new ApiError("server", "Falha no servidor.")).mockResolvedValue(detalhe());
    const user = userEvent.setup();
    renderizar();

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar a fatura. Falha no servidor.");
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByRole("heading", { level: 1, name: /Fatura #12/ })).toBeInTheDocument();
  });
});

describe("FaturaDetalhe: voltar e aviso de emissão", () => {
  it("voltar usa o histórico quando há de onde voltar", async () => {
    vi.mocked(getFatura).mockResolvedValue(detalhe());
    vi.spyOn(window.history, "length", "get").mockReturnValue(3);
    const user = userEvent.setup();
    renderizar();

    await user.click(screen.getByRole("button", { name: "Voltar para faturas" }));
    expect(back).toHaveBeenCalledTimes(1);
  });

  it("sem histórico, voltar leva à lista", async () => {
    vi.mocked(getFatura).mockResolvedValue(detalhe());
    vi.spyOn(window.history, "length", "get").mockReturnValue(1);
    const user = userEvent.setup();
    renderizar();

    await user.click(screen.getByRole("button", { name: "Voltar para faturas" }));
    expect(push).toHaveBeenCalledWith("/faturas");
  });

  it("vindo da emissão, mostra o aviso uma vez com os números da fatura e limpa a URL", async () => {
    params = { emitida: "1" };
    vi.mocked(getFatura).mockResolvedValue(detalhe({ quantidadeSaidas: 14, valorTotal: 1250 }));
    renderizar();

    expect(await screen.findByText("Fatura emitida: 14 saídas, R$ 1.250,00.")).toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith("/faturas/12", { scroll: false });
  });

  it("sem a marca de emissão, não mostra aviso", async () => {
    vi.mocked(getFatura).mockResolvedValue(detalhe());
    renderizar();

    await screen.findByRole("heading", { level: 1 });
    expect(screen.queryByText(/Fatura emitida/)).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});

describe("FaturaDetalhe: pagar e cancelar", () => {
  it("registrar pagamento abre o modal e, ao concluir, avisa e atualiza a fatura", async () => {
    vi.mocked(getFatura)
      .mockResolvedValueOnce(detalhe())
      .mockResolvedValue(detalhe({ situacao: SITUACAO_FATURA.Paga, dataPagamento: "2026-11-12T09:00:00", formaPagamento: 2, valorPago: 1250 }));
    vi.mocked(pagarFatura).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderizar();

    await user.click(await screen.findByRole("button", { name: "Registrar pagamento" }));
    const modal = screen.getByRole("dialog", { name: /Registrar pagamento/ });
    await user.selectOptions(within(modal).getByLabelText("Forma de pagamento"), "Pix");
    await user.click(within(modal).getByRole("button", { name: "Registrar pagamento" }));

    expect(await screen.findByText("Pagamento registrado.")).toBeInTheDocument();
    expect(pagarFatura).toHaveBeenCalledWith(12, { formaPagamento: "2", valorPago: "", dataPagamento: "" }, expect.any(String));
    // A consulta é refeita: a fatura passa a Paga e as ações somem.
    await waitFor(() => expect(screen.queryByRole("button", { name: "Registrar pagamento" })).not.toBeInTheDocument());
    expect(screen.getAllByText("Paga")).toHaveLength(2);
  });

  it("cancelar fatura pede confirmação e, ao concluir, avisa e atualiza a fatura", async () => {
    vi.mocked(getFatura)
      .mockResolvedValueOnce(detalhe())
      .mockResolvedValue(detalhe({ situacao: SITUACAO_FATURA.Cancelada, dataCancelamento: "2026-11-13T15:30:00", usuarioCancelamento: "Beto" }, []));
    vi.mocked(cancelarFatura).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderizar();

    await user.click(await screen.findByRole("button", { name: "Cancelar fatura" }));
    const dialogo = screen.getByRole("dialog", { name: "Cancelar fatura #12?" });
    expect(cancelarFatura).not.toHaveBeenCalled();
    await user.click(within(dialogo).getByRole("button", { name: "Cancelar fatura" }));

    expect(await screen.findByText("Fatura cancelada. As saídas voltaram a ficar em aberto.")).toBeInTheDocument();
    expect(cancelarFatura).toHaveBeenCalledWith(12);
    await waitFor(() => expect(screen.queryByRole("button", { name: "Cancelar fatura" })).not.toBeInTheDocument());
    expect(screen.getByText("As saídas desta fatura voltaram a ficar em aberto e entram na próxima fatura.")).toBeInTheDocument();
  });

  it("Manter fatura fecha a confirmação sem cancelar", async () => {
    vi.mocked(getFatura).mockResolvedValue(detalhe());
    const user = userEvent.setup();
    renderizar();

    await user.click(await screen.findByRole("button", { name: "Cancelar fatura" }));
    await user.click(screen.getByRole("button", { name: "Manter fatura" }));

    expect(cancelarFatura).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog", { name: "Cancelar fatura #12?" })).not.toBeInTheDocument();
  });
});

describe("FaturaDetalhe no celular", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) => ({ matches: true, media: query, addEventListener: () => {}, removeEventListener: () => {} })),
    );
    // Só o relógio é falso: o destaque de vencimento depende de "hoje".
    vi.useFakeTimers({ toFake: ["Date"], now: new Date(2026, 10, 8, 12, 0, 0) });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("fatura aberta: ações na barra (não no herói), vencimento e ciclo recolhido com resumo", async () => {
    vi.mocked(getFatura).mockResolvedValue(detalhe());
    renderizar();

    await screen.findByRole("heading", { level: 1, name: /Fatura #12/ });
    // O painel recolhido do ciclo também diz quando vence, então o herói é consultado à parte.
    const heroi = within(screen.getByRole("region", { name: /Fatura #12/ }));
    expect(heroi.getByText("Vence em 08/12/2026")).toBeInTheDocument();
    expect(heroi.getByText("2 saídas")).toBeInTheDocument();
    expect(heroi.queryByRole("button", { name: "Registrar pagamento" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Registrar pagamento" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Cancelar fatura" })).toHaveLength(1);

    // As saídas viram cartões, e o ciclo fica recolhido.
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    const ciclo = screen.getByRole("button", { name: /Ciclo da fatura/ });
    expect(ciclo).toHaveAttribute("aria-expanded", "false");
    expect(ciclo).toHaveTextContent("Emitida em 08/11 por Renato Rossler");
    expect(screen.queryByRole("list", { name: "Ciclo da fatura" })).not.toBeInTheDocument();
  });

  it("tocar no ciclo mostra a linha do tempo", async () => {
    vi.mocked(getFatura).mockResolvedValue(detalhe());
    const user = userEvent.setup({ advanceTimers: () => undefined });
    renderizar();

    await user.click(await screen.findByRole("button", { name: /Ciclo da fatura/ }));
    expect(screen.getByRole("list", { name: "Ciclo da fatura" })).toBeInTheDocument();
  });

  it("fatura vencida destaca o vencimento", async () => {
    vi.mocked(getFatura).mockResolvedValue(detalhe({ vencimento: "2026-11-05" }));
    renderizar();

    await screen.findByRole("heading", { level: 1 });
    expect(screen.getByText("Vencida há 3 dias")).toBeInTheDocument();
    expect(screen.getByText("Vencimento 05/11/2026")).toBeInTheDocument();
  });

  it("os botões da barra abrem o pagamento e o cancelamento", async () => {
    vi.mocked(getFatura).mockResolvedValue(detalhe());
    const user = userEvent.setup({ advanceTimers: () => undefined });
    renderizar();

    await user.click(await screen.findByRole("button", { name: "Registrar pagamento" }));
    expect(screen.getByRole("dialog", { name: /Registrar pagamento/ })).toBeInTheDocument();
  });

  it("fatura paga: sem barra, com a data do pagamento no herói e o resumo no ciclo", async () => {
    vi.mocked(getFatura).mockResolvedValue(
      detalhe({ situacao: SITUACAO_FATURA.Paga, dataPagamento: "2026-11-12T09:00:00", usuarioPagamento: "Ana", formaPagamento: 2, valorPago: 1250 }),
    );
    renderizar();

    await screen.findByRole("heading", { level: 1 });
    expect(screen.getByText("Paga em 12/11/2026")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ciclo da fatura/ })).toHaveTextContent("Paga em 12/11");
    expect(screen.queryByRole("button", { name: "Registrar pagamento" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancelar fatura" })).not.toBeInTheDocument();
  });

  it("fatura cancelada: sem barra, sem vencimento e com o aviso no lugar das saídas", async () => {
    vi.mocked(getFatura).mockResolvedValue(
      detalhe({ situacao: SITUACAO_FATURA.Cancelada, dataCancelamento: "2026-11-13T15:30:00", usuarioCancelamento: "Beto" }, []),
    );
    renderizar();

    await screen.findByRole("heading", { level: 1 });
    expect(screen.queryByRole("button", { name: "Registrar pagamento" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Vence/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ciclo da fatura/ })).toHaveTextContent("Cancelada em 13/11 por Beto");
    expect(screen.getByText("As saídas desta fatura voltaram a ficar em aberto e entram na próxima fatura.")).toBeInTheDocument();
  });

  it("observação longa vem limitada, com Ver mais", async () => {
    vi.mocked(getFatura).mockResolvedValue(detalhe({ observacao: "fechamento de outubro com ajustes combinados ".repeat(4) }));
    renderizar();

    await screen.findByRole("heading", { level: 1 });
    expect(screen.getByRole("button", { name: "Ver mais" })).toBeInTheDocument();
  });
});
