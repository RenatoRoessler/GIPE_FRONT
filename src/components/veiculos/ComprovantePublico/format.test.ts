import { describe, expect, it } from "vitest";
import { formatPermanencia } from "./format";

describe("formatPermanencia", () => {
  it("formata minutos em horas e minutos com dois dígitos", () => {
    expect(formatPermanencia(0)).toBe("0h 00min");
    expect(formatPermanencia(5)).toBe("0h 05min");
    expect(formatPermanencia(65)).toBe("1h 05min");
    expect(formatPermanencia(1563)).toBe("26h 03min");
  });

  it("trata valores inválidos como zero", () => {
    expect(formatPermanencia(-10)).toBe("0h 00min");
    expect(formatPermanencia(Number.NaN)).toBe("0h 00min");
  });
});
