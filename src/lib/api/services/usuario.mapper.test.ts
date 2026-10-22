import { describe, expect, it } from "vitest";
import {
  fromCpfConsultaResponse,
  fromNovoUsuarioResponse,
  fromUsuarioResponse,
  toNovoUsuarioPayload,
} from "./usuario.mapper";

describe("usuario.mapper", () => {
  it("lê a resposta completa de um usuário", () => {
    const usuario = fromUsuarioResponse({
      usuarioId: 26,
      cpf: "11011954010",
      nome: "renato teste",
      email: "renatoroessler@gmail.com",
      celular: "54996384949",
      perfil: 1,
      perfilDescricao: "Administrador",
      ativo: true,
      trocarSenha: false,
      dataCriacao: "2026-10-08T16:54:36.990448",
    });
    expect(usuario).toMatchObject({ usuarioId: 26, perfil: 1, perfilDescricao: "Administrador", ativo: true });
  });

  it("tolera campos ausentes e tira máscara de CPF e celular", () => {
    expect(fromUsuarioResponse({})).toMatchObject({ usuarioId: 0, nome: "", ativo: false, perfil: 0 });
    expect(fromUsuarioResponse({ cpf: "110.119.540-10", celular: "(54) 99638-4949" })).toMatchObject({
      cpf: "11011954010",
      celular: "54996384949",
    });
  });

  it("mantém perfil fora do enum", () => {
    expect(fromUsuarioResponse({ perfil: 9, perfilDescricao: "Auditor" })).toMatchObject({
      perfil: 9,
      perfilDescricao: "Auditor",
    });
  });

  it("lê a consulta de CPF", () => {
    expect(fromCpfConsultaResponse({ encontrado: false })).toMatchObject({
      encontrado: false,
      usuarioId: null,
      vinculadoNaEmpresa: false,
    });
    expect(
      fromCpfConsultaResponse({ encontrado: true, cpf: "11011954010", usuarioId: 26, vinculadoNaEmpresa: true }),
    ).toMatchObject({ encontrado: true, usuarioId: 26, vinculadoNaEmpresa: true });
  });

  it("lê o resultado do cadastro", () => {
    expect(fromNovoUsuarioResponse({ usuarioId: 3, novoCadastro: true })).toEqual({ usuarioId: 3, novoCadastro: true });
    expect(fromNovoUsuarioResponse({})).toEqual({ usuarioId: 0, novoCadastro: false });
  });

  it("monta o payload só com dígitos e perfil numérico", () => {
    expect(
      toNovoUsuarioPayload({
        cpf: "110.119.540-10",
        nome: "  Maria  ",
        email: " maria@exemplo.com ",
        celular: "(54) 99638-4949",
        perfil: "4",
      }),
    ).toEqual({
      cpf: "11011954010",
      nome: "Maria",
      email: "maria@exemplo.com",
      celular: "54996384949",
      perfil: 4,
    });
  });
});
