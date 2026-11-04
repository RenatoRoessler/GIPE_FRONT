import type { Metadata } from "next";
import { Suspense } from "react";
import { PatioConveniadaEsqueleto, PatioConveniadaPage } from "@/components/patio-conveniada/PatioConveniadaPage";

export const metadata: Metadata = {
  title: "Pátio — Murel",
};

// `PatioConveniadaPage` lê os filtros da URL: o Suspense deixa o resto da página sair pré-renderizado.
export default function Page() {
  return (
    <Suspense fallback={<PatioConveniadaEsqueleto />}>
      <PatioConveniadaPage />
    </Suspense>
  );
}
