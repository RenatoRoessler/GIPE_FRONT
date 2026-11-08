import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithTheme } from "@/test/render";
import { item } from "../fixtures";
import { SaidaCard } from "./SaidaCard";

function renderizar(extra: Parameters<typeof item>[0] = {}) {
  return renderWithTheme(
    <ul>
      <SaidaCard item={item(extra)} />
    </ul>,
  );
}

describe("SaidaCard", () => {
  it("mostra todos os dados da saída", () => {
    renderizar();

    expect(screen.getByText("YCC3U07")).toBeInTheDocument();
    expect(screen.getByText("FUSION · Carro médio")).toBeInTheDocument();
    expect(screen.getByText("07/11/2026, 08:10 → 07/11/2026, 17:40 · 9h 30min")).toBeInTheDocument();
    expect(screen.getByText("Tabela convênio · 50%")).toBeInTheDocument();
    expect(screen.getByText("Total R$ 30,00 · Cliente R$ 15,00")).toBeInTheDocument();
  });

  it("destaca o valor da conveniada com o rótulo escrito", () => {
    renderizar({ valorConveniada: 1235 });

    expect(screen.getByText("R$ 1.235,00")).toBeInTheDocument();
    expect(screen.getByText("da conveniada")).toBeInTheDocument();
  });

  it("regra de valor fixo e saída sem modelo nem tabela", () => {
    renderizar({ modelo: null, rotatividade: null, percentualConveniada: null, valorFixoConveniada: 12, categoria: 2 });

    expect(screen.getByText("Carro pequeno")).toBeInTheDocument();
    expect(screen.getByText("R$ 12,00 fixo")).toBeInTheDocument();
  });

  it("não é interativo: sem links nem botões", () => {
    renderizar();

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
