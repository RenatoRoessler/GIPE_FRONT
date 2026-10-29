import { describe, expect, it } from "vitest";
import { cadastroParam, mensagemCadastro, parseCadastroParam } from "./mensagens";

describe("mensagemCadastro", () => {
  it("empresa nova e usuário novo", () => {
    expect(mensagemCadastro({ novaEmpresa: true, novoUsuario: true })).toBe(
      "Empresa cadastrada e convênio registrado. O acesso foi enviado por e-mail ao responsável.",
    );
  });

  it("empresa nova e usuário existente", () => {
    expect(mensagemCadastro({ novaEmpresa: true, novoUsuario: false })).toBe(
      "Empresa cadastrada e convênio registrado. O usuário já cadastrado ganhou acesso a esta conveniada.",
    );
  });

  it("empresa reaproveitada e usuário novo", () => {
    expect(mensagemCadastro({ novaEmpresa: false, novoUsuario: true })).toBe(
      "Empresa já cadastrada: dados mantidos e convênio registrado. O acesso foi enviado por e-mail ao responsável.",
    );
  });

  it("empresa reaproveitada e usuário existente", () => {
    expect(mensagemCadastro({ novaEmpresa: false, novoUsuario: false })).toBe(
      "Empresa já cadastrada: dados mantidos e convênio registrado. O usuário já cadastrado ganhou acesso a esta conveniada.",
    );
  });
});

describe("cadastroParam", () => {
  it("vai e volta nas quatro combinações", () => {
    for (const novaEmpresa of [true, false]) {
      for (const novoUsuario of [true, false]) {
        expect(parseCadastroParam(cadastroParam({ novaEmpresa, novoUsuario }))).toEqual({ novaEmpresa, novoUsuario });
      }
    }
  });

  it("ignora valor ausente ou inválido", () => {
    expect(parseCadastroParam(null)).toBeNull();
    expect(parseCadastroParam("2x")).toBeNull();
    expect(parseCadastroParam("111")).toBeNull();
  });
});
