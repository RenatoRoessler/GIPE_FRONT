import type { Metadata } from "next";
import { AcessoNegado } from "@/components/layout/AcessoNegado";

export const metadata: Metadata = {
  title: "Acesso negado — Murel",
};

export default function Page() {
  return <AcessoNegado />;
}
