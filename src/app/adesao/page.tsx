import type { Metadata } from "next";
import { OnboardingWizard } from "@/components/adesao/OnboardingWizard";

export const metadata: Metadata = {
  title: "Adesão ao sistema — GIPE",
};

export default function AdesaoPage() {
  return <OnboardingWizard />;
}
