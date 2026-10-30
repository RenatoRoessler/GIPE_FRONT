import { describe, expect, it } from "vitest";
import { EMPTY_CONVENIADA_FORM, type ConveniadaFormValues } from "@/types/conveniada";
import { secaoCompleta, secaoDoCampo } from "./secoes";

const EMPRESA_OK: Partial<ConveniadaFormValues> = {
  cnpj: "11.222.333/0001-81",
  razaoSocial: "Auto Peças Sul LTDA",
  telefone: "(11) 3456-7890",
  cep: "01310-100",
  logradouro: "Rua X",
  numero: "10",
  bairro: "Centro",
  cidade: "São Paulo",
  estado: "SP",
};

const RESPONSAVEL_OK: Partial<ConveniadaFormValues> = {
  usuarioNome: "Maria Souza",
  usuarioCpf: "529.982.247-25",
  usuarioEmail: "maria@exemplo.com",
  usuarioCelular: "(11) 98765-4321",
};

describe("secaoDoCampo", () => {
  it("campos com prefixo usuario são do responsável", () => {
    expect(secaoDoCampo("usuarioCpf")).toBe("responsavel");
    expect(secaoDoCampo("cnpj")).toBe("empresa");
    expect(secaoDoCampo("nomeFantasia")).toBe("empresa");
  });
});

describe("secaoCompleta", () => {
  it("formulário vazio: nenhuma seção completa", () => {
    expect(secaoCompleta(EMPTY_CONVENIADA_FORM, "empresa")).toBe(false);
    expect(secaoCompleta(EMPTY_CONVENIADA_FORM, "responsavel")).toBe(false);
  });

  it("cada seção fica completa sozinha, sem depender da outra", () => {
    const soEmpresa = { ...EMPTY_CONVENIADA_FORM, ...EMPRESA_OK };
    expect(secaoCompleta(soEmpresa, "empresa")).toBe(true);
    expect(secaoCompleta(soEmpresa, "responsavel")).toBe(false);

    const soResponsavel = { ...EMPTY_CONVENIADA_FORM, ...RESPONSAVEL_OK };
    expect(secaoCompleta(soResponsavel, "empresa")).toBe(false);
    expect(secaoCompleta(soResponsavel, "responsavel")).toBe(true);
  });

  it("nome fantasia é opcional", () => {
    const tudo = {
      ...EMPTY_CONVENIADA_FORM,
      ...EMPRESA_OK,
      ...RESPONSAVEL_OK,
      nomeFantasia: "",
    };
    expect(secaoCompleta(tudo, "empresa")).toBe(true);
  });
});
