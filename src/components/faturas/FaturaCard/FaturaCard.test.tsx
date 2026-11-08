import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithTheme } from "@/test/render";
import { SITUACAO_FATURA } from "@/types/fatura";
import { fatura } from "../fixtures";
import { FaturaCard } from "./FaturaCard";

const HOJE = "2026-11-08";

function renderizar(extra: Parameters<typeof fatura>[0] = {}) {
  return renderWithTheme(
    <ul>
      <FaturaCard fatura={fatura({ quantidadeSaidas: 14, ...extra })} hoje={HOJE} />
    </ul>,
  );
}

describe("FaturaCard", () => {
  it("mostra número, conveniada, valor, situação, vencimento e apoio", () => {
    renderizar({ vencimento: "2026-12-08" });
    expect(screen.getByText("#12")).toBeInTheDocument();
    expect(screen.getByText("Auto Peças Sul")).toBeInTheDocument();
    expect(screen.getByText("R$ 1.250,00")).toBeInTheDocument();
    expect(screen.getByText("Aberta")).toBeInTheDocument();
    expect(screen.getByText("Vence em 08/12/2026")).toBeInTheDocument();
    expect(screen.getByText("14 saídas · emitida 08/11")).toBeInTheDocument();
  });

  it("o número é o link para o detalhe, com nome acessível completo", () => {
    renderizar({ vencimento: "2026-11-10" });
    const link = screen.getByRole("link", { name: "Fatura 12, Auto Peças Sul, R$ 1.250,00, aberta, vence em 2 dias · 10/11" });
    expect(link).toHaveAttribute("href", "/faturas/12");
  });

  it("aberta vencida mostra o aviso de vencida", () => {
    renderizar({ vencimento: "2026-11-05" });
    expect(screen.getByText("Vencida há 3 dias")).toBeInTheDocument();
  });

  it("aberta que vence hoje mostra o aviso", () => {
    renderizar({ vencimento: HOJE });
    expect(screen.getByText("Vence hoje")).toBeInTheDocument();
  });

  it("paga mostra o vencimento sem destaque", () => {
    renderizar({ situacao: SITUACAO_FATURA.Paga, vencimento: "2026-11-01" });
    expect(screen.getByText("Paga")).toBeInTheDocument();
    expect(screen.getByText("Vencimento 01/11/2026")).toBeInTheDocument();
    expect(screen.queryByText(/Vencida/)).not.toBeInTheDocument();
  });

  it("cancelada mostra a situação em texto, o valor riscado e o vencimento neutro", () => {
    renderizar({ situacao: SITUACAO_FATURA.Cancelada, vencimento: "2026-11-01" });
    expect(screen.getByText("Cancelada")).toBeInTheDocument();
    expect(screen.getByText("R$ 1.250,00")).toHaveStyle({ textDecoration: "line-through" });
    expect(screen.getByText("Vencimento 01/11/2026")).toBeInTheDocument();
  });

  it("concorda o singular da quantidade de saídas", () => {
    renderizar({ quantidadeSaidas: 1 });
    expect(screen.getByText("1 saída · emitida 08/11")).toBeInTheDocument();
  });
});
