import { describe, expect, it } from "vitest";
import { parseAba } from "./aba";

describe("parseAba", () => {
  it("reconhece as abas válidas", () => {
    expect(parseAba("mensalistas")).toBe("mensalistas");
    expect(parseAba("tipos")).toBe("tipos");
  });

  it("cai em mensalistas quando ausente ou inválida", () => {
    expect(parseAba(null)).toBe("mensalistas");
    expect(parseAba("")).toBe("mensalistas");
    expect(parseAba("outra")).toBe("mensalistas");
  });
});
