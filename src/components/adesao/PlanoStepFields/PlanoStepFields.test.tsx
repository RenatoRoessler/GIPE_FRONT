import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import { PlanoStepFields } from "./PlanoStepFields";

describe("PlanoStepFields", () => {
  it("mostra os quatro planos na ordem, sem nenhum selecionado", () => {
    renderWithTheme(<PlanoStepFields plano={undefined} onChange={() => {}} />);
    const radios = screen.getAllByRole("radio");

    expect(radios).toHaveLength(4);
    expect(radios.map((radio) => radio.getAttribute("value"))).toEqual(["1", "2", "3", "4"]);
    radios.forEach((radio) => expect(radio).not.toBeChecked());
  });

  it("mostra valor por mês, total e economia de cada plano", () => {
    renderWithTheme(<PlanoStepFields plano={undefined} onChange={() => {}} />);

    expect(screen.getByRole("radio", { name: /Mensal/ })).toHaveAccessibleName(
      expect.stringContaining("R$ 149,90"),
    );
    expect(screen.getByRole("radio", { name: /Trimestral/ })).toHaveAccessibleName(
      expect.stringContaining("R$ 404,70 por 3 meses"),
    );
    expect(screen.getByRole("radio", { name: /Semestral/ })).toHaveAccessibleName(
      expect.stringContaining("Economia de R$ 180,00 (20%)"),
    );
    expect(screen.getByRole("radio", { name: /Anual/ })).toHaveAccessibleName(
      expect.stringContaining("R$ 958,80 em uma cobrança única"),
    );
  });

  it("não mostra economia no Mensal", () => {
    renderWithTheme(<PlanoStepFields plano={undefined} onChange={() => {}} />);
    expect(screen.getByRole("radio", { name: /Mensal/ })).not.toHaveAccessibleName(
      expect.stringContaining("Economia"),
    );
    expect(screen.getAllByText(/^Economia de/)).toHaveLength(3);
  });

  it("mostra o selo só no Anual", () => {
    renderWithTheme(<PlanoStepFields plano={undefined} onChange={() => {}} />);
    expect(screen.getAllByText("Mais econômico")).toHaveLength(1);
    expect(screen.getByRole("radio", { name: /Anual/ })).toHaveAccessibleName(
      expect.stringContaining("Mais econômico"),
    );
  });

  it("marca o plano recebido e avisa a escolha com o tipo numérico", () => {
    const onChange = vi.fn();
    renderWithTheme(<PlanoStepFields plano={3} onChange={onChange} />);

    expect(screen.getByRole("radio", { name: /Semestral/ })).toBeChecked();
    fireEvent.click(screen.getByRole("radio", { name: /Anual/ }));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("mostra o erro em role alert", () => {
    renderWithTheme(<PlanoStepFields plano={undefined} onChange={() => {}} error="Escolha um plano para continuar." />);
    expect(screen.getByRole("alert")).toHaveTextContent("Escolha um plano para continuar.");
  });

  it("lista as 13 áreas do sistema como valendo em todos os planos", () => {
    renderWithTheme(<PlanoStepFields plano={undefined} onChange={() => {}} />);
    const bloco = screen.getByRole("region", { name: "Tudo isso em todos os planos" });

    expect(within(bloco).getAllByRole("listitem")).toHaveLength(13);
    expect(within(bloco).getByText("Quadro de chaves")).toBeInTheDocument();
    expect(within(bloco).getByText("Cada chave no seu gancho, com o gancho livre sugerido na entrada.")).toBeInTheDocument();
    expect(within(bloco).queryByText(/Relatórios|avarias/)).not.toBeInTheDocument();
  });
});
