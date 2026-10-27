import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { QuadroForm } from "@/components/quadros/QuadroForm";

export const metadata: Metadata = {
  title: "Adicionar posições — Murel",
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    notFound();
  }

  return <QuadroForm patioQuadroId={Number(id)} />;
}
