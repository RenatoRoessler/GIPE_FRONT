import { describe, expect, it } from "vitest";
import { enderecoResumido, formatDesde, nomeExibido, razaoSecundaria } from "./format";

describe("nomeExibido / razaoSecundaria", () => {
  it("usa o nome fantasia e mostra a razão social como apoio", () => {
    const empresa = { nomeFantasia: "Sul Peças", razaoSocial: "Auto Peças Sul LTDA" };
    expect(nomeExibido(empresa)).toBe("Sul Peças");
    expect(razaoSecundaria(empresa)).toBe("Auto Peças Sul LTDA");
  });

  it("sem nome fantasia usa a razão social, sem linha de apoio", () => {
    const empresa = { nomeFantasia: "", razaoSocial: "Auto Peças Sul LTDA" };
    expect(nomeExibido(empresa)).toBe("Auto Peças Sul LTDA");
    expect(razaoSecundaria(empresa)).toBeNull();
  });
});

describe("enderecoResumido", () => {
  it("junta rua, bairro e cidade/estado", () => {
    expect(
      enderecoResumido({ logradouro: "Rua X", numero: "10", bairro: "Centro", cidade: "São Paulo", estado: "SP", cep: "01310100" }),
    ).toBe("Rua X, 10 – Centro, São Paulo/SP");
  });

  it("pula o que não veio", () => {
    expect(enderecoResumido({ logradouro: "Rua X", numero: "", bairro: "", cidade: "Santos", estado: "", cep: "" })).toBe(
      "Rua X – Santos",
    );
    expect(enderecoResumido({ logradouro: "", numero: "", bairro: "", cidade: "", estado: "", cep: "" })).toBe("");
  });
});

describe("formatDesde", () => {
  it("formata a data do convênio em pt-BR", () => {
    expect(formatDesde("2026-03-12T10:20:30.1234567")).toBe("12/03/2026");
  });

  it("data ausente ou inválida vira traço", () => {
    expect(formatDesde("")).toBe("—");
    expect(formatDesde("nada")).toBe("—");
  });
});
