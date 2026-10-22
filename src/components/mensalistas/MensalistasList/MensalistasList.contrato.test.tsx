import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import { TODOS_OS_DIAS, CONTRATO_STATUS,
  SITUACAO_AGUARDANDO_PRIMEIRO_PAGAMENTO,
  type ContratoMensalista,
  type Mensalista,
  type MensalistaTipo, } from "@/types/mensalista";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => ({ get: () => null }),
}));

vi.mock("@/lib/api/services/mensalista", () => ({
  listMensalistas: vi.fn(),
  listTiposMensalidade: vi.fn(),
  getContratoMensalista: vi.fn(),
  reenviarContrato: vi.fn(),
}));

import {
  getContratoMensalista,
  listMensalistas,
  listTiposMensalidade,
  reenviarContrato,
} from "@/lib/api/services/mensalista";
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
  situacao: null,
  dataProximoVencimento: null,
  diasAteProximoVencimento: null,
};
const joao: Mensalista = { ...maria, mensalistaId: 2, nome: "João Lima", email: "joao@exemplo.com", ativo: false };

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

const aguardando = { ...maria, ativo: false, situacao: SITUACAO_AGUARDANDO_PRIMEIRO_PAGAMENTO };
const emDias = (dias: number) => new Date(Date.now() + dias * 86_400_000).toISOString();
const contrato = (extra: Partial<ContratoMensalista> = {}): ContratoMensalista => ({
  status: CONTRATO_STATUS.Pendente,
  versao: "1",
  titulo: "Contrato",
  dataGeracao: null,
  tokenExpiracao: null,
  dataAceite: null,
  ...extra,
});
const veiculo = (placa: string) => ({ placa, modelo: "Gol", cor: "PRATA", categoria: 2 as const, condutores: [] });

function page(items: Mensalista[]) {
  return { items, page: 1, pageSize: 20, totalRecords: items.length, totalPages: 1 };
}

const handlers = { onNovo: vi.fn(), onEditar: vi.fn(), onVerFicha: vi.fn(), onReceberPagamento: vi.fn(), onToast: vi.fn(), onCriarTipo: vi.fn() };

beforeEach(() => {
  vi.mocked(listMensalistas).mockReset();
  vi.mocked(listTiposMensalidade).mockReset().mockResolvedValue([tipoAtivo]);
  vi.mocked(getContratoMensalista).mockReset().mockResolvedValue(null);
  vi.mocked(reenviarContrato).mockReset();
  Object.values(handlers).forEach((fn) => fn.mockReset());
});

describe("MensalistasList: veículos", () => {
  it("mostra até duas placas e um chip com as demais, e abre a ficha", async () => {
    const comVeiculos = { ...maria, veiculos: [veiculo("ABC1D23"), veiculo("BRA2E19"), veiculo("XYZ9876")] };
    vi.mocked(listMensalistas).mockResolvedValue(page([comVeiculos]));
    renderWithProviders(<MensalistasList {...handlers} />);

    expect(await screen.findByText("ABC1D23")).toBeInTheDocument();
    expect(screen.getByText("BRA2E19")).toBeInTheDocument();
    expect(screen.queryByText("XYZ-9876")).not.toBeInTheDocument();
    expect(screen.getByText("+1")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Ver veículos de Maria Souza" }));
    expect(handlers.onVerFicha).toHaveBeenCalledWith(comVeiculos);
  });

  it("sem veículos não há botão de veículos", async () => {
    vi.mocked(listMensalistas).mockResolvedValue(page([maria]));
    renderWithProviders(<MensalistasList {...handlers} />);

    await screen.findByText("Maria Souza");
    expect(screen.queryByRole("button", { name: /Ver veículos/ })).not.toBeInTheDocument();
  });

  it("o botão Ver ficha abre a ficha do mensalista", async () => {
    vi.mocked(listMensalistas).mockResolvedValue(page([maria]));
    renderWithProviders(<MensalistasList {...handlers} />);

    await userEvent.click(await screen.findByRole("button", { name: "Ver ficha de Maria Souza" }));
    expect(handlers.onVerFicha).toHaveBeenCalledWith(maria);
  });
});

describe("MensalistasList: situação do contrato", () => {
  it("link válido: aguardando aceite, com a validade e a ação de reenviar", async () => {
    vi.mocked(listMensalistas).mockResolvedValue(page([aguardando]));
    vi.mocked(getContratoMensalista).mockResolvedValue(contrato({ tokenExpiracao: emDias(3) }));
    renderWithProviders(<MensalistasList {...handlers} />);

    expect(await screen.findByText("Aguardando aceite")).toBeInTheDocument();
    expect(screen.getByText(/Enviado · link vence em/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reenviar contrato para Maria Souza" })).toBeInTheDocument();
    expect(getContratoMensalista).toHaveBeenCalledWith(aguardando.mensalistaId);
  });

  it("link vencido", async () => {
    vi.mocked(listMensalistas).mockResolvedValue(page([aguardando]));
    vi.mocked(getContratoMensalista).mockResolvedValue(contrato({ tokenExpiracao: emDias(-1) }));
    renderWithProviders(<MensalistasList {...handlers} />);

    expect(await screen.findByText("Link do contrato vencido")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reenviar contrato para Maria Souza" })).toBeInTheDocument();
  });

  it("contrato aceito: aguarda o 1º pagamento, com a data do aceite e sem reenvio", async () => {
    vi.mocked(listMensalistas).mockResolvedValue(page([aguardando]));
    vi.mocked(getContratoMensalista).mockResolvedValue(
      contrato({ status: CONTRATO_STATUS.Aceito, dataAceite: "2026-10-20T14:32:00" }),
    );
    renderWithProviders(<MensalistasList {...handlers} />);

    expect(await screen.findByText("Aguardando 1º pagamento")).toBeInTheDocument();
    expect(screen.getByText(/Contrato aceito em/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Reenviar contrato/ })).not.toBeInTheDocument();
  });

  it("sem contrato: oferece enviar um", async () => {
    vi.mocked(listMensalistas).mockResolvedValue(page([aguardando]));
    vi.mocked(getContratoMensalista).mockResolvedValue(null);
    renderWithProviders(<MensalistasList {...handlers} />);

    expect(await screen.findByText("Sem contrato")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enviar contrato para Maria Souza" })).toBeInTheDocument();
  });

  it("falha ao consultar o contrato cai em Inativo", async () => {
    vi.mocked(listMensalistas).mockResolvedValue(page([aguardando]));
    vi.mocked(getContratoMensalista).mockRejectedValue(new ApiError("server"));
    renderWithProviders(<MensalistasList {...handlers} />);

    expect(await screen.findByText("Inativo")).toBeInTheDocument();
  });

  it("não consulta o contrato de quem está ativo ou foi desativado", async () => {
    vi.mocked(listMensalistas).mockResolvedValue(page([maria, joao]));
    renderWithProviders(<MensalistasList {...handlers} />);

    await screen.findByText("Maria Souza");
    expect(getContratoMensalista).not.toHaveBeenCalled();
  });
});

describe("MensalistasList: reenvio do contrato", () => {
  const outro = { ...aguardando, mensalistaId: 2, nome: "João Lima", email: "joao@exemplo.com" };

  it("reenvia, desabilita só a linha e avisa o e-mail e que o link anterior deixa de funcionar", async () => {
    vi.mocked(listMensalistas).mockResolvedValue(page([aguardando, outro]));
    vi.mocked(getContratoMensalista).mockResolvedValue(contrato({ tokenExpiracao: emDias(1) }));
    let concluir: (value: { email: string; tokenExpiracao: string | null }) => void = () => {};
    vi.mocked(reenviarContrato).mockReturnValue(new Promise((resolve) => (concluir = resolve)));
    renderWithProviders(<MensalistasList {...handlers} />);

    await userEvent.click(await screen.findByRole("button", { name: "Reenviar contrato para Maria Souza" }));

    expect(reenviarContrato).toHaveBeenCalledWith(aguardando.mensalistaId);
    expect(await screen.findByRole("button", { name: "Reenviar contrato para Maria Souza" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reenviar contrato para João Lima" })).toBeEnabled();

    concluir({ email: "maria@exemplo.com", tokenExpiracao: null });
    await waitFor(() =>
      expect(handlers.onToast).toHaveBeenCalledWith(
        "Novo link enviado para maria@exemplo.com. Vale por 7 dias; o link anterior deixa de funcionar.",
      ),
    );
  });

  it("mostra a mensagem do back quando o reenvio falha", async () => {
    vi.mocked(listMensalistas).mockResolvedValue(page([aguardando]));
    vi.mocked(getContratoMensalista).mockResolvedValue(contrato({ tokenExpiracao: emDias(1) }));
    vi.mocked(reenviarContrato).mockImplementation(async () => {
      throw new ApiError("validation", "O mensalista já aceitou o contrato.", 400);
    });
    renderWithProviders(<MensalistasList {...handlers} />);

    await userEvent.click(await screen.findByRole("button", { name: "Reenviar contrato para Maria Souza" }));

    await waitFor(() => expect(handlers.onToast).toHaveBeenCalledWith("O mensalista já aceitou o contrato.", "error"));
  });
});
