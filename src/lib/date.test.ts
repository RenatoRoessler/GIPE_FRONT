import { describe, expect, it } from "vitest";
import { parseApiDate } from "./date";

describe("parseApiDate", () => {
  it("lê data/hora sem fuso como horário local, descartando microssegundos", () => {
    const date = parseApiDate("2026-10-21T14:32:05.1234567");
    expect(date).not.toBeNull();
    expect(date?.getHours()).toBe(14);
    expect(date?.getMinutes()).toBe(32);
    expect(date?.getMilliseconds()).toBe(123);
  });

  it("devolve null para vazio ou inválido", () => {
    expect(parseApiDate(null)).toBeNull();
    expect(parseApiDate(undefined)).toBeNull();
    expect(parseApiDate("")).toBeNull();
    expect(parseApiDate("não é data")).toBeNull();
  });
});
