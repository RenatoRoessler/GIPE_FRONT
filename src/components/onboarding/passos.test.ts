import { describe, expect, it } from "vitest";
import { NAV_ITEMS, navItemKey, navItemsPermitidos } from "@/lib/nav";
import { PERFIL_USUARIO } from "@/types/usuario";
import { CONTEUDO_MODULOS } from "./conteudo";
import { montarPassos } from "./passos";

const { Administrador, Caixa, Manobrista, Financeiro, GerenteConveniada, UsuarioConveniada, AdministradorConveniada } = PERFIL_USUARIO;

describe("conteúdo dos módulos", () => {
  it("todo item do menu tem explicação, para o tour não deixar módulo sem texto", () => {
    const semTexto = NAV_ITEMS.map(navItemKey).filter((chave) => !CONTEUDO_MODULOS[chave]);
    expect(semTexto).toEqual([]);
  });

  it("os textos são curtos: de uma frase a poucas linhas", () => {
    for (const [chave, { texto }] of Object.entries(CONTEUDO_MODULOS)) {
      expect(texto.length, chave).toBeGreaterThan(40);
      expect(texto.length, chave).toBeLessThan(260);
    }
  });
});

describe("montarPassos", () => {
  it("equipe: boas-vindas, um passo por módulo permitido na ordem do menu e fechamento", () => {
    const passos = montarPassos(Administrador);
    const permitidos = navItemsPermitidos(Administrador).map(navItemKey);

    expect(passos[0].id).toBe("boas-vindas");
    expect(passos.at(-1)?.id).toBe("pronto");
    expect(passos.slice(1, -1).map((passo) => passo.id)).toEqual(permitidos);
  });

  it("cada passo de módulo leva título do menu, ícone e onde encontrar", () => {
    const passos = montarPassos(Administrador);

    expect(passos.find((passo) => passo.id === "/patio")).toMatchObject({ titulo: "Pátio", icone: "yard", onde: "No menu, em Operação." });
    expect(passos.find((passo) => passo.id === "entrada")).toMatchObject({ titulo: "Entrada de Veículos", onde: "No menu, em Operação." });
    expect(passos.find((passo) => passo.id === "/dashboard")).toMatchObject({ icone: "dashboard", onde: "No menu." });
  });

  it("só mostra módulos que o perfil acessa", () => {
    const ids = montarPassos(Manobrista).map((passo) => passo.id);

    expect(ids).toContain("/patio");
    expect(ids).not.toContain("/usuarios");
    expect(ids).not.toContain("/financeiro");
    expect(montarPassos(Financeiro).map((passo) => passo.id)).toContain("/financeiro");
    expect(montarPassos(Caixa).map((passo) => passo.id)).toContain("/caixa");
  });

  it.each([[AdministradorConveniada], [GerenteConveniada], [UsuarioConveniada]])(
    "conveniada (perfil %s): só Carimbo e Pátio da conveniada, com textos próprios",
    (perfil) => {
      const passos = montarPassos(perfil);

      expect(passos.map((passo) => passo.id)).toEqual(["boas-vindas", "/carimbo", "/patio-conveniada", "pronto"]);
      expect(passos[0].texto).toContain("sua empresa");
      expect(passos.at(-1)?.texto).toContain("Carimbar ticket");
    },
  );

  it("perfil desconhecido não quebra e não vê módulos restritos", () => {
    for (const perfil of [null, undefined, 99 as never]) {
      const passos = montarPassos(perfil);

      expect(passos[0].id).toBe("boas-vindas");
      expect(passos.at(-1)?.id).toBe("pronto");
      expect(passos.some((passo) => passo.id === "/usuarios")).toBe(false);
    }
  });
});
