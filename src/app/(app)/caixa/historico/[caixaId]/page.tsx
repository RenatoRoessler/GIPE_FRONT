import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExtratoCaixaPage } from "@/components/caixa/ExtratoCaixaPage";

export const metadata: Metadata = {
  title: "Extrato do caixa — GIPE",
};

export default async function Page({ params }: { params: Promise<{ caixaId: string }> }) {
  const { caixaId } = await params;

  if (!/^\d+$/.test(caixaId)) {
    notFound();
  }

  return <ExtratoCaixaPage caixaId={Number(caixaId)} />;
}
