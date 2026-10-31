import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import { CredencialDados, CredencialEmpresa } from "./CredencialEmpresa";

const DIAS: CredencialDados["dias"] = [
  { sigla: "D", nome: "Domingo", estado: "fechado" },
  { sigla: "S", nome: "Segunda-feira", estado: "aberto" },
  { sigla: "S", nome: "Sábado", estado: "24h" },
];

const VAZIA: CredencialDados = { dias: DIAS, pagamentos: [] };

const PREENCHIDA: CredencialDados = {
  nome: "Central",
  cnpj: "11.222.333/0001-81",
  tipo: "Estacionamento",
  vagasCarro: 80,
  vagasMoto: 20,
  dias: DIAS,
  pagamentos: ["Dinheiro", "Pix"],
};

describe("CredencialEmpresa", () => {
  it("é uma região rotulada e não anuncia mudanças", () => {
    renderWithTheme(<CredencialEmpresa dados={VAZIA} />);
    const regiao = screen.getByRole("region", { name: "Resumo da credencial" });
    expect(regiao).not.toHaveAttribute("aria-live");
  });

  it("mostra traço nos campos vazios, sem valores falsos", () => {
    renderWithTheme(<CredencialEmpresa dados={VAZIA} />);
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText("— CARROS")).toBeInTheDocument();
    expect(screen.getByText("Pagamentos: —")).toBeInTheDocument();
  });

  it("mostra os dados preenchidos", () => {
    renderWithTheme(<CredencialEmpresa dados={PREENCHIDA} />);
    expect(screen.getByText("Central")).toBeInTheDocument();
    expect(screen.getByText("11.222.333/0001-81")).toBeInTheDocument();
    expect(screen.getByText("80 CARROS")).toBeInTheDocument();
    expect(screen.getByText("20 MOTOS")).toBeInTheDocument();
    expect(screen.getByText("Pagamentos: Dinheiro · Pix")).toBeInTheDocument();
  });

  it("descreve o estado de cada dia por texto", () => {
    renderWithTheme(<CredencialEmpresa dados={PREENCHIDA} />);
    expect(screen.getByLabelText("Domingo: fechado")).toBeInTheDocument();
    expect(screen.getByLabelText("Sábado: aberto 24 horas")).toHaveTextContent("24");
  });

  it("na variante compacta mostra só o nome e abre a credencial completa", async () => {
    const onAbrir = vi.fn();
    renderWithTheme(<CredencialEmpresa dados={VAZIA} variant="compacta" onAbrir={onAbrir} />);
    expect(screen.getByText("Sua empresa")).toBeInTheDocument();
    expect(screen.queryByText("CNPJ")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Ver credencial" }));
    expect(onAbrir).toHaveBeenCalledOnce();
  });
});
