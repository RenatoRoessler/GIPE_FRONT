import { act, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import { TIPO_CATEGORIA, TIPO_REGRA, type PrecoView } from "@/types/preco";
import { ANUNCIO_DEBOUNCE_MS, AVISO_ESTIMATIVA, SimuladorCobranca } from "./SimuladorCobranca";

function preco(extra: Partial<PrecoView> = {}): PrecoView {
  return {
    rotatividadeId: 1,
    empresaConveniadaId: null,
    descricao: "Tarifa padrão",
    tipoRegra: TIPO_REGRA.Padrao,
    inicioVigencia: "2026-06-06T00:00:00",
    fimVigencia: null,
    toleranciaEntradaMinutos: 10,
    toleranciaAlteracaoFaixaMinutos: 0,
    periodoDiaria: 720,
    valorDiaria: 35,
    valorAdicionalDiaria: 1,
    ativo: true,
    regras: [],
    faixas: [
      { minutosLimite: 30, valor: 6, percentualConveniada: null },
      { minutosLimite: 60, valor: 10, percentualConveniada: null },
      { minutosLimite: 120, valor: 16, percentualConveniada: null },
      { minutosLimite: 180, valor: 20, percentualConveniada: null },
    ],
    categorias: [TIPO_CATEGORIA.Todas],
    ...extra,
  };
}

afterEach(() => {
  vi.useRealTimers();
});

const resultado = () => screen.getByTestId("resultado-estimativa");
const minutos = () => screen.getByLabelText("Permanência (minutos)");
const deslizante = () => screen.getByLabelText("Permanência em minutos, controle deslizante");
const anuncio = () => screen.getByRole("status");

describe("SimuladorCobranca", () => {
  it("abre com 'Carro médio' e 2 h 30 min para uma tabela de todas as categorias", () => {
    renderWithTheme(<SimuladorCobranca preco={preco()} />);
    expect(screen.getByRole("heading", { name: "Simular cobrança" })).toBeInTheDocument();
    expect(screen.getByLabelText("Categoria")).toHaveValue(String(TIPO_CATEGORIA.CarroMedio));
    expect(minutos()).toHaveValue("150");
    expect(screen.getByText("= 2 h 30 min")).toBeInTheDocument();
    expect(resultado()).toHaveTextContent(/R\$\s20,00/);
    expect(resultado()).toHaveTextContent("Degrau até 3 h");
  });

  it("abre na primeira categoria da tabela quando ela atende só algumas", () => {
    renderWithTheme(<SimuladorCobranca preco={preco({ categorias: [TIPO_CATEGORIA.Moto, TIPO_CATEGORIA.Caminhao] })} />);
    expect(screen.getByLabelText("Categoria")).toHaveValue(String(TIPO_CATEGORIA.Moto));
  });

  it("oferece as seis categorias de veículo, sem 'Todas'", () => {
    renderWithTheme(<SimuladorCobranca preco={preco()} />);
    const opcoes = screen.getAllByRole("option").map((option) => option.textContent);
    expect(opcoes).toEqual(["Moto", "Carro pequeno", "Carro médio", "Caminhonete", "Caminhão", "Carro grande"]);
  });

  it("o aviso de estimativa está sempre visível", () => {
    renderWithTheme(<SimuladorCobranca preco={preco()} />);
    expect(screen.getByText(AVISO_ESTIMATIVA)).toBeInTheDocument();
    expect(AVISO_ESTIMATIVA).toBe("Estimativa. O valor real é calculado no momento da saída.");
  });

  it("digitar os minutos atualiza o resultado e a equivalência", () => {
    renderWithTheme(<SimuladorCobranca preco={preco()} />);
    fireEvent.change(minutos(), { target: { value: "45" } });
    expect(resultado()).toHaveTextContent(/R\$\s10,00/);
    expect(resultado()).toHaveTextContent("Degrau até 1 h");
    expect(screen.getByText("= 45 min")).toBeInTheDocument();
  });

  it("o controle deslizante e o campo andam juntos", () => {
    renderWithTheme(<SimuladorCobranca preco={preco()} />);
    fireEvent.change(deslizante(), { target: { value: "60" } });
    expect(minutos()).toHaveValue("60");
    fireEvent.change(minutos(), { target: { value: "90" } });
    expect(deslizante()).toHaveValue("90");
  });

  it("limita a permanência ao intervalo do controle", () => {
    renderWithTheme(<SimuladorCobranca preco={preco()} />);
    fireEvent.change(minutos(), { target: { value: "5000" } });
    expect(minutos()).toHaveValue("900");
    fireEvent.change(minutos(), { target: { value: "-10" } });
    expect(minutos()).toHaveValue("0");
  });

  it("explica a tolerância de entrada com valor zero", () => {
    renderWithTheme(<SimuladorCobranca preco={preco()} />);
    fireEvent.change(minutos(), { target: { value: "5" } });
    expect(resultado()).toHaveTextContent(/R\$\s0,00/);
    expect(resultado()).toHaveTextContent("Dentro da tolerância de entrada (10 min)");
  });

  it("explica a diária e o adicional", () => {
    renderWithTheme(<SimuladorCobranca preco={preco()} />);
    fireEvent.change(minutos(), { target: { value: "900" } });
    expect(resultado()).toHaveTextContent(/R\$\s38,00/);
    expect(resultado()).toHaveTextContent("Diária mais 3 h de adicional");
  });

  it("mostra o desconto da conveniada e o valor sem desconto", () => {
    const convenio = preco({
      tipoRegra: TIPO_REGRA.Convenio,
      faixas: [{ minutosLimite: 60, valor: 10, percentualConveniada: 30 }],
    });
    renderWithTheme(<SimuladorCobranca preco={convenio} />);
    fireEvent.change(minutos(), { target: { value: "45" } });
    expect(resultado()).toHaveTextContent(/R\$\s7,00/);
    expect(resultado()).toHaveTextContent("com desconto de 30% da conveniada");
    expect(screen.getByLabelText(/Valor sem desconto R\$\s10,00/)).toBeInTheDocument();
  });

  it("avisa que a tabela não se aplica à categoria, sem mostrar valor", async () => {
    const user = userEvent.setup();
    renderWithTheme(<SimuladorCobranca preco={preco({ categorias: [TIPO_CATEGORIA.Moto] })} />);
    await user.selectOptions(screen.getByLabelText("Categoria"), String(TIPO_CATEGORIA.Caminhao));
    expect(resultado()).toHaveTextContent("Esta tabela não se aplica a Caminhão.");
    expect(resultado()).not.toHaveTextContent("R$");
  });

  it("avisa quando a tabela não tem valores para a permanência", () => {
    renderWithTheme(<SimuladorCobranca preco={preco({ faixas: [], valorDiaria: 0 })} />);
    expect(resultado()).toHaveTextContent("Esta tabela ainda não tem valores para essa permanência.");
  });

  it("trocar a categoria atualiza o resultado", async () => {
    const user = userEvent.setup();
    renderWithTheme(<SimuladorCobranca preco={preco({ categorias: [TIPO_CATEGORIA.CarroMedio] })} />);
    expect(resultado()).toHaveTextContent(/R\$\s20,00/);
    await user.selectOptions(screen.getByLabelText("Categoria"), String(TIPO_CATEGORIA.Moto));
    expect(resultado()).toHaveTextContent("não se aplica a Moto");
  });
});

describe("SimuladorCobranca: anúncio para leitor de tela", () => {
  it("anuncia o resultado inicial", () => {
    renderWithTheme(<SimuladorCobranca preco={preco()} />);
    expect(anuncio()).toHaveTextContent(/Estimativa de R\$\s20,00\. Degrau até 3 h\./);
  });

  it("só anuncia o novo valor depois de o usuário parar de mexer", () => {
    vi.useFakeTimers();
    renderWithTheme(<SimuladorCobranca preco={preco()} />);

    fireEvent.change(deslizante(), { target: { value: "60" } });
    fireEvent.change(deslizante(), { target: { value: "70" } });
    fireEvent.change(deslizante(), { target: { value: "45" } });
    // O resultado visível já mudou, mas o anúncio ainda é o anterior.
    expect(resultado()).toHaveTextContent(/R\$\s10,00/);
    expect(anuncio()).toHaveTextContent(/R\$\s20,00/);

    act(() => vi.advanceTimersByTime(ANUNCIO_DEBOUNCE_MS - 1));
    expect(anuncio()).toHaveTextContent(/R\$\s20,00/);

    act(() => vi.advanceTimersByTime(1));
    expect(anuncio()).toHaveTextContent(/Estimativa de R\$\s10,00\. Degrau até 1 h\./);
  });

  it("anuncia também quando a tabela não se aplica à categoria escolhida", () => {
    renderWithTheme(<SimuladorCobranca preco={preco({ categorias: [TIPO_CATEGORIA.Moto] })} />);
    fireEvent.change(screen.getByLabelText("Categoria"), { target: { value: String(TIPO_CATEGORIA.CarroMedio) } });
    expect(anuncio()).toHaveTextContent("Esta tabela não se aplica a Carro médio.");
  });

  it("o anúncio é uma região de status educada", () => {
    renderWithTheme(<SimuladorCobranca preco={preco()} />);
    expect(anuncio()).toHaveAttribute("aria-live", "polite");
  });
});
