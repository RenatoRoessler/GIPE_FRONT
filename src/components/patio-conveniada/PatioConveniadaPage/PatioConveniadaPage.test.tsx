import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import type { VeiculoConveniada } from "@/types/patioConveniada";

vi.mock("@/lib/api/services/patioConveniada", () => ({ listarPatioConveniada: vi.fn() }));

// A URL é a fonte dos filtros: o mock guarda a query e avisa quem a lê, como o roteador faz.
const nav = vi.hoisted(() => {
  let query = "";
  const ouvintes = new Set<() => void>();
  return {
    push: vi.fn(),
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
  const roteador = { push: nav.push, replace: (url: string) => nav.gravar(url.includes("?") ? url.split("?")[1] : "") };
  return {
    useRouter: () => roteador,
    usePathname: () => "/patio-conveniada",
    useSearchParams: () => {
      const query = useSyncExternalStore(nav.assinar, nav.ler, nav.ler);
      return useMemo(() => new URLSearchParams(query), [query]);
    },
  };
});

import { listarPatioConveniada } from "@/lib/api/services/patioConveniada";
import { PatioConveniadaPage } from "./PatioConveniadaPage";

function veiculo(id: number, extra: Partial<VeiculoConveniada> = {}): VeiculoConveniada {
  return {
    patioConvenioId: id,
    empresaId: 37,
    estacionamento: "teste 2",
    placa: "OLG7Z94",
    modelo: "HB20S",
    cor: "PRATA",
    categoria: 3,
    dataEntrada: "2026-10-29T18:44:03",
    dataValidacao: "2026-10-29T18:44:24",
    usuarioIdConveniada: 37,
    usuarioConveniada: "teste login",
    rotatividadeId: 17,
    rotatividade: "convenio mercado 1",
    minutosPermanencia: 30,
    permanencia: "0h 30min",
    ...extra,
  };
}

const OLG = veiculo(12, { placa: "OLG7Z94", minutosPermanencia: 8571, permanencia: "5d 22h 51min" });
const TEP = veiculo(10, { placa: "TEP6I32", modelo: "Fusca", categoria: 2 });
const CENTRO = veiculo(8, { placa: "ABC1234", empresaId: 40, estacionamento: "centro" });

const cartoes = () => screen.queryAllByRole("article");
const placas = () => cartoes().map((cartao) => cartao.getAttribute("aria-label")?.split(",")[0]);

function abrir(lista: VeiculoConveniada[] = [OLG, TEP]) {
  vi.mocked(listarPatioConveniada).mockResolvedValue(lista);
  return renderWithProviders(<PatioConveniadaPage />);
}

beforeEach(() => {
  vi.clearAllMocks();
  nav.gravar("");
});

describe("PatioConveniadaPage: lista", () => {
  it("mostra o título, o resumo e os veículos na ordem do servidor", async () => {
    abrir();
    expect(screen.getByRole("status", { name: "Carregando o pátio" })).toBeInTheDocument();
    await waitFor(() => expect(placas()).toEqual(["OLG7Z94", "TEP6I32"]));
    expect(screen.getByRole("heading", { level: 1, name: "Pátio" })).toBeInTheDocument();
    expect(screen.getByText("2 veículos no pátio", { selector: '[role="status"]' })).toBeInTheDocument();
    expect(screen.getByText(/^Atualizado às/)).toBeInTheDocument();
    expect(listarPatioConveniada).toHaveBeenCalledWith("");
  });

  it("'Atualizar' consulta de novo e mostra 'Atualizando…' enquanto isso", async () => {
    const user = userEvent.setup();
    abrir();
    await screen.findAllByRole("article");

    let concluir: (lista: VeiculoConveniada[]) => void = () => undefined;
    vi.mocked(listarPatioConveniada).mockReturnValue(new Promise((resolve) => (concluir = resolve)));
    await user.click(screen.getByRole("button", { name: "Atualizar" }));

    expect(await screen.findByRole("button", { name: "Atualizando…" })).toBeDisabled();
    expect(cartoes()).toHaveLength(2);
    concluir([OLG]);
    await waitFor(() => expect(cartoes()).toHaveLength(1));
  });

  it("um veículo que saiu deixa de aparecer na atualização", async () => {
    const user = userEvent.setup();
    abrir();
    await screen.findAllByRole("article");

    vi.mocked(listarPatioConveniada).mockResolvedValue([TEP]);
    await user.click(screen.getByRole("button", { name: "Atualizar" }));
    await waitFor(() => expect(placas()).toEqual(["TEP6I32"]));
    expect(screen.getByText("1 veículo no pátio", { selector: '[role="status"]' })).toBeInTheDocument();
  });

  it("corta em 100 itens e 'Mostrar mais' traz o resto", async () => {
    const user = userEvent.setup();
    abrir(Array.from({ length: 130 }, (_, indice) => veiculo(indice + 1, { placa: `AAA${1000 + indice}` })));
    await waitFor(() => expect(cartoes()).toHaveLength(100));

    await user.click(screen.getByRole("button", { name: "Mostrar mais 30" }));
    expect(cartoes()).toHaveLength(130);
  });
});

describe("PatioConveniadaPage: estados", () => {
  it("lista vazia: explica e leva ao carimbo", async () => {
    const user = userEvent.setup();
    abrir([]);
    expect(await screen.findByText("Nenhum veículo carimbado em aberto")).toBeInTheDocument();
    expect(screen.queryByLabelText("Placa")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Carimbar ticket" }));
    expect(nav.push).toHaveBeenCalledWith("/carimbo");
  });

  it("erro ao carregar: mostra o erro e deixa tentar de novo", async () => {
    const user = userEvent.setup();
    vi.mocked(listarPatioConveniada).mockRejectedValueOnce(new ApiError("server", "Falha no servidor.", 500));
    renderWithProviders(<PatioConveniadaPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Falha no servidor.");
    vi.mocked(listarPatioConveniada).mockResolvedValue([OLG]);
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    await waitFor(() => expect(cartoes()).toHaveLength(1));
  });

  it("403: só o aviso de permissão, sem tentar de novo", async () => {
    vi.mocked(listarPatioConveniada).mockRejectedValue(new ApiError("forbidden", undefined, 403));
    renderWithProviders(<PatioConveniadaPage />);
    await waitFor(() => expect(screen.queryByRole("status", { name: "Carregando o pátio" })).not.toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "Tentar novamente" })).not.toBeInTheDocument();
  });

  it("falha ao atualizar não derruba a lista que já estava na tela", async () => {
    const user = userEvent.setup();
    abrir();
    await screen.findAllByRole("article");

    vi.mocked(listarPatioConveniada).mockRejectedValue(new ApiError("server", "Falha ao atualizar.", 500));
    await user.click(screen.getByRole("button", { name: "Atualizar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Falha ao atualizar.");
    expect(cartoes()).toHaveLength(2);
  });
});

describe("PatioConveniadaPage: busca por placa", () => {
  it("a placa parcial filtra na tela, sem chamar o servidor de novo", async () => {
    const user = userEvent.setup();
    abrir();
    await screen.findAllByRole("article");

    await user.type(screen.getByLabelText("Placa"), "tep");
    await waitFor(() => expect(placas()).toEqual(["TEP6I32"]));
    expect(listarPatioConveniada).toHaveBeenCalledTimes(1);
    expect(screen.getByText("1 de 2 veículos", { selector: '[role="status"]' })).toBeInTheDocument();
  });

  it("a placa completa e válida vai ao servidor", async () => {
    const user = userEvent.setup();
    abrir();
    await screen.findAllByRole("article");

    vi.mocked(listarPatioConveniada).mockResolvedValue([OLG]);
    await user.type(screen.getByLabelText("Placa"), "olg-7z94");
    await waitFor(() => expect(listarPatioConveniada).toHaveBeenCalledWith("OLG7Z94"));
    await waitFor(() => expect(placas()).toEqual(["OLG7Z94"]));
  });

  it("sem resultado: avisa e 'Limpar busca' volta à lista", async () => {
    const user = userEvent.setup();
    abrir();
    await screen.findAllByRole("article");

    await user.type(screen.getByLabelText("Placa"), "zzz");
    expect(await screen.findByText("Nenhum carro encontrado")).toBeInTheDocument();
    expect(screen.getByText(/Nada encontrado para “ZZZ”/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Limpar busca" }));
    await waitFor(() => expect(cartoes()).toHaveLength(2));
    expect(screen.getByLabelText("Placa")).toHaveValue("");
  });

  // O teclado de placa não deixa digitar uma placa fora do padrão; ela só chega por um link editado à mão.
  it("placa completa e inválida (vinda da URL): mostra o erro, mantém a lista e não a envia ao servidor", async () => {
    nav.gravar("placa=1234567");
    abrir();
    expect(await screen.findByText("Placa inválida")).toBeInTheDocument();
    await waitFor(() => expect(cartoes()).toHaveLength(2));
    expect(listarPatioConveniada).toHaveBeenCalledTimes(1);
    expect(listarPatioConveniada).toHaveBeenCalledWith("");
  });
});

describe("PatioConveniadaPage: estacionamentos", () => {
  it("com um só estacionamento não há chips", async () => {
    abrir();
    await screen.findAllByRole("article");
    expect(screen.queryByRole("group", { name: "Estacionamento" })).not.toBeInTheDocument();
  });

  it("com mais de um, o chip filtra a lista e tocar de novo volta a todos", async () => {
    const user = userEvent.setup();
    abrir([OLG, TEP, CENTRO]);
    await screen.findAllByRole("article");

    const grupo = screen.getByRole("group", { name: "Estacionamento" });
    await user.click(within(grupo).getByRole("button", { name: /centro/ }));
    await waitFor(() => expect(placas()).toEqual(["ABC1234"]));

    await user.click(within(screen.getByRole("group", { name: "Estacionamento" })).getByRole("button", { name: /centro/ }));
    await waitFor(() => expect(cartoes()).toHaveLength(3));
  });

  it("estacionamento da URL que não existe mais é ignorado", async () => {
    nav.gravar("estacionamento=99");
    abrir([OLG, TEP]);
    await waitFor(() => expect(cartoes()).toHaveLength(2));
  });
});
