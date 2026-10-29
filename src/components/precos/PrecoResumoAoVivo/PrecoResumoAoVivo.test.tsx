import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithTheme } from "@/test/render";
import { EMPTY_PRECO_FORM_VALUES, TIPO_CATEGORIA, type PrecoFormValues } from "@/types/preco";
import { PrecoResumoAoVivo } from "./PrecoResumoAoVivo";

const COMPLETO: PrecoFormValues = {
  info: {
    descricao: "Tarifa padrão rotativo",
    tipoRegra: "1",
    inicioVigencia: "2026-11-01T00:00",
    fimVigencia: "",
    toleranciaEntradaMinutos: "10",
    toleranciaAlteracaoFaixaMinutos: "0",
    periodoDiaria: "1440",
    valorDiaria: "70,00",
    valorAdicionalDiaria: "2,00",
    empresaConveniadaId: "",
    ativo: true,
  },
  horarios: [2, 3, 4, 5, 6].map((dia) => ({
    diaSemana: String(dia),
    horaInicio: "06:00",
    horaFim: "22:00",
    dataInicio: "",
    dataFim: "",
    ativo: true,
  })),
  faixas: [
    { minutosLimite: "60", valor: "15,00", percentualConveniada: "" },
    { minutosLimite: "120", valor: "25,00", percentualConveniada: "" },
  ],
  categorias: [TIPO_CATEGORIA.Todas],
};

describe("PrecoResumoAoVivo", () => {
  it("cadastro vazio mostra os itens pendentes e a placa sem faixas", () => {
    renderWithTheme(
      <PrecoResumoAoVivo
        values={{ ...EMPTY_PRECO_FORM_VALUES, faixas: [] }}
        etapasCompletas={[false, false, false]}
      />,
    );
    expect(screen.getByText("ainda sem nome")).toBeInTheDocument();
    expect(screen.getByText("nenhuma")).toBeInTheDocument();
    expect(screen.getByText("nenhum ainda")).toBeInTheDocument();
    expect(screen.getByText("Adicione faixas para ver a tarifa.")).toBeInTheDocument();
  });

  it("mostra a tabela preenchida: vigência sem fim, horários agrupados, degraus e diária", () => {
    renderWithTheme(<PrecoResumoAoVivo values={COMPLETO} etapasCompletas={[true, true, true]} />);
    const painel = screen.getByRole("complementary", { name: "Resumo ao vivo da tabela" });
    expect(within(painel).getByText("Tarifa padrão rotativo")).toBeInTheDocument();
    expect(within(painel).getByText(/→ sem fim/)).toBeInTheDocument();
    expect(within(painel).getByText("Seg–Sex 06:00–22:00")).toBeInTheDocument();
    expect(within(painel).getByText(/2 degraus · diária R\$\s70,00/)).toBeInTheDocument();
    expect(within(painel).getByText("Todas")).toBeInTheDocument();
    // A placa mostra os degraus e a diária.
    expect(within(painel).getByLabelText("Pré-visualização da tabela tarifária")).toHaveTextContent("R$ 25,00");
  });

  it("sem original não destaca alterações", () => {
    renderWithTheme(<PrecoResumoAoVivo values={COMPLETO} etapasCompletas={[true, true, true]} />);
    expect(screen.queryByText("Alterado")).not.toBeInTheDocument();
  });

  it("na edição destaca o que mudou em relação ao salvo", () => {
    const editado: PrecoFormValues = {
      ...COMPLETO,
      info: { ...COMPLETO.info, descricao: "Tarifa revisada" },
      faixas: [...COMPLETO.faixas, { minutosLimite: "180", valor: "30,00", percentualConveniada: "" }],
    };
    renderWithTheme(<PrecoResumoAoVivo values={editado} original={COMPLETO} etapasCompletas={[true, true, true]} />);
    expect(screen.getAllByText("Alterado")).toHaveLength(2);
    expect(screen.getByText("Descrição: Tarifa padrão rotativo → Tarifa revisada")).toBeInTheDocument();
    expect(screen.getByText(/^\+ Até 3 h/)).toBeInTheDocument();
  });

  it("sem mudanças na edição não mostra 'Alterado'", () => {
    renderWithTheme(<PrecoResumoAoVivo values={COMPLETO} original={COMPLETO} etapasCompletas={[true, true, true]} />);
    expect(screen.queryByText("Alterado")).not.toBeInTheDocument();
  });
});
