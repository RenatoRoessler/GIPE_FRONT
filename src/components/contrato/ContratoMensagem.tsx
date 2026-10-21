"use client";

import { Logo } from "@/components/ui/Logo";
import { Column, LogoBox, Message, Screen } from "./Contrato.styles";

export type ContratoMensagemKind = "vencido" | "invalido";

const TEXTOS: Record<ContratoMensagemKind, { titulo: string; texto: string }> = {
  vencido: {
    titulo: "Este link venceu",
    texto: "Os links do contrato valem 7 dias. Peça um novo link ao estacionamento.",
  },
  invalido: {
    titulo: "Link inválido",
    texto: "Confira se abriu o link completo do e-mail ou peça um novo ao estacionamento.",
  },
};

function Icon({ kind }: { kind: ContratoMensagemKind }) {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {kind === "vencido" ? (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </>
      ) : (
        <>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3M8.5 11h5" />
        </>
      )}
    </svg>
  );
}

// Sem detalhe técnico: o mensalista só precisa saber o que fazer em seguida.
export function ContratoMensagem({ kind }: { kind: ContratoMensagemKind }) {
  const { titulo, texto } = TEXTOS[kind];

  return (
    <Screen data-print-area="">
      <Column>
        <LogoBox>
          <Logo />
        </LogoBox>
        <Message>
          <Icon kind={kind} />
          <h1>{titulo}</h1>
          <p>{texto}</p>
        </Message>
      </Column>
    </Screen>
  );
}
