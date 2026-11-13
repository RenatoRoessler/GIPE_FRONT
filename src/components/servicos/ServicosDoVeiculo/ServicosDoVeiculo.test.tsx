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
  atualizarStatusServico: vi.fn(),
  listFila: vi.fn(),
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
  valorCentavos: 2500,
  tempoPermitidoMinutos: 60,
  status,
  motivoCancelamento: null,
  adicionadoEm: null,
  adicionadoPor: null,
  previsaoEm: null,
  prontoEm: null,
  ...extra,
});

const DADOS: ServicosDoVeiculoDados = {
  valorServicosCentavos: 5000,
  tempoPermitidoMinutos: 60,
  livreAte: "2026-11-12T15:30:00",
  servicos: [doVeiculo(1, "Lavagem", STATUS_SERVICO.Aguardando), doVeiculo(2, "Cera", STATUS_SERVICO.Pronto)],
};

const SEM_SERVICOS: ServicosDoVeiculoDados = { ...DADOS, valorServicosCentavos: 0, servicos: [] };

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

function renderizar() {
  const onAviso = vi.fn();
  const onFolhaAberta = vi.fn();
  renderWithProviders(<ServicosDoVeiculo idPatio={7} placa="ABC1D23" categoria={2} onAviso={onAviso} onFolhaAberta={onFolhaAberta} />);
  return { onAviso, onFolhaAberta };
}

beforeEach(() => {
  vi.clearAllMocks();
  sessao.atual = { user: { name: "Ana", perfil: 1 }, isLoading: false };
  configuracao.getConfiguracao.mockResolvedValue(CONFIG);
  api.listServicosDoVeiculo.mockResolvedValue(DADOS);
  api.listServicos.mockResolvedValue([catalogo(10, "Polimento", [preco(2, 8000)]), catalogo(11, "Caminhão", [preco(5, 20000)]), catalogo(12, "Vitrificação", [preco(99, 30000)])]);
  api.acrescentarServicos.mockResolvedValue(undefined);
  api.cancelarServico.mockResolvedValue(SEM_SERVICOS);
  api.atualizarStatusServico.mockResolvedValue(undefined);
  api.listFila.mockResolvedValue([]);
});

describe("ServicosDoVeiculo", () => {
  it("não aparece com os serviços desligados", async () => {
    configuracao.getConfiguracao.mockResolvedValue({ ...CONFIG, servicos: false });
    renderizar();

    await waitFor(() => expect(configuracao.getConfiguracao).toHaveBeenCalled());
    expect(screen.queryByRole("region", { name: "Serviços do veículo" })).not.toBeInTheDocument();
    expect(api.listServicosDoVeiculo).not.toHaveBeenCalled();
  });

  it("sem serviço, mostra o botão tracejado para adicionar", async () => {
    api.listServicosDoVeiculo.mockResolvedValue(SEM_SERVICOS);
    renderizar();

    expect(await screen.findByRole("button", { name: "Adicionar serviço" })).toBeInTheDocument();
    expect(screen.getByText("Serviços adicionais")).toBeInTheDocument();
  });

  it("sem serviço, quem não gere serviços não vê o botão", async () => {
    sessao.atual = { user: { name: "Leo", perfil: 9 }, isLoading: false };
    api.listServicosDoVeiculo.mockResolvedValue(SEM_SERVICOS);
    renderizar();

    await waitFor(() => expect(api.listServicosDoVeiculo).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByRole("status", { name: "Carregando os serviços do veículo" })).not.toBeInTheDocument());
    expect(screen.getByText("Serviços adicionais")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Adicionar/ })).not.toBeInTheDocument();
  });

  it("com serviços, lista nome, valor e status, o subtotal do back e a contagem", async () => {
    renderizar();

    const lista = await screen.findByRole("list", { name: "Serviços de ABC1D23" });
    expect(within(lista).getByText("Lavagem")).toBeInTheDocument();
    expect(within(lista).getByText("Na fila")).toBeInTheDocument();
    expect(within(lista).getByText("Pronto")).toBeInTheDocument();
    expect(screen.getByText("Serviços · 2")).toBeInTheDocument();
    expect(screen.getByText(/Subtotal serviços/)).toHaveTextContent("R$ 50,00");
    expect(screen.getByRole("button", { name: "+ Adicionar" })).toBeInTheDocument();
  });

  it("não mostra serviço cancelado nem pede ao back que o inclua", async () => {
    api.listServicosDoVeiculo.mockResolvedValue({ ...DADOS, servicos: [...DADOS.servicos, doVeiculo(3, "Enceramento", STATUS_SERVICO.Cancelado, { motivoCancelamento: "Cliente desistiu" })] });
    renderizar();

    await screen.findByText("Lavagem");
    expect(screen.queryByText("Enceramento")).not.toBeInTheDocument();
    expect(screen.getByText("Serviços · 2")).toBeInTheDocument();
    expect(api.listServicosDoVeiculo).toHaveBeenCalledWith(7, { incluirCancelados: false });
    expect(screen.queryByRole("switch", { name: "Mostrar cancelados" })).not.toBeInTheDocument();
  });

  it("não repete o resumo de tempo permitido no ticket", async () => {
    renderizar();
    await screen.findByText("Lavagem");

    expect(screen.queryByText(/tempo permitido/)).not.toBeInTheDocument();
    expect(screen.queryByText(/livre até/)).not.toBeInTheDocument();
  });

  it("o Lavador troca o status pelo menu, mas não adiciona", async () => {
    sessao.atual = { user: { name: "Leo", perfil: 9 }, isLoading: false };
    renderizar();
    await screen.findByText("Lavagem");

    expect(screen.queryByRole("button", { name: "+ Adicionar" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ações de Lavagem" })).toBeInTheDocument();
  });

  it("perfil sem permissão de serviços só lê: nem adicionar nem menu", async () => {
    sessao.atual = { user: { name: "Zé", perfil: 6 }, isLoading: false };
    renderizar();
    await screen.findByText("Lavagem");

    expect(screen.queryByRole("button", { name: "+ Adicionar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Ações de/ })).not.toBeInTheDocument();
  });

  it("mostra o erro e tenta de novo", async () => {
    api.listServicosDoVeiculo.mockRejectedValueOnce(new ApiError("server", "Falha ao carregar."));
    renderizar();

    expect(await screen.findByText("Falha ao carregar.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findByText("Lavagem")).toBeInTheDocument();
  });
});

describe("ServicosDoVeiculo: adicionar", () => {
  async function abrir() {
    const avisos = renderizar();
    await screen.findByText("Lavagem");
    await userEvent.click(screen.getByRole("button", { name: "+ Adicionar" }));
    return { ...avisos, folha: await screen.findByRole("dialog", { name: "Adicionar serviços" }) };
  }

  it("abre a folha com o que atende a categoria do veículo e avisa a pausa", async () => {
    const { folha, onFolhaAberta } = await abrir();

    expect(await within(folha).findByRole("checkbox", { name: /Polimento/ })).toBeEnabled();
    expect(within(folha).getByRole("checkbox", { name: /Vitrificação/ })).toBeEnabled();
    expect(within(folha).getByRole("checkbox", { name: /Caminhão/ })).toBeDisabled();
    expect(onFolhaAberta).toHaveBeenLastCalledWith(true);
  });

  it("envia os serviços escolhidos e avisa", async () => {
    const { onAviso, onFolhaAberta, folha } = await abrir();
    await userEvent.click(await within(folha).findByRole("checkbox", { name: /Polimento/ }));
    await userEvent.click(within(folha).getByRole("button", { name: /Adicionar ao ticket/ }));

    await waitFor(() => expect(api.acrescentarServicos).toHaveBeenCalledWith(7, [10]));
    await waitFor(() => expect(onAviso).toHaveBeenCalledWith("Serviço adicionado."));
    await waitFor(() => expect(onFolhaAberta).toHaveBeenLastCalledWith(false));
  });

  it("mostra o erro do back e mantém a escolha", async () => {
    api.acrescentarServicos.mockRejectedValue(new ApiError("validation", "Serviço já acrescentado."));
    const { folha } = await abrir();
    await userEvent.click(await within(folha).findByRole("checkbox", { name: /Polimento/ }));
    await userEvent.click(within(folha).getByRole("button", { name: /Adicionar ao ticket/ }));

    expect(await within(folha).findByText("Serviço já acrescentado.")).toBeInTheDocument();
    expect(within(folha).getByRole("checkbox", { name: /Polimento/ })).toBeChecked();
  });
});

describe("ServicosDoVeiculo: detalhe", () => {
  it("o menu abre o detalhe do serviço e trocar o status chama a API", async () => {
    const { onFolhaAberta } = renderizar();
    await screen.findByText("Lavagem");
    await userEvent.click(screen.getByRole("button", { name: "Ações de Lavagem" }));

    const folha = await screen.findByRole("dialog", { name: "Lavagem" });
    expect(onFolhaAberta).toHaveBeenLastCalledWith(true);
    await userEvent.click(within(folha).getByRole("radio", { name: "Em andamento" }));

    await waitFor(() => expect(api.atualizarStatusServico).toHaveBeenCalledWith(7, 1, STATUS_SERVICO.EmExecucao));
  });
});
