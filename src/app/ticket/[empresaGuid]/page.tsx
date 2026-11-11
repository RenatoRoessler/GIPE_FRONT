import type { Metadata } from "next";
import { ConsultaTicketPublica, LinkInvalido } from "@/components/veiculos/ConsultaTicketPublica";

// A consulta devolve dados de veículo: fora de buscadores.
export const metadata: Metadata = {
  title: "Consultar ticket — Murel",
  robots: { index: false, follow: false },
};

// O identificador da empresa é um GUID; qualquer outra coisa nem mostra o formulário.
const GUID_PATTERN = /^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$/;

export default async function TicketPage({ params }: { params: Promise<{ empresaGuid: string }> }) {
  const { empresaGuid } = await params;

  if (!GUID_PATTERN.test(empresaGuid)) {
    return <LinkInvalido />;
  }

  return <ConsultaTicketPublica empresaGuid={empresaGuid} />;
}
