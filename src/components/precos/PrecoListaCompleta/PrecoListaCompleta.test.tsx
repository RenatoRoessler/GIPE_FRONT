import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { PrecoView } from "@/types/preco";
import { renderWithTheme } from "@/test/render";
import type { UsePrecos } from "../PrecosCockpit/usePrecos";
import { PrecoListaCompleta, type PrecoListaCompletaProps } from "./PrecoListaCompleta";

function preco(id: number, descricao: string, extra: Partial<PrecoView> = {}): PrecoView {
  return {
    rotatividadeId: id,
    empresaConveniadaId: null,
    descricao,
    tipoRegra: 1,
    inicioVigencia: "2020-01-01T00:00:00",
    fimVigencia: null,
    toleranciaEntradaMinutos: 0,
    toleranciaAlteracaoFaixaMinutos: 0,
    periodoDiaria: 720,
    valorDiaria: 100,
    valorAdicionalDiaria: 0,
    ativo: true,
    regras: [],
    faixas: [{ minutosLimite: 60, valor: 15, percentualConveniada: null }],
    categorias: [],
    ...extra,
  };
}

const TABELAS = [preco(1, "Final de semana"), preco(2, "Convênio", { tipoRegra: 2 }), preco(3, "Noturno", { ativo: false })];

function pronto(extra: Partial<Extract<UsePrecos, { status: "pronto" }>> = {}): UsePrecos {
  return {
    status: "pronto",
    todas: TABELAS,
    filtradas: TABELAS,
    pagina: { itens: TABELAS, page: 1, totalPages: 1, totalRecords: TABELAS.length, pageSize: 20 },
    contagem: "3 tabelas",
    paginaForaDoIntervalo: false,
    atualizando: false,
    ...extra,
  };
}

function renderizar(precos: UsePrecos, extra: Partial<PrecoListaCompletaProps> = {}) {
  const props: PrecoListaCompletaProps = {
    url: { q: "", situacao: "todas", setQ: vi.fn(), setSituacao: vi.fn(), setPagina: vi.fn() },
    precos,
    selecionadaId: 1,
    onSelecionar: vi.fn(),
    onNovoPreco: vi.fn(),
    ...extra,
  };
  renderWithTheme(<PrecoListaCompleta {...props} />);
  return props;
}

describe("PrecoListaCompleta", () => {
  it("cada item mostra descrição, tipo, situação e o resumo do que cobra", () => {
    renderizar(pronto());
    const item = screen.getByRole("button", { name: /Final de semana/ });
    expect(item).toHaveTextContent("Padrão");
    expect(item).toHaveTextContent("Vigente");
    expect(item).toHaveTextContent("R$ 15,00 até 1 h · diária R$ 100,00");
    expect(screen.getByRole("button", { name: /Noturno/ })).toHaveTextContent("Inativa");
    expect(screen.getByText("3 tabelas")).toBeInTheDocument();
  });

  it("escolher um item avisa quem usa, com o id", async () => {
    const { onSelecionar } = renderizar(pronto());
    await userEvent.click(screen.getByRole("button", { name: /Convênio/ }));
    expect(onSelecionar).toHaveBeenCalledWith(2);
  });

  it("mostra todas as situações do filtro, sem esconder nenhuma, e troca ao escolher", async () => {
    const { url } = renderizar(pronto());
    for (const nome of ["Todas", "Vigente", "Agendada", "Encerrada", "Inativa"]) {
      expect(screen.getByRole("radio", { name: nome })).toBeInTheDocument();
    }
    await userEvent.click(screen.getByRole("radio", { name: "Encerrada" }));
    expect(url.setSituacao).toHaveBeenCalledWith("encerrada");
  });

  it("a busca grava o texto e Esc limpa", async () => {
    const { url } = renderizar(pronto(), { url: { q: "conv", situacao: "todas", setQ: vi.fn(), setSituacao: vi.fn(), setPagina: vi.fn() } });
    const busca = screen.getByRole("searchbox", { name: "Buscar tabela de preço" });
    expect(busca).toHaveValue("conv");
    busca.focus();
    await userEvent.keyboard("{Escape}");
    // `url` do retorno é o objeto passado por `extra`, não o padrão.
    expect(url.setQ).toHaveBeenCalledWith("");
  });

  it("as setas movem o foco entre os itens e só um entra na ordem de Tab", async () => {
    renderizar(pronto());
    expect(screen.getByRole("button", { name: /Final de semana/ })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("button", { name: /Convênio/ })).toHaveAttribute("tabindex", "-1");
    screen.getByRole("button", { name: /Final de semana/ }).focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("button", { name: /Convênio/ })).toHaveFocus();
    await userEvent.keyboard("{End}");
    expect(screen.getByRole("button", { name: /Noturno/ })).toHaveFocus();
  });

  it("sem resultado mostra a mensagem e Limpar busca zera busca e situação", async () => {
    const { url } = renderizar(pronto({ filtradas: [], pagina: { itens: [], page: 1, totalPages: 1, totalRecords: 0, pageSize: 20 }, contagem: "0 tabelas" }));
    expect(screen.getByText("Nenhuma tabela encontrada.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Limpar busca" }));
    expect(url.setQ).toHaveBeenCalledWith("");
    expect(url.setSituacao).toHaveBeenCalledWith("todas");
  });

  it("vazio de verdade oferece Novo preço", async () => {
    const { onNovoPreco } = renderizar(pronto({ todas: [], filtradas: [], pagina: { itens: [], page: 1, totalPages: 1, totalRecords: 0, pageSize: 20 }, contagem: "0 tabelas" }));
    expect(screen.getByText("Nenhuma tabela de preço cadastrada.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Novo preço" }));
    expect(onNovoPreco).toHaveBeenCalled();
  });

  it("carregando mostra o esqueleto", () => {
    renderizar({ status: "carregando" });
    expect(screen.getByRole("status", { name: "Carregando preços" })).toBeInTheDocument();
  });

  it("erro mostra a mensagem e Tentar novamente refaz a busca", async () => {
    const refetch = vi.fn();
    renderizar({ status: "erro", erro: "Falha de rede", semPermissao: false, refetch });
    expect(screen.getByRole("alert")).toHaveTextContent("Falha de rede");
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(refetch).toHaveBeenCalled();
  });

  it("sem permissão avisa e não oferece nova tentativa", () => {
    renderizar({ status: "erro", erro: "403", semPermissao: true, refetch: vi.fn() });
    expect(screen.queryByRole("button", { name: "Tentar novamente" })).not.toBeInTheDocument();
  });

  it("pagina e avisa a página escolhida", async () => {
    const { url } = renderizar(
      pronto({ pagina: { itens: TABELAS, page: 1, totalPages: 2, totalRecords: 25, pageSize: 20 }, contagem: "25 tabelas" }),
    );
    expect(screen.getByText("Mostrando 1–20 de 25")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Próxima" }));
    expect(url.setPagina).toHaveBeenCalledWith(2);
  });
});
