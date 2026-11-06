import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import { PlanoStepFields } from "./PlanoStepFields";

describe("PlanoStepFields", () => {
  it("mostra o teste grátis e o plano Mensal na ordem, sem nenhum selecionado", () => {
    renderWithTheme(<PlanoStepFields plano={undefined} onChange={() => {}} />);
    const radios = screen.getAllByRole("radio");

    expect(radios).toHaveLength(2);
    expect(radios.map((radio) => radio.getAttribute("value"))).toEqual(["0", "1"]);
    radios.forEach((radio) => expect(radio).not.toBeChecked());
  });

  it("o teste grátis diz as condições e não mostra valor", () => {
    renderWithTheme(<PlanoStepFields plano={undefined} onChange={() => {}} />);
    const teste = screen.getByRole("radio", { name: /Teste grátis/ });

    expect(teste).toHaveAccessibleName(expect.stringContaining("30 dias"));
    expect(teste).toHaveAccessibleName(
      expect.stringContaining("Todas as funcionalidades, sem cartão de crédito e sem compromisso."),
    );
    expect(teste).not.toHaveAccessibleName(expect.stringContaining("R$"));
  });

  it("escolher o teste grátis avisa com o tipo 0", () => {
    const onChange = vi.fn();
    renderWithTheme(<PlanoStepFields plano={undefined} onChange={onChange} />);
    fireEvent.click(screen.getByRole("radio", { name: /Teste grátis/ }));
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it("marca o teste grátis quando o plano recebido é 0", () => {
    renderWithTheme(<PlanoStepFields plano={0} onChange={() => {}} />);
    expect(screen.getByRole("radio", { name: /Teste grátis/ })).toBeChecked();
  });

  it("mostra o preço de lançamento, a regra dos 12 meses e o selo com a data", () => {
    renderWithTheme(<PlanoStepFields plano={undefined} onChange={() => {}} />);
    const mensal = screen.getByRole("radio", { name: /Mensal/ });

    expect(mensal).toHaveAccessibleName(expect.stringContaining("R$ 69,90"));
    expect(mensal).toHaveAccessibleName(
      expect.stringContaining("R$ 69,90/mês nos primeiros 12 meses; depois, R$ 99,90/mês."),
    );
    expect(mensal).toHaveAccessibleName(expect.stringContaining("assine até 30/06/2027"));
  });

  it("depois do prazo mostra só o preço de tabela, sem selo", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-07-01T00:00:00-03:00"));
    try {
      renderWithTheme(<PlanoStepFields plano={undefined} onChange={() => {}} />);
      const mensal = screen.getByRole("radio", { name: /Mensal/ });

      expect(mensal).toHaveAccessibleName(expect.stringContaining("R$ 99,90"));
      expect(mensal).not.toHaveAccessibleName(expect.stringContaining("R$ 69,90"));
      expect(mensal).not.toHaveAccessibleName(expect.stringContaining("lançamento"));
    } finally {
      vi.useRealTimers();
    }
  });

  it("não mostra os planos longos nem economia", () => {
    renderWithTheme(<PlanoStepFields plano={undefined} onChange={() => {}} />);
    expect(screen.queryByText(/Trimestral|Semestral|Anual|Economia/)).not.toBeInTheDocument();
  });

  it("marca o plano recebido e avisa a escolha com o tipo numérico", () => {
    const onChange = vi.fn();
    renderWithTheme(<PlanoStepFields plano={1} onChange={onChange} />);

    expect(screen.getByRole("radio", { name: /Mensal/ })).toBeChecked();
    fireEvent.click(screen.getByRole("radio", { name: /Teste grátis/ }));
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it("mostra o erro em role alert", () => {
    renderWithTheme(<PlanoStepFields plano={undefined} onChange={() => {}} error="Escolha um plano para continuar." />);
    expect(screen.getByRole("alert")).toHaveTextContent("Escolha um plano para continuar.");
  });

  it("lista as 13 áreas do sistema como incluídas no plano", () => {
    renderWithTheme(<PlanoStepFields plano={undefined} onChange={() => {}} />);
    const bloco = screen.getByRole("region", { name: "Tudo isso incluso no plano" });

    expect(within(bloco).getAllByRole("listitem")).toHaveLength(13);
    expect(within(bloco).getByText("Quadro de chaves")).toBeInTheDocument();
    expect(within(bloco).getByText("Cada chave no seu gancho, com o gancho livre sugerido na entrada.")).toBeInTheDocument();
    expect(within(bloco).queryByText(/Relatórios|avarias/)).not.toBeInTheDocument();
  });
});
