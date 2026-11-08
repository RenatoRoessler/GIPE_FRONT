import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { navItemsPermitidos, ordenarPeloMenu, type NavItem } from "@/lib/nav";
import { renderWithTheme } from "@/test/render";
import { MenuSheet } from "./MenuSheet";

// Fechado, o painel é escondido pelo navegador e fora da árvore de acessibilidade.
const opcoes = { hidden: true } as const;

const onRequestClose = vi.fn();
const onAction = vi.fn();

function renderizar(itens: NavItem[], pathname = "/dashboard") {
  return renderWithTheme(
    <MenuSheet id="painel" dialogRef={createRef<HTMLDialogElement>()} pathname={pathname} itens={itens} onRequestClose={onRequestClose} onAction={onAction} onClosed={() => undefined} />,
  );
}

const grupo = (titulo: string) => within(screen.getByRole("list", { name: titulo, ...opcoes }));
const nomesDoGrupo = (titulo: string) => grupo(titulo).getAllByRole("listitem", opcoes).map((item) => item.textContent);

// O que a barra de cinco posições deixa para o painel: tudo menos Pátio, Caixa, Entrada e Saída.
const doAdministrador = () => ordenarPeloMenu(navItemsPermitidos(1).filter((item) => !["Pátio", "Caixa", "Entrada de Veículos", "Saída de Veículos"].includes(item.label)));

beforeEach(() => {
  onRequestClose.mockReset();
  onAction.mockReset();
});

describe("MenuSheet: grupos", () => {
  it("mostra a Visão Geral sem grupo e, depois, Operação, Financeiro e Configurações com os itens que não estão na barra", () => {
    renderizar(doAdministrador());

    const nav = screen.getByRole("navigation", { name: "Outras telas", ...opcoes });
    expect(within(nav).getAllByRole("listitem", opcoes)[0]).toHaveTextContent("Visão Geral");
    expect(nomesDoGrupo("Operação")).toEqual(["Conferência de pátio"]);
    expect(nomesDoGrupo("Financeiro")).toEqual(["Financeiro", "Faturas", "Notas Fiscais"]);
    expect(nomesDoGrupo("Configurações")).toEqual(["Minha Empresa", "Gestão de Preços", "Quadros de Chaves", "Mensalistas", "Gestão de Usuários", "Empresas conveniadas"]);
  });

  it("os títulos aparecem na ordem do menu e não são cabeçalhos", () => {
    renderizar(doAdministrador());

    const titulos = Array.from(document.querySelectorAll("section > p")).map((titulo) => titulo.textContent);
    expect(titulos).toEqual(["Operação", "Financeiro", "Configurações"]);
    expect(screen.queryAllByRole("heading", { level: 3, ...opcoes })).toHaveLength(0);
  });

  it("não repete na lista os itens que já estão na barra", () => {
    renderizar(doAdministrador());

    for (const nome of ["Caixa", "Pátio", "Entrada de Veículos", "Saída de Veículos"]) {
      expect(screen.queryByText(nome)).not.toBeInTheDocument();
    }
  });

  it("grupo sem nenhum item no painel não aparece", () => {
    const soConfiguracoes = doAdministrador().filter((item) => item.grupo === "configuracoes");
    renderizar(soConfiguracoes);

    expect(screen.getByRole("list", { name: "Configurações", ...opcoes })).toBeInTheDocument();
    expect(screen.queryByText("Financeiro")).not.toBeInTheDocument();
    expect(screen.queryByText("Operação")).not.toBeInTheDocument();
  });

  it("itens da conveniada aparecem numa lista simples, sem título", () => {
    renderizar(navItemsPermitidos(5), "/carimbo");

    const nav = screen.getByRole("navigation", { name: "Outras telas", ...opcoes });
    expect(within(nav).getAllByRole("listitem", opcoes).map((item) => item.textContent)).toEqual(["Carimbar ticket", "Pátio da conveniada"]);
    expect(document.querySelectorAll("section > p")).toHaveLength(0);
    expect(within(nav).getAllByRole("list", opcoes)[0]).not.toHaveAttribute("aria-labelledby");
  });

  it("Entrada e Saída, quando estão no painel, ficam em Operação e abrem o modal", async () => {
    renderizar(navItemsPermitidos(8).concat(navItemsPermitidos(1).filter((item) => item.label === "Entrada de Veículos")));
    const user = userEvent.setup();

    expect(nomesDoGrupo("Operação")).toEqual(["Entrada de Veículos"]);
    await user.click(grupo("Operação").getByRole("button", { name: /Entrada de Veículos/, ...opcoes }));
    expect(onAction).toHaveBeenCalledWith("entrada");
  });

  it("marca a tela atual dentro do seu grupo e tocar numa tela fecha o painel", async () => {
    renderizar(doAdministrador(), "/faturas/12");
    const user = userEvent.setup();

    const faturas = grupo("Financeiro").getByRole("link", { name: /Faturas/, ...opcoes });
    expect(faturas).toHaveAttribute("aria-current", "page");
    expect(grupo("Operação").queryByRole("link", { current: "page", ...opcoes })).not.toBeInTheDocument();
    await user.click(faturas);
    expect(onRequestClose).toHaveBeenCalledTimes(1);
  });

  it("sem itens não mostra grupo nenhum", () => {
    renderizar([]);

    expect(screen.queryAllByRole("list", opcoes)).toHaveLength(0);
  });
});
