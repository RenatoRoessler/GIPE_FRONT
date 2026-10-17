import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithTheme } from "@/test/render";
import { FaixasPreview } from "./FaixasPreview";

const FAIXAS = [
  { minutosLimite: 120, valor: 16 },
  { minutosLimite: 60, valor: 10 },
];
const DIARIA = { periodo: 720, valor: 35, adicional: 1 };

const placa = () => screen.getByLabelText("Pré-visualização da tabela tarifária");

describe("FaixasPreview", () => {
  it("mostra os degraus em ordem de tempo e a diária", () => {
    renderWithTheme(<FaixasPreview faixas={FAIXAS} diaria={DIARIA} />);
    const degraus = screen.getAllByRole("listitem").map((item) => item.textContent);
    expect(degraus[0]).toMatch(/^Até 1 h.*R\$\s10,00$/);
    expect(degraus[1]).toMatch(/^Até 2 h.*R\$\s16,00$/);
    expect(screen.getByText(/Diária de 12 h/)).toBeInTheDocument();
    expect(screen.getByText(/adicional R\$\s1,00/)).toBeInTheDocument();
  });

  it("sem faixas orienta a adicionar", () => {
    renderWithTheme(<FaixasPreview faixas={[]} />);
    expect(screen.getByText("Adicione faixas para ver a tarifa.")).toBeInTheDocument();
  });

  it("o uso atual (sem as props novas) segue no tamanho padrão e sem selo", () => {
    renderWithTheme(<FaixasPreview faixas={FAIXAS} diaria={DIARIA} />);
    expect(placa()).toHaveAttribute("data-size", "md");
    expect(screen.queryByText(/Conveniada/)).not.toBeInTheDocument();
  });

  it("no tamanho grande marca a placa como lg", () => {
    renderWithTheme(<FaixasPreview faixas={FAIXAS} diaria={DIARIA} size="lg" />);
    expect(placa()).toHaveAttribute("data-size", "lg");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("mostra o selo da conveniada com o percentual", () => {
    renderWithTheme(<FaixasPreview faixas={FAIXAS} conveniadaPercentual={30} />);
    expect(screen.getByText("Conveniada −30%")).toBeInTheDocument();
  });

  it.each([null, 0, undefined])("não mostra o selo para %j", (percentual) => {
    renderWithTheme(<FaixasPreview faixas={FAIXAS} conveniadaPercentual={percentual} />);
    expect(screen.queryByText(/Conveniada/)).not.toBeInTheDocument();
  });

  it("não mostra a diária sem valor válido", () => {
    renderWithTheme(<FaixasPreview faixas={FAIXAS} diaria={{ periodo: 0, valor: 35, adicional: 0 }} />);
    expect(screen.queryByText(/Diária/)).not.toBeInTheDocument();
  });
});
