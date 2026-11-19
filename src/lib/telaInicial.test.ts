import { describe, expect, it } from "vitest";
import { PERFIL_USUARIO } from "@/types/usuario";
import { telaInicial } from "./telaInicial";

const { Administrador, Gerente, Caixa, Manobrista, Financeiro, Lavador, AdministradorConveniada, GerenteConveniada, UsuarioConveniada } = PERFIL_USUARIO;

describe("telaInicial", () => {
  it("tela grande abre a Visão Geral para o Administrador", () => {
    expect(telaInicial(Administrador, true)).toBe("/dashboard");
  });

  it("tela pequena abre o Pátio para o Administrador", () => {
    expect(telaInicial(Administrador, false)).toBe("/patio");
  });

  it("Gerente, Caixa e Manobrista abrem o Pátio em qualquer largura, porque não veem a Visão Geral", () => {
    for (const perfil of [Gerente, Caixa, Manobrista]) {
      expect(telaInicial(perfil, true)).toBe("/patio");
      expect(telaInicial(perfil, false)).toBe("/patio");
    }
  });

  it("o Financeiro abre o Financeiro em qualquer largura", () => {
    expect(telaInicial(Financeiro, true)).toBe("/financeiro");
    expect(telaInicial(Financeiro, false)).toBe("/financeiro");
  });

  it("o Lavador abre a Fila de serviços em qualquer largura", () => {
    expect(telaInicial(Lavador, true)).toBe("/servicos");
    expect(telaInicial(Lavador, false)).toBe("/servicos");
  });

  it("os perfis de conveniada abrem o Carimbo em qualquer largura", () => {
    for (const perfil of [AdministradorConveniada, GerenteConveniada, UsuarioConveniada]) {
      expect(telaInicial(perfil, true)).toBe("/carimbo");
      expect(telaInicial(perfil, false)).toBe("/carimbo");
    }
  });

  it("sem perfil conhecido abre a própria conta, a única rota livre", () => {
    for (const largura of [true, false]) {
      expect(telaInicial(null, largura)).toBe("/usuario");
      expect(telaInicial(undefined, largura)).toBe("/usuario");
    }
  });

  it("nenhum perfil abre numa tela que não pode acessar", async () => {
    const { podeAcessar, areaDaRota } = await import("./permissoes");
    for (const perfil of Object.values(PERFIL_USUARIO)) {
      for (const largura of [true, false]) {
        const destino = telaInicial(perfil, largura);
        const area = areaDaRota(destino);
        expect(area === null || podeAcessar(perfil, area)).toBe(true);
      }
    }
  });
});
