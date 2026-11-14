"use client";

import { useCallback, useRef } from "react";

// Depois de um envio recusado por validação, o foco vai ao primeiro campo com erro (`aria-invalid`) do formulário, para
// quem usa teclado ou leitor de tela não ter de procurá-lo. Sem erro, não mexe no foco.
// Ponha `ref` no formulário e chame `focarNoPrimeiroErro` quando o envio terminar. Espera um quadro para os campos já
// terem recebido o `aria-invalid`.
export function useFocoNoPrimeiroErro<T extends HTMLElement = HTMLFormElement>() {
  const ref = useRef<T>(null);

  const focarNoPrimeiroErro = useCallback(() => {
    requestAnimationFrame(() => {
      ref.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    });
  }, []);

  return { ref, focarNoPrimeiroErro };
}
