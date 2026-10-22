import { describe, expect, it } from "vitest";
import type { CpfConsulta } from "@/types/usuario";
import { mensagemSucesso, proximaEtapa } from "./cadastroEtapa";

const base: CpfConsulta = {
  encontrado: false,
  cpf: "11011954010",
  usuarioId: null,
  nome: "",
  email: "",
  celular: "",
  vinculadoNaEmpresa: false,
};

describe("proximaEtapa", () => {
  it("CPF não encontrado leva ao formulário completo", () => {
    expect(proximaEtapa(base)).toEqual({ etapa: "dados", modo: "novo" });
  });

  it("CPF encontrado e não vinculado leva à conferência", () => {
    const pessoa = { ...base, encontrado: true, usuarioId: 26, nome: "Maria" };
    expect(proximaEtapa(pessoa)).toEqual({ etapa: "dados", modo: "conferencia", pessoa });
  });

  it("CPF já vinculado à empresa bloqueia o cadastro", () => {
    expect(proximaEtapa({ ...base, encontrado: true, usuarioId: 26, vinculadoNaEmpresa: true })).toEqual({
      etapa: "bloqueado",
      usuarioId: 26,
    });
  });
});

describe("mensagemSucesso", () => {
  it("varia conforme novoCadastro", () => {
    expect(mensagemSucesso(true)).toMatch(/senha temporária/i);
    expect(mensagemSucesso(false)).toMatch(/avisada/i);
  });
});
