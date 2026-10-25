import type { Metadata } from "next";
import { RecoverPasswordForm } from "@/components/auth/RecoverPasswordForm";

export const metadata: Metadata = {
  title: "Recuperar senha — Murel",
};

export default function RecoverPasswordPage() {
  return <RecoverPasswordForm />;
}
