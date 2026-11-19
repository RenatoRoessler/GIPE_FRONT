import type { Metadata } from "next";
import { Suspense } from "react";
import { DashboardPage } from "@/components/dashboard/DashboardPage";

export const metadata: Metadata = {
  title: "Visão Geral — Murel",
};

export default function Page() {
  return (
    // useSearchParams (período e data na URL) exige Suspense.
    <Suspense fallback={null}>
      <DashboardPage />
    </Suspense>
  );
}
