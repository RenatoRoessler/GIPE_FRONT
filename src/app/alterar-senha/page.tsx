import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Alterar senha — GIPE",
  // O código do link vem na URL: não deve vazar para terceiros pelo cabeçalho Referer.
  referrer: "no-referrer",
};

export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/alterar-senha">) {
  const { token } = await searchParams;
  const tokenValue = Array.isArray(token) ? token[0] : token;

  return <ResetPasswordForm token={tokenValue ?? null} />;
}
