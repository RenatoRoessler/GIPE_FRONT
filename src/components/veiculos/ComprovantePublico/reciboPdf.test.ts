import { describe, expect, it } from "vitest";
import type { ComprovanteCliente } from "@/types/veiculo";
import { criarReciboPdf } from "./reciboPdf";

const comprovante: ComprovanteCliente = {
  cnpj: "66326569000150",
  razaoSocial: "Estacionamento Central",
  endereco: "Avenida Sete de Setembro, 123",
  telefone: "54996384949",
  placa: "LWJ2686",
  modelo: "Fusca",
  cor: "PRATA",
  categoriaId: 2,
  categoriaDescricao: "Carro pequeno",
  dataHoraEntrada: "2026-10-17T10:06:06.2094",
  dataHoraConsulta: "2026-10-17T11:11:21.3565059",
  minutosPermanencia: 65,
  permanencia: "1h 5min",
  sequencial: 7888,
  token: "227SUSYV",
  valorAtual: 12.5,
};

describe("criarReciboPdf", () => {
  it("gera um PDF de uma página, com altura ajustada ao conteúdo", async () => {
    const doc = await criarReciboPdf(comprovante, "https://gipe.exemplo.com/comprovante/227SUSYV");
    const bytes = new Uint8Array(doc.output("arraybuffer"));
    expect(String.fromCharCode(...bytes.slice(0, 5))).toBe("%PDF-");
    expect(doc.getNumberOfPages()).toBe(1);
    expect(doc.internal.pageSize.getWidth()).toBe(80);
    expect(doc.internal.pageSize.getHeight()).toBeLessThan(200);
  });

  it("aceita campos vazios sem quebrar", async () => {
    const doc = await criarReciboPdf(
      { ...comprovante, telefone: null, endereco: null, modelo: null, cor: null },
      "https://gipe.exemplo.com/comprovante/227SUSYV",
    );
    expect(doc.getNumberOfPages()).toBe(1);
  });
});
