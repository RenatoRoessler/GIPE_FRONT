import type { Metadata } from "next";
import { ComprovanteNaoEncontrado, ComprovantePublico } from "@/components/veiculos/ComprovantePublico";

// O comprovante tem dados de veículo: fora de buscadores.
export const metadata: Metadata = {
  title: "Comprovante de entrada — Murel",
  robots: { index: false, follow: false },
};

// Tokens têm poucos caracteres alfanuméricos; qualquer outra coisa nem chega à API.
const TOKEN_PATTERN = /^[A-Za-z0-9]{4,32}$/;

export default async function ComprovantePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  if (!TOKEN_PATTERN.test(token)) {
    return <ComprovanteNaoEncontrado />;
  }

  return <ComprovantePublico token={token} />;
}
