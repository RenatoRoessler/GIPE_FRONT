import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import { TIPO_CATEGORIA, TIPO_REGRA, type PrecoView } from "@/types/preco";
import { PrecoDetalhe, TABELA_INEXISTENTE_MESSAGE, type PrecoDetalheProps } from "./PrecoDetalhe";

function preco(extra: Partial<PrecoView> = {}): PrecoView {
  return {
    rotatividadeId: 7,
    empresaConveniadaId: null,
    descricao: "Tarifa padrão rotativo",
    tipoRegra: TIPO_REGRA.Padrao,
    inicioVigencia: "2026-06-06T00:00:00",
    fimVigencia: null,
    toleranciaEntradaMinutos: 10,
    toleranciaAlteracaoFaixaMinutos: 5,
    periodoDiaria: 720,
    valorDiaria: 35,
    valorAdicionalDiaria: 1,
    ativo: true,
    regras: [{ diaSemana: 2, horaInicio: "06:00:00", horaFim: "22:00:00", dataInicio: null, dataFim: null, ativo: true }],
    faixas: [
      { minutosLimite: 60, valor: 10, percentualConveniada: null },
      { minutosLimite: 120, valor: 16, percentualConveniada: null },
    ],
    categorias: [TIPO_CATEGORIA.Todas],
    ...extra,
  };
}

function renderDetalhe(props: Partial<PrecoDetalheProps> = {}) {
  renderWithTheme(<PrecoDetalhe estado="pronto" preco={preco()} {...props} />);
}

const aba = (nome: string) => screen.getByRole("tab", { name: nome });

describe("PrecoDetalhe: cabeçalho", () => {
  it("mostra título, tipo, situação e vigência", () => {
    renderDetalhe();
    expect(screen.getByRole("heading", { level: 2, name: "Tarifa padrão rotativo" })).toBeInTheDocument();
    expect(screen.getByText("Padrão")).toBeInTheDocument();
    expect(screen.getByText("Vigente")).toBeInTheDocument();
    expect(screen.getByText("06/06/2026 → sem fim")).toBeInTheDocument();
  });

  it("Editar é um link para a edição da tabela", () => {
    renderDetalhe();
    const editar = screen.getByRole("link", { name: "Editar Tarifa padrão rotativo" });
    expect(editar).toHaveAttribute("href", "/precos/7/editar");
  });

  it("tipo desconhecido aparece como traço", () => {
    renderDetalhe({ preco: preco({ tipoRegra: null }) });
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("não mostra o botão Voltar sem onVoltar", () => {
    renderDetalhe();
    expect(screen.queryByRole("button", { name: /Preços/ })).not.toBeInTheDocument();
  });

  it("mostra Voltar e o aciona (celular)", () => {
    const onVoltar = vi.fn();
    renderDetalhe({ onVoltar });
    fireEvent.click(screen.getByRole("button", { name: /Preços/ }));
    expect(onVoltar).toHaveBeenCalledTimes(1);
  });
});

describe("PrecoDetalhe: abas", () => {
  it("oferece Tarifa, Horários e Informações, com Tarifa aberta", () => {
    renderDetalhe();
    expect(screen.getAllByRole("tab").map((item) => item.textContent)).toEqual(["Tarifa", "Horários", "Informações"]);
    expect(aba("Tarifa")).toHaveAttribute("aria-selected", "true");
  });

  it("Tarifa mostra a placa, a diária, as tolerâncias e as categorias", () => {
    renderDetalhe();
    const placa = screen.getByLabelText("Pré-visualização da tabela tarifária");
    expect(placa).toHaveAttribute("data-size", "lg");
    expect(within(placa).getByText(/Diária de 12 h/)).toBeInTheDocument();
    expect(screen.getByText("Tolerância de entrada").nextSibling).toHaveTextContent("10 min");
    expect(screen.getByText("Tolerância de alteração de faixa").nextSibling).toHaveTextContent("5 min");
    expect(screen.getByText("Categorias").nextSibling).toHaveTextContent("Todas");
  });

  it("lista as categorias pelo nome quando não é 'Todas'", () => {
    renderDetalhe({ preco: preco({ categorias: [TIPO_CATEGORIA.Moto, TIPO_CATEGORIA.Caminhao] }) });
    expect(screen.getByText("Categorias").nextSibling).toHaveTextContent("Moto, Caminhão");
  });

  it("mostra traço quando não há categoria", () => {
    renderDetalhe({ preco: preco({ categorias: [] }) });
    expect(screen.getByText("Categorias").nextSibling).toHaveTextContent("—");
  });

  it("um só percentual da conveniada vira selo na placa", () => {
    renderDetalhe({
      preco: preco({
        tipoRegra: TIPO_REGRA.Convenio,
        faixas: [
          { minutosLimite: 60, valor: 10, percentualConveniada: 30 },
          { minutosLimite: 120, valor: 16, percentualConveniada: 30 },
        ],
      }),
    });
    expect(screen.getByText("Conveniada −30%")).toBeInTheDocument();
  });

  it("percentuais diferentes aparecem como faixa de desconto, sem selo", () => {
    renderDetalhe({
      preco: preco({
        faixas: [
          { minutosLimite: 60, valor: 10, percentualConveniada: 10 },
          { minutosLimite: 120, valor: 16, percentualConveniada: 30 },
        ],
      }),
    });
    expect(screen.queryByText(/Conveniada −/)).not.toBeInTheDocument();
    expect(screen.getByText("Desconto da conveniada").nextSibling).toHaveTextContent("10% a 30%, conforme o degrau");
  });

  it("Horários mostra a semana inteira", async () => {
    const user = userEvent.setup();
    renderDetalhe();
    await user.click(aba("Horários"));
    expect(screen.getByRole("list", { name: "Horários de cobrança por dia da semana" })).toBeInTheDocument();
    expect(screen.getByText("06:00–22:00")).toBeInTheDocument();
    expect(screen.getAllByText("Sem cobrança")).toHaveLength(6);
  });

  it("Informações mostra os dados cadastrais", async () => {
    const user = userEvent.setup();
    renderDetalhe();
    await user.click(aba("Informações"));
    expect(screen.getByText("Tipo de regra").nextSibling).toHaveTextContent("Padrão");
    expect(screen.getByText("Vigência").nextSibling).toHaveTextContent("06/06/2026 → sem fim");
    expect(screen.getByText("Situação").nextSibling).toHaveTextContent("Vigente");
    expect(screen.getByText("Período da diária").nextSibling).toHaveTextContent("12 h");
    expect(screen.getByText("Valor da diária").nextSibling).toHaveTextContent(/R\$\s35,00/);
    expect(screen.getByText("Valor adicional").nextSibling).toHaveTextContent(/R\$\s1,00/);
  });

  it("empresa conveniada fica oculta enquanto vazia e aparece quando existe", async () => {
    const user = userEvent.setup();
    const { unmount } = renderWithTheme(<PrecoDetalhe estado="pronto" preco={preco()} />);
    await user.click(aba("Informações"));
    expect(screen.queryByText("Empresa conveniada")).not.toBeInTheDocument();
    unmount();

    renderWithTheme(<PrecoDetalhe estado="pronto" preco={preco({ empresaConveniadaId: 12 })} />);
    await user.click(aba("Informações"));
    expect(screen.getByText("Empresa conveniada").nextSibling).toHaveTextContent("12");
  });

  it("a aba escolhida continua ao trocar de tabela", async () => {
    const user = userEvent.setup();
    const { rerender } = renderWithTheme(<PrecoDetalhe estado="pronto" preco={preco()} />);
    await user.click(aba("Horários"));
    rerender(<PrecoDetalhe estado="pronto" preco={preco({ rotatividadeId: 8, descricao: "Motos" })} />);
    expect(screen.getByRole("heading", { level: 2, name: "Motos" })).toBeInTheDocument();
    expect(aba("Horários")).toHaveAttribute("aria-selected", "true");
  });

  it("navega entre as abas pelas setas", async () => {
    const user = userEvent.setup();
    renderDetalhe();
    aba("Tarifa").focus();
    await user.keyboard("{ArrowRight}");
    expect(aba("Horários")).toHaveAttribute("aria-selected", "true");
  });
});

describe("PrecoDetalhe: simulador", () => {
  it("aparece abaixo das abas, em todas elas", async () => {
    const user = userEvent.setup();
    renderDetalhe();
    for (const nome of ["Tarifa", "Horários", "Informações"]) {
      await user.click(aba(nome));
      expect(screen.getByRole("heading", { name: "Simular cobrança" })).toBeInTheDocument();
    }
  });

  it("recomeça do padrão ao trocar de tabela", () => {
    const { rerender } = renderWithTheme(<PrecoDetalhe estado="pronto" preco={preco()} />);
    fireEvent.change(screen.getByLabelText("Permanência (minutos)"), { target: { value: "45" } });
    rerender(<PrecoDetalhe estado="pronto" preco={preco({ rotatividadeId: 8 })} />);
    expect(screen.getByLabelText("Permanência (minutos)")).toHaveValue("150");
  });
});

describe("PrecoDetalhe: estados", () => {
  it("carregando mostra o esqueleto anunciado", () => {
    renderWithTheme(<PrecoDetalhe estado="carregando" />);
    expect(screen.getByRole("status", { name: "Carregando tabela de preço" })).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
  });

  it("erro mostra a mensagem e Tentar novamente refaz", () => {
    const onTentarNovamente = vi.fn();
    renderWithTheme(<PrecoDetalhe estado="erro" mensagemErro="Sem conexão." onTentarNovamente={onTentarNovamente} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível carregar a tabela de preço. Sem conexão.");
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(onTentarNovamente).toHaveBeenCalledTimes(1);
  });

  it("tabela inexistente avisa e leva à primeira da lista", () => {
    const onIrParaPrimeira = vi.fn();
    renderWithTheme(<PrecoDetalhe estado="inexistente" onIrParaPrimeira={onIrParaPrimeira} />);
    expect(screen.getByText(TABELA_INEXISTENTE_MESSAGE)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ver a primeira da lista" }));
    expect(onIrParaPrimeira).toHaveBeenCalledTimes(1);
  });

  it("tabela inexistente sem primeira não oferece o botão", () => {
    renderWithTheme(<PrecoDetalhe estado="inexistente" />);
    expect(screen.queryByRole("button", { name: "Ver a primeira da lista" })).not.toBeInTheDocument();
  });

  it("nos estados de erro e de inexistente o celular ainda pode voltar", () => {
    const onVoltar = vi.fn();
    const { unmount } = renderWithTheme(<PrecoDetalhe estado="erro" mensagemErro="x" onVoltar={onVoltar} />);
    fireEvent.click(screen.getByRole("button", { name: /Preços/ }));
    unmount();
    renderWithTheme(<PrecoDetalhe estado="inexistente" onVoltar={onVoltar} />);
    fireEvent.click(screen.getByRole("button", { name: /Preços/ }));
    expect(onVoltar).toHaveBeenCalledTimes(2);
  });

  it("pronto sem tabela cai no estado de inexistente", () => {
    renderWithTheme(<PrecoDetalhe estado="pronto" preco={null} />);
    expect(screen.getByText(TABELA_INEXISTENTE_MESSAGE)).toBeInTheDocument();
  });
});
