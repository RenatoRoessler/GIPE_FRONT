import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import {
  CONTRATO_STATUS,
  SITUACAO_AGUARDANDO_PRIMEIRO_PAGAMENTO,
  TIPO_PESSOA,
  type ContratoMensalista,
  type Mensalista,
  type MensalistaVeiculo,
} from "@/types/mensalista";

vi.mock("@/lib/api/services/mensalista", () => ({
  getContratoMensalista: vi.fn(),
  reenviarContrato: vi.fn(),
}));

import { getContratoMensalista, reenviarContrato } from "@/lib/api/services/mensalista";
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

const veiculo = (placa: string, extra: Partial<MensalistaVeiculo> = {}): MensalistaVeiculo => ({
  placa,
  modelo: "Gol",
  cor: "PRATA",
  categoria: 2,
  condutores: [],
  ...extra,
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
  dataProximoVencimento: null,
  diasAteProximoVencimento: null,
};
const aguardando: Mensalista = { ...maria, ativo: false, situacao: SITUACAO_AGUARDANDO_PRIMEIRO_PAGAMENTO };

const contrato = (extra: Partial<ContratoMensalista> = {}): ContratoMensalista => ({
  status: CONTRATO_STATUS.Pendente,
  versao: "1",
  titulo: "Contrato",
  dataGeracao: null,
  tokenExpiracao: new Date(Date.now() + 86_400_000).toISOString(),
  dataAceite: null,
  ...extra,
});

const handlers = { onClose: vi.fn(), onEditar: vi.fn(), onToast: vi.fn() };

beforeEach(() => {
  vi.mocked(getContratoMensalista).mockReset().mockResolvedValue(null);
  vi.mocked(reenviarContrato).mockReset();
  Object.values(handlers).forEach((fn) => fn.mockReset());
});

describe("MensalistaFichaModal", () => {
  it("mostra o resumo, o contrato de quem está ativo e a falta de veículos", () => {
    renderWithProviders(<MensalistaFichaModal mensalista={maria} {...handlers} />);

    expect(screen.getByRole("dialog", { name: "Maria Souza" })).toBeInTheDocument();
    expect(screen.getByText("CPF 529.982.247-25 · Diurno · Todas · R$ 280,00")).toBeInTheDocument();
    expect(screen.getByText("Mensalista ativo.")).toBeInTheDocument();
    expect(screen.getByText("Nenhum veículo cadastrado.")).toBeInTheDocument();
    expect(getContratoMensalista).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: /contrato/i })).not.toBeInTheDocument();
  });

  it("pessoa física: veículo com modelo, cor e categoria, sem condutores", () => {
    renderWithProviders(
      <MensalistaFichaModal mensalista={{ ...maria, veiculos: [veiculo("ABC1D23")] }} {...handlers} />,
    );

    expect(screen.getByText("Veículos (1)")).toBeInTheDocument();
    expect(screen.getByText("ABC1D23")).toBeInTheDocument();
    expect(screen.getByText(/Gol · PRATA/)).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: /Condutores/ })).not.toBeInTheDocument();
  });

  it("pessoa jurídica: condutores com o CPF parcialmente mascarado", () => {
    const juridica: Mensalista = {
      ...maria,
      tipoPessoa: TIPO_PESSOA.Juridica,
      documento: "11222333000181",
      veiculos: [
        veiculo("BRA2E19", {
          condutores: [
            { nome: "Ana Lima", cpf: "52998224725" },
            { nome: "Bruno Reis", cpf: "11144477735" },
          ],
        }),
      ],
    };
    renderWithProviders(<MensalistaFichaModal mensalista={juridica} {...handlers} />);

    expect(screen.getByText(/^CNPJ 11\.222\.333\/0001-81/)).toBeInTheDocument();
    expect(screen.getByText("Ana Lima (529.***.***-25)")).toBeInTheDocument();
    expect(screen.getByText("Bruno Reis (111.***.***-35)")).toBeInTheDocument();
    expect(screen.queryByText(/529\.982\.247-25/)).not.toBeInTheDocument();
  });

  it("contrato aceito: explica que a ativação depende do primeiro pagamento", async () => {
    vi.mocked(getContratoMensalista).mockResolvedValue(
      contrato({ status: CONTRATO_STATUS.Aceito, dataAceite: "2026-10-20T14:32:00" }),
    );
    renderWithProviders(<MensalistaFichaModal mensalista={aguardando} {...handlers} />);

    expect(await screen.findByText(/Contrato aceito em .*O mensalista fica ativo após o primeiro pagamento\./)).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Situação de Maria Souza" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Reenviar contrato/ })).not.toBeInTheDocument();
  });

  it("contrato pendente: reenvia pelo rodapé e avisa o e-mail", async () => {
    vi.mocked(getContratoMensalista).mockResolvedValue(contrato());
    vi.mocked(reenviarContrato).mockResolvedValue({ email: "maria@exemplo.com", tokenExpiracao: null });
    renderWithProviders(<MensalistaFichaModal mensalista={aguardando} {...handlers} />);

    await userEvent.click(await screen.findByRole("button", { name: "Reenviar contrato" }));

    expect(reenviarContrato).toHaveBeenCalledWith(1);
    await waitFor(() =>
      expect(handlers.onToast).toHaveBeenCalledWith(
        "Novo link enviado para maria@exemplo.com. Vale por 7 dias; o link anterior deixa de funcionar.",
      ),
    );
  });

  it("sem contrato oferece enviar um", async () => {
    renderWithProviders(<MensalistaFichaModal mensalista={aguardando} {...handlers} />);

    expect(await screen.findByText("Este mensalista ainda não tem contrato. Envie para ele aceitar.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enviar contrato" })).toBeInTheDocument();
  });

  it("Editar entrega o mensalista para a edição", async () => {
    renderWithProviders(<MensalistaFichaModal mensalista={maria} {...handlers} />);

    await userEvent.click(screen.getByRole("button", { name: "Editar" }));
    expect(handlers.onEditar).toHaveBeenCalledWith(maria);
  });
});
