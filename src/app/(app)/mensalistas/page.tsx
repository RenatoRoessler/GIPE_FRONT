import type { Metadata } from "next";
import { Suspense } from "react";
import { MensalistasPage } from "@/components/mensalistas/MensalistasPage";

export const metadata: Metadata = {
  title: "Mensalistas — GIPE",
};

export default function Page() {
  return (
    // useSearchParams (aba e página na URL) exige Suspense.
    <Suspense fallback={null}>
      <MensalistasPage />
    </Suspense>
  );
}
