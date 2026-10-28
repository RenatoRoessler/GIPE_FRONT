import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComprovanteDigital } from "@/components/patio/ComprovanteDigital";

// O comprovante tem dados de veículo: fora de buscadores.
export const metadata: Metadata = {
  title: "Comprovante digital — Murel",
  robots: { index: false, follow: false },
};

const ID_PATTERN = /^[1-9]\d{0,9}$/;

export default async function ComprovanteDigitalPage({ params }: { params: Promise<{ patioId: string }> }) {
  const { patioId } = await params;

  if (!ID_PATTERN.test(patioId)) {
    notFound();
  }

  // O comprovante lê a origem da navegação na URL: o Suspense deixa o resto da página sair pré-renderizado.
  return (
    <Suspense>
      <ComprovanteDigital patioId={Number(patioId)} />
    </Suspense>
  );
}
