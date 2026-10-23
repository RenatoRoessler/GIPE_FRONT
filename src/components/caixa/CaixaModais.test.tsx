import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import type { Turno } from "@/types/caixa";

vi.mock("@/contexts/CurrentUserContext", () => ({
  useCurrentUser: () => ({ user: { name: "Maria", perfil: 4 }, isLoading: false }),
}));
vi.mock("@/lib/api/services/caixa", () => ({
  listTurnos: vi.fn(),
  registrarSangria: vi.fn(),
  passarTurno: vi.fn(),
  fecharCaixa: vi.fn(),
  abrirCaixa: vi.fn(),
}));

import { fecharCaixa, listTurnos, passarTurno, registrarSangria } from "@/lib/api/services/caixa";
import { FecharCaixaModal } from "./FecharCaixaModal";
import { PassarTurnoModal } from "./PassarTurnoModal";
import { SangriaModal } from "./SangriaModal";

// jsdom não implementa <dialog>.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

function turnoBase(extra: Partial<Turno> = {}): Turno {
  return {
    turnoId: 7,
    caixaId: 2,
    usuarioId: 1,
    usuario: "Maria",
    usuarioIdFechamento: null,
    dataHoraInicio: "2026-10-23T08:00:00",
    dataHoraFim: null,
    valorFundoCaixa: 100,
    status: 1,
    saldoCaixa: 400,
    totalEntradas: 450,
    totalSaidas: 50,
    totalSaida: null,
    saldoCaixaInformado: null,
    totalDiferenca: null,
    observacao: null,
    disponivelSangria: 300,
    formasPagamento: [
      { formaPagamento: 1, entradas: 300, saidas: 0, valorEsperado: 300, valorInformado: null, diferenca: null },
      { formaPagamento: 2, entradas: 150, saidas: 50, valorEsperado: 100, valorInformado: null, diferenca: null },
    ],
    ...extra,
  };
}

const props = () => ({ onClose: vi.fn(), onSuccess: vi.fn() });

beforeEach(() => {
  vi.resetAllMocks();
});

describe("SangriaModal", () => {
  it("mostra o que pode retirar e que o fundo fica, sem falar em troco padrão", () => {
    renderWithProviders(<SangriaModal turno={turnoBase()} {...props()} />);

    const dica = screen.getByText(/Pode retirar:/);
    expect(dica).toHaveTextContent("R$ 300,00");
    expect(dica).toHaveTextContent("R$ 100,00");
    expect(dica).toHaveTextContent("sempre fica na gaveta");
    expect(document.body.textContent?.toLowerCase()).not.toContain("troco");
  });

  it("impede valor acima do disponível e mostra o limite", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SangriaModal turno={turnoBase()} {...props()} />);

    await user.type(screen.getByLabelText("Valor"), "500");
    await user.type(screen.getByLabelText("Motivo"), "Cofre");
    await user.click(screen.getByRole("button", { name: "Registrar retirada" }));

    expect(await screen.findByText(/O valor passa do que pode ser retirado \(R\$\s300,00\)/)).toBeInTheDocument();
    expect(registrarSangria).not.toHaveBeenCalled();
  });

  it("envia valor e motivo", async () => {
    vi.mocked(registrarSangria).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(<SangriaModal turno={turnoBase()} {...props()} />);

    await user.type(screen.getByLabelText("Valor"), "80,50");
    await user.type(screen.getByLabelText("Motivo"), "Recolhimento");
    await user.click(screen.getByRole("button", { name: "Registrar retirada" }));

    await waitFor(() => expect(registrarSangria).toHaveBeenCalled());
    expect(vi.mocked(registrarSangria).mock.calls[0][0]).toEqual({ valor: 80.5, observacao: "Recolhimento" });
  });

  it("mostra a mensagem que a API devolveu no erro de regra de negócio", async () => {
    vi.mocked(registrarSangria).mockRejectedValue(new ApiError("validation", "Valor acima do disponível para sangria."));
    const user = userEvent.setup();
    renderWithProviders(<SangriaModal turno={turnoBase()} {...props()} />);

    await user.type(screen.getByLabelText("Valor"), "10");
    await user.type(screen.getByLabelText("Motivo"), "x");
    await user.click(screen.getByRole("button", { name: "Registrar retirada" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Valor acima do disponível para sangria.");
  });
});

describe("PassarTurnoModal", () => {
  it("chama o campo de fundo do novo turno e explica o valor assumido quando em branco", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PassarTurnoModal turno={turnoBase()} {...props()} />);

    expect(screen.getByLabelText("Fundo de caixa do novo turno (opcional)")).toBeInTheDocument();
    // Fundo do turno (R$ 100,00) + dinheiro conferido (ainda zero).
    expect(screen.getByText(/Se vazio, fica o fundo do turno atual mais o dinheiro conferido: R\$\s100,00\./)).toBeInTheDocument();

    await user.type(screen.getByLabelText("Dinheiro"), "40");
    expect(screen.getByText(/dinheiro conferido: R\$\s140,00\./)).toBeInTheDocument();
  });

  it("envia o fundo informado com o nome da API", async () => {
    vi.mocked(passarTurno).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(<PassarTurnoModal turno={turnoBase()} {...props()} />);

    await user.type(screen.getByLabelText("Dinheiro"), "40");
    await user.type(screen.getByLabelText("Fundo de caixa do novo turno (opcional)"), "120");
    await user.click(screen.getByRole("button", { name: "Assumir turno" }));

    await waitFor(() => expect(passarTurno).toHaveBeenCalled());
    const corpo = vi.mocked(passarTurno).mock.calls[0][0];
    expect(corpo.valorFundoCaixa).toBe(120);
    expect(corpo).not.toHaveProperty("valorInicial");
    expect(corpo.conferencias).toEqual([
      { formaPagamento: 1, valorInformado: 40 },
      { formaPagamento: 2, valorInformado: 0 },
    ]);
  });

  it("envia fundo nulo quando o campo fica vazio", async () => {
    vi.mocked(passarTurno).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(<PassarTurnoModal turno={turnoBase()} {...props()} />);

    await user.click(screen.getByRole("button", { name: "Assumir turno" }));

    await waitFor(() => expect(passarTurno).toHaveBeenCalled());
    expect(vi.mocked(passarTurno).mock.calls[0][0].valorFundoCaixa).toBeNull();
  });

  it("depois de passar mostra o resumo do turno encerrado, com quem assume", async () => {
    vi.mocked(passarTurno).mockResolvedValue(undefined);
    vi.mocked(listTurnos).mockResolvedValue([
      turnoBase({ dataHoraFim: "2026-10-23T12:00:00", saldoCaixaInformado: 390, totalDiferenca: -10 }),
      turnoBase({ turnoId: 8, usuario: "Maria" }),
    ]);
    const user = userEvent.setup();
    const { onClose, onSuccess } = props();
    renderWithProviders(<PassarTurnoModal turno={turnoBase()} onClose={onClose} onSuccess={onSuccess} />);

    await user.click(screen.getByRole("button", { name: "Assumir turno" }));

    expect(await screen.findByRole("dialog", { name: "Turno passado" })).toBeInTheDocument();
    expect(screen.getByText(/assume Maria/)).toBeInTheDocument();
    expect(onSuccess).toHaveBeenCalledWith("Turno passado.");
    expect(onClose).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Concluir" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("se o turno encerrado não aparecer na lista, fecha o modal como antes", async () => {
    vi.mocked(passarTurno).mockResolvedValue(undefined);
    vi.mocked(listTurnos).mockResolvedValue([turnoBase()]);
    const user = userEvent.setup();
    const { onClose, onSuccess } = props();
    renderWithProviders(<PassarTurnoModal turno={turnoBase()} onClose={onClose} onSuccess={onSuccess} />);

    await user.click(screen.getByRole("button", { name: "Assumir turno" }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(onSuccess).toHaveBeenCalledWith("Turno passado.");
  });

  it("se a lista de turnos falhar, a passagem já feita fecha o modal sem erro", async () => {
    vi.mocked(passarTurno).mockResolvedValue(undefined);
    vi.mocked(listTurnos).mockRejectedValue(new ApiError("server"));
    const user = userEvent.setup();
    const { onClose } = props();
    renderWithProviders(<PassarTurnoModal turno={turnoBase()} onClose={onClose} onSuccess={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Assumir turno" }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("mostra a mensagem da API quando o turno já é do usuário", async () => {
    vi.mocked(passarTurno).mockRejectedValue(new ApiError("validation", "O turno já é do usuário logado."));
    const user = userEvent.setup();
    renderWithProviders(<PassarTurnoModal turno={turnoBase()} {...props()} />);

    await user.click(screen.getByRole("button", { name: "Assumir turno" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("O turno já é do usuário logado.");
  });
});

describe("FecharCaixaModal", () => {
  it("tem o campo opcional de fundo contado e avisa que o dinheiro é sem o fundo", () => {
    renderWithProviders(<FecharCaixaModal turno={turnoBase()} {...props()} />);

    expect(screen.getByLabelText("Fundo de caixa contado na gaveta (opcional)")).toBeInTheDocument();
    expect(screen.getByText("Sem o fundo de caixa.")).toBeInTheDocument();
  });

  it("fecha com conferências, fundo contado e observação", async () => {
    vi.mocked(fecharCaixa).mockResolvedValue(turnoBase({ dataHoraFim: "2026-10-23T18:00:00", saldoCaixaInformado: 390, totalDiferenca: -10 }));
    const user = userEvent.setup();
    renderWithProviders(<FecharCaixaModal turno={turnoBase()} {...props()} />);

    await user.type(screen.getByLabelText("Dinheiro"), "290");
    await user.type(screen.getByLabelText("Pix"), "100");
    await user.type(screen.getByLabelText("Fundo de caixa contado na gaveta (opcional)"), "100");
    await user.type(screen.getByLabelText("Observação (opcional)"), "fim do dia");
    await user.click(screen.getByRole("button", { name: "Fechar caixa" }));

    await waitFor(() => expect(fecharCaixa).toHaveBeenCalled());
    expect(vi.mocked(fecharCaixa).mock.calls[0][0]).toEqual({
      conferencias: [
        { formaPagamento: 1, valorInformado: 290 },
        { formaPagamento: 2, valorInformado: 100 },
      ],
      valorFundoCaixa: 100,
      observacao: "fim do dia",
    });
    expect(await screen.findByText("Caixa fechado")).toBeInTheDocument();
  });

  it("sem fundo contado envia null", async () => {
    vi.mocked(fecharCaixa).mockResolvedValue(turnoBase());
    const user = userEvent.setup();
    renderWithProviders(<FecharCaixaModal turno={turnoBase()} {...props()} />);

    await user.click(screen.getByRole("button", { name: "Fechar caixa" }));

    await waitFor(() => expect(fecharCaixa).toHaveBeenCalled());
    expect(vi.mocked(fecharCaixa).mock.calls[0][0]).toMatchObject({ valorFundoCaixa: null });
  });

  it("recusa fundo contado negativo sem chamar a API", async () => {
    const user = userEvent.setup();
    renderWithProviders(<FecharCaixaModal turno={turnoBase()} {...props()} />);

    await user.type(screen.getByLabelText("Fundo de caixa contado na gaveta (opcional)"), "-5");
    await user.click(screen.getByRole("button", { name: "Fechar caixa" }));

    expect(await screen.findByText(/valor válido/i)).toBeInTheDocument();
    expect(fecharCaixa).not.toHaveBeenCalled();
  });

  it("mostra a mensagem da API quando não há caixa aberto", async () => {
    vi.mocked(fecharCaixa).mockRejectedValue(new ApiError("validation", "Não há caixa aberto."));
    const user = userEvent.setup();
    renderWithProviders(<FecharCaixaModal turno={turnoBase()} {...props()} />);

    await user.click(screen.getByRole("button", { name: "Fechar caixa" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Não há caixa aberto.");
  });
});
