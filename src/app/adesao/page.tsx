import type { Metadata } from "next";
import { OnboardingWizard } from "@/components/adesao/OnboardingWizard";

export const metadata: Metadata = {
  title: "Adesão ao sistema — Murel",
};

export default function AdesaoPage() {
  return <OnboardingWizard />;
}
