import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import {
  CONTRATO_STATUS,
  SITUACAO_AGUARDANDO_PRIMEIRO_PAGAMENTO,
  type ContratoMensalista,
  type Mensalista,
  type MensalistaTipo,
} from "@/types/mensalista";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => ({ get: () => null }),
}));

vi.mock("@/lib/api/services/mensalista", () => ({
  listMensalistas: vi.fn(),
  listTiposMensalidade: vi.fn(),
  getContratoMensalista: vi.fn(),
  reenviarContrato: vi.fn(),
  pagarMensalista: vi.fn(),
}));

import {
  getContratoMensalista,
  listMensalistas,
  listTiposMensalidade,
  pagarMensalista,
} from "@/lib/api/services/mensalista";
import { MensalistasPage } from "./MensalistasPage";

// jsdom não implementa <dialog>.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

const aguardando: Mensalista = {
  mensalistaId: 3,
  mensalistaTipoId: 3,
  tipoMensal: "Diurno",
  categoria: 99,
  valorMensalidade: 280,
  tipoPessoa: 1,
  documento: "52998224725",
  nome: "Ana Lima",
  email: "ana@exemplo.com",
  celular: "11912345678",
  diaVencimento: 5,
  ativo: false,
  veiculos: [],
  situacao: SITUACAO_AGUARDANDO_PRIMEIRO_PAGAMENTO,
  dataProximoVencimento: null,
  diasAteProximoVencimento: null,
};
const ativa: Mensalista = { ...aguardando, ativo: true, situacao: "Em Dia", dataProximoVencimento: "2026-11-05T00:00:00" };

const tipoAtivo: MensalistaTipo = {
  mensalistaTipoId: 3,
  tipoMensal: "Diurno",
  categoria: 99,
  valorMensalidade: 280,
  horarioEntrada: null,
  horarioSaida: null,
  ativo: true,
};

const aceito: ContratoMensalista = {
  status: CONTRATO_STATUS.Aceito,
  versao: "1",
  titulo: "Contrato",
  dataGeracao: null,
  tokenExpiracao: null,
  dataAceite: "2026-10-20T14:32:00",
};

const pagina = (items: Mensalista[]) => ({ items, page: 1, pageSize: 20, totalRecords: items.length, totalPages: 1 });

beforeEach(() => {
  vi.mocked(listMensalistas).mockReset().mockResolvedValue(pagina([aguardando]));
  vi.mocked(listTiposMensalidade).mockReset().mockResolvedValue([tipoAtivo]);
  vi.mocked(getContratoMensalista).mockReset().mockResolvedValue(aceito);
  vi.mocked(pagarMensalista).mockReset().mockResolvedValue({
    paga: { cobrancaId: 1, valor: 280, vencimento: "2026-10-05", dataPagamento: "2026-10-21T14:32:00", formaPagamento: 2, status: 1 },
    proxima: { cobrancaId: 2, valor: 280, vencimento: "2026-11-05", dataPagamento: null, formaPagamento: null, status: 0 },
  });
});

describe("MensalistasPage: pagamento", () => {
  it("da lista ao comprovante: recebe, mostra o resultado, e a lista já mostra o mensalista ativo", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MensalistasPage />);

    await user.click(await screen.findByRole("button", { name: "Receber pagamento de Ana Lima" }));
    const modal = await screen.findByRole("dialog", { name: "Registrar pagamento" });
    expect(within(modal).getByText(/o cadastro será ativado/)).toBeInTheDocument();

    // Depois do pagamento a listagem devolve o mensalista ativo.
    vi.mocked(listMensalistas).mockResolvedValue(pagina([ativa]));
    await user.click(within(modal).getByRole("radio", { name: "Pix" }));
    await user.click(within(modal).getByRole("button", { name: "Confirmar R$ 280,00 em Pix" }));

    expect(pagarMensalista).toHaveBeenCalledWith({ mensalistaId: 3, valorPago: 280, formaPagamento: 2 });
    const comprovante = await screen.findByRole("dialog", { name: "Pagamento registrado" });
    expect(within(comprovante).getByText("R$ 280,00 · vence em 05/11/26")).toBeInTheDocument();

    await user.click(within(comprovante).getByRole("button", { name: "Concluir" }));

    expect(await screen.findByText("Pagamento registrado. Mensalista ativado.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText("Ativo").length).toBeGreaterThan(0));
    expect(screen.queryByRole("button", { name: "Receber pagamento de Ana Lima" })).not.toBeInTheDocument();
  });

  it("da ficha: troca a ficha pelo modal de pagamento", async () => {
    const user = userEvent.setup();
    vi.mocked(listMensalistas).mockResolvedValue(pagina([ativa]));
    renderWithProviders(<MensalistasPage />);

    await user.click(await screen.findByRole("button", { name: "Ver ficha de Ana Lima" }));
    const ficha = await screen.findByRole("dialog", { name: "Ana Lima" });
    await user.click(within(ficha).getByRole("button", { name: "Registrar pagamento" }));

    expect(await screen.findByRole("dialog", { name: "Registrar pagamento" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Ana Lima" })).not.toBeInTheDocument();
  });
});
