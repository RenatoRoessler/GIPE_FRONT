import { Suspense } from "react";
import { PrecosList } from "@/components/precos/PrecosList";

export default function PrecosPage() {
  return (
    // useSearchParams (página atual na URL) exige Suspense.
    <Suspense fallback={null}>
      <PrecosList />
    </Suspense>
  );
}
