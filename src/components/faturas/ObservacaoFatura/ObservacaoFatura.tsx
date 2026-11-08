"use client";

import { useId, useState } from "react";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { Apoio } from "../Faturas.styles";
import { BotaoTexto, TextoLimitado } from "../FaturasMobile.styles";

// Aproxima 3 linhas num celular de 360 px; medir o DOM pediria ResizeObserver e deixaria o teste frágil.
const LIMITE_CARACTERES = 120;

export interface ObservacaoFaturaProps {
  observacao: string | null;
}

// "Obs.: …". No celular, observação longa fica em 3 linhas com "Ver mais"; em tela larga aparece inteira.
export function ObservacaoFatura({ observacao }: ObservacaoFaturaProps) {
  const celular = useIsMobile();
  const [aberta, setAberta] = useState(false);
  const id = useId();

  if (!observacao) {
    return null;
  }

  if (!celular || observacao.length <= LIMITE_CARACTERES) {
    return <Apoio>Obs.: {observacao}</Apoio>;
  }

  return (
    <>
      <TextoLimitado id={id} $limitado={!aberta}>
        Obs.: {observacao}
      </TextoLimitado>
      <BotaoTexto type="button" aria-expanded={aberta} aria-controls={id} onClick={() => setAberta((atual) => !atual)}>
        {aberta ? "Ver menos" : "Ver mais"}
      </BotaoTexto>
    </>
  );
}
