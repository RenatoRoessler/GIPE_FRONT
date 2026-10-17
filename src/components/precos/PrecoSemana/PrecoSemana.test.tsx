import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithTheme } from "@/test/render";
import type { PrecoRegraView } from "@/types/preco";
import { PrecoSemana } from "./PrecoSemana";

function regra(diaSemana: number, extra: Partial<PrecoRegraView> = {}): PrecoRegraView {
  return { diaSemana, horaInicio: "06:00:00", horaFim: "22:00:00", dataInicio: null, dataFim: null, ativo: true, ...extra };
}

const linhas = () => within(screen.getByRole("list", { name: "Horários de cobrança por dia da semana" })).getAllByRole("listitem");

describe("PrecoSemana", () => {
  it("mostra sempre as sete linhas, de domingo a sábado", () => {
    renderWithTheme(<PrecoSemana regras={[]} />);
    expect(linhas()).toHaveLength(7);
    expect(linhas()[0]).toHaveTextContent("Domingo");
    expect(linhas()[1]).toHaveTextContent("Segunda-feira");
    expect(linhas()[6]).toHaveTextContent("Sábado");
  });

  it("mostra o nome abreviado e deixa o completo para o leitor de tela", () => {
    renderWithTheme(<PrecoSemana regras={[]} />);
    expect(within(linhas()[1]).getByText("Seg")).toHaveAttribute("aria-hidden", "true");
    expect(within(linhas()[1]).getByText("Segunda-feira")).toBeInTheDocument();
  });

  it("a régua de 24 h é decorativa", () => {
    const { container } = renderWithTheme(<PrecoSemana regras={[]} />);
    const regua = container.querySelector('[aria-hidden="true"]');
    expect(regua).toHaveTextContent("0h");
    expect(regua).toHaveTextContent("24h");
  });

  it("dias sem regra mostram 'Sem cobrança'", () => {
    renderWithTheme(<PrecoSemana regras={[regra(2)]} />);
    expect(linhas()[0]).toHaveTextContent("Sem cobrança");
    expect(linhas()[2]).toHaveTextContent("Sem cobrança");
  });

  it("mostra o intervalo em texto, equivalente ao trilho", () => {
    renderWithTheme(<PrecoSemana regras={[regra(2, { horaInicio: "06:00:00", horaFim: "22:00:00" })]} />);
    expect(linhas()[1]).toHaveTextContent("06:00–22:00");
  });

  it("horário nulo aparece como 'Dia inteiro'", () => {
    renderWithTheme(<PrecoSemana regras={[regra(1, { horaInicio: null, horaFim: null })]} />);
    expect(linhas()[0]).toHaveTextContent("Dia inteiro");
  });

  it("junta vários intervalos do mesmo dia", () => {
    renderWithTheme(
      <PrecoSemana regras={[regra(2, { horaInicio: "06:00:00", horaFim: "10:00:00" }), regra(2, { horaInicio: "14:00:00", horaFim: "18:00:00" })]} />,
    );
    expect(linhas()[1]).toHaveTextContent("06:00–10:00, 14:00–18:00");
  });

  it("regra inativa fica marcada com 'Inativa'", () => {
    renderWithTheme(<PrecoSemana regras={[regra(2, { ativo: false }), regra(3)]} />);
    expect(linhas()[1]).toHaveTextContent("Inativa");
    expect(linhas()[2]).not.toHaveTextContent("Inativa");
  });

  it("mostra o período específico da regra em texto", () => {
    renderWithTheme(<PrecoSemana regras={[regra(2, { dataInicio: "2025-12-01", dataFim: "2026-01-31" })]} />);
    expect(linhas()[1]).toHaveTextContent("de 01/12/2025 a 31/01/2026");
  });

  it("o trilho recebe o segmento na posição do intervalo", () => {
    const { container } = renderWithTheme(<PrecoSemana regras={[regra(2, { horaInicio: "06:00:00", horaFim: "18:00:00" })]} />);
    const segmento = linhas()[1].querySelector("[aria-hidden='true'] span") as HTMLElement;
    expect(container).toBeInTheDocument();
    expect(getComputedStyle(segmento).left).toBe("25%");
    expect(getComputedStyle(segmento).width).toBe("50%");
  });

  it("dia sem cobrança não desenha segmento", () => {
    renderWithTheme(<PrecoSemana regras={[]} />);
    expect(linhas()[0].querySelector("[aria-hidden='true'] span")).toBeNull();
  });
});
