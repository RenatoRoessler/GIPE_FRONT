import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FaturaDetalhe } from "@/components/faturas/FaturaDetalhe";

export const metadata: Metadata = {
  title: "Fatura — Murel",
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    notFound();
  }

  return (
    // useSearchParams (marca de fatura recém-emitida) exige Suspense.
    <Suspense fallback={null}>
      <FaturaDetalhe id={Number(id)} />
    </Suspense>
  );
}
