import { describe, expect, it } from "vitest";
import { TIPO_PESSOA } from "./mensalista";

describe("TIPO_PESSOA", () => {
  it("segue os códigos do back (1 física, 2 jurídica)", () => {
    expect(TIPO_PESSOA.Fisica).toBe(1);
    expect(TIPO_PESSOA.Juridica).toBe(2);
  });
});
