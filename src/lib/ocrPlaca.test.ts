import { describe, expect, it } from "vitest";
import { criarConsenso, extrairPlaca } from "./ocrPlaca";

describe("extrairPlaca", () => {
  it("reconhece placa Mercosul e antiga", () => {
    expect(extrairPlaca("ABC1D23")).toBe("ABC1D23");
    expect(extrairPlaca("ABC1234")).toBe("ABC1234");
  });

  it("ignora hífen, espaços, minúsculas e ruído ao redor", () => {
    expect(extrairPlaca("  abc-1234 \n")).toBe("ABC1234");
    expect(extrairPlaca("BRASIL ABC 1D23 ??")).toBe("ABC1D23");
  });

  it("corrige confusões nas posições de letra e de dígito", () => {
    expect(extrairPlaca("8RA1234")).toBe("BRA1234");
    expect(extrairPlaca("ABCI234")).toBe("ABC1234");
    expect(extrairPlaca("ABC1D2S")).toBe("ABC1D25");
    expect(extrairPlaca("A0C1B23")).toBe("AOC1B23");
    expect(extrairPlaca("ABC1O23")).toBe("ABC1O23");
  });

  it("aceita letra ou dígito na 5ª posição", () => {
    expect(extrairPlaca("ABC1B23")).toBe("ABC1B23");
    expect(extrairPlaca("ABC1523")).toBe("ABC1523");
  });

  it("devolve null quando não há placa válida", () => {
    expect(extrairPlaca("")).toBeNull();
    expect(extrairPlaca("BRASIL")).toBeNull();
    expect(extrairPlaca("ABC12")).toBeNull();
    expect(extrairPlaca("1234567")).toBeNull();
  });
});

describe("criarConsenso", () => {
  it("só confirma depois de duas leituras iguais seguidas", () => {
    const consenso = criarConsenso();
    expect(consenso.registrar("ABC1D23")).toBeNull();
    expect(consenso.registrar("ABC1D23")).toBe("ABC1D23");
  });

  it("zera a contagem quando a leitura muda ou falha", () => {
    const consenso = criarConsenso();
    consenso.registrar("ABC1D23");
    expect(consenso.registrar("ABC1D24")).toBeNull();
    expect(consenso.registrar(null)).toBeNull();
    expect(consenso.registrar("ABC1D24")).toBeNull();
    expect(consenso.registrar("ABC1D24")).toBe("ABC1D24");
  });

  it("reiniciar descarta o que foi lido", () => {
    const consenso = criarConsenso();
    consenso.registrar("ABC1D23");
    consenso.reiniciar();
    expect(consenso.registrar("ABC1D23")).toBeNull();
  });
});

describe("criarConsenso: dúvida entre as leituras", () => {
  it("sem divergência não há dúvida", () => {
    const consenso = criarConsenso();
    consenso.registrar("ABC1D23");
    expect(consenso.registrar("ABC1D23")).toBe("ABC1D23");
    expect(consenso.duvida()).toBeNull();
  });

  it("aponta o caractere em que uma leitura anterior divergia", () => {
    const consenso = criarConsenso();
    consenso.registrar("ABC1D28");
    consenso.registrar("ABC1D23");
    expect(consenso.registrar("ABC1D23")).toBe("ABC1D23");
    expect(consenso.duvida()).toBe(6);
  });

  it("divergência em mais de um caractere é outro carro, não dúvida", () => {
    const consenso = criarConsenso();
    consenso.registrar("XYZ9K88");
    consenso.registrar("ABC1D23");
    expect(consenso.registrar("ABC1D23")).toBe("ABC1D23");
    expect(consenso.duvida()).toBeNull();
  });

  it("a divergência vale mesmo com um quadro sem placa no meio", () => {
    const consenso = criarConsenso();
    consenso.registrar("ABC1D28");
    consenso.registrar(null);
    consenso.registrar("ABC1D23");
    expect(consenso.registrar("ABC1D23")).toBe("ABC1D23");
    expect(consenso.duvida()).toBe(6);
  });

  it("reiniciar esquece as divergências", () => {
    const consenso = criarConsenso();
    consenso.registrar("ABC1D28");
    consenso.registrar("ABC1D23");
    consenso.reiniciar();
    consenso.registrar("ABC1D23");
    expect(consenso.registrar("ABC1D23")).toBe("ABC1D23");
    expect(consenso.duvida()).toBeNull();
  });

  it("não muda quando a placa ainda não foi confirmada", () => {
    const consenso = criarConsenso();
    expect(consenso.registrar("ABC1D23")).toBeNull();
    expect(consenso.duvida()).toBeNull();
  });
});
