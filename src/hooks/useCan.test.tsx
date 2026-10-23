import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AREA } from "@/lib/permissoes";

const sessao = vi.hoisted(() => ({
  atual: { user: null as { name: string; perfil: number | null } | null, isLoading: false },
}));
vi.mock("@/contexts/CurrentUserContext", () => ({ useCurrentUser: () => sessao.atual }));

import { useCan } from "./useCan";

function pode(area: Parameters<typeof useCan>[0]) {
  return renderHook(() => useCan(area)).result.current;
}

describe("useCan", () => {
  beforeEach(() => {
    sessao.atual = { user: { name: "Maria", perfil: 1 }, isLoading: false };
  });

  it("libera a área que o perfil permite", () => {
    expect(pode(AREA.CaixaSangria)).toBe(true);
    sessao.atual = { user: { name: "Caio", perfil: 4 }, isLoading: false };
    expect(pode(AREA.CaixaSangria)).toBe(true);
  });

  it("bloqueia a área que o perfil não permite", () => {
    sessao.atual = { user: { name: "Joao", perfil: 3 }, isLoading: false };
    expect(pode(AREA.CaixaSangria)).toBe(false);
    sessao.atual = { user: { name: "Caio", perfil: 4 }, isLoading: false };
    expect(pode(AREA.CaixaHistorico)).toBe(false);
    sessao.atual = { user: { name: "Ana", perfil: 8 }, isLoading: false };
    expect(pode(AREA.Patio)).toBe(false);
  });

  it("perfil desconhecido só tem o início", () => {
    sessao.atual = { user: { name: "Zé", perfil: null }, isLoading: false };
    expect(pode(AREA.Inicio)).toBe(true);
    expect(pode(AREA.Caixa)).toBe(false);
  });

  it("sem usuário bloqueia", () => {
    sessao.atual = { user: null, isLoading: false };
    expect(pode(AREA.Caixa)).toBe(false);
  });

  it("enquanto carrega, bloqueia tudo, até o que o perfil permite", () => {
    sessao.atual = { user: { name: "Maria", perfil: 1 }, isLoading: true };
    expect(pode(AREA.CaixaSangria)).toBe(false);
  });
});
