import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import type { EmpresaOpcao } from "@/types/auth";
import { EscolherEmpresa } from "./EscolherEmpresa";

vi.mock("@/contexts/ThemeModeContext", () => ({ useThemeMode: () => ({ mode: "light", toggleThemeMode: vi.fn() }) }));

const empresas: EmpresaOpcao[] = [
  { id: "guid-a", nome: "Central", cnpj: "11222333000181", perfil: 1, perfilDescricao: "Administrador" },
  { id: "guid-b", nome: "Filial Norte", cnpj: "" },
];

function renderizar(props: Partial<React.ComponentProps<typeof EscolherEmpresa>> = {}) {
  const onEscolher = vi.fn();
  const onVoltar = vi.fn();
  const view = renderWithTheme(<EscolherEmpresa empresas={empresas} onEscolher={onEscolher} onVoltar={onVoltar} {...props} />);
  return { onEscolher, onVoltar, ...view };
}

describe("EscolherEmpresa", () => {
  it("mostra o título e uma lista com um botão por empresa, com nome e CNPJ com máscara", () => {
    renderizar();

    expect(screen.getByRole("heading", { name: "Escolha a empresa" })).toBeInTheDocument();
    const itens = within(screen.getByRole("list", { name: "Empresas disponíveis" })).getAllByRole("listitem");
    expect(itens).toHaveLength(2);
    expect(itens[0]).toHaveTextContent("Central");
    expect(itens[0]).toHaveTextContent("11.222.333/0001-81 · Administrador");
    expect(itens[1]).toHaveTextContent("Filial Norte");
    expect(itens[1]).toHaveTextContent("CNPJ não informado");
    expect(itens[1]).not.toHaveTextContent("·");
  });

  it("cada botão tem o nome acessível 'Entrar em {empresa}, CNPJ {número}'", () => {
    renderizar();

    expect(screen.getByRole("button", { name: "Entrar em Central, CNPJ 11.222.333/0001-81" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Entrar em Filial Norte" })).toBeInTheDocument();
  });

  it("tocar na empresa chama onEscolher com o id dela", async () => {
    const { onEscolher } = renderizar();

    await userEvent.click(screen.getByRole("button", { name: /Entrar em Filial Norte/ }));

    expect(onEscolher).toHaveBeenCalledTimes(1);
    expect(onEscolher).toHaveBeenCalledWith("guid-b");
  });

  it("enquanto entra, a empresa tocada mostra 'Entrando…' e todas ficam desabilitadas", () => {
    renderizar({ pendenteId: "guid-a" });

    const central = screen.getByRole("button", { name: /Entrar em Central/ });
    expect(central).toHaveTextContent("Entrando…");
    expect(central).toHaveAttribute("aria-busy", "true");
    expect(central).toBeDisabled();
    expect(screen.getByRole("button", { name: /Entrar em Filial Norte/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Entrar em Filial Norte/ })).toHaveAttribute("aria-busy", "false");
  });

  it("mostra o erro em alert e mantém a lista clicável para tentar de novo", () => {
    renderizar({ error: "Não foi possível conectar ao servidor." });

    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível conectar ao servidor.");
    expect(screen.getByRole("button", { name: /Entrar em Central/ })).toBeEnabled();
  });

  it("escolha expirada troca a lista por 'Voltar ao login'", async () => {
    const { onVoltar } = renderizar({ expirada: true, error: "Sua escolha expirou. Entre novamente." });

    expect(screen.getByRole("alert")).toHaveTextContent("Sua escolha expirou. Entre novamente.");
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Entrar em/ })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Voltar ao login" }));
    expect(onVoltar).toHaveBeenCalledTimes(1);
  });

  it("o link Voltar chama onVoltar sem navegar", async () => {
    const { onVoltar } = renderizar();

    await userEvent.click(screen.getByRole("link", { name: "Voltar" }));

    expect(onVoltar).toHaveBeenCalledTimes(1);
  });

  it("os botões da lista são alcançáveis pelo teclado, na ordem da lista", async () => {
    const user = userEvent.setup();
    const { onEscolher } = renderizar();

    await user.tab();
    expect(screen.getByRole("button", { name: /Entrar em Central/ })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: /Entrar em Filial Norte/ })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onEscolher).toHaveBeenCalledWith("guid-b");
  });
});
