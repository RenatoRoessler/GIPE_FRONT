import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import { ColorSwatchGroup } from "./ColorSwatchGroup";

const options = [
  { value: "PRATA", label: "Prata", color: "#C3C7CC" },
  { value: "AZUL", label: "Azul", color: "#1F4FD6" },
];

describe("ColorSwatchGroup", () => {
  it("mostra o nome da cor selecionada em texto", () => {
    renderWithTheme(<ColorSwatchGroup legend="Cor" options={options} value="AZUL" onChange={() => {}} />);
    expect(screen.getByRole("radio", { name: "Azul" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Prata" })).not.toBeChecked();
    expect(screen.getAllByText("Azul").length).toBeGreaterThan(0);
    expect(screen.getByRole("group", { name: /^Cor/ })).toBeInTheDocument();
  });

  it("chama onChange ao escolher outra cor", () => {
    const onChange = vi.fn();
    renderWithTheme(<ColorSwatchGroup legend="Cor" options={options} value="PRATA" onChange={onChange} />);
    fireEvent.click(screen.getByRole("radio", { name: "Azul" }));
    expect(onChange).toHaveBeenCalledWith("AZUL");
  });

  it("desabilita as opções", () => {
    renderWithTheme(<ColorSwatchGroup legend="Cor" options={options} value="PRATA" onChange={() => {}} disabled />);
    expect(screen.getByRole("radio", { name: "Azul" })).toBeDisabled();
  });

  it("exibe o erro como alerta", () => {
    renderWithTheme(<ColorSwatchGroup legend="Cor" options={options} value="" onChange={() => {}} error="Selecione a cor" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Selecione a cor");
  });

  it("mostra o texto de apoio, que cede lugar ao erro", () => {
    const { rerender } = renderWithTheme(<ColorSwatchGroup legend="Cor" options={options} value="" onChange={() => {}} hint="Cor no cadastro: rosa" />);
    expect(screen.getByText("Cor no cadastro: rosa")).toBeInTheDocument();
    rerender(<ColorSwatchGroup legend="Cor" options={options} value="" onChange={() => {}} hint="Cor no cadastro: rosa" error="Selecione a cor" />);
    expect(screen.queryByText("Cor no cadastro: rosa")).not.toBeInTheDocument();
  });
});
