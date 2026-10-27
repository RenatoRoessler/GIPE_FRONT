import type { Metadata } from "next";
import { QuadroForm } from "@/components/quadros/QuadroForm";

export const metadata: Metadata = {
  title: "Configurar quadro — Murel",
};

export default function Page() {
  return <QuadroForm />;
}
