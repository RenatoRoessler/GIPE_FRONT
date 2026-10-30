import type { Metadata } from "next";
import { Suspense } from "react";
import { FinanceiroPage } from "@/components/financeiro/FinanceiroPage";

export const metadata: Metadata = {
  title: "Financeiro — Murel",
};

export default function Page() {
  return (
    // useSearchParams (aba e filtros na URL) exige Suspense.
    <Suspense fallback={null}>
      <FinanceiroPage />
    </Suspense>
  );
}
