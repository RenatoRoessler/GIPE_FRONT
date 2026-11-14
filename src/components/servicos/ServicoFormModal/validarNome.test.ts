import { describe, expect, it } from "vitest";
import type { Servico } from "@/types/servico";
import { nomeJaExiste } from "./validarNome";

const servico = (id: number, nome: string, ativo = true): Servico => ({
  id,
  nome,
  descricao: null,
  duracaoMinutos: null,
  tempoPermitidoMinutos: null,
  ativo,
  precos: [],
});

const catalogo = [servico(1, "Lavagem completa"), servico(2, "Polimento", false)];

describe("nomeJaExiste", () => {
  it("compara sem acento, sem diferença de caixa e sem espaço sobrando", () => {
    expect(nomeJaExiste("  LAVAGEM   completa ", catalogo)).toBe(true);
    expect(nomeJaExiste("higienizacao", [servico(3, "Higienização")])).toBe(true);
  });

  it("serviço inativo não conta: o back só recusa nome repetido entre os ativos", () => {
    expect(nomeJaExiste("Polimento", catalogo)).toBe(false);
  });

  it("na edição o próprio serviço não conta, mas os outros sim", () => {
    expect(nomeJaExiste("Lavagem completa", catalogo, 1)).toBe(false);
    expect(nomeJaExiste("Lavagem completa", catalogo, 9)).toBe(true);
  });

  it("nome vazio não é repetido", () => {
    expect(nomeJaExiste("   ", catalogo)).toBe(false);
  });
});
