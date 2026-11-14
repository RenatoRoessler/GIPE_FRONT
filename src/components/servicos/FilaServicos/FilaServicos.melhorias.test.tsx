import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { STATUS_SERVICO, type ItemFila } from "@/types/servico";

const api = vi.hoisted(() => ({ listFila: vi.fn(), atualizarStatusServico: vi.fn(), cancelarServico: vi.fn() }));
vi.mock("@/lib/api/services/servico", () => api);

const sessao = vi.hoisted(() => ({ atual: { user: { name: "Ana", perfil: 4 }, isLoading: false } }));
vi.mock("@/contexts/CurrentUserContext", () => ({ useCurrentUser: () => sessao.atual }));

const navegacao = vi.hoisted(() => ({ replace: vi.fn(), params: new URLSearchParams(), celular: false }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: navegacao.replace }),
  usePathname: () => "/servicos",
  useSearchParams: () => navegacao.params,
}));
vi.mock("@/hooks/useMediaQuery", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/hooks/useMediaQuery")>()),
  useIsMobile: () => navegacao.celular,
}));

import { FilaServicos } from "./FilaServicos";

// Horário local, sem fuso: é como a API manda.
function atras(minutos: number): string {
  const data = new Date(Date.now() - minutos * 60_000);
  const dois = (n: number) => String(n).padStart(2, "0");
  return `${data.getFullYear()}-${dois(data.getMonth() + 1)}-${dois(data.getDate())}T${dois(data.getHours())}:${dois(data.getMinutes())}:${dois(data.getSeconds())}`;
}

const item = (id: number, nomeServico: string, status: ItemFila["status"], placa: string, extra: Partial<ItemFila> = {}): ItemFila => ({
  patioServicoId: id,
  idPatio: 100 + id,
  nomeServico,
  status,
  placa,
  modelo: "Onix",
  cor: "Prata",
  categoria: "Carro médio",
  prisma: null,
  entradaEm: null,
  ...extra,
});

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
  vi.clearAllMocks();
  navegacao.params = new URLSearchParams();
  navegacao.celular = false;
  sessao.atual = { user: { name: "Ana", perfil: 4 }, isLoading: false };
  api.atualizarStatusServico.mockResolvedValue(undefined);
  api.cancelarServico.mockResolvedValue(undefined);
});

describe("FilaServicos: cabeçalho e resumo", () => {
  it("mostra a hora, o resumo por status e a busca", async () => {
    api.listFila.mockResolvedValue([
      item(1, "Lavagem", STATUS_SERVICO.Aguardando, "ABC1D23"),
      item(2, "Cera", STATUS_SERVICO.EmExecucao, "DEF4G56"),
      item(3, "Polimento", STATUS_SERVICO.Pronto, "GHI7J89"),
    ]);
    renderWithProviders(<FilaServicos />);

    const resumo = await screen.findByRole("list", { name: "Resumo da fila" });
    expect(within(resumo).getByText("1 na fila")).toBeInTheDocument();
    expect(within(resumo).getByText("1 em andamento")).toBeInTheDocument();
    expect(within(resumo).getByText("1 pronto")).toBeInTheDocument();
    expect(screen.getByText(/^Lava-rápido · agora \d{2}:\d{2}$/)).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "Placa ou prisma" })).toBeInTheDocument();
  });

  it("conta quantos passaram da previsão, e só quando o back mandou os tempos", async () => {
    api.listFila.mockResolvedValue([
      item(1, "Lavagem", STATUS_SERVICO.EmExecucao, "ABC1D23", { iniciadoEm: atras(90), duracaoMinutos: 60 }),
      item(2, "Cera", STATUS_SERVICO.EmExecucao, "DEF4G56", { iniciadoEm: atras(10), duracaoMinutos: 60 }),
      item(3, "Higienização", STATUS_SERVICO.EmExecucao, "GHI7J89"),
    ]);
    renderWithProviders(<FilaServicos />);

    expect(await screen.findByText("1 passou da previsão")).toBeInTheDocument();
  });
});

describe("FilaServicos: busca por placa ou prisma", () => {
  const FILA = [
    item(1, "Lavagem", STATUS_SERVICO.Aguardando, "RTZ4E21", { prisma: "12" }),
    item(2, "Cera", STATUS_SERVICO.EmExecucao, "QXA2B90", { prisma: "7" }),
    item(3, "Polimento", STATUS_SERVICO.Pronto, "FGH8C33"),
  ];

  it("filtra as três colunas por trecho da placa, sem diferença de caixa nem de hífen", async () => {
    api.listFila.mockResolvedValue(FILA);
    renderWithProviders(<FilaServicos />);
    await screen.findByText("Lavagem");

    await userEvent.type(screen.getByRole("searchbox", { name: "Placa ou prisma" }), "rtz-4");

    expect(screen.getByText("Lavagem")).toBeInTheDocument();
    expect(screen.queryByText("Cera")).not.toBeInTheDocument();
    expect(screen.queryByText("Polimento")).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Na fila, 1 serviço" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Em andamento, 0 serviços" })).toBeInTheDocument();
  });

  it("o prisma casa exato: 1 não acha o prisma 12", async () => {
    api.listFila.mockResolvedValue([item(1, "Lavagem", STATUS_SERVICO.Aguardando, "ABC-DEF", { prisma: "12" }), item(2, "Cera", STATUS_SERVICO.Aguardando, "XYZ-UVW", { prisma: "7" })]);
    renderWithProviders(<FilaServicos />);
    await screen.findByText("Lavagem");

    await userEvent.type(screen.getByRole("searchbox", { name: "Placa ou prisma" }), "7");

    expect(screen.getByText("Cera")).toBeInTheDocument();
    expect(screen.queryByText("Lavagem")).not.toBeInTheDocument();
  });

  it("o resumo continua contando a fila inteira enquanto se busca", async () => {
    api.listFila.mockResolvedValue(FILA);
    renderWithProviders(<FilaServicos />);
    await screen.findByText("Lavagem");

    await userEvent.type(screen.getByRole("searchbox", { name: "Placa ou prisma" }), "rtz");

    const resumo = screen.getByRole("list", { name: "Resumo da fila" });
    expect(within(resumo).getByText("1 em andamento")).toBeInTheDocument();
    expect(within(resumo).getByText("1 pronto")).toBeInTheDocument();
  });

  it("sem resultado, avisa e o botão limpa a busca", async () => {
    api.listFila.mockResolvedValue(FILA);
    renderWithProviders(<FilaServicos />);
    await screen.findByText("Lavagem");

    await userEvent.type(screen.getByRole("searchbox", { name: "Placa ou prisma" }), "zzz");
    expect(screen.getByText("Nenhum serviço encontrado para essa placa ou prisma.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Limpar busca" }));
    expect(screen.getByText("Lavagem")).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "Placa ou prisma" })).toHaveValue("");
  });

  it("Esc limpa a busca e o campo escreve a placa em maiúsculas", async () => {
    api.listFila.mockResolvedValue(FILA);
    renderWithProviders(<FilaServicos />);
    await screen.findByText("Lavagem");
    const busca = screen.getByRole("searchbox", { name: "Placa ou prisma" });

    await userEvent.type(busca, "rtz");
    expect(busca).toHaveValue("RTZ");
    await userEvent.keyboard("{Escape}");

    expect(busca).toHaveValue("");
  });
});

describe("FilaServicos: cartão", () => {
  it("mostra '+N no carro' quando o mesmo veículo tem outros serviços na fila", async () => {
    api.listFila.mockResolvedValue([
      item(1, "Lavagem", STATUS_SERVICO.Aguardando, "ABC1D23", { idPatio: 50 }),
      item(2, "Cera", STATUS_SERVICO.EmExecucao, "ABC1D23", { idPatio: 50 }),
      item(3, "Polimento", STATUS_SERVICO.Aguardando, "XYZ9K88", { idPatio: 60 }),
    ]);
    renderWithProviders(<FilaServicos />);

    const naFila = await screen.findByRole("region", { name: "Na fila, 2 serviços" });
    expect(within(naFila).getByText("+1 no carro")).toBeInTheDocument();
    expect(within(naFila).getAllByText(/no carro/)).toHaveLength(1);
  });

  it("Na fila mostra há quanto tempo espera e quanto leva", async () => {
    api.listFila.mockResolvedValue([item(1, "Lavagem", STATUS_SERVICO.Aguardando, "ABC1D23", { criadoEm: atras(12), duracaoMinutos: 60 })]);
    renderWithProviders(<FilaServicos />);

    expect(await screen.findByText("leva ~1 h")).toBeInTheDocument();
    expect(screen.getByText("12 min")).toBeInTheDocument();
  });

  it("Em andamento passado da previsão tem o texto do atraso", async () => {
    api.listFila.mockResolvedValue([item(1, "Lavagem", STATUS_SERVICO.EmExecucao, "ABC1D23", { iniciadoEm: atras(80), duracaoMinutos: 60 })]);
    renderWithProviders(<FilaServicos />);

    expect(await screen.findByText("Passou 20 min da previsão")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("sem os tempos do back, o cartão fica como antes: sem tempo, sem barra, sem atraso", async () => {
    api.listFila.mockResolvedValue([item(1, "Lavagem", STATUS_SERVICO.EmExecucao, "ABC1D23")]);
    renderWithProviders(<FilaServicos />);

    await screen.findByText("Lavagem");
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.queryByText(/Passou/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Iniciado às/)).not.toBeInTheDocument();
  });

  it("Em andamento tem 'Voltar' (para a fila) além de 'Marcar como pronto'", async () => {
    api.listFila.mockResolvedValue([item(1, "Lavagem", STATUS_SERVICO.EmExecucao, "ABC1D23")]);
    renderWithProviders(<FilaServicos />);
    await screen.findByText("Lavagem");

    expect(screen.getByRole("button", { name: "Marcar como pronto" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Voltar para a fila" }));

    await waitFor(() => expect(api.atualizarStatusServico).toHaveBeenCalledWith(101, 1, STATUS_SERVICO.Aguardando));
    expect(await screen.findByText("Serviço voltou para a fila.")).toBeInTheDocument();
  });

  it("Na fila e Pronto não têm o 'Voltar' de um passo (Pronto já tem a sua correção)", async () => {
    api.listFila.mockResolvedValue([item(1, "Lavagem", STATUS_SERVICO.Aguardando, "ABC1D23"), item(2, "Cera", STATUS_SERVICO.Pronto, "DEF4G56")]);
    renderWithProviders(<FilaServicos />);
    await screen.findByText("Lavagem");

    expect(screen.queryByRole("button", { name: "Voltar para a fila" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Voltar para em andamento" })).toBeInTheDocument();
  });
});

describe("FilaServicos: cancelar com motivos rápidos", () => {
  it("o título diz qual serviço, o resumo diz o carro e um motivo rápido preenche o campo", async () => {
    api.listFila.mockResolvedValue([item(1, "Lavagem completa", STATUS_SERVICO.Aguardando, "ABC1D23")]);
    renderWithProviders(<FilaServicos />);
    await userEvent.click(await screen.findByRole("button", { name: "Cancelar serviço" }));

    const dialogo = await screen.findByRole("dialog", { name: "Cancelar lavagem completa?" });
    expect(within(dialogo).getByText("ABC1D23 · Onix")).toBeInTheDocument();
    const confirmar = within(dialogo).getByRole("button", { name: "Cancelar serviço" });
    expect(confirmar).toBeDisabled();

    await userEvent.click(within(dialogo).getByRole("button", { name: "Sem horário hoje" }));

    expect(within(dialogo).getByLabelText("Motivo")).toHaveValue("Sem horário hoje");
    expect(within(dialogo).getByRole("button", { name: "Sem horário hoje" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(confirmar);
    await waitFor(() => expect(api.cancelarServico).toHaveBeenCalledWith(101, 1, "Sem horário hoje"));
  });

  it("explica o que o cancelamento faz com o valor e com o tempo grátis do carro", async () => {
    api.listFila.mockResolvedValue([item(1, "Lavagem completa", STATUS_SERVICO.Aguardando, "ABC1D23")]);
    renderWithProviders(<FilaServicos />);
    await userEvent.click(await screen.findByRole("button", { name: "Cancelar serviço" }));

    const dialogo = await screen.findByRole("dialog");
    expect(within(dialogo).getByText(/O serviço sai do valor e do tempo grátis do carro./)).toBeInTheDocument();
    expect(within(dialogo).getByText(/a permanência volta a ser cobrada pela tabela do rotativo desde a entrada/)).toBeInTheDocument();
  });

  it("o motivo rápido pode ser editado, e 'Manter' fecha sem cancelar", async () => {
    api.listFila.mockResolvedValue([item(1, "Lavagem completa", STATUS_SERVICO.Aguardando, "ABC1D23")]);
    renderWithProviders(<FilaServicos />);
    await userEvent.click(await screen.findByRole("button", { name: "Cancelar serviço" }));
    const dialogo = await screen.findByRole("dialog");

    await userEvent.click(within(dialogo).getByRole("button", { name: "Cliente desistiu" }));
    await userEvent.type(within(dialogo).getByLabelText("Motivo"), " de vez");
    expect(within(dialogo).getByLabelText("Motivo")).toHaveValue("Cliente desistiu de vez");
    expect(within(dialogo).getByRole("button", { name: "Cliente desistiu" })).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(within(dialogo).getByRole("button", { name: "Manter" }));
    expect(api.cancelarServico).not.toHaveBeenCalled();
  });

  it("o Lavador não vê o cancelamento", async () => {
    sessao.atual = { user: { name: "Lu", perfil: 9 }, isLoading: false };
    api.listFila.mockResolvedValue([item(1, "Lavagem completa", STATUS_SERVICO.Aguardando, "ABC1D23")]);
    renderWithProviders(<FilaServicos />);
    await screen.findByText("Lavagem completa");

    expect(screen.queryByRole("button", { name: "Cancelar serviço" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Iniciar" })).toBeInTheDocument();
  });
});
