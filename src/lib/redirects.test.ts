import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";

describe("redirecionamentos das páginas removidas", () => {
  it("Entrada e Saída de veículos não têm página: os endereços antigos levam ao Início, de forma temporária", async () => {
    const redirects = await nextConfig.redirects?.();

    expect(redirects).toEqual(
      expect.arrayContaining([
        { source: "/veiculos/entrada", destination: "/dashboard", permanent: false },
        { source: "/veiculos/saida", destination: "/dashboard", permanent: false },
      ]),
    );
  });
});
