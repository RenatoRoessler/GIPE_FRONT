import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PERFIL_USUARIO } from "@/types/usuario";
import { renderWithTheme } from "@/test/render";

const sessao = vi.hoisted(() => ({
  atual: { user: null, isLoading: false } as { user: { name: string; perfil: number | null } | null; isLoading: boolean },
}));
vi.mock("@/contexts/CurrentUserContext", () => ({ useCurrentUser: () => sessao.atual }));

const caixa = vi.hoisted(() => ({
  estado: { aberto: true, carregando: false, erro: false },
  useCaixaAberto: vi.fn(),
}));
vi.mock("@/components/caixa/useCaixa", () => ({ useCaixaAberto: caixa.useCaixaAberto }));

import { MenuUsuario } from "./MenuUsuario";

beforeEach(() => {
  sessao.atual = { user: { name: "Everton Lima", perfil: PERFIL_USUARIO.Administrador }, isLoading: false };
  caixa.estado = { aberto: true, carregando: false, erro: false };
  caixa.useCaixaAberto.mockReset().mockImplementation(() => caixa.estado);
});

describe("MenuUsuario", () => {
  it("mostra as iniciais, o nome, o perfil e o caixa aberto", () => {
    renderWithTheme(<MenuUsuario />);

    expect(screen.getByText("EL")).toBeInTheDocument();
    expect(screen.getByText("Everton Lima")).toBeInTheDocument();
    expect(screen.getByText("Administrador")).toBeInTheDocument();
    expect(screen.getByText("Caixa aberto")).toBeInTheDocument();
  });

  it("com o caixa fechado, diz que está fechado", () => {
    caixa.estado = { aberto: false, carregando: false, erro: false };
    renderWithTheme(<MenuUsuario />);
    expect(screen.getByText("Caixa fechado")).toBeInTheDocument();
    expect(screen.queryByText("Caixa aberto")).not.toBeInTheDocument();
  });

  it("enquanto carrega o caixa, mostra o esqueleto no lugar da situação", () => {
    caixa.estado = { aberto: false, carregando: true, erro: false };
    renderWithTheme(<MenuUsuario />);
    expect(screen.queryByText(/Caixa (aberto|fechado)/)).not.toBeInTheDocument();
    expect(screen.getByText("Administrador")).toBeInTheDocument();
  });

  it("se a consulta do caixa falhar, só a situação some", () => {
    caixa.estado = { aberto: false, carregando: false, erro: true };
    renderWithTheme(<MenuUsuario />);
    expect(screen.getByText("Everton Lima")).toBeInTheDocument();
    expect(screen.getByText("Administrador")).toBeInTheDocument();
    expect(screen.queryByText(/Caixa (aberto|fechado)/)).not.toBeInTheDocument();
  });

  it("perfil com acesso ao caixa consulta a situação dele", () => {
    renderWithTheme(<MenuUsuario />);
    expect(caixa.useCaixaAberto).toHaveBeenCalledWith({ enabled: true });
  });

  it("perfil sem acesso ao caixa não consulta nem mostra a situação", () => {
    sessao.atual = { user: { name: "Lia Gomes", perfil: PERFIL_USUARIO.Lavador }, isLoading: false };
    renderWithTheme(<MenuUsuario />);

    expect(caixa.useCaixaAberto).toHaveBeenCalledWith({ enabled: false });
    expect(screen.getByText("Lia Gomes")).toBeInTheDocument();
    expect(screen.getByText("Lavador")).toBeInTheDocument();
    expect(screen.queryByText(/Caixa (aberto|fechado)/)).not.toBeInTheDocument();
  });

  it("perfil desconhecido mostra só o nome", () => {
    sessao.atual = { user: { name: "Zé", perfil: null }, isLoading: false };
    renderWithTheme(<MenuUsuario />);
    expect(screen.getByText("Zé")).toBeInTheDocument();
    expect(screen.getByLabelText("Usuário logado")).not.toHaveTextContent("Perfil");
  });

  it("sem usuário não mostra nada", () => {
    sessao.atual = { user: null, isLoading: false };
    const { container } = renderWithTheme(<MenuUsuario />);
    expect(container).toBeEmptyDOMElement();
  });
});
