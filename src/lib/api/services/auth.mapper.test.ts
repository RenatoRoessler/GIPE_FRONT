import { describe, expect, it } from "vitest";
import { ApiError } from "../errors";
import { fromEmpresasResponse } from "./auth.mapper";

const GUID_A = "5be38c77-bcd2-462f-a2f3-92d7a77dd48c";
const GUID_B = "0f1d9c40-7a1e-4d6b-9d3f-1a2b3c4d5e6f";

describe("fromEmpresasResponse", () => {
  it("lê empresaGuid, nome fantasia e cnpj, deixando o cnpj só em dígitos", () => {
    expect(fromEmpresasResponse([{ empresaGuid: GUID_A, nomeFantasia: "Central", razaoSocial: "Central LTDA", cnpj: "11.222.333/0001-81" }])).toEqual([
      { id: GUID_A, nome: "Central", cnpj: "11222333000181", perfil: null, perfilDescricao: null },
    ]);
  });

  it("usa a razão social quando não há nome fantasia", () => {
    expect(fromEmpresasResponse([{ empresaGuid: GUID_A, nomeFantasia: "  ", razaoSocial: "Central LTDA", cnpj: "11222333000181" }])[0].nome).toBe("Central LTDA");
  });

  it("aceita nomes alternativos de identificador e de nome", () => {
    expect(fromEmpresasResponse([{ guid: GUID_A, nome: "Filial Norte" }])[0]).toMatchObject({ id: GUID_A, nome: "Filial Norte", cnpj: "" });
    expect(fromEmpresasResponse([{ id: GUID_B, razaoSocial: "Sul LTDA" }])[0]).toMatchObject({ id: GUID_B, nome: "Sul LTDA" });
  });

  it("traz o perfil na empresa quando a API informa, em código e em texto", () => {
    expect(fromEmpresasResponse([{ empresaGuid: GUID_A, nomeFantasia: "A", perfil: 2 }])[0].perfil).toBe(2);
    expect(fromEmpresasResponse([{ empresaGuid: GUID_A, nomeFantasia: "A", tipoUsuario: 4 }])[0].perfil).toBe(4);
    expect(fromEmpresasResponse([{ empresaGuid: GUID_A, nomeFantasia: "A", perfilId: 1, perfil: "Administrador" }])[0]).toMatchObject({
      perfil: 1,
      perfilDescricao: "Administrador",
    });
  });

  it("o perfil em texto nunca vira o código numérico", () => {
    const [empresa] = fromEmpresasResponse([{ empresaGuid: GUID_A, nomeFantasia: "A", perfil: "Gerente" }]);
    expect(empresa.perfil).toBeNull();
    expect(empresa.perfilDescricao).toBe("Gerente");
  });

  // Resposta real de /autenticacao/login com duas empresas, conferida na API em 23/10/2026.
  it("lê a lista real do login", () => {
    expect(
      fromEmpresasResponse([
        { empresaGuid: "5be38c77-bcd2-462f-a2f3-92d7a77dd48c", razaoSocial: "teste razao", cnpj: "66326569000150", perfil: "Administrador", perfilId: 1 },
        { empresaGuid: "a9bebee3-d7ff-406f-b0a0-fe03249b7031", razaoSocial: "TESTE VALIDACAO ADICIONAR EMPRESA LTDA", cnpj: "54172891000192", perfil: "Administrador", perfilId: 1 },
      ]),
    ).toEqual([
      { id: "5be38c77-bcd2-462f-a2f3-92d7a77dd48c", nome: "teste razao", cnpj: "66326569000150", perfil: 1, perfilDescricao: "Administrador" },
      { id: "a9bebee3-d7ff-406f-b0a0-fe03249b7031", nome: "TESTE VALIDACAO ADICIONAR EMPRESA LTDA", cnpj: "54172891000192", perfil: 1, perfilDescricao: "Administrador" },
    ]);
  });

  it("mantém a ordem recebida de várias empresas", () => {
    const lista = fromEmpresasResponse([
      { empresaGuid: GUID_A, nomeFantasia: "A" },
      { empresaGuid: GUID_B, nomeFantasia: "B" },
    ]);
    expect(lista.map((empresa) => empresa.nome)).toEqual(["A", "B"]);
  });

  it.each([
    ["lista vazia", []],
    ["valor que não é lista", { empresaGuid: GUID_A }],
    ["ausente", undefined],
    ["nulo", null],
    ["item sem identificador", [{ nomeFantasia: "A" }]],
    ["item sem nome", [{ empresaGuid: GUID_A }]],
    ["item que não é objeto", ["texto"]],
    ["item nulo", [null]],
  ])("%s vira erro, nunca uma tela vazia", (_nome, entrada) => {
    expect(() => fromEmpresasResponse(entrada)).toThrow(ApiError);
    expect(() => fromEmpresasResponse(entrada)).toThrowError(expect.objectContaining({ kind: "unknown" }));
  });

  it("uma empresa inválida no meio da lista invalida a lista toda", () => {
    expect(() => fromEmpresasResponse([{ empresaGuid: GUID_A, nomeFantasia: "A" }, { nomeFantasia: "sem id" }])).toThrow(ApiError);
  });
});
