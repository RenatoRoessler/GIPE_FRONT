import type { Metadata } from "next";
import { QuadrosLista } from "@/components/quadros/QuadrosLista";

export const metadata: Metadata = {
  title: "Quadros de chaves — Murel",
};

export default function Page() {
  return <QuadrosLista />;
}
