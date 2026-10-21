import type { Metadata } from "next";
import { ContratoAceite } from "@/components/contrato/ContratoAceite";
import { ContratoMensagem } from "@/components/contrato/ContratoMensagem";

// O contrato tem dados pessoais e o token vai na URL: fora de buscadores e sem repassar o link a sites externos.
export const metadata: Metadata = {
  title: "Contrato — GIPE",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

// O token do link tem 10 caracteres alfanuméricos; qualquer outra coisa nem chega à API.
const TOKEN_PATTERN = /^[A-Za-z0-9]{10}$/;

export default async function ContratoPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { t } = await searchParams;
  const token = Array.isArray(t) ? t[0] : t;

  if (!token || !TOKEN_PATTERN.test(token)) {
    return <ContratoMensagem kind="invalido" />;
  }

  return <ContratoAceite token={token} />;
}
