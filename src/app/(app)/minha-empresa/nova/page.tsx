import type { Metadata } from "next";
import { NovaEmpresa } from "@/components/empresa/NovaEmpresa";

export const metadata: Metadata = {
  title: "Adicionar empresa — Murel",
};

export default function Page() {
  return <NovaEmpresa />;
}
