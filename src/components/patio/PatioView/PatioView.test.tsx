import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TecladoProvider } from "@/components/teclado/TecladoProvider";
import { MEDIA_TOQUE } from "@/components/teclado/useTecladoCampo";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import type { PatioVeiculo } from "@/types/patio";

vi.mock("@/lib/api/services/patio", () => ({ listPatio: vi.fn() }));
vi.mock("@/lib/api/services/quadroChaves", () => ({ listQuadros: vi.fn().mockResolvedValue([]), escolherQuadroChave: vi.fn() }));
vi.mock("@/contexts/CurrentUserContext", () => ({
  useCurrentUser: () => ({ user: { id: "x", name: "Renato", email: "r@e.com", perfil: 1 }, isLoading: false }),
}));
vi.mock("../useVagasPatio", () => ({ useVagasPatio: () => ({ moto: 12, carro: 23 }) }));
vi.mock("../useEstacionamento", () => ({ useEstacionamento: () => "Estacionamento Central" }));
const modais = vi.hoisted(() => ({ abrirEntrada: vi.fn(), abrirSaida: vi.fn() }));
vi.mock("@/components/veiculos/VeiculoModais", () => ({ useVeiculoModais: () => modais }));

// A URL é a fonte da busca e dos filtros: o mock guarda a query e avisa quem a lê, como o roteador faz.
const nav = vi.hoisted(() => {
  let query = "";
  const ouvintes = new Set<() => void>();
  return {
    ler: () => query,
    gravar(proxima: string) {
      query = proxima;
      ouvintes.forEach((avisar) => avisar());
    },
    assinar(avisar: () => void) {
      ouvintes.add(avisar);
      return () => ouvintes.delete(avisar);
    },
  };
});
vi.mock("next/navigation", async () => {
  const { useMemo, useSyncExternalStore } = await import("react");
  const roteador = { replace: (url: string) => nav.gravar(url.includes("?") ? url.split("?")[1] : "") };
  return {
    useRouter: () => roteador,
    usePathname: () => "/patio",
    useSearchParams: () => {
      const query = useSyncExternalStore(nav.assinar, nav.ler, nav.ler);
      return useMemo(() => new URLSearchParams(query), [query]);
    },
  };
});

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
const MENSALISTA = veiculo({ placa: "ZNF7Z70", modelo: "Corolla Cross", minutosPermanencia: 90, permanencia: "1h 30min", categoria: 6, mensalista: true });

function abrir(lista: PatioVeiculo[] = [UM_DIA, DOIS_DIAS, MENSALISTA]) {
  vi.mocked(listPatio).mockResolvedValue(lista);
  return renderWithProviders(<PatioView />);
}

const cards = () => screen.queryAllByRole("link", { name: /^Ver ticket do veículo / });
const placasNaTela = () => cards().map((card) => card.getAttribute("aria-label")?.match(/veículo (\w+),/)?.[1]);

// A frase de resumo é a região de status que fala em veículos.
const resumo = () =>
  screen
    .getAllByRole("status")
    .map((regiao) => regiao.textContent ?? "")
    .find((texto) => /veículos?/.test(texto));
const esperarResumo = (texto: string) => waitFor(() => expect(resumo()).toBe(texto));

const campoBusca = () => screen.getByLabelText("Buscar por placa, modelo ou ticket");

afterEach(() => {
  vi.unstubAllGlobals();
});

beforeEach(() => {
  proximoId = 1;
  nav.gravar("");
  vi.mocked(listPatio).mockReset();
  modais.abrirEntrada.mockReset();
});

describe("PatioView: topo e resumo", () => {
  it("mostra o título e o nome do estacionamento", async () => {
    abrir();
    await esperarResumo("3 veículos no pátio");

    expect(screen.getByRole("heading", { name: "Pátio" })).toBeInTheDocument();
    expect(screen.getByText("Estacionamento Central")).toBeInTheDocument();
  });

  it("mostra as vagas ocupadas, livres e a barra com texto", async () => {
    abrir();
    await esperarResumo("3 veículos no pátio");

    const bloco = screen.getByRole("region", { name: "Vagas ocupadas" });
    expect(within(bloco).getByText("3")).toBeInTheDocument();
    expect(within(bloco).getByText("/35")).toBeInTheDocument();
    expect(within(bloco).getByText("32 livres")).toBeInTheDocument();
    expect(within(bloco).getByRole("img", { name: "9% ocupado" })).toBeInTheDocument();
    expect(within(bloco).getByText("Carros 2/23 · Motos 1/12")).toBeInTheDocument();
  });

  it("conta os veículos por tipo", async () => {
    abrir();
    await esperarResumo("3 veículos no pátio");

    expect(screen.getByRole("button", { name: "Filtrar por Avulso, 2 veículos" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Filtrar por Mensal, 1 veículo" })).toBeInTheDocument();
  });

  it("um veículo só fica no singular", async () => {
    abrir([UM_DIA]);
    await esperarResumo("1 veículo no pátio");
  });
});

describe("PatioView: lista", () => {
  it("mostra os veículos do que está há mais tempo para o que está há menos", async () => {
    abrir();
    await esperarResumo("3 veículos no pátio");

    expect(placasNaTela()).toEqual(["BRA2E19", "MNB7880", "ZNF7Z70"]);
  });

  it("cada veículo é um único link para o ticket, com tipo e permanência no nome", async () => {
    abrir();
    await esperarResumo("3 veículos no pátio");

    const card = screen.getByRole("link", { name: "Ver ticket do veículo ZNF7Z70, Mensalista, 1h 30min no pátio" });
    expect(card).toHaveAttribute("href", `/patio/${MENSALISTA.patioId}`);
    expect(within(card).getByText("Mensalista")).toBeInTheDocument();
    expect(within(card).getByText("1h 30min")).toBeInTheDocument();
    expect(within(card).queryByRole("button")).not.toBeInTheDocument();
  });

  it("o link do ticket leva os filtros da lista", async () => {
    abrir();
    await esperarResumo("3 veículos no pátio");
    await userEvent.click(screen.getByRole("button", { name: /^Filtrar por Mensal/ }));

    const card = await screen.findByRole("link", { name: /ZNF7Z70/ });
    expect(card).toHaveAttribute("href", `/patio/${MENSALISTA.patioId}?tipo=mensalistas`);
  });

  it("modelo e cor ausentes viram traço", async () => {
    abrir([veiculo({ placa: "SEM1M00", modelo: null, cor: null })]);
    await esperarResumo("1 veículo no pátio");

    expect(screen.getByText("— · —")).toBeInTheDocument();
  });

  it("carregando mostra esqueletos num status", () => {
    vi.mocked(listPatio).mockReturnValue(new Promise(() => {}));
    renderWithProviders(<PatioView />);

    expect(screen.getByRole("status", { name: "Carregando o pátio" })).toBeInTheDocument();
  });

  it("sem veículos diz isso e abre o modal de entrada, sem navegar", async () => {
    abrir([]);

    expect(await screen.findByText("Nenhum carro no pátio")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Avulso 0".replace("Avulso 0", "Filtrar por Avulso, 0 veículos") })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Registrar entrada" }));
    expect(modais.abrirEntrada).toHaveBeenCalledTimes(1);
  });

  it("o topo tem Entrada e Saída com nome, que abrem os modais", async () => {
    abrir([]);
    await screen.findByText("Nenhum carro no pátio");

    // Só aparecem a partir de `lg` (abaixo, a barra inferior faz isso); o jsdom não avalia a media query.
    await userEvent.click(screen.getByRole("button", { name: "Entrada", hidden: true }));
    await userEvent.click(screen.getByRole("button", { name: "Saída", hidden: true }));

    expect(modais.abrirEntrada).toHaveBeenCalledTimes(1);
    expect(modais.abrirSaida).toHaveBeenCalledTimes(1);
  });

  it("erro mostra a mensagem do back e deixa tentar de novo", async () => {
    vi.mocked(listPatio).mockRejectedValueOnce(new ApiError("server", "Serviço fora do ar.", 500));
    renderWithProviders(<PatioView />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar o pátio. Serviço fora do ar.");
    vi.mocked(listPatio).mockResolvedValue([UM_DIA]);
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    await esperarResumo("1 veículo no pátio");
  });

  it("erro de permissão não oferece tentar de novo", async () => {
    vi.mocked(listPatio).mockRejectedValue(new ApiError("forbidden", "Sem permissão.", 403));
    renderWithProviders(<PatioView />);

    await screen.findByText(/permissão/i);
    expect(screen.queryByRole("button", { name: "Tentar novamente" })).not.toBeInTheDocument();
  });
});

describe("PatioView: atualizar", () => {
  it("Atualizar recarrega a lista e mostra Atualizando… enquanto espera", async () => {
    abrir([UM_DIA]);
    await esperarResumo("1 veículo no pátio");
    expect(screen.getByText(/^Atualizado às \d{2}:\d{2}$/)).toBeInTheDocument();

    let resolver: (lista: PatioVeiculo[]) => void = () => {};
    vi.mocked(listPatio).mockReturnValue(new Promise((resolve) => (resolver = resolve)));
    await userEvent.click(screen.getByRole("button", { name: "Atualizar" }));

    expect(await screen.findByRole("button", { name: "Atualizando…" })).toBeDisabled();
    resolver([UM_DIA, DOIS_DIAS]);
    await esperarResumo("2 veículos no pátio");
  });
});

describe("PatioView: busca", () => {
  it("no celular usa o teclado de letras; OK fecha o teclado e mantém o filtro", async () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query === MEDIA_TOQUE,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    vi.mocked(listPatio).mockResolvedValue([UM_DIA, DOIS_DIAS, MENSALISTA]);
    renderWithProviders(
      <TecladoProvider>
        <PatioView />
      </TecladoProvider>,
    );
    await esperarResumo("3 veículos no pátio");

    expect(campoBusca()).toHaveAttribute("inputmode", "none");
    act(() => campoBusca().focus());
    for (const tecla of ["M", "N", "B"]) {
      fireEvent.click(screen.getByRole("button", { name: tecla }));
    }
    await esperarResumo("1 de 3 veículos");

    fireEvent.click(screen.getByRole("button", { name: "Concluir" }));

    expect(screen.queryByRole("group", { name: "Teclado de letras e números" })).not.toBeInTheDocument();
    expect(campoBusca()).toHaveValue("MNB");
    expect(placasNaTela()).toEqual(["MNB7880"]);
  });

  it("filtra por placa, com o resumo no formato M de N", async () => {
    abrir();
    await esperarResumo("3 veículos no pátio");

    await userEvent.type(campoBusca(), "mnb-78");

    await esperarResumo("1 de 3 veículos");
    expect(placasNaTela()).toEqual(["MNB7880"]);
  });

  it("filtra por modelo, sem acento", async () => {
    abrir();
    await esperarResumo("3 veículos no pátio");

    await userEvent.type(campoBusca(), "corolla");

    await esperarResumo("1 de 3 veículos");
    expect(placasNaTela()).toEqual(["ZNF7Z70"]);
  });

  it("filtra por ticket e por sequencial", async () => {
    abrir();
    await esperarResumo("3 veículos no pátio");

    await userEvent.type(campoBusca(), "24024");
    await esperarResumo("1 de 3 veículos");
    expect(placasNaTela()).toEqual(["BRA2E19"]);
  });

  it("sem resultado diz o que foi buscado e deixa limpar", async () => {
    abrir();
    await esperarResumo("3 veículos no pátio");

    await userEvent.type(campoBusca(), "zzzz");

    expect(await screen.findByText("Nenhum carro encontrado")).toBeInTheDocument();
    expect(screen.getByText(/Nada encontrado para “zzzz”/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Limpar busca" }));

    await esperarResumo("3 veículos no pátio");
    expect(campoBusca()).toHaveValue("");
  });
});

describe("PatioView: filtros", () => {
  it("tocar num tipo filtra e tocar de novo desfaz", async () => {
    abrir();
    await esperarResumo("3 veículos no pátio");

    const mensal = screen.getByRole("button", { name: /^Filtrar por Mensal/ });
    await userEvent.click(mensal);
    await esperarResumo("1 de 3 veículos");
    expect(mensal).toHaveAttribute("aria-pressed", "true");
    expect(placasNaTela()).toEqual(["ZNF7Z70"]);

    await userEvent.click(mensal);
    await esperarResumo("3 veículos no pátio");
  });

  it("filtra por categoria e conta os filtros ativos no botão", async () => {
    abrir();
    await esperarResumo("3 veículos no pátio");
    expect(screen.getByRole("button", { name: "Filtros" })).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(screen.getByRole("button", { name: "Filtros" }));
    expect(screen.getByRole("button", { name: "Filtros" })).toHaveAttribute("aria-expanded", "true");
    const grupo = screen.getByRole("group", { name: "Categoria" });
    await userEvent.click(within(grupo).getAllByRole("button")[0]);

    await esperarResumo("1 de 3 veículos");
    expect(screen.getByRole("button", { name: "Filtros 1" })).toBeInTheDocument();
  });

  it("Limpar filtros só aparece enquanto há filtro e desfaz todos", async () => {
    abrir();
    await esperarResumo("3 veículos no pátio");
    expect(screen.queryByRole("button", { name: "Limpar filtros" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /^Filtrar por Avulso/ }));
    await esperarResumo("2 de 3 veículos");
    await userEvent.click(screen.getByRole("button", { name: "Filtros 1" }));
    await userEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));

    await esperarResumo("3 veículos no pátio");
    expect(screen.queryByRole("button", { name: "Limpar filtros" })).not.toBeInTheDocument();
  });

  it("os filtros vêm da URL", async () => {
    nav.gravar("tipo=avulsos");
    abrir();

    await esperarResumo("2 de 3 veículos");
    expect(screen.getByRole("button", { name: /^Filtrar por Avulso/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("filtro sem resultado diz que nenhum veículo tem esses filtros", async () => {
    abrir([UM_DIA, MENSALISTA]);
    await esperarResumo("2 veículos no pátio");

    // Categoria do avulso + tipo mensal: nenhum veículo tem os dois.
    await userEvent.click(screen.getByRole("button", { name: "Filtros" }));
    await userEvent.click(within(screen.getByRole("group", { name: "Categoria" })).getByRole("button", { name: /^Moto/ }));
    await userEvent.click(screen.getByRole("button", { name: /^Filtrar por Mensal/ }));

    expect(await screen.findByText("Nenhum veículo com esses filtros")).toBeInTheDocument();
  });

  it("os gráficos do pátio ficam recolhidos até o operador abrir", async () => {
    abrir();
    await esperarResumo("3 veículos no pátio");

    const detalhes = screen.getByText("Ver gráficos do pátio").closest("details");
    expect(detalhes).not.toHaveAttribute("open");
  });
});

describe("PatioView: depois de uma saída", () => {
  it("anuncia a saída, mostra o aviso e põe o foco no primeiro card", async () => {
    nav.gravar("saiu=BRA2E19");
    abrir([UM_DIA, MENSALISTA]);

    await esperarResumo("2 veículos no pátio");
    expect((await screen.findAllByText("BRA2E19 saiu do pátio.")).length).toBeGreaterThan(0);
    await waitFor(() => expect(cards()[0]).toHaveFocus());
    // O parâmetro some da URL: recarregar a página não repete o aviso.
    await waitFor(() => expect(nav.ler()).toBe(""));
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
