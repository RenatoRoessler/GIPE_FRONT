import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import type { PatioVeiculo } from "@/types/patio";

vi.mock("@/lib/api/services/patio", () => ({ listPatio: vi.fn() }));
vi.mock("../useVagasPatio", () => ({ useVagasPatio: () => ({ moto: 12, carro: 23 }) }));
const modais = vi.hoisted(() => ({ abrirEntrada: vi.fn(), abrirSaida: vi.fn() }));
vi.mock("@/components/veiculos/VeiculoModais", () => ({ useVeiculoModais: () => modais }));

import { listPatio } from "@/lib/api/services/patio";
import { PatioView } from "./PatioView";

let proximoId = 1;

function veiculo(extra: Partial<PatioVeiculo> = {}): PatioVeiculo {
  return {
    patioId: proximoId++,
    placa: "ABC1D23",
    categoria: 2,
    modelo: "Gol",
    cor: "PRATA",
    codigoTicket: null,
    sequencial: 1000 + proximoId,
    mensalista: false,
    dataHoraEntrada: "2026-10-17T15:30:22",
    minutosPermanencia: 60,
    permanencia: "1h 0min",
    rotatividadeDescricao: "TABELA",
    usuarioEntrada: "operador",
    token: "ABCD1234",
    ...extra,
  };
}

const DOIS_DIAS = veiculo({ placa: "BRA2E19", modelo: "Corsa Classic", minutosPermanencia: 2880, permanencia: "2d 0h 0min", categoria: 3, sequencial: 2464, codigoTicket: 24024 });
const UM_DIA = veiculo({ placa: "MNB7880", modelo: "Gol", minutosPermanencia: 1440, permanencia: "1d 0h 0min", categoria: 1 });
const MENSALISTA = veiculo({ placa: "ZNF7Z70", modelo: "Corolla Cross", minutosPermanencia: 90, permanencia: "1h 30min", categoria: 7, mensalista: true });

function abrir(lista: PatioVeiculo[] = [UM_DIA, DOIS_DIAS, MENSALISTA]) {
  vi.mocked(listPatio).mockResolvedValue(lista);
  return renderWithProviders(<PatioView />);
}

const placasNaTela = () =>
  screen
    .getAllByRole("button", { name: /^Registrar saída de / })
    .map((botao) => botao.getAttribute("aria-label")?.replace("Registrar saída de ", ""));

// O resumo tem a contagem em negrito: o texto vem partido em dois elementos, então compara-se o texto da região.
const resumo = () =>
  screen
    .getAllByRole("status")
    .map((regiao) => regiao.textContent ?? "")
    .find((texto) => /veículos?/.test(texto));
const esperarResumo = (texto: string) => waitFor(() => expect(resumo()).toBe(texto));

const campoBusca = () => screen.getByLabelText("Buscar por placa, modelo ou ticket");

beforeEach(() => {
  proximoId = 1;
  vi.mocked(listPatio).mockReset();
  modais.abrirEntrada.mockReset();
});

describe("PatioView: lista e resumo", () => {
  it("mostra os veículos do que está há mais tempo para o que está há menos", async () => {
    abrir();

    await esperarResumo("3 veículos no pátio");
    expect(placasNaTela()).toEqual(["BRA2E19", "MNB7880", "ZNF7Z70"]);
  });

  it("diz a quantidade e o horário da última atualização", async () => {
    abrir();

    await esperarResumo("3 veículos no pátio");
    expect(screen.getByText(/^Atualizado às \d{2}:\d{2}$/)).toBeInTheDocument();
  });

  it("um veículo só fica no singular", async () => {
    abrir([UM_DIA]);

    await esperarResumo("1 veículo no pátio");
  });

  it("carregando mostra esqueletos num status", () => {
    vi.mocked(listPatio).mockReturnValue(new Promise(() => {}));
    renderWithProviders(<PatioView />);

    expect(screen.getByRole("status", { name: "Carregando o pátio" })).toBeInTheDocument();
  });

  it("sem veículos diz isso e abre o modal de entrada, sem navegar", async () => {
    abrir([]);

    expect(await screen.findByText("Nenhum veículo no pátio.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Registrar entrada" })).not.toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: "Registrar entrada" }));
    expect(modais.abrirEntrada).toHaveBeenCalledTimes(1);
  });

  it("erro mostra a mensagem do back e deixa tentar de novo", async () => {
    vi.mocked(listPatio).mockRejectedValueOnce(new ApiError("server", "Instabilidade no servidor.", 500));
    renderWithProviders(<PatioView />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar o pátio. Instabilidade no servidor.");

    vi.mocked(listPatio).mockResolvedValue([UM_DIA]);
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    await esperarResumo("1 veículo no pátio");
  });

  it("erro de permissão não oferece tentar de novo", async () => {
    vi.mocked(listPatio).mockRejectedValue(new ApiError("forbidden", undefined, 403));
    renderWithProviders(<PatioView />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Você não tem permissão para acessar esta página.");
    expect(screen.queryByRole("button", { name: "Tentar novamente" })).not.toBeInTheDocument();
  });
});

describe("PatioView: atualizar", () => {
  it("Atualizar recarrega a lista e mostra Atualizando… enquanto espera", async () => {
    abrir([UM_DIA]);
    await esperarResumo("1 veículo no pátio");

    let concluir: (lista: PatioVeiculo[]) => void = () => {};
    vi.mocked(listPatio).mockReturnValue(new Promise((resolve) => (concluir = resolve)));
    await userEvent.click(screen.getByRole("button", { name: "Atualizar" }));

    const botao = await screen.findByRole("button", { name: "Atualizando…" });
    expect(botao).toBeDisabled();

    concluir([UM_DIA, DOIS_DIAS]);
    await esperarResumo("2 veículos no pátio");
    expect(screen.getByRole("button", { name: "Atualizar" })).toBeEnabled();
  });
});

describe("PatioView: busca", () => {
  it("filtra por placa, com o resumo no formato M de N", async () => {
    abrir();
    await esperarResumo("3 veículos no pátio");

    await userEvent.type(campoBusca(), "mnb");

    await waitFor(() => expect(placasNaTela()).toEqual(["MNB7880"]));
    expect(resumo()).toMatch(/ de 3 veículos$/);
  });

  it("filtra por modelo, sem acento", async () => {
    abrir();
    await esperarResumo("3 veículos no pátio");

    await userEvent.type(campoBusca(), "corolla");

    await waitFor(() => expect(placasNaTela()).toEqual(["ZNF7Z70"]));
  });

  it("filtra por ticket e por sequencial", async () => {
    abrir();
    await esperarResumo("3 veículos no pátio");

    await userEvent.type(campoBusca(), "24024");
    await waitFor(() => expect(placasNaTela()).toEqual(["BRA2E19"]));

    await userEvent.clear(campoBusca());
    await userEvent.type(campoBusca(), "2464");
    await waitFor(() => expect(placasNaTela()).toEqual(["BRA2E19"]));
  });

  it("sem resultado diz o que foi buscado e deixa limpar", async () => {
    abrir();
    await esperarResumo("3 veículos no pátio");

    await userEvent.type(campoBusca(), "zzzz");

    expect(await screen.findByText("Nada encontrado para “zzzz”.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Limpar busca" }));
    await waitFor(() => expect(placasNaTela()).toHaveLength(3));
    expect(campoBusca()).toHaveValue("");
  });
});

describe("PatioView: filtros", () => {
  it("filtra por tipo e mostra Limpar filtros só enquanto há filtro", async () => {
    abrir();
    await esperarResumo("3 veículos no pátio");
    expect(screen.queryByRole("button", { name: "Limpar filtros" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /^Mensalistas/ }));

    expect(placasNaTela()).toEqual(["ZNF7Z70"]);
    expect(resumo()).toMatch(/ de 3 veículos$/);

    await userEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(placasNaTela()).toHaveLength(3);
    expect(screen.queryByRole("button", { name: "Limpar filtros" })).not.toBeInTheDocument();
  });

  it("avulsos e categoria", async () => {
    abrir();
    await esperarResumo("3 veículos no pátio");

    await userEvent.click(screen.getByRole("button", { name: /^Avulsos/ }));
    expect(placasNaTela()).toEqual(["BRA2E19", "MNB7880"]);

    await userEvent.click(screen.getByRole("button", { name: /^Moto/ }));
    expect(placasNaTela()).toEqual(["MNB7880"]);
  });

  it("a barra e os chips mostram a proporção e só as categorias que estão no pátio", async () => {
    abrir();
    await esperarResumo("3 veículos no pátio");

    expect(screen.getByRole("button", { name: "Mensalistas 33% · 1" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Avulsos 67% · 2" })).toBeInTheDocument();
    const chips = within(screen.getByRole("group", { name: "Categoria" })).getAllByRole("button").map((chip) => chip.textContent);
    expect(chips).toEqual(["Carro grande1", "Carro médio1", "Moto1"]);
  });

  it("tocar de novo no filtro ativo o desfaz", async () => {
    abrir();
    await esperarResumo("3 veículos no pátio");

    await userEvent.click(screen.getByRole("button", { name: /^Mensalistas/ }));
    expect(screen.getByRole("button", { name: /^Mensalistas/ })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: /^Mensalistas/ }));

    expect(placasNaTela()).toHaveLength(3);
    await userEvent.click(screen.getByRole("button", { name: /^Moto/ }));
    expect(placasNaTela()).toEqual(["MNB7880"]);
    await userEvent.click(screen.getByRole("button", { name: /^Moto/ }));
    expect(placasNaTela()).toHaveLength(3);
  });

  it("mostra a permanência média e quantos estão há 3 dias ou mais", async () => {
    abrir([veiculo({ minutosPermanencia: 120 }), veiculo({ minutosPermanencia: 5000 })]);
    await esperarResumo("2 veículos no pátio");

    expect(screen.getByText("Permanência média 1d 18h")).toBeInTheDocument();
    expect(screen.getByText("1 há 3 dias ou mais")).toBeInTheDocument();
  });

  it("mostra a ocupação das vagas, com carros e motos separados", async () => {
    abrir();
    await esperarResumo("3 veículos no pátio");

    // 3 veículos (1 moto, 2 carros) para 35 vagas (12 de moto e 23 de carro).
    expect(screen.getByText("Ocupação 9%")).toHaveAttribute("title", "Carros 2 de 23 · Motos 1 de 12");
  });

  it("os gráficos do pátio ficam recolhidos até o operador abrir", async () => {
    abrir();
    await esperarResumo("3 veículos no pátio");

    const detalhes = screen.getByText("Ver gráficos do pátio").closest("details");
    expect(detalhes).not.toHaveAttribute("open");
    await userEvent.click(screen.getByText("Ver gráficos do pátio"));
    expect(detalhes).toHaveAttribute("open");
    expect(screen.getByRole("region", { name: "Tempo no pátio" })).toBeInTheDocument();
  });

  it("busca e filtros valem juntos; sem resultado, a busca se limpa ali e os filtros na barra", async () => {
    abrir();
    await esperarResumo("3 veículos no pátio");

    await userEvent.click(screen.getByRole("button", { name: /^Mensalistas/ }));
    await userEvent.type(campoBusca(), "mnb");

    expect(await screen.findByText("Nada encontrado para “mnb”.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Limpar busca" })).toBeInTheDocument();
    // Um só botão de limpar filtros: o da barra, que continua à vista.
    expect(screen.getAllByRole("button", { name: "Limpar filtros" })).toHaveLength(1);
  });

  it("filtro sem resultado diz que nenhum veículo tem esses filtros", async () => {
    abrir([UM_DIA, MENSALISTA]);
    await esperarResumo("2 veículos no pátio");

    await userEvent.click(screen.getByRole("button", { name: /^Mensalistas/ }));
    await userEvent.click(screen.getByRole("button", { name: /^Moto/ }));

    expect(await screen.findByText("Nenhum veículo com esses filtros.")).toBeInTheDocument();
    // A barra de busca e os filtros continuam à vista.
    expect(campoBusca()).toBeInTheDocument();
  });
});

describe("PatioView: limite de linhas", () => {
  const muitos = () =>
    Array.from({ length: 230 }, (_, i) =>
      veiculo({ placa: `AAA${String(i).padStart(4, "0")}`.slice(0, 7), minutosPermanencia: 10_000 - i, modelo: i < 150 ? "Gol" : "Palio" }),
    );

  it("mostra as primeiras 100 e Mostrar mais soma outras 100", async () => {
    abrir(muitos());
    await esperarResumo("230 veículos no pátio");

    expect(placasNaTela()).toHaveLength(100);
    await userEvent.click(screen.getByRole("button", { name: "Mostrar mais 100" }));
    expect(placasNaTela()).toHaveLength(200);
    expect(screen.getByRole("button", { name: "Mostrar mais 30" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Mostrar mais 30" }));
    expect(placasNaTela()).toHaveLength(230);
    expect(screen.queryByRole("button", { name: /Mostrar mais/ })).not.toBeInTheDocument();
  });

  it("mudar a busca ou o filtro volta o limite a 100", async () => {
    abrir(muitos());
    await esperarResumo("230 veículos no pátio");
    await userEvent.click(screen.getByRole("button", { name: "Mostrar mais 100" }));
    expect(placasNaTela()).toHaveLength(200);

    await userEvent.type(campoBusca(), "gol");

    await waitFor(() => expect(resumo()).toMatch(/ de 230 veículos$/));
    await waitFor(() => expect(placasNaTela()).toHaveLength(100));
  });
});
