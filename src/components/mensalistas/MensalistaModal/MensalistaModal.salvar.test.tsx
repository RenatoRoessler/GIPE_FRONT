import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import {
  CONTRATO_STATUS,
  SITUACAO_AGUARDANDO_PRIMEIRO_PAGAMENTO,
  type Mensalista,
  type MensalistaTipo,
} from "@/types/mensalista";

vi.mock("@/lib/api/services/mensalista", () => ({
  createMensalista: vi.fn(),
  updateMensalista: vi.fn(),
  listTiposMensalidade: vi.fn(),
  getContratoMensalista: vi.fn(),
}));

import {
  createMensalista,
  getContratoMensalista,
  listTiposMensalidade,
  updateMensalista,
} from "@/lib/api/services/mensalista";
import { MensalistaModal } from "./MensalistaModal";

// jsdom não implementa <dialog>.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

const handlers = { onClose: vi.fn(), onSuccess: vi.fn(), onGoToTipos: vi.fn() };

const tipo: MensalistaTipo = {
  mensalistaTipoId: 3,
  tipoMensal: "Diurno",
  categoria: 99,
  valorMensalidade: 280,
  horarioEntrada: null,
  horarioSaida: null,
  ativo: true,
};

const veiculoMaria = { placa: "ABC1D23", modelo: "Gol", cor: "PRATA", categoria: 2 as const, condutores: [] };

const maria: Mensalista = {
  mensalistaId: 7,
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
  veiculos: [veiculoMaria],
  situacao: "Em Dia",
  dataProximoVencimento: null,
  diasAteProximoVencimento: null,
};

type User = ReturnType<typeof userEvent.setup>;

beforeEach(() => {
  vi.mocked(createMensalista).mockReset();
  vi.mocked(updateMensalista).mockReset();
  vi.mocked(listTiposMensalidade).mockReset().mockResolvedValue([tipo]);
  vi.mocked(getContratoMensalista).mockReset().mockResolvedValue(null);
  Object.values(handlers).forEach((fn) => fn.mockReset());
});

async function abrirEdicao(mensalista: Mensalista) {
  renderWithProviders(<MensalistaModal mensalista={mensalista} {...handlers} />);
  await screen.findByRole("option", { name: /Diurno/ });
}

describe("MensalistaModal: ativo na edição", () => {
  it("mensalista ativo: o interruptor só desliga, e o salvar envia ativo=false", async () => {
    vi.mocked(updateMensalista).mockResolvedValue();
    const user: User = userEvent.setup();
    await abrirEdicao(maria);

    const interruptor = screen.getByRole("switch", { name: "Mensalista ativo" });
    await user.click(interruptor);
    expect(screen.getByRole("switch", { name: "Mensalista será desativado ao salvar" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(updateMensalista).toHaveBeenCalled());
    expect(vi.mocked(updateMensalista).mock.calls[0][0]).toBe(7);
    expect(vi.mocked(updateMensalista).mock.calls[0][1]).toMatchObject({ ativo: false });
    expect(handlers.onSuccess).toHaveBeenCalledWith("Mensalista atualizado.");
  });

  it("mensalista ativo: sem mexer no interruptor continua ativo", async () => {
    vi.mocked(updateMensalista).mockResolvedValue();
    const user: User = userEvent.setup();
    await abrirEdicao(maria);
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(updateMensalista).toHaveBeenCalled());
    expect(vi.mocked(updateMensalista).mock.calls[0][1]).toMatchObject({ ativo: true });
  });

  it("mensalista inativo: sem interruptor, mostra a situação e mantém ativo=false", async () => {
    vi.mocked(updateMensalista).mockResolvedValue();
    vi.mocked(getContratoMensalista).mockResolvedValue({
      status: CONTRATO_STATUS.Aceito,
      versao: "1",
      titulo: "Contrato",
      dataGeracao: null,
      tokenExpiracao: null,
      dataAceite: "2026-10-20T14:32:00",
    });
    const user: User = userEvent.setup();
    await abrirEdicao({ ...maria, ativo: false, situacao: SITUACAO_AGUARDANDO_PRIMEIRO_PAGAMENTO });

    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    expect(await screen.findByText("Aguardando 1º pagamento")).toBeInTheDocument();
    // Dentro do modal a situação é só leitura: o reenvio fica na lista e na ficha.
    expect(screen.queryByRole("button", { name: /contrato para/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(updateMensalista).toHaveBeenCalled());
    expect(vi.mocked(updateMensalista).mock.calls[0][1]).toMatchObject({ ativo: false });
  });
});

describe("MensalistaModal: erros do servidor nos veículos", () => {
  it("mensagem que cita a placa vai para o campo do veículo, que abre e recebe o foco", async () => {
    vi.mocked(updateMensalista).mockImplementation(async () => {
      throw new ApiError("validation", "A placa ABC1D23 pertence a outro mensalista.", 400);
    });
    const user: User = userEvent.setup();
    await abrirEdicao(maria);
    // O veículo vem recolhido na edição.
    const painel = () => screen.getAllByRole("region", { hidden: true })[1];
    expect(painel()).toHaveAttribute("hidden");

    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("A placa ABC1D23 pertence a outro mensalista.")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await waitFor(() => expect(painel()).not.toHaveAttribute("hidden"));
    await waitFor(() => expect(screen.getByLabelText("Placa")).toHaveFocus());
  });

  it("mexer na placa tira o erro do servidor", async () => {
    vi.mocked(updateMensalista).mockImplementation(async () => {
      throw new ApiError("validation", "A placa ABC1D23 pertence a outro mensalista.", 400);
    });
    const user: User = userEvent.setup();
    await abrirEdicao(maria);
    await user.click(screen.getByRole("button", { name: "Salvar" }));
    await screen.findByText("A placa ABC1D23 pertence a outro mensalista.");

    await user.type(screen.getByLabelText("Placa"), "{Backspace}");

    await waitFor(() =>
      expect(screen.queryByText("A placa ABC1D23 pertence a outro mensalista.")).not.toBeInTheDocument(),
    );
  });

  it("mensagem sem placa conhecida fica no banner", async () => {
    vi.mocked(updateMensalista).mockImplementation(async () => {
      throw new ApiError("validation", "A categoria do veículo difere da do tipo de mensalidade.", 400);
    });
    const user: User = userEvent.setup();
    await abrirEdicao(maria);
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("A categoria do veículo difere da do tipo de mensalidade.");
  });
});
