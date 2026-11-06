import { describe, expect, it } from "vitest";
import { assuntoDoEmail, hrefDoEnvio, mensagemDoTicket, validarContato } from "./envioTicket";

const dados = { placa: "FLP3C88", estacionamento: "Estacionamento Central", link: "https://app.test/comprovante/abc" };

describe("mensagemDoTicket", () => {
  it("traz placa, estacionamento e link", () => {
    expect(mensagemDoTicket(dados)).toBe(
      "Olá! Segue o ticket do veículo FLP3C88 no Estacionamento Central: https://app.test/comprovante/abc",
    );
  });

  it("omite o estacionamento quando não há nome", () => {
    expect(mensagemDoTicket({ ...dados, estacionamento: undefined })).toBe(
      "Olá! Segue o ticket do veículo FLP3C88: https://app.test/comprovante/abc",
    );
  });
});

describe("assuntoDoEmail", () => {
  it("inclui a placa e, quando houver, o estacionamento", () => {
    expect(assuntoDoEmail(dados)).toBe("Ticket de entrada — FLP3C88 · Estacionamento Central");
    expect(assuntoDoEmail({ placa: "FLP3C88" })).toBe("Ticket de entrada — FLP3C88");
  });
});

describe("hrefDoEnvio", () => {
  it("WhatsApp: usa só os dígitos com o código do Brasil e a mensagem codificada", () => {
    const href = hrefDoEnvio("whatsapp", "(11) 91234-5678", dados);
    expect(href.startsWith("https://wa.me/5511912345678?text=")).toBe(true);
    expect(decodeURIComponent(href.split("?text=")[1])).toBe(mensagemDoTicket(dados));
  });

  it("e-mail: monta o mailto com assunto e corpo codificados", () => {
    const href = hrefDoEnvio("email", "  cliente@exemplo.com ", dados);
    expect(href.startsWith("mailto:cliente@exemplo.com?subject=")).toBe(true);
    const params = new URLSearchParams(href.split("?")[1]);
    expect(params.get("subject")).toBe(assuntoDoEmail(dados));
    expect(params.get("body")).toBe(mensagemDoTicket(dados));
  });
});

describe("validarContato", () => {
  it.each([
    ["(11) 9123", "Informe o WhatsApp com DDD."],
    ["(11) 1234-5678", null],
    ["(11) 91234-5678", null],
    ["119123456789", "Informe o WhatsApp com DDD."],
  ])("WhatsApp %s", (valor, esperado) => {
    expect(validarContato("whatsapp", valor)).toBe(esperado);
  });

  it.each([
    ["cliente@exemplo.com", null],
    [" cliente@exemplo.com ", null],
    ["cliente@exemplo", "Informe um e-mail válido, como nome@dominio.com."],
    ["", "Informe um e-mail válido, como nome@dominio.com."],
  ])("e-mail %j", (valor, esperado) => {
    expect(validarContato("email", valor)).toBe(esperado);
  });
});
