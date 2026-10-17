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
