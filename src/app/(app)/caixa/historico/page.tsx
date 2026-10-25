import type { Metadata } from "next";
import { Suspense } from "react";
import { HistoricoCaixasPage } from "@/components/caixa/HistoricoCaixasPage";

export const metadata: Metadata = {
  title: "Caixas anteriores — Murel",
};

export default function Page() {
  return (
    // useSearchParams (período e página na URL) exige Suspense.
    <Suspense fallback={null}>
      <HistoricoCaixasPage />
    </Suspense>
  );
}
