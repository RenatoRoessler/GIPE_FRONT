import type { Metadata } from "next";
import { Suspense } from "react";
import { ConveniadasPage } from "@/components/conveniadas/ConveniadasPage";

export const metadata: Metadata = {
  title: "Empresas conveniadas — Murel",
};

export default function Page() {
  return (
    // useSearchParams (situação e resultado do cadastro na URL) exige Suspense.
    <Suspense fallback={null}>
      <ConveniadasPage />
    </Suspense>
  );
}
