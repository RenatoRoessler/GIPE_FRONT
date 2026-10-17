import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
import { PrecosMasterDetail } from "./PrecosMasterDetail";

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

// jsdom não aplica media query: sem isso valeria o layout de celular (uma coluna por vez) e o detalhe ou a lista
// ficariam escondidos. Os testes de desktop forçam as duas colunas; os de celular usam as regras reais.
function layoutDesktop() {
  const style = document.createElement("style");
  style.id = "layout-desktop";
  style.textContent = `[aria-label="Lista de tabelas de preço"]{display:flex!important}[aria-label="Detalhe da tabela de preço"]{display:block!important}`;
  document.head.appendChild(style);
}

function renderTela() {
  return renderWithProviders(<PrecosMasterDetail />);
}

async function tela(tabelas: PrecoView[] = TABELAS) {
  vi.mocked(listAllPrecos).mockResolvedValue(tabelas);
  const view = renderTela();
  // `hidden`: no celular a lista pode estar escondida (detalhe aberto), e ainda assim a tela já carregou.
  await screen.findByRole("list", { name: "Tabelas de preço", hidden: true });
  return view;
}

const lista = () => screen.getByRole("list", { name: "Tabelas de preço" });
const itens = () => within(lista()).getAllByRole("button");
const item = (nome: string) => within(lista()).getByRole("button", { name: new RegExp(nome) });
const detalhe = () => screen.getByRole("region", { name: "Detalhe da tabela de preço" });
const tituloDoDetalhe = () => within(detalhe()).getByRole("heading", { level: 2 });
const colunaDaLista = () => screen.getByLabelText("Lista de tabelas de preço");

beforeEach(() => {
  layoutDesktop();
  vi.mocked(listAllPrecos).mockReset();
  nav.push.mockReset();
  nav.replace.mockReset();
  nav.set("/precos");
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.getElementById("layout-desktop")?.remove();
});

describe("PrecosMasterDetail: lista e detalhe", () => {
  it("abre com a lista e o detalhe lado a lado, com a primeira vigente selecionada", async () => {
    await tela();
    expect(screen.getByRole("heading", { level: 1, name: "Gestão de Preços" })).toBeInTheDocument();
    expect(itens()).toHaveLength(6);
    expect(tituloDoDetalhe()).toHaveTextContent("Tarifa padrão rotativo");
    expect(item("Tarifa padrão rotativo")).toHaveAttribute("aria-current", "true");
    expect(item("Noturno")).not.toHaveAttribute("aria-current");
    // A seleção padrão não vai para o endereço.
    expect(nav.get().get("preco")).toBeNull();
  });

  it("cada item mostra descrição, tipo e situação", async () => {
    await tela();
    const motos = item("Motos");
    expect(motos).toHaveTextContent("Padrão");
    expect(motos).toHaveTextContent("Vigente");
    expect(item("Convênio Shopping Central")).toHaveTextContent("Convênio");
    expect(item("Black Friday")).toHaveTextContent("Agendada");
    expect(item("Tarifa verão 2025")).toHaveTextContent("Encerrada");
    expect(item("Noturno")).toHaveTextContent("Inativa");
  });

  it("clicar num item mostra o detalhe dele sem abrir a edição", async () => {
    const user = userEvent.setup();
    await tela();
    await user.click(item("Motos"));

    expect(tituloDoDetalhe()).toHaveTextContent("Motos");
    expect(item("Motos")).toHaveAttribute("aria-current", "true");
    expect(nav.get().get("preco")).toBe("3");
    expect(nav.push).not.toHaveBeenCalled();
    expect(nav.replace).toHaveBeenCalledWith("/precos?preco=3", { scroll: false });
    expect(JSON.stringify(nav.push.mock.calls)).not.toContain("editar");
  });

  it("o detalhe oferece Editar como link para a edição", async () => {
    await tela();
    expect(within(detalhe()).getByRole("link", { name: /^Editar/ })).toHaveAttribute("href", "/precos/2/editar");
  });

  it("anuncia a tabela escolhida em região de status", async () => {
    const user = userEvent.setup();
    await tela();
    await user.click(item("Motos"));
    expect(screen.getByText("Motos selecionada")).toBeInTheDocument();
  });

  it("Novo preço abre o cadastro", async () => {
    const user = userEvent.setup();
    await tela();
    await user.click(screen.getAllByRole("button", { name: "Novo preço" })[0]);
    expect(nav.push).toHaveBeenCalledWith("/precos/novo", undefined);
  });

  it("abre já na tabela do endereço, mesmo fora da primeira vigente", async () => {
    nav.set("/precos?preco=5");
    await tela();
    expect(tituloDoDetalhe()).toHaveTextContent("Black Friday");
    expect(item("Black Friday")).toHaveAttribute("aria-current", "true");
  });

  it("as setas movem o foco entre os itens, e só um item entra na ordem de Tab", async () => {
    const user = userEvent.setup();
    await tela();
    const lis = itens();
    expect(lis.filter((botao) => botao.getAttribute("tabindex") === "0")).toHaveLength(1);
    expect(item("Tarifa padrão rotativo")).toHaveAttribute("tabindex", "0");

    item("Tarifa padrão rotativo").focus();
    await user.keyboard("{ArrowDown}");
    expect(item("Motos")).toHaveFocus();
    await user.keyboard("{ArrowUp}{ArrowUp}");
    expect(item("Noturno")).toHaveFocus();
    await user.keyboard("{End}");
    expect(item("Tarifa verão 2025")).toHaveFocus();
    await user.keyboard("{Home}");
    expect(item("Noturno")).toHaveFocus();
  });
});

describe("PrecosMasterDetail: busca e filtro", () => {
  it("a busca reduz a lista e a contagem acompanha", async () => {
    const user = userEvent.setup();
    await tela();
    expect(screen.getByText("6 tabelas")).toBeInTheDocument();

    await user.type(screen.getByRole("searchbox", { name: "Buscar tabela de preço" }), "tarifa");
    expect(itens().map((botao) => botao.textContent)).toEqual([
      expect.stringContaining("Tarifa padrão rotativo"),
      expect.stringContaining("Tarifa verão 2025"),
    ]);
    expect(screen.getByText("2 tabelas")).toBeInTheDocument();
  });

  it("a busca vai para o endereço depois do debounce", async () => {
    const user = userEvent.setup();
    await tela();
    await user.type(screen.getByRole("searchbox"), "motos");
    await waitFor(() => expect(nav.get().get("q")).toBe("motos"));
  });

  it("a busca ignora caixa e acento", async () => {
    const user = userEvent.setup();
    await tela();
    await user.type(screen.getByRole("searchbox"), "CONVENIO");
    expect(itens()).toHaveLength(1);
    expect(itens()[0]).toHaveTextContent("Convênio Shopping Central");
  });

  it("Esc limpa a busca", async () => {
    const user = userEvent.setup();
    await tela();
    await user.type(screen.getByRole("searchbox"), "motos");
    expect(itens()).toHaveLength(1);
    await user.keyboard("{Escape}");
    expect(screen.getByRole("searchbox")).toHaveValue("");
    expect(itens()).toHaveLength(6);
  });

  it("sem resultado mostra a mensagem e Limpar busca restaura a lista", async () => {
    const user = userEvent.setup();
    await tela();
    await user.type(screen.getByRole("searchbox"), "zzz");
    expect(screen.getByText("Nenhuma tabela encontrada.")).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Tabelas de preço" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Limpar busca" }));
    expect(screen.getByRole("searchbox")).toHaveValue("");
    expect(await screen.findAllByRole("button", { name: /Motos/ })).toHaveLength(1);
  });

  it("filtra por situação e mostra a contagem no plural e no singular", async () => {
    const user = userEvent.setup();
    await tela();
    await user.selectOptions(screen.getByLabelText("Situação"), "vigente");
    expect(itens()).toHaveLength(3);
    expect(screen.getByText("3 vigentes")).toBeInTheDocument();
    expect(nav.get().get("situacao")).toBe("vigente");

    await user.selectOptions(screen.getByLabelText("Situação"), "agendada");
    expect(itens()).toHaveLength(1);
    expect(screen.getByText("1 agendada")).toBeInTheDocument();
  });

  it("busca e situação funcionam juntas", async () => {
    const user = userEvent.setup();
    await tela();
    await user.selectOptions(screen.getByLabelText("Situação"), "vigente");
    await user.type(screen.getByRole("searchbox"), "tarifa");
    expect(itens()).toHaveLength(1);
    expect(itens()[0]).toHaveTextContent("Tarifa padrão rotativo");
  });

  it("voltar a 'Todas' tira o parâmetro do endereço", async () => {
    const user = userEvent.setup();
    nav.set("/precos?situacao=inativa");
    await tela();
    expect(itens()).toHaveLength(1);
    await user.selectOptions(screen.getByLabelText("Situação"), "todas");
    expect(nav.get().get("situacao")).toBeNull();
    expect(itens()).toHaveLength(6);
  });
});

describe("PrecosMasterDetail: paginação", () => {
  it("pagina de 20 em 20 e mostra o intervalo", async () => {
    const user = userEvent.setup();
    await tela([...TABELAS, ...mais(19)]);
    expect(itens()).toHaveLength(20);
    expect(screen.getByText("Mostrando 1–20 de 25")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Próxima" }));
    expect(itens()).toHaveLength(5);
    expect(screen.getByText("Mostrando 21–25 de 25")).toBeInTheDocument();
    expect(nav.get().get("pagina")).toBe("2");
  });

  it("trocar de página mantém a busca e o filtro", async () => {
    const user = userEvent.setup();
    nav.set("/precos?situacao=vigente&q=tabela");
    await tela([...TABELAS, ...mais(30)]);
    expect(screen.getByText("Mostrando 1–20 de 30")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Próxima" }));
    expect(nav.get().get("situacao")).toBe("vigente");
    expect(nav.get().get("q")).toBe("tabela");
    expect(nav.get().get("pagina")).toBe("2");
    expect(itens()).toHaveLength(10);
  });

  it("mudar o filtro volta para a página 1", async () => {
    const user = userEvent.setup();
    nav.set("/precos?pagina=2");
    await tela([...TABELAS, ...mais(30)]);
    await user.selectOptions(screen.getByLabelText("Situação"), "vigente");
    expect(nav.get().get("pagina")).toBeNull();
  });

  it("página fora do intervalo volta para a última existente", async () => {
    nav.set("/precos?pagina=9");
    await tela([...TABELAS, ...mais(19)]);
    await waitFor(() => expect(nav.get().get("pagina")).toBe("2"));
    expect(screen.getByText("Mostrando 21–25 de 25")).toBeInTheDocument();
  });

  it("a seleção padrão olha só a página atual", async () => {
    nav.set("/precos?pagina=2");
    await tela([...mais(20), preco(500, "Última vigente")]);
    expect(tituloDoDetalhe()).toHaveTextContent("Última vigente");
  });
});

describe("PrecosMasterDetail: estados", () => {
  it("carregando mostra o esqueleto na lista e no detalhe", () => {
    vi.mocked(listAllPrecos).mockReturnValue(new Promise(() => {}));
    renderTela();
    expect(screen.getByRole("status", { name: "Carregando preços" })).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Carregando tabela de preço" })).toBeInTheDocument();
  });

  it("erro mostra a mensagem e Tentar novamente refaz a busca", async () => {
    const user = userEvent.setup();
    vi.mocked(listAllPrecos).mockRejectedValueOnce(new ApiError("network"));
    renderTela();
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar os preços. Não foi possível conectar ao servidor.");

    vi.mocked(listAllPrecos).mockResolvedValue(TABELAS);
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByRole("list", { name: "Tabelas de preço" })).toBeInTheDocument();
    expect(listAllPrecos).toHaveBeenCalledTimes(2);
  });

  it("vazio mostra a mensagem e Novo preço", async () => {
    const user = userEvent.setup();
    vi.mocked(listAllPrecos).mockResolvedValue([]);
    renderTela();
    expect(await screen.findByText("Nenhuma tabela de preço cadastrada.")).toBeInTheDocument();
    expect(screen.getByText("Nenhuma tabela para mostrar.")).toBeInTheDocument();
    await user.click(within(colunaDaLista()).getByRole("button", { name: "Novo preço" }));
    expect(nav.push).toHaveBeenCalledWith("/precos/novo", undefined);
  });

  it("tabela removida mostra o aviso e leva à primeira da lista", async () => {
    const user = userEvent.setup();
    nav.set("/precos?preco=999");
    await tela();
    expect(within(detalhe()).getByText("Esta tabela de preço não existe mais.")).toBeInTheDocument();

    await user.click(within(detalhe()).getByRole("button", { name: "Ver a primeira da lista" }));
    expect(nav.get().get("preco")).toBe("1");
    expect(tituloDoDetalhe()).toHaveTextContent("Noturno 22h às 6h");
  });
});

describe("PrecosMasterDetail: celular", () => {
  function celular() {
    document.getElementById("layout-desktop")?.remove();
    vi.stubGlobal("matchMedia", (consulta: string) => ({
      matches: consulta.includes("max-width"),
      media: consulta,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  }

  const visivel = (elemento: HTMLElement) => getComputedStyle(elemento).display !== "none";

  it("sem tabela no endereço só a lista aparece", async () => {
    celular();
    await tela();
    expect(visivel(colunaDaLista())).toBe(true);
    expect(visivel(screen.getByLabelText("Detalhe da tabela de preço"))).toBe(false);
  });

  it("escolher um item cria uma entrada no histórico e abre o detalhe", async () => {
    celular();
    const user = userEvent.setup();
    await tela();
    await user.click(item("Motos"));

    expect(nav.push).toHaveBeenCalledWith("/precos?preco=3", { scroll: false });
    expect(nav.replace).not.toHaveBeenCalled();
    expect(visivel(colunaDaLista())).toBe(false);
    expect(visivel(screen.getByLabelText("Detalhe da tabela de preço"))).toBe(true);
    expect(tituloDoDetalhe()).toHaveTextContent("Motos");
  });

  it("Voltar devolve a lista com busca, filtro e página", async () => {
    celular();
    const user = userEvent.setup();
    nav.set("/precos?preco=3&q=tab&situacao=vigente&pagina=2");
    await tela([...TABELAS, ...mais(30)]);
    await user.click(within(detalhe()).getByRole("button", { name: /Preços/ }));

    expect(nav.get().get("preco")).toBeNull();
    expect(nav.get().get("q")).toBe("tab");
    expect(nav.get().get("situacao")).toBe("vigente");
    expect(nav.get().get("pagina")).toBe("2");
    expect(visivel(colunaDaLista())).toBe(true);
    expect(screen.getByRole("searchbox")).toHaveValue("tab");
  });

  it("no desktop selecionar só substitui a entrada do histórico", async () => {
    const user = userEvent.setup();
    await tela();
    await user.click(item("Motos"));
    expect(nav.push).not.toHaveBeenCalled();
    expect(nav.replace).toHaveBeenCalledTimes(1);
  });
});

describe("PrecosMasterDetail: depois de salvar", () => {
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

describe("PrecosMasterDetail: link compartilhável", () => {
  it("reabrir o endereço leva à mesma tabela, busca e filtro", async () => {
    nav.set("/precos?preco=6&q=tarifa&situacao=encerrada");
    await tela();
    expect(screen.getByRole("searchbox")).toHaveValue("tarifa");
    expect(screen.getByLabelText("Situação")).toHaveValue("encerrada");
    expect(itens()).toHaveLength(1);
    expect(tituloDoDetalhe()).toHaveTextContent("Tarifa verão 2025");
  });

  it("parâmetros inválidos no endereço são ignorados", async () => {
    nav.set("/precos?preco=abc&situacao=xxx&pagina=-1");
    await tela();
    expect(itens()).toHaveLength(6);
    expect(tituloDoDetalhe()).toHaveTextContent("Tarifa padrão rotativo");
  });

  it("a recarga não refaz a busca ao mexer só na seleção", async () => {
    const user = userEvent.setup();
    await tela();
    await user.click(item("Motos"));
    await user.click(item("Black Friday"));
    expect(listAllPrecos).toHaveBeenCalledTimes(1);
  });
});
