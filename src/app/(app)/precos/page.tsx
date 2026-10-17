import { Suspense } from "react";
import { PrecosMasterDetail } from "@/components/precos/PrecosMasterDetail";

export default function PrecosPage() {
  return (
    // useSearchParams (tabela, busca, situação e página na URL) exige Suspense.
    <Suspense fallback={null}>
      <PrecosMasterDetail />
    </Suspense>
  );
}
