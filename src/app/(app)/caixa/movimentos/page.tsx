import type { Metadata } from "next";
import { MovimentosCaixaPage } from "@/components/caixa/MovimentosCaixaPage";

export const metadata: Metadata = {
  title: "Movimentos do caixa — Murel",
};

export default function Page() {
  return <MovimentosCaixaPage />;
}
