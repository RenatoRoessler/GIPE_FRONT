import { describe, expect, it } from "vitest";
import { formatPerfil, isPerfilAtribuivel, isPerfilConhecido, PERFIL_OPTIONS } from "./perfil";

describe("perfil", () => {
  it("traduz os perfis conhecidos", () => {
    expect(formatPerfil(1)).toBe("Administrador");
    expect(formatPerfil(8)).toBe("Financeiro");
  });

  it("traduz também os perfis da conveniada", () => {
    expect(formatPerfil(5)).toBe("Administrador Conveniada");
    expect(formatPerfil(6)).toBe("Gerente Conveniada");
    expect(formatPerfil(7)).toBe("Usuário Conveniada");
  });

  it("perfil desconhecido usa a descrição do back e, sem ela, o número", () => {
    expect(isPerfilConhecido(9)).toBe(false);
    expect(formatPerfil(9, "Auditor")).toBe("Auditor");
    expect(formatPerfil(9)).toBe("Perfil 9");
  });

  it("só os perfis do estacionamento são atribuíveis", () => {
    expect(isPerfilAtribuivel(8)).toBe(true);
    expect(isPerfilAtribuivel(5)).toBe(false);
    expect(isPerfilAtribuivel(9)).toBe(false);
  });

  it("oferece os cinco perfis no Select", () => {
    expect(PERFIL_OPTIONS.map((option) => option.value)).toEqual([1, 2, 4, 3, 8]);
  });
});
