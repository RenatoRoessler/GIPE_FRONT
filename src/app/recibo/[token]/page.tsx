import type { Metadata } from "next";
import { ReciboNaoEncontrado, ReciboPublico } from "@/components/veiculos/ReciboPublico";

// O recibo tem dados de veículo: fora de buscadores.
export const metadata: Metadata = {
  title: "Recibo de saída — GIPE",
  robots: { index: false, follow: false },
};

// Códigos têm poucos caracteres alfanuméricos; qualquer outra coisa nem chega à API.
const TOKEN_PATTERN = /^[A-Za-z0-9]{4,32}$/;

export default async function ReciboPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  if (!TOKEN_PATTERN.test(token)) {
    return <ReciboNaoEncontrado />;
  }

  return <ReciboPublico token={token} />;
}
