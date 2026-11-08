import type { Metadata } from "next";
import { Suspense } from "react";
import { FaturasPage } from "@/components/faturas/FaturasPage";

export const metadata: Metadata = {
  title: "Faturas — Murel",
};

export default function Page() {
  return (
    // useSearchParams (conveniada, situação e página na URL) exige Suspense.
    <Suspense fallback={null}>
      <FaturasPage />
    </Suspense>
  );
}
