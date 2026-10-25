import type { Metadata } from "next";
import { Suspense } from "react";
import { NotasFiscaisPage } from "@/components/notas/NotasFiscaisPage";

export const metadata: Metadata = {
  title: "Notas Fiscais — Murel",
};

export default function Page() {
  return (
    // useSearchParams (aba na URL) exige Suspense.
    <Suspense fallback={null}>
      <NotasFiscaisPage />
    </Suspense>
  );
}
