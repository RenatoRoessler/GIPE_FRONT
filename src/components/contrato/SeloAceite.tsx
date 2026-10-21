"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { HashLine, LinkButton, Selo, SeloTitle } from "./Contrato.styles";
import { formatDataHora, formatHash } from "./format";

export interface SeloAceiteProps {
  dataAceite: string | null;
  hash: string;
  // Acabou de aceitar nesta tela (e não só reabriu o link): mostra os próximos passos e leva o foco ao selo.
  recemAceito: boolean;
}

export function SeloAceite({ dataAceite, hash, recemAceito }: SeloAceiteProps) {
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const [hashCompleto, setHashCompleto] = useState(false);

  useEffect(() => {
    if (recemAceito) {
      tituloRef.current?.focus();
    }
  }, [recemAceito]);

  return (
    <Selo role="status" aria-label="Contrato aceito">
      <SeloTitle ref={tituloRef} tabIndex={-1}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="m8 12.5 3 3 5-6" />
        </svg>
        Contrato aceito
      </SeloTitle>
      <p>{`${formatDataHora(dataAceite)} (horário de Brasília)`}</p>
      {recemAceito && (
        <>
          <p>Enviamos uma cópia para o seu e-mail.</p>
          <p>Seu cadastro será ativado após o primeiro pagamento.</p>
        </>
      )}
      {hash && (
        <HashLine>
          <span>Identificação do texto:</span>
          <span>{formatHash(hash, hashCompleto)}</span>
          <LinkButton type="button" data-no-print="" aria-expanded={hashCompleto} onClick={() => setHashCompleto((atual) => !atual)}>
            {hashCompleto ? "Ver resumo" : "Ver completo"}
          </LinkButton>
        </HashLine>
      )}
      <Button type="button" variant="secondary" data-no-print="" onClick={() => window.print()}>
        Imprimir ou salvar PDF
      </Button>
    </Selo>
  );
}
