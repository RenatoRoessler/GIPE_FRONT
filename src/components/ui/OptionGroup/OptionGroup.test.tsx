import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import { OptionGroup } from "./OptionGroup";

const options = [
  { value: "1", label: "Dinheiro", icon: <svg data-testid="icone-dinheiro" /> },
  { value: "2", label: "Crédito" },
  { value: "3", label: "Débito" },
  { value: "4", label: "Pix" },
];

describe("OptionGroup", () => {
  it("expõe o grupo pela legenda e marca a opção selecionada", () => {
    renderWithTheme(<OptionGroup legend="Forma de pagamento" options={options} value="2" onChange={() => {}} />);
    expect(screen.getByRole("group", { name: "Forma de pagamento" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Crédito" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Dinheiro" })).not.toBeChecked();
  });

  it("chama onChange ao clicar em uma opção", () => {
    const onChange = vi.fn();
    renderWithTheme(<OptionGroup legend="Forma" options={options} value="1" onChange={onChange} />);
    fireEvent.click(screen.getByRole("radio", { name: "Pix" }));
    expect(onChange).toHaveBeenCalledWith("4");
  });

  it("navega entre as opções com as setas", async () => {
    const onChange = vi.fn();
    renderWithTheme(<OptionGroup legend="Forma" options={options} value="1" onChange={onChange} />);
    screen.getByRole("radio", { name: "Dinheiro" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenCalledWith("2");
  });

  it("desabilita as opções", () => {
    renderWithTheme(<OptionGroup legend="Forma" options={options} value="1" onChange={() => {}} disabled />);
    expect(screen.getByRole("radio", { name: "Pix" })).toBeDisabled();
  });

  it("mantém o ícone fora do nome acessível", () => {
    renderWithTheme(<OptionGroup legend="Forma" options={options} value="1" onChange={() => {}} />);
    expect(screen.getByTestId("icone-dinheiro").closest("[aria-hidden='true']")).not.toBeNull();
    expect(screen.getByRole("radio", { name: "Dinheiro" })).toBeInTheDocument();
  });

  it("fixa o número de colunas quando informado", () => {
    renderWithTheme(<OptionGroup legend="Forma" options={options} value="1" onChange={() => {}} columns={4} />);
    const grid = screen.getByRole("radio", { name: "Pix" }).closest("label")!.parentElement!;
    expect(getComputedStyle(grid).gridTemplateColumns).toBe("repeat(4, minmax(0, 1fr))");
  });

  it("exibe o erro como alerta", () => {
    renderWithTheme(<OptionGroup legend="Forma" options={options} value="" onChange={() => {}} error="Selecione" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Selecione");
  });
});

describe("OptionGroup variante card", () => {
  const cartoes = [
    { value: "1", label: "Mensal", aside: "R$ 149,90", detail: "Cobrado todo mês" },
    { value: "4", label: "Anual", aside: "R$ 79,90", detail: "Economia de R$ 840,00", badge: "Mais econômico" },
  ];

  it("inclui valor, detalhe e selo de texto no nome acessível da opção", () => {
    renderWithTheme(<OptionGroup legend="Plano" options={cartoes} value="" onChange={() => {}} variant="card" />);
    const anual = screen.getByRole("radio", { name: /Anual/ });
    expect(anual).toHaveAccessibleName(expect.stringContaining("R$ 79,90"));
    expect(anual).toHaveAccessibleName(expect.stringContaining("Economia de R$ 840,00"));
    expect(anual).toHaveAccessibleName(expect.stringContaining("Mais econômico"));
    expect(screen.getByRole("radio", { name: /Mensal/ })).not.toHaveAccessibleName(
      expect.stringContaining("Mais econômico"),
    );
  });

  it("seleciona por clique e por setas", async () => {
    const onChange = vi.fn();
    renderWithTheme(<OptionGroup legend="Plano" options={cartoes} value="1" onChange={onChange} variant="card" />);
    fireEvent.click(screen.getByRole("radio", { name: /Anual/ }));
    expect(onChange).toHaveBeenCalledWith("4");
    onChange.mockClear();
    screen.getByRole("radio", { name: /Mensal/ }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenCalledWith("4");
  });

  it("mostra o erro com role alert", () => {
    renderWithTheme(
      <OptionGroup
        legend="Plano"
        options={cartoes}
        value=""
        onChange={() => {}}
        variant="card"
        error="Escolha um plano para continuar."
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Escolha um plano para continuar.");
  });
});
