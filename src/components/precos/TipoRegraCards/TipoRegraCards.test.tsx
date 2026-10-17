import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import { TipoRegraCards } from "./TipoRegraCards";

describe("TipoRegraCards", () => {
  it("expõe o grupo pela legenda, com a frase de cada tipo, e marca o selecionado", () => {
    renderWithTheme(<TipoRegraCards value="2" onChange={() => {}} />);
    expect(screen.getByRole("group", { name: "Tipo de regra" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /^Convênio/ })).toBeChecked();
    expect(screen.getByRole("radio", { name: /^Padrão/ })).not.toBeChecked();
    expect(screen.getByText("Para dias específicos, como jogos e shows.")).toBeInTheDocument();
  });

  it("devolve o valor do tipo escolhido como texto", () => {
    const onChange = vi.fn();
    renderWithTheme(<TipoRegraCards value="1" onChange={onChange} />);
    fireEvent.click(screen.getByRole("radio", { name: /^Evento/ }));
    expect(onChange).toHaveBeenCalledWith("4");
  });

  it("desabilitado não aceita escolha", () => {
    renderWithTheme(<TipoRegraCards value="1" onChange={() => {}} disabled />);
    expect(screen.getByRole("radio", { name: /^Evento/ })).toBeDisabled();
  });

  it("mostra o erro de validação", () => {
    renderWithTheme(<TipoRegraCards value="" onChange={() => {}} error="Selecione o tipo de regra" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Selecione o tipo de regra");
  });
});
