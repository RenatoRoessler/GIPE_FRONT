import { describe, expect, it } from "vitest";
import type { Usuario } from "@/types/usuario";
import { ehUltimoAdminAtivo } from "./ultimoAdmin";

function usuario(id: number, perfil: number, ativo = true): Usuario {
  return {
    usuarioId: id,
    cpf: "11011954010",
    nome: `Usuário ${id}`,
    email: `u${id}@exemplo.com`,
    celular: "54996384949",
    perfil,
    perfilDescricao: "",
    ativo,
    trocarSenha: false,
    dataCriacao: "2026-10-08T16:54:36.990448",
  };
}

describe("ehUltimoAdminAtivo", () => {
  it("é verdadeiro para o único Administrador ativo", () => {
    const admin = usuario(1, 1);
    expect(ehUltimoAdminAtivo(admin, [admin, usuario(2, 4)])).toBe(true);
  });

  it("é falso com outro Administrador ativo", () => {
    const admin = usuario(1, 1);
    expect(ehUltimoAdminAtivo(admin, [admin, usuario(2, 1)])).toBe(false);
  });

  it("outro Administrador inativo não conta", () => {
    const admin = usuario(1, 1);
    expect(ehUltimoAdminAtivo(admin, [admin, usuario(2, 1, false)])).toBe(true);
  });

  it("é falso para Administrador inativo e para outros perfis", () => {
    const inativo = usuario(1, 1, false);
    const caixa = usuario(2, 4);
    expect(ehUltimoAdminAtivo(inativo, [inativo, caixa])).toBe(false);
    expect(ehUltimoAdminAtivo(caixa, [inativo, caixa])).toBe(false);
  });

  it("lista vazia: o próprio usuário é o único", () => {
    expect(ehUltimoAdminAtivo(usuario(1, 1), [])).toBe(true);
  });
});
