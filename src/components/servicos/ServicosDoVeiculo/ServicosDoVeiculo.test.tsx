import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import { STATUS_SERVICO, type Servico, type ServicoDoVeiculo, type ServicosDoVeiculo as ServicosDoVeiculoDados } from "@/types/servico";

const api = vi.hoisted(() => ({
  listServicosDoVeiculo: vi.fn(),
  listServicos: vi.fn(),
  acrescentarServicos: vi.fn(),
  cancelarServico: vi.fn(),
}));
vi.mock("@/lib/api/services/servico", () => api);

const configuracao = vi.hoisted(() => ({ getConfiguracao: vi.fn(), updateConfiguracao: vi.fn() }));
vi.mock("@/lib/api/services/configuracao", () => configuracao);

const sessao = vi.hoisted(() => ({ atual: { user: { name: "Ana", perfil: 1 }, isLoading: false } }));
vi.mock("@/contexts/CurrentUserContext", () => ({ useCurrentUser: () => sessao.atual }));

vi.mock("@/hooks/useMediaQuery", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/hooks/useMediaQuery")>()),
  useIsMobile: () => false,
}));

import { ServicosDoVeiculo } from "./ServicosDoVeiculo";

const CONFIG = { modelo: true, cor: true, prisma: false, servicos: true, entradaDiretoCamera: true, alteradoPorId: null, alteradoEm: null };

const doVeiculo = (id: number, nome: string, status: ServicoDoVeiculo["status"], extra: Partial<ServicoDoVeiculo> = {}): ServicoDoVeiculo => ({
  id,
  servicoId: id,
  nome,
  valorCentavos: 5000,
  tempoPermitidoMinutos: 60,
  status,
  motivoCancelamento: null,
  ...extra,
});

const DADOS: ServicosDoVeiculoDados = {
  valorServicosCentavos: 5000,
  tempoPermitidoMinutos: 60,
  livreAte: "2026-11-12T15:30:00",
  servicos: [doVeiculo(1, "Lavagem", STATUS_SERVICO.Aguardando), doVeiculo(2, "Cera", STATUS_SERVICO.Pronto)],
};

const catalogo = (id: number, nome: string, precos: Servico["precos"]): Servico => ({
  id,
  nome,
  descricao: null,
  duracaoMinutos: null,
  tempoPermitidoMinutos: null,
  ativo: true,
  precos,
});

const preco = (categoria: number, valorCentavos: number) => ({ categoria, descricao: "x", valorCentavos });

// jsdom não implementa <dialog>.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

function renderizar(onAviso = vi.fn()) {
  renderWithProviders(<ServicosDoVeiculo idPatio={7} placa="ABC1D23" categoria={2} onAviso={onAviso} />);
  return onAviso;
}

beforeEach(() => {
  vi.clearAllMocks();
  sessao.atual = { user: { name: "Ana", perfil: 1 }, isLoading: false };
  configuracao.getConfiguracao.mockResolvedValue(CONFIG);
  api.listServicosDoVeiculo.mockResolvedValue(DADOS);
  api.listServicos.mockResolvedValue([catalogo(10, "Polimento", [preco(2, 8000)]), catalogo(11, "Caminhão", [preco(5, 20000)]), catalogo(12, "Vitrificação", [preco(99, 30000)])]);
  api.acrescentarServicos.mockResolvedValue(undefined);
  api.cancelarServico.mockResolvedValue(undefined);
});

describe("ServicosDoVeiculo", () => {
  it("não aparece com os serviços desligados", async () => {
    configuracao.getConfiguracao.mockResolvedValue({ ...CONFIG, servicos: false });
    renderizar();

    await waitFor(() => expect(configuracao.getConfiguracao).toHaveBeenCalled());
    expect(screen.queryByRole("region", { name: "Serviços do veículo" })).not.toBeInTheDocument();
    expect(api.listServicosDoVeiculo).not.toHaveBeenCalled();
  });

  it("lista os serviços com status e valor, e o resumo do back", async () => {
    renderizar();

    const lista = await screen.findByRole("list", { name: "Serviços de ABC1D23" });
    expect(within(lista).getByText("Lavagem")).toBeInTheDocument();
    expect(within(lista).getByText("Aguardando")).toBeInTheDocument();
    expect(within(lista).getByText("Pronto")).toBeInTheDocument();
    expect(screen.getByText(/Serviços R\$\s50,00 · tempo permitido 60 min · 1 h · livre até 15:30/)).toBeInTheDocument();
  });

  it("mostra os cancelados, com o motivo, só quando o interruptor liga", async () => {
    api.listServicosDoVeiculo.mockImplementation((_id: number, { incluirCancelados }: { incluirCancelados: boolean }) =>
      Promise.resolve(
        incluirCancelados
          ? { ...DADOS, servicos: [...DADOS.servicos, doVeiculo(3, "Enceramento", STATUS_SERVICO.Cancelado, { motivoCancelamento: "Cliente desistiu" })] }
          : DADOS,
      ),
    );
    renderizar();
    await screen.findByText("Lavagem");
    expect(screen.queryByText("Enceramento")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("switch", { name: "Mostrar cancelados" }));

    expect(await screen.findByText("Enceramento")).toBeInTheDocument();
    expect(screen.getByText("Motivo: Cliente desistiu")).toBeInTheDocument();
  });

  it("só o serviço Aguardando tem Cancelar", async () => {
    renderizar();
    await screen.findByText("Lavagem");

    expect(screen.getAllByRole("button", { name: "Cancelar serviço" })).toHaveLength(1);
  });

  it("cancela com o motivo e avisa", async () => {
    const onAviso = renderizar();
    await screen.findByText("Lavagem");
    await userEvent.click(screen.getByRole("button", { name: "Cancelar serviço" }));

    const dialogo = await screen.findByRole("dialog");
    await userEvent.type(within(dialogo).getByLabelText("Motivo"), "Engano");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Cancelar serviço" }));

    await waitFor(() => expect(api.cancelarServico).toHaveBeenCalledWith(7, 1, "Engano"));
    await waitFor(() => expect(onAviso).toHaveBeenCalledWith("Serviço cancelado."));
  });

  it("o Lavador só vê, sem acrescentar nem cancelar", async () => {
    sessao.atual = { user: { name: "Leo", perfil: 9 }, isLoading: false };
    renderizar();
    await screen.findByText("Lavagem");

    expect(screen.queryByRole("button", { name: "Acrescentar serviços" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancelar serviço" })).not.toBeInTheDocument();
  });

  it("mostra o erro e tenta de novo", async () => {
    api.listServicosDoVeiculo.mockRejectedValueOnce(new ApiError("server", "Falha ao carregar."));
    renderizar();

    expect(await screen.findByText("Falha ao carregar.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findByText("Lavagem")).toBeInTheDocument();
  });
});

describe("ServicosDoVeiculo: acrescentar", () => {
  async function abrir() {
    const onAviso = renderizar();
    await screen.findByText("Lavagem");
    await userEvent.click(screen.getByRole("button", { name: "Acrescentar serviços" }));
    return { onAviso, dialogo: await screen.findByRole("dialog") };
  }

  it("desabilita o que não atende a categoria do veículo", async () => {
    const { dialogo } = await abrir();

    expect(await within(dialogo).findByRole("checkbox", { name: /Polimento/ })).toBeEnabled();
    expect(within(dialogo).getByRole("checkbox", { name: /Vitrificação/ })).toBeEnabled();
    expect(within(dialogo).getByRole("checkbox", { name: /Caminhão/ })).toBeDisabled();
    expect(within(dialogo).getByText("Não atende a categoria deste veículo.")).toBeInTheDocument();
  });

  it("soma o total escolhido e só liga com algo marcado", async () => {
    const { dialogo } = await abrir();
    const acrescentar = within(dialogo).getByRole("button", { name: "Acrescentar" });
    expect(acrescentar).toBeDisabled();

    await userEvent.click(await within(dialogo).findByRole("checkbox", { name: /Polimento/ }));
    await userEvent.click(within(dialogo).getByRole("checkbox", { name: /Vitrificação/ }));

    expect(within(dialogo).getByText(/Total R\$\s380,00/)).toBeInTheDocument();
    expect(acrescentar).toBeEnabled();
  });

  it("envia os serviços escolhidos e avisa", async () => {
    const { onAviso, dialogo } = await abrir();
    await userEvent.click(await within(dialogo).findByRole("checkbox", { name: /Polimento/ }));
    await userEvent.click(within(dialogo).getByRole("button", { name: "Acrescentar" }));

    await waitFor(() => expect(api.acrescentarServicos).toHaveBeenCalledWith(7, [10]));
    await waitFor(() => expect(onAviso).toHaveBeenCalledWith("Serviço acrescentado."));
  });

  it("mostra o erro do back e mantém a escolha", async () => {
    api.acrescentarServicos.mockRejectedValue(new ApiError("validation", "Serviço já acrescentado."));
    const { dialogo } = await abrir();
    await userEvent.click(await within(dialogo).findByRole("checkbox", { name: /Polimento/ }));
    await userEvent.click(within(dialogo).getByRole("button", { name: "Acrescentar" }));

    expect(await within(dialogo).findByText("Serviço já acrescentado.")).toBeInTheDocument();
    expect(within(dialogo).getByRole("checkbox", { name: /Polimento/ })).toBeChecked();
  });
});
