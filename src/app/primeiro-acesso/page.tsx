import type { Metadata } from "next";
import { PrimeiroAcessoForm } from "@/components/auth/PrimeiroAcessoForm";

export const metadata: Metadata = {
  title: "Primeiro acesso — GIPE",
};

export default function PrimeiroAcessoPage() {
  return <PrimeiroAcessoForm />;
}
