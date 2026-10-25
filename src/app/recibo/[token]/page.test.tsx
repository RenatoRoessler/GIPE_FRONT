import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";

// Os componentes em si são testados à parte: aqui só interessa qual deles a rota escolhe.
vi.mock("@/components/veiculos/ReciboPublico", () => ({
  ReciboPublico: () => null,
  ReciboNaoEncontrado: () => null,
}));

import { ReciboNaoEncontrado, ReciboPublico } from "@/components/veiculos/ReciboPublico";
import ReciboPage, { metadata } from "./page";

async function abrir(token: string) {
  return (await ReciboPage({ params: Promise.resolve({ token }) })) as ReactElement<{ token?: string }>;
}

describe("rota /recibo/[token]", () => {
  it("fica fora dos buscadores e tem o título da aba", () => {
    expect(metadata.title).toBe("Recibo de saída — Murel");
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("código válido abre o recibo com o código recebido", async () => {
    const elemento = await abrir("94M6ND36Z4");
    expect(elemento.type).toBe(ReciboPublico);
    expect(elemento.props.token).toBe("94M6ND36Z4");
  });

  it.each(["abc", "a".repeat(33), "AB-CD1234", "AB CD1234", "<script>"])("código fora do padrão (%s) mostra não encontrado, sem consultar a API", async (token) => {
    const elemento = await abrir(token);
    expect(elemento.type).toBe(ReciboNaoEncontrado);
  });
});
