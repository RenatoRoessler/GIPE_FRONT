import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import type { MensalistaVeiculo } from "@/types/mensalista";
import { VeiculosResumo } from "./VeiculosResumo";

const veiculo = (placa: string): MensalistaVeiculo => ({ placa, modelo: "Gol", cor: "PRATA", categoria: 2, condutores: [] });
const tres = [veiculo("ABC1D23"), veiculo("BRA2E19"), veiculo("XYZ9K88")];

function celular(ativo: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: ativo,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("VeiculosResumo", () => {
  it("no computador mostra duas placas e o +N das demais", () => {
    celular(false);
    renderWithTheme(<VeiculosResumo veiculos={tres} nome="Maria" onAbrir={() => {}} />);

    expect(screen.getByText("ABC1D23")).toBeInTheDocument();
    expect(screen.getByText("BRA2E19")).toBeInTheDocument();
    expect(screen.queryByText("XYZ9K88")).not.toBeInTheDocument();
    expect(screen.getByText("+1")).toBeInTheDocument();
  });

  it("no celular mostra uma placa e o +N de todas as outras", () => {
    celular(true);
    renderWithTheme(<VeiculosResumo veiculos={tres} nome="Maria" onAbrir={() => {}} />);

    expect(screen.getByText("ABC1D23")).toBeInTheDocument();
    expect(screen.queryByText("BRA2E19")).not.toBeInTheDocument();
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("no celular, com um veículo só, não há +N", () => {
    celular(true);
    renderWithTheme(<VeiculosResumo veiculos={[veiculo("ABC1D23")]} nome="Maria" onAbrir={() => {}} />);

    expect(screen.getByText("ABC1D23")).toBeInTheDocument();
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });

  it("o botão abre a ficha, em qualquer largura", async () => {
    celular(true);
    const onAbrir = vi.fn();
    renderWithTheme(<VeiculosResumo veiculos={tres} nome="Maria" onAbrir={onAbrir} />);

    await userEvent.click(screen.getByRole("button", { name: "Ver veículos de Maria" }));
    expect(onAbrir).toHaveBeenCalled();
  });
});
