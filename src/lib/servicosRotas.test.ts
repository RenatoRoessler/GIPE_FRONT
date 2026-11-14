import { describe, expect, it } from "vitest";
import { PERFIL_USUARIO } from "@/types/usuario";
import { destinoLegadoDeServicos } from "./servicosRotas";

const { Administrador, Gerente, Caixa, Manobrista, Financeiro, Lavador, AdministradorConveniada, GerenteConveniada, UsuarioConveniada } = PERFIL_USUARIO;

const busca = (texto = "") => new URLSearchParams(texto);

describe("destinoLegadoDeServicos", () => {
  it("quem mantém o catálogo vai ao catálogo, com ou sem ?aba=", () => {
    for (const perfil of [Administrador, Gerente]) {
      expect(destinoLegadoDeServicos(perfil, "/servicos", busca())).toBe("/servicos/catalogo");
      expect(destinoLegadoDeServicos(perfil, "/servicos", busca("aba=catalogo"))).toBe("/servicos/catalogo");
      expect(destinoLegadoDeServicos(perfil, "/servicos", busca("aba=fila"))).toBe("/servicos/catalogo");
    }
  });

  it("repassa a seleção quando o id é um inteiro positivo", () => {
    expect(destinoLegadoDeServicos(Gerente, "/servicos", busca("aba=catalogo&servico=7"))).toBe("/servicos/catalogo?servico=7");
  });

  it("descarta a seleção que não é um inteiro positivo", () => {
    for (const ruim of ["0", "-3", "abc", "7.5", "07", ""]) {
      expect(destinoLegadoDeServicos(Gerente, "/servicos", busca(`servico=${ruim}`))).toBe("/servicos/catalogo");
    }
  });

  it("quem vê a fila fica nela, mesmo com ?aba=catalogo", () => {
    for (const perfil of [Caixa, Manobrista, Lavador]) {
      expect(destinoLegadoDeServicos(perfil, "/servicos", busca())).toBeNull();
      expect(destinoLegadoDeServicos(perfil, "/servicos", busca("aba=catalogo&servico=7"))).toBeNull();
    }
  });

  it("perfil sem fila nem catálogo não tem para onde ir", () => {
    for (const perfil of [Financeiro, AdministradorConveniada, GerenteConveniada, UsuarioConveniada, null, undefined]) {
      expect(destinoLegadoDeServicos(perfil, "/servicos", busca())).toBeNull();
    }
  });

  it("só age em /servicos exato", () => {
    for (const caminho of ["/servicos/catalogo", "/servicos/catalogo/1", "/servicos/outra", "/servicosx", "/patio", "/"]) {
      expect(destinoLegadoDeServicos(Gerente, caminho, busca("aba=catalogo"))).toBeNull();
    }
  });
});
