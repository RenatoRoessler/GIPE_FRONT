"use client";

import { Skeleton } from "@/components/ui/Skeleton";
import { VisuallyHidden } from "./Caixa.styles";
import { Cartao, Dupla, Pilha } from "./CaixaResumo.styles";

// Carregamento no formato da tela: abertura, valor em caixa, dois cartões e a lista por forma.
export function CaixaSkeleton() {
  return (
    <Pilha role="status" aria-busy="true">
      <VisuallyHidden>Carregando caixa…</VisuallyHidden>
      <Cartao as="div">
        <Skeleton width="40%" height="16px" />
      </Cartao>
      <Cartao as="div">
        <Skeleton width="30%" height="16px" />
        <Skeleton width="60%" height="40px" />
        <Skeleton width="70%" height="16px" />
      </Cartao>
      <Dupla>
        <Cartao as="div">
          <Skeleton width="60%" height="16px" />
          <Skeleton width="70%" height="28px" />
        </Cartao>
        <Cartao as="div">
          <Skeleton width="60%" height="16px" />
          <Skeleton width="70%" height="28px" />
        </Cartao>
      </Dupla>
      <Cartao as="div">
        <Skeleton width="50%" height="16px" />
        <Skeleton height="12px" />
        <Skeleton height="96px" />
      </Cartao>
    </Pilha>
  );
}
