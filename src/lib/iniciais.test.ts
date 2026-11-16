import { describe, expect, it } from "vitest";
import { iniciais } from "./iniciais";

describe("iniciais", () => {
  it("usa as duas primeiras palavras, em maiúsculas", () => {
    expect(iniciais("maria souza")).toBe("MS");
    expect(iniciais("Maria de Souza")).toBe("MD");
  });

  it("com uma palavra só, uma inicial", () => {
    expect(iniciais("Everton")).toBe("E");
  });

  it("ignora espaços sobrando e aceita nome vazio", () => {
    expect(iniciais("  Ana   Lima ")).toBe("AL");
    expect(iniciais("")).toBe("");
  });
});
