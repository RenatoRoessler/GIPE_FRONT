import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PERFIL_USUARIO, type PerfilUsuario } from "@/types/usuario";
import { AREA, areaDaRota, podeAcessar, ROTAS_SEM_AREA, type Area } from "./permissoes";

const { Administrador, Gerente, Caixa, Manobrista, Financeiro, AdministradorConveniada, GerenteConveniada, UsuarioConveniada } =
  PERFIL_USUARIO;

const TODOS: PerfilUsuario[] = [Administrador, Gerente, Caixa, Manobrista, Financeiro, AdministradorConveniada, GerenteConveniada, UsuarioConveniada];

const PERMITIDOS: Record<Area, PerfilUsuario[]> = {
  [AREA.Inicio]: TODOS,
  [AREA.Patio]: [Administrador, Gerente, Caixa, Manobrista],
  [AREA.Caixa]: [Administrador, Gerente, Caixa, Manobrista],
  [AREA.CaixaSangria]: [Administrador, Gerente, Caixa],
  [AREA.CaixaHistorico]: [Administrador, Gerente],
  [AREA.Precos]: [Administrador, Gerente],
  [AREA.Mensalistas]: [Administrador, Gerente],
  [AREA.NotasFiscais]: [Administrador, Gerente, Financeiro],
  [AREA.Relatorios]: [Administrador, Gerente],
  [AREA.Empresa]: [Administrador],
  [AREA.Usuarios]: [Administrador, AdministradorConveniada],
};

describe("podeAcessar", () => {
  for (const area of Object.values(AREA)) {
    for (const perfil of TODOS) {
      const esperado = PERMITIDOS[area].includes(perfil);
      it(`${area} ${esperado ? "libera" : "bloqueia"} o perfil ${perfil}`, () => {
        expect(podeAcessar(perfil, area)).toBe(esperado);
      });
    }
  }

  it("sem perfil conhecido só libera o início", () => {
    for (const area of Object.values(AREA)) {
      expect(podeAcessar(null, area)).toBe(area === AREA.Inicio);
      expect(podeAcessar(undefined, area)).toBe(area === AREA.Inicio);
    }
  });

  it("a permissão por módulo substitui a regra padrão da área", () => {
    expect(podeAcessar(Manobrista, AREA.Precos, { [AREA.Precos]: [Manobrista] })).toBe(true);
    expect(podeAcessar(Administrador, AREA.Precos, { [AREA.Precos]: [Manobrista] })).toBe(false);
    expect(podeAcessar(Gerente, AREA.Precos, { [AREA.Empresa]: [Manobrista] })).toBe(true);
  });
});

describe("areaDaRota", () => {
  it("mapeia a rota e as rotas filhas", () => {
    expect(areaDaRota("/dashboard")).toBe(AREA.Inicio);
    expect(areaDaRota("/precos")).toBe(AREA.Precos);
    expect(areaDaRota("/precos/novo")).toBe(AREA.Precos);
    expect(areaDaRota("/precos/123/editar")).toBe(AREA.Precos);
    expect(areaDaRota("/minha-empresa")).toBe(AREA.Empresa);
    expect(areaDaRota("/usuarios")).toBe(AREA.Usuarios);
    expect(areaDaRota("/notas-fiscais")).toBe(AREA.NotasFiscais);
  });

  it("rotas abertas não têm área", () => {
    expect(areaDaRota("/usuario/editar")).toBeNull();
    expect(areaDaRota("/atualizacoes")).toBeNull();
    expect(areaDaRota("/acesso-negado")).toBeNull();
  });

  it("não confunde prefixos parecidos", () => {
    expect(areaDaRota("/usuarioX")).toBeNull();
    expect(areaDaRota("/caixas")).toBeNull();
    expect(areaDaRota("/usuario")).toBeNull();
  });
});

describe("rotas da área logada", () => {
  it("toda pasta de src/app/(app) tem área ou está na lista de rotas abertas", () => {
    const pasta = join(process.cwd(), "src", "app", "(app)");
    const rotas = readdirSync(pasta, { withFileTypes: true })
      .filter((entrada) => entrada.isDirectory())
      .map((entrada) => `/${entrada.name}`);

    const semDestino = rotas.filter((rota) => areaDaRota(rota) === null && !(ROTAS_SEM_AREA as readonly string[]).includes(rota));
    expect(semDestino).toEqual([]);
  });
});
