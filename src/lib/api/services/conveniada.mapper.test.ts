import { describe, expect, it } from "vitest";
import { EMPTY_CONVENIADA_FORM, type ConveniadaFormValues } from "@/types/conveniada";
import {
  fromConveniadaResponse,
  fromConveniadasResponse,
  fromResultadoResponse,
  toConveniadaPayload,
} from "./conveniada.mapper";

const ENDERECO = { logradouro: "Rua X", numero: "10", bairro: "Centro", cidade: "São Paulo", estado: "SP", cep: "01310-100" };

const base = {
  empresaConvenioId: 7,
  empresaConveniadaId: 3,
  empresaGuid: "abc-123",
  razaoSocial: " Auto Peças Sul LTDA ",
  nomeFantasia: "Auto Peças Sul",
  cnpj: "12345678000195",
  telefone: "(11) 98765-4321",
  ativo: true,
  dataCriacao: "2026-03-12T10:20:30.1234567",
};

describe("fromConveniadaResponse", () => {
  it("lê o endereço aninhado", () => {
    const conveniada = fromConveniadaResponse({ ...base, endereco: ENDERECO });
    expect(conveniada).toMatchObject({
      empresaConvenioId: 7,
      empresaConveniadaId: 3,
      empresaGuid: "abc-123",
      razaoSocial: "Auto Peças Sul LTDA",
      nomeFantasia: "Auto Peças Sul",
      cnpj: "12345678000195",
      telefone: "11987654321",
      endereco: ENDERECO,
      ativo: true,
      dataCriacao: "2026-03-12T10:20:30.1234567",
    });
  });

  it("lê o endereço plano", () => {
    expect(fromConveniadaResponse({ ...base, ...ENDERECO }).endereco).toEqual(ENDERECO);
  });

  it("aceita CNPJ com máscara e devolve só dígitos", () => {
    expect(fromConveniadaResponse({ ...base, cnpj: "12.345.678/0001-95" }).cnpj).toBe("12345678000195");
  });

  it("tolera campos ausentes", () => {
    expect(fromConveniadaResponse({})).toEqual({
      empresaConvenioId: 0,
      empresaConveniadaId: 0,
      empresaGuid: "",
      razaoSocial: "",
      nomeFantasia: "",
      cnpj: "",
      telefone: "",
      endereco: { logradouro: "", numero: "", bairro: "", cidade: "", estado: "", cep: "" },
      ativo: false,
      dataCriacao: "",
    });
    expect(fromConveniadaResponse(null).razaoSocial).toBe("");
  });

  it("nomeFantasia nulo vira vazio", () => {
    expect(fromConveniadaResponse({ ...base, nomeFantasia: null }).nomeFantasia).toBe("");
  });
});

describe("fromConveniadasResponse", () => {
  it("devolve lista vazia quando a resposta não é um array", () => {
    expect(fromConveniadasResponse(undefined)).toEqual([]);
    expect(fromConveniadasResponse({})).toEqual([]);
  });

  it("converte cada item", () => {
    expect(fromConveniadasResponse([base, base])).toHaveLength(2);
  });
});

describe("fromResultadoResponse", () => {
  it("lê os indicadores do cadastro", () => {
    expect(
      fromResultadoResponse({ empresaConveniadaId: 3, empresaGuid: "g", novaEmpresa: true, usuarioId: 9, novoUsuario: false }),
    ).toEqual({ empresaConveniadaId: 3, empresaGuid: "g", novaEmpresa: true, usuarioId: 9, novoUsuario: false });
  });

  it("indicador ausente vira falso", () => {
    expect(fromResultadoResponse({})).toMatchObject({ novaEmpresa: false, novoUsuario: false });
  });
});

describe("toConveniadaPayload", () => {
  const values: ConveniadaFormValues = {
    ...EMPTY_CONVENIADA_FORM,
    cnpj: "12.345.678/0001-95",
    telefone: "(11) 3456-7890",
    razaoSocial: " Auto Peças Sul LTDA ",
    nomeFantasia: " ",
    cep: "01310100",
    logradouro: " Rua X ",
    numero: " 10 ",
    bairro: "Centro",
    cidade: "São Paulo",
    estado: "SP",
    usuarioNome: " Maria ",
    usuarioCpf: "529.982.247-25",
    usuarioEmail: " maria@exemplo.com ",
    usuarioCelular: "(11) 98765-4321",
  };

  it("monta o corpo do contrato, sem tipoEmpresa, com documentos só em dígitos", () => {
    const payload = toConveniadaPayload(values);
    expect(payload).toEqual({
      empresa: {
        razaoSocial: "Auto Peças Sul LTDA",
        nomeFantasia: "",
        cnpj: "12345678000195",
        telefone: "1134567890",
        endereco: { logradouro: "Rua X", bairro: "Centro", numero: "10", cidade: "São Paulo", estado: "SP", cep: "01310-100" },
      },
      usuario: { nome: "Maria", cpf: "52998224725", email: "maria@exemplo.com", celular: "11987654321" },
    });
    expect(payload.empresa).not.toHaveProperty("tipoEmpresa");
  });
});
