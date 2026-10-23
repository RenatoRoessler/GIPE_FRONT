import { Suspense } from "react";
import { CaixaPage } from "@/components/caixa/CaixaPage";

export default function CaixaRoutePage() {
  return (
    // useSearchParams (aba na URL) exige Suspense.
    <Suspense fallback={null}>
      <CaixaPage />
    </Suspense>
  );
}
