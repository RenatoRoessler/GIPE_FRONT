import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import {
  CONTRATO_STATUS,
  SITUACAO_AGUARDANDO_PRIMEIRO_PAGAMENTO,
  TIPO_PESSOA,
  type ContratoMensalista,
  type Mensalista,
} from "@/types/mensalista";

vi.mock("@/lib/api/services/mensalista", () => ({
  getContratoMensalista: vi.fn(),
  reenviarContrato: vi.fn(),
}));

import { getContratoMensalista } from "@/lib/api/services/mensalista";
import { MensalistaFichaModal } from "./MensalistaFichaModal";

// jsdom não implementa <dialog>.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

const maria: Mensalista = {
  mensalistaId: 1,
  mensalistaTipoId: 3,
  tipoMensal: "Diurno",
  categoria: 99,
  valorMensalidade: 280,
  tipoPessoa: TIPO_PESSOA.Fisica,
  documento: "52998224725",
  nome: "Maria Souza",
  email: "maria@exemplo.com",
  celular: "11912345678",
  diaVencimento: 5,
  ativo: true,
  veiculos: [],
  situacao: "Em Dia",
  dataProximoVencimento: "2026-11-05T00:00:00",
  diasAteProximoVencimento: 15,
};
const aguardando: Mensalista = { ...maria, ativo: false, situacao: SITUACAO_AGUARDANDO_PRIMEIRO_PAGAMENTO, dataProximoVencimento: null };

const contrato = (extra: Partial<ContratoMensalista> = {}): ContratoMensalista => ({
  status: CONTRATO_STATUS.Pendente,
  versao: "1",
  titulo: "Contrato",
  dataGeracao: null,
  tokenExpiracao: new Date(Date.now() + 86_400_000).toISOString(),
  dataAceite: null,
  ...extra,
});

const handlers = { onClose: vi.fn(), onEditar: vi.fn(), onReceberPagamento: vi.fn(), onToast: vi.fn() };

beforeEach(() => {
  vi.mocked(getContratoMensalista).mockReset().mockResolvedValue(null);
  Object.values(handlers).forEach((fn) => fn.mockReset());
});

describe("MensalistaFichaModal: pagamento", () => {
  it("mostra o vencimento, o próximo vencimento e a mensalidade", () => {
    renderWithProviders(<MensalistaFichaModal mensalista={maria} {...handlers} />);

    const bloco = screen.getByRole("region", { name: "Pagamento" });
    expect(bloco).toHaveTextContent("Vencimento dia 5 · próximo em 05/11/26");
    expect(bloco).toHaveTextContent("Mensalidade R$ 280,00");
  });

  it("mensalista ativo: o botão está habilitado e entrega a situação para o pagamento", async () => {
    renderWithProviders(<MensalistaFichaModal mensalista={maria} {...handlers} />);

    const botao = screen.getByRole("button", { name: "Registrar pagamento" });
    expect(botao).not.toHaveAttribute("aria-disabled");
    await userEvent.click(botao);

    expect(handlers.onReceberPagamento).toHaveBeenCalledWith(maria, { kind: "ativo" });
  });

  it("contrato aceito: é o primeiro pagamento e ele ativa o cadastro", async () => {
    vi.mocked(getContratoMensalista).mockResolvedValue(
      contrato({ status: CONTRATO_STATUS.Aceito, dataAceite: "2026-10-20T14:32:00" }),
    );
    renderWithProviders(<MensalistaFichaModal mensalista={aguardando} {...handlers} />);

    expect(await screen.findByText("O primeiro pagamento ativa o cadastro.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Registrar pagamento" }));

    expect(handlers.onReceberPagamento).toHaveBeenCalledWith(aguardando, {
      kind: "aguardando-pagamento",
      aceitoEm: "2026-10-20T14:32:00",
    });
    // O contrato já foi aceito: não há o que reenviar.
    expect(screen.queryByRole("button", { name: /contrato/i })).not.toBeInTheDocument();
  });

  it("sem aceite do contrato: o botão fica focável, explica o motivo e não abre o pagamento", async () => {
    vi.mocked(getContratoMensalista).mockResolvedValue(contrato());
    renderWithProviders(<MensalistaFichaModal mensalista={aguardando} {...handlers} />);

    const motivo = await screen.findByText("O primeiro pagamento só é liberado depois do aceite do contrato.");
    const botao = screen.getByRole("button", { name: "Registrar pagamento" });
    expect(botao).toHaveAttribute("aria-disabled", "true");
    expect(botao).not.toBeDisabled();
    expect(botao).toHaveAccessibleDescription(motivo.textContent ?? "");

    botao.focus();
    expect(botao).toHaveFocus();
    await userEvent.click(botao);
    expect(handlers.onReceberPagamento).not.toHaveBeenCalled();
    // Reenviar o contrato continua à mão.
    expect(screen.getByRole("button", { name: "Reenviar contrato" })).toBeInTheDocument();
  });

  it("sem contrato também bloqueia, e oferece enviar um", async () => {
    renderWithProviders(<MensalistaFichaModal mensalista={aguardando} {...handlers} />);

    expect(await screen.findByText("O primeiro pagamento só é liberado depois do aceite do contrato.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Registrar pagamento" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("button", { name: "Enviar contrato" })).toBeInTheDocument();
  });

  it("enquanto consulta o contrato, o botão espera e o motivo é a consulta", async () => {
    vi.mocked(getContratoMensalista).mockReturnValue(new Promise(() => {}));
    renderWithProviders(<MensalistaFichaModal mensalista={aguardando} {...handlers} />);

    expect(screen.getByText("Consultando o contrato…")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Registrar pagamento" }));
    expect(handlers.onReceberPagamento).not.toHaveBeenCalled();
  });
});
