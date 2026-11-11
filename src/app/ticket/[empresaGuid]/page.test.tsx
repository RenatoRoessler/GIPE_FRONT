import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";

// Os componentes em si são testados à parte: aqui só interessa qual deles a rota escolhe.
vi.mock("@/components/veiculos/ConsultaTicketPublica", () => ({
  ConsultaTicketPublica: () => null,
  LinkInvalido: () => null,
}));

import { ConsultaTicketPublica, LinkInvalido } from "@/components/veiculos/ConsultaTicketPublica";
import TicketPage, { metadata } from "./page";

const GUID = "3f2b8c1e-0000-4000-8000-000000000001";

async function abrir(empresaGuid: string) {
  return (await TicketPage({ params: Promise.resolve({ empresaGuid }) })) as ReactElement<{ empresaGuid?: string }>;
}

describe("rota /ticket/[empresaGuid]", () => {
  it("fica fora dos buscadores e tem o título da aba", () => {
    expect(metadata.title).toBe("Consultar ticket — Murel");
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("empresa válida abre a consulta com o identificador recebido", async () => {
    const elemento = await abrir(GUID);
    expect(elemento.type).toBe(ConsultaTicketPublica);
    expect(elemento.props.empresaGuid).toBe(GUID);
  });

  it("aceita o GUID em maiúsculas", async () => {
    const elemento = await abrir(GUID.toUpperCase());
    expect(elemento.type).toBe(ConsultaTicketPublica);
  });

  it.each(["abc", "3f2b8c1e00004000800000000000000001", `${GUID}0`, "3f2b8c1e-0000-4000-8000-00000000000g", "<script>", "undefined"])(
    "identificador fora do formato (%s) mostra link inválido, sem formulário",
    async (empresaGuid) => {
      const elemento = await abrir(empresaGuid);
      expect(elemento.type).toBe(LinkInvalido);
    },
  );
});
