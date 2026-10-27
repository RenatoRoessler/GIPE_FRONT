import { describe, expect, it } from "vitest";
import { QUADRO_SEM_GANCHO_MESSAGE, quadroFormSchema } from "./quadroChaves";

const valido = { nome: "Recepção", linhas: 5, colunas: 6, foraDeUso: [] as string[] };

function erro(valores: unknown, campo: string) {
  const result = quadroFormSchema.safeParse(valores);
  return result.success ? undefined : result.error.issues.find((issue) => issue.path[0] === campo)?.message;
}

describe("quadroFormSchema", () => {
  it("aceita um quadro válido", () => {
    expect(quadroFormSchema.safeParse(valido).success).toBe(true);
  });

  it("exige nome de até 100 caracteres", () => {
    expect(erro({ ...valido, nome: "  " }, "nome")).toBe("Informe o nome do quadro");
    expect(erro({ ...valido, nome: "a".repeat(101) }, "nome")).toBe("Use no máximo 100 caracteres");
  });

  it("limita linhas a 26 e colunas a 255", () => {
    expect(erro({ ...valido, linhas: 27, colunas: 1 }, "linhas")).toBe("Use no máximo 26 linhas");
    expect(erro({ ...valido, linhas: 1, colunas: 256 }, "colunas")).toBe("Use no máximo 255 colunas");
    expect(erro({ ...valido, linhas: 0 }, "linhas")).toBe("Use ao menos 1 linha");
  });

  it("limita o quadro a 600 ganchos", () => {
    expect(erro({ ...valido, linhas: 26, colunas: 24 }, "colunas")).toBe("O quadro pode ter no máximo 600 ganchos");
    expect(quadroFormSchema.safeParse({ ...valido, linhas: 25, colunas: 24 }).success).toBe(true);
  });

  it("exige ao menos um gancho em uso", () => {
    expect(erro({ nome: "X", linhas: 1, colunas: 2, foraDeUso: ["A1", "A2"] }, "foraDeUso")).toBe(
      QUADRO_SEM_GANCHO_MESSAGE,
    );
  });
});
