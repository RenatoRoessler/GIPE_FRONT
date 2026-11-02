import type { Metadata } from "next";
import { Suspense } from "react";
import { OnboardingWizard } from "@/components/adesao/OnboardingWizard";

export const metadata: Metadata = {
  title: "Adesão ao sistema — Murel",
};

export default function AdesaoPage() {
  return (
    // useSearchParams (plano na URL) exige Suspense.
    <Suspense fallback={null}>
      <OnboardingWizard />
    </Suspense>
  );
}
