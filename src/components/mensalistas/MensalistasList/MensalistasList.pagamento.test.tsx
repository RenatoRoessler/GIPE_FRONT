import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { TODOS_OS_DIAS, CONTRATO_STATUS,
  SITUACAO_AGUARDANDO_PRIMEIRO_PAGAMENTO,
  type ContratoMensalista,
  type Mensalista,
  type MensalistaTipo, } from "@/types/mensalista";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => ({ get: () => null }),
}));

vi.mock("@/lib/api/services/mensalista", () => ({
  listMensalistas: vi.fn(),
  listTiposMensalidade: vi.fn(),
  getContratoMensalista: vi.fn(),
  reenviarContrato: vi.fn(),
}));

import { getContratoMensalista, listMensalistas, listTiposMensalidade } from "@/lib/api/services/mensalista";
import { MensalistasList } from "./MensalistasList";

const maria: Mensalista = {
  mensalistaId: 1,
  mensalistaTipoId: 3,
  tipoMensal: "Diurno",
  categoria: 99,
  valorMensalidade: 280,
  tipoPessoa: 1,
  documento: "52998224725",
  nome: "Maria Souza",
  email: "maria@exemplo.com",
  celular: "11912345678",
  diaVencimento: 5,
  ativo: true,
  veiculos: [],
  situacao: "Em Dia",
  dataProximoVencimento: null,
  diasAteProximoVencimento: null,
};
// Inativo que já pagou antes (desativado).
const joao: Mensalista = { ...maria, mensalistaId: 2, nome: "João Lima", ativo: false, situacao: "Inativo" };
const aguardando: Mensalista = {
  ...maria,
  mensalistaId: 3,
  nome: "Ana Lima",
  ativo: false,
  situacao: SITUACAO_AGUARDANDO_PRIMEIRO_PAGAMENTO,
};

const tipoAtivo: MensalistaTipo = {
  mensalistaTipoId: 3,
  tipoMensal: "Diurno",
  categoria: 99,
  valorMensalidade: 280,
  horarioEntrada: null,
  horarioSaida: null,
  ...TODOS_OS_DIAS,
  ativo: true,
};

const contrato = (extra: Partial<ContratoMensalista> = {}): ContratoMensalista => ({
  status: CONTRATO_STATUS.Pendente,
  versao: "1",
  titulo: "Contrato",
  dataGeracao: null,
  tokenExpiracao: new Date(Date.now() + 86_400_000).toISOString(),
  dataAceite: null,
  ...extra,
});

function page(items: Mensalista[]) {
  return { items, page: 1, pageSize: 20, totalRecords: items.length, totalPages: 1 };
}

const handlers = {
  onNovo: vi.fn(),
  onEditar: vi.fn(),
  onVerFicha: vi.fn(),
  onReceberPagamento: vi.fn(),
  onToast: vi.fn(),
  onCriarTipo: vi.fn(),
};

beforeEach(() => {
  vi.mocked(listMensalistas).mockReset();
  vi.mocked(listTiposMensalidade).mockReset().mockResolvedValue([tipoAtivo]);
  vi.mocked(getContratoMensalista).mockReset().mockResolvedValue(null);
  Object.values(handlers).forEach((fn) => fn.mockReset());
});

describe("MensalistasList: pagamento", () => {
  it("ativo e inativo que já pagou ganham o ícone de pagamento, que entrega a situação", async () => {
    vi.mocked(listMensalistas).mockResolvedValue(page([maria, joao]));
    renderWithProviders(<MensalistasList {...handlers} />);

    await userEvent.click(await screen.findByRole("button", { name: "Registrar pagamento de Maria Souza" }));
    expect(handlers.onReceberPagamento).toHaveBeenCalledWith(maria, { kind: "ativo" });

    await userEvent.click(screen.getByRole("button", { name: "Registrar pagamento de João Lima" }));
    expect(handlers.onReceberPagamento).toHaveBeenLastCalledWith(joao, { kind: "inativo" });
  });

  it("aguardando o 1º pagamento: botão Receber pagamento na situação, sem o ícone", async () => {
    vi.mocked(listMensalistas).mockResolvedValue(page([aguardando]));
    vi.mocked(getContratoMensalista).mockResolvedValue(
      contrato({ status: CONTRATO_STATUS.Aceito, dataAceite: "2026-10-20T14:32:00" }),
    );
    renderWithProviders(<MensalistasList {...handlers} />);

    const botao = await screen.findByRole("button", { name: "Receber pagamento de Ana Lima" });
    expect(screen.queryByRole("button", { name: "Registrar pagamento de Ana Lima" })).not.toBeInTheDocument();

    await userEvent.click(botao);
    expect(handlers.onReceberPagamento).toHaveBeenCalledWith(aguardando, {
      kind: "aguardando-pagamento",
      aceitoEm: "2026-10-20T14:32:00",
    });
  });

  it("aguardando o aceite do contrato: nenhum atalho de pagamento", async () => {
    vi.mocked(listMensalistas).mockResolvedValue(page([aguardando]));
    vi.mocked(getContratoMensalista).mockResolvedValue(contrato());
    renderWithProviders(<MensalistasList {...handlers} />);

    expect(await screen.findByText("Aguardando aceite")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /pagamento/i })).not.toBeInTheDocument();
  });

  it("enquanto o contrato é consultado, também não oferece o pagamento", async () => {
    vi.mocked(listMensalistas).mockResolvedValue(page([aguardando]));
    vi.mocked(getContratoMensalista).mockReturnValue(new Promise(() => {}));
    renderWithProviders(<MensalistasList {...handlers} />);

    await screen.findByText("Ana Lima");
    expect(screen.queryByRole("button", { name: /pagamento/i })).not.toBeInTheDocument();
  });
});
