import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import { TIPO_CATEGORIA, type PrecoView } from "@/types/preco";

// Endereço simulado: o router grava nele e quem lê o endereço é avisado, como no Next.
const nav = vi.hoisted(() => {
  let params = new URLSearchParams();
  const listeners = new Set<() => void>();
  return {
    get: () => params,
    set(url: string) {
      params = new URLSearchParams(url.includes("?") ? url.split("?")[1] : "");
      listeners.forEach((listener) => listener());
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    push: vi.fn(),
    replace: vi.fn(),
  };
});

vi.mock("next/navigation", async () => {
  const { useSyncExternalStore } = await import("react");
  return {
    useRouter: () => ({
      replace: (url: string, opcoes?: unknown) => {
        nav.replace(url, opcoes);
        nav.set(url);
      },
      push: (url: string, opcoes?: unknown) => {
        nav.push(url, opcoes);
        if (url === "/precos" || url.startsWith("/precos?")) {
          nav.set(url);
        }
      },
    }),
    useSearchParams: () => useSyncExternalStore(nav.subscribe, nav.get, nav.get),
  };
});

vi.mock("@/lib/api/services/preco", () => ({ listAllPrecos: vi.fn() }));

import { listAllPrecos } from "@/lib/api/services/preco";
import { PrecosCockpit } from "./PrecosCockpit";

// jsdom não implementa <dialog>: a folha só "abre" (e fica acessível) depois de showModal.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

function preco(id: number, descricao: string, extra: Partial<PrecoView> = {}): PrecoView {
  return {
    rotatividadeId: id,
    empresaConveniadaId: null,
    descricao,
    tipoRegra: 1,
    inicioVigencia: "2020-01-01T00:00:00",
    fimVigencia: null,
    toleranciaEntradaMinutos: 10,
    toleranciaAlteracaoFaixaMinutos: 0,
    periodoDiaria: 720,
    valorDiaria: 35,
    valorAdicionalDiaria: 1,
    ativo: true,
    regras: [],
    faixas: [{ minutosLimite: 60, valor: 10, percentualConveniada: null }],
    categorias: [TIPO_CATEGORIA.Todas],
    ...extra,
  };
}

const INATIVA = { ativo: false };
const AGENDADA = { inicioVigencia: "2099-01-01T00:00:00" };
const ENCERRADA = { fimVigencia: "2021-01-01T00:00:00" };

// Ordem da API: a primeira vigente é "Tarifa padrão rotativo" (id 2), não o primeiro item.
const TABELAS = [
  preco(1, "Noturno 22h às 6h", INATIVA),
  preco(2, "Tarifa padrão rotativo"),
  preco(3, "Motos", { categorias: [TIPO_CATEGORIA.Moto] }),
  preco(4, "Convênio Shopping Central", { tipoRegra: 2 }),
  preco(5, "Black Friday", AGENDADA),
  preco(6, "Tarifa verão 2025", ENCERRADA),
];

function mais(quantidade: number): PrecoView[] {
  return Array.from({ length: quantidade }, (_, index) => preco(100 + index, `Tabela extra ${index + 1}`));
}

async function tela(tabelas: PrecoView[] = TABELAS) {
  vi.mocked(listAllPrecos).mockResolvedValue(tabelas);
  const view = renderWithProviders(<PrecosCockpit />);
  await screen.findByRole("list", { name: "Escolher tabela de preço" });
  return view;
}

// A esteira está sempre à mostra; a lista completa só existe (acessível) com a folha aberta.
const esteira = () => screen.getByRole("list", { name: "Escolher tabela de preço" });
const placa = (nome: string) => within(esteira()).getByRole("button", { name: new RegExp(nome) });
const placas = () => within(esteira()).getAllByRole("button");
const detalhe = () => screen.getByRole("article");
const tituloDoDetalhe = () => within(detalhe()).getByRole("heading", { level: 2 });
const folha = () => screen.getByRole("dialog", { name: "Todas as tabelas" });
const itensDaLista = () => within(within(folha()).getByRole("list", { name: "Tabelas de preço" })).getAllByRole("button");

async function abrirLista(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /Buscar ou ver todas as tabelas/ }));
}

beforeEach(() => {
  vi.mocked(listAllPrecos).mockReset();
  nav.push.mockReset();
  nav.replace.mockReset();
  nav.set("/precos");
});

describe("PrecosCockpit: esteira e detalhe", () => {
  it("abre com a esteira e o detalhe, com a primeira vigente selecionada", async () => {
    await tela();
    expect(screen.getByRole("heading", { level: 1, name: "Gestão de Preços" })).toBeInTheDocument();
    expect(placas()).toHaveLength(6);
    expect(tituloDoDetalhe()).toHaveTextContent("Tarifa padrão rotativo");
    expect(placa("Tarifa padrão rotativo")).toHaveAttribute("aria-current", "true");
    expect(placa("Noturno")).not.toHaveAttribute("aria-current");
    // A seleção padrão não vai para o endereço.
    expect(nav.get().get("preco")).toBeNull();
  });

  it("cada miniplaca mostra tipo e situação em texto", async () => {
    await tela();
    expect(placa("Convênio Shopping Central")).toHaveTextContent("Convênio");
    expect(placa("Black Friday")).toHaveTextContent("Agendada");
    expect(placa("Tarifa verão 2025")).toHaveTextContent("Encerrada");
    expect(placa("Noturno")).toHaveTextContent("Inativa");
  });

  it("tocar numa miniplaca troca de tabela, substituindo a entrada do histórico e sem abrir a edição", async () => {
    const user = userEvent.setup();
    await tela();
    await user.click(placa("Motos"));

    expect(tituloDoDetalhe()).toHaveTextContent("Motos");
    expect(placa("Motos")).toHaveAttribute("aria-current", "true");
    expect(nav.get().get("preco")).toBe("3");
    expect(nav.push).not.toHaveBeenCalled();
    expect(nav.replace).toHaveBeenCalledWith("/precos?preco=3", { scroll: false });
    expect(JSON.stringify(nav.replace.mock.calls)).not.toContain("editar");
  });

  it("o detalhe oferece Editar como link para a edição, na primeira tela", async () => {
    await tela();
    expect(within(detalhe()).getByRole("link", { name: /^Editar/ })).toHaveAttribute("href", "/precos/2/editar");
    expect(within(detalhe()).getByRole("tab", { name: "Tarifa" })).toHaveAttribute("aria-selected", "true");
  });

  it("anuncia a tabela escolhida em região de status", async () => {
    const user = userEvent.setup();
    await tela();
    await user.click(placa("Motos"));
    expect(screen.getByText("Motos selecionada")).toBeInTheDocument();
  });

  it("Novo preço abre o cadastro", async () => {
    const user = userEvent.setup();
    await tela();
    await user.click(screen.getByRole("button", { name: "Novo preço" }));
    expect(nav.push).toHaveBeenCalledWith("/precos/novo", undefined);
  });

  it("abre já na tabela do endereço, mesmo fora da primeira vigente", async () => {
    nav.set("/precos?preco=5");
    await tela();
    expect(tituloDoDetalhe()).toHaveTextContent("Black Friday");
    expect(placa("Black Friday")).toHaveAttribute("aria-current", "true");
  });

  it("a tabela do endereço que está fora da página atual aparece na frente da esteira", async () => {
    nav.set("/precos?preco=500");
    await tela([...mais(20), preco(500, "Tabela distante")]);
    expect(placas()[0]).toHaveTextContent("Tabela distante");
    expect(placas()[0]).toHaveAttribute("aria-current", "true");
    expect(placas()).toHaveLength(21);
  });

  it("o dock do simulador acompanha a tabela e zera ao trocar", async () => {
    const user = userEvent.setup();
    await tela();
    expect(screen.getByRole("region", { name: "Simulador de cobrança" })).toHaveTextContent("Carro médio");
    await user.click(placa("Motos"));
    expect(screen.getByRole("region", { name: "Simulador de cobrança" })).toHaveTextContent("Moto");
  });
});

describe("PrecosCockpit: lista completa", () => {
  it("o botão de busca abre a folha com todas as tabelas, criando uma entrada no histórico", async () => {
    const user = userEvent.setup();
    await tela();
    await abrirLista(user);
    expect(nav.push).toHaveBeenCalledWith("/precos?lista=1", { scroll: false });
    expect(itensDaLista()).toHaveLength(6);
    expect(within(folha()).getByText("6 tabelas")).toBeInTheDocument();
  });

  it("o nome do botão de busca diz quantas tabelas há no filtro atual", async () => {
    await tela();
    expect(screen.getByRole("button", { name: "Buscar ou ver todas as tabelas (6)" })).toBeInTheDocument();
  });

  it("escolher na lista fecha a folha e mostra a tabela", async () => {
    const user = userEvent.setup();
    await tela();
    await abrirLista(user);
    await user.click(within(folha()).getByRole("button", { name: /Motos/ }));
    expect(nav.get().get("lista")).toBeNull();
    expect(nav.get().get("preco")).toBe("3");
    expect(tituloDoDetalhe()).toHaveTextContent("Motos");
  });

  it("a busca reduz a lista, a contagem acompanha e vai para o endereço depois do debounce", async () => {
    const user = userEvent.setup();
    await tela();
    await abrirLista(user);
    await user.type(within(folha()).getByRole("searchbox", { name: "Buscar tabela de preço" }), "tarifa");
    expect(itensDaLista().map((botao) => botao.textContent)).toEqual([
      expect.stringContaining("Tarifa padrão rotativo"),
      expect.stringContaining("Tarifa verão 2025"),
    ]);
    expect(within(folha()).getByText("2 tabelas")).toBeInTheDocument();
    await waitFor(() => expect(nav.get().get("q")).toBe("tarifa"));
  });

  it("filtra por situação e busca e situação funcionam juntas", async () => {
    const user = userEvent.setup();
    await tela();
    await abrirLista(user);
    await user.click(within(folha()).getByRole("radio", { name: "Vigente" }));
    expect(itensDaLista()).toHaveLength(3);
    expect(within(folha()).getByText("3 vigentes")).toBeInTheDocument();
    expect(nav.get().get("situacao")).toBe("vigente");
    await user.type(within(folha()).getByRole("searchbox"), "tarifa");
    expect(itensDaLista()).toHaveLength(1);
  });

  it("sem resultado mostra a mensagem e Limpar busca restaura a lista", async () => {
    const user = userEvent.setup();
    await tela();
    await abrirLista(user);
    await user.type(within(folha()).getByRole("searchbox"), "zzz");
    expect(within(folha()).getByText("Nenhuma tabela encontrada.")).toBeInTheDocument();
    await user.click(within(folha()).getByRole("button", { name: "Limpar busca" }));
    expect(within(folha()).getByRole("searchbox")).toHaveValue("");
    expect(await within(folha()).findAllByRole("button", { name: /Motos/ })).toHaveLength(1);
  });

  it("pagina de 20 em 20 e a esteira mostra a página atual", async () => {
    const user = userEvent.setup();
    await tela([...TABELAS, ...mais(19)]);
    expect(placas()).toHaveLength(20);
    await abrirLista(user);
    expect(within(folha()).getByText("Mostrando 1–20 de 25")).toBeInTheDocument();
    await user.click(within(folha()).getByRole("button", { name: "Próxima" }));
    expect(nav.get().get("pagina")).toBe("2");
    expect(within(folha()).getByText("Mostrando 21–25 de 25")).toBeInTheDocument();
    expect(placas()).toHaveLength(5);
  });

  it("página fora do intervalo volta para a última existente", async () => {
    nav.set("/precos?pagina=9");
    await tela([...TABELAS, ...mais(19)]);
    await waitFor(() => expect(nav.get().get("pagina")).toBe("2"));
  });

  it("a seleção padrão olha só a página atual", async () => {
    nav.set("/precos?pagina=2");
    await tela([...mais(20), preco(500, "Última vigente")]);
    expect(tituloDoDetalhe()).toHaveTextContent("Última vigente");
  });
});

describe("PrecosCockpit: estados", () => {
  it("carregando mostra o esqueleto da esteira e do detalhe", () => {
    vi.mocked(listAllPrecos).mockReturnValue(new Promise(() => {}));
    renderWithProviders(<PrecosCockpit />);
    expect(screen.getByRole("status", { name: "Carregando preços" })).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Carregando tabela de preço" })).toBeInTheDocument();
  });

  it("erro mostra a mensagem e Tentar novamente refaz a busca", async () => {
    const user = userEvent.setup();
    vi.mocked(listAllPrecos).mockRejectedValueOnce(new ApiError("network"));
    renderWithProviders(<PrecosCockpit />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar os preços. Não foi possível conectar ao servidor.");

    vi.mocked(listAllPrecos).mockResolvedValue(TABELAS);
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByRole("list", { name: "Escolher tabela de preço" })).toBeInTheDocument();
    expect(listAllPrecos).toHaveBeenCalledTimes(2);
  });

  it("no 403 avisa da permissão e não oferece nova tentativa", async () => {
    vi.mocked(listAllPrecos).mockRejectedValueOnce(new ApiError("forbidden"));
    renderWithProviders(<PrecosCockpit />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Você não tem permissão para acessar esta página.");
    expect(screen.queryByRole("button", { name: "Tentar novamente" })).not.toBeInTheDocument();
  });

  it("vazio mostra a mensagem e Novo preço", async () => {
    const user = userEvent.setup();
    vi.mocked(listAllPrecos).mockResolvedValue([]);
    renderWithProviders(<PrecosCockpit />);
    expect(await screen.findByText("Nenhuma tabela de preço cadastrada.")).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Novo preço" })[1]);
    expect(nav.push).toHaveBeenCalledWith("/precos/novo", undefined);
  });

  it("filtro do endereço sem resultado mostra a mensagem e Limpar busca", async () => {
    const user = userEvent.setup();
    nav.set("/precos?q=zzz");
    vi.mocked(listAllPrecos).mockResolvedValue(TABELAS);
    renderWithProviders(<PrecosCockpit />);
    expect(await screen.findByText("Nenhuma tabela encontrada.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Limpar busca" }));
    expect(await screen.findByRole("list", { name: "Escolher tabela de preço" })).toBeInTheDocument();
  });

  it("tabela removida mostra o aviso e leva à primeira da lista", async () => {
    const user = userEvent.setup();
    nav.set("/precos?preco=999");
    await tela();
    expect(screen.getByText("Esta tabela de preço não existe mais.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ver a primeira da lista" }));
    expect(nav.get().get("preco")).toBe("1");
    expect(tituloDoDetalhe()).toHaveTextContent("Noturno 22h às 6h");
  });
});

describe("PrecosCockpit: depois de salvar", () => {
  it("avisa que a tabela foi atualizada e mantém a tabela do endereço", async () => {
    nav.set("/precos?preco=3&salvo=atualizado");
    await tela();
    expect(screen.getByText("Tabela de preço atualizada.")).toBeInTheDocument();
    expect(tituloDoDetalhe()).toHaveTextContent("Motos");
  });

  it("depois de criar, avisa e seleciona a tabela de maior id", async () => {
    nav.set("/precos?salvo=criado");
    await tela([...TABELAS, preco(77, "Tabela recém-criada")]);
    expect(screen.getByText("Tabela de preço criada.")).toBeInTheDocument();
    await waitFor(() => expect(tituloDoDetalhe()).toHaveTextContent("Tabela recém-criada"));
    expect(nav.get().get("preco")).toBe("77");
  });

  it("o aviso some do endereço quando o toast é dispensado", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      nav.set("/precos?preco=3&salvo=atualizado");
      await tela();
      await act(async () => void (await vi.advanceTimersByTimeAsync(4100)));
      expect(nav.get().get("salvo")).toBeNull();
      expect(nav.get().get("preco")).toBe("3");
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("PrecosCockpit: link compartilhável", () => {
  it("reabrir o endereço leva à mesma tabela, busca, filtro e lista aberta", async () => {
    nav.set("/precos?preco=6&q=tarifa&situacao=encerrada&lista=1");
    await tela();
    expect(tituloDoDetalhe()).toHaveTextContent("Tarifa verão 2025");
    expect(within(folha()).getByRole("searchbox")).toHaveValue("tarifa");
    expect(within(folha()).getByRole("radio", { name: "Encerrada" })).toBeChecked();
    expect(itensDaLista()).toHaveLength(1);
  });

  it("parâmetros inválidos no endereço são ignorados", async () => {
    nav.set("/precos?preco=abc&situacao=xxx&pagina=-1&lista=2");
    await tela();
    expect(placas()).toHaveLength(6);
    expect(tituloDoDetalhe()).toHaveTextContent("Tarifa padrão rotativo");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("trocar de tabela não refaz a busca na API", async () => {
    const user = userEvent.setup();
    await tela();
    await user.click(placa("Motos"));
    await user.click(placa("Black Friday"));
    expect(listAllPrecos).toHaveBeenCalledTimes(1);
  });
});
