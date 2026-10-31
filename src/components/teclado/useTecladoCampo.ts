"use client";

import { ClipboardEvent, FocusEvent, InputHTMLAttributes, MouseEvent, useCallback, useEffect, useRef } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { aceitaCaractere, limparTexto, maxPadrao, normalizarCaractere } from "@/lib/teclado/regras";
import type { TecladoConfig } from "@/lib/teclado/tipos";
import { setNativeValue } from "./setNativeValue";
import { TECLADO_CAMPO_ATTR, TECLADO_FOLHA_ID, useTeclado } from "./TecladoProvider";

// Aparelho de toque como aparelho principal: só nele o teclado do Murel aparece.
export const MEDIA_TOQUE = "(hover: none) and (pointer: coarse)";

type PropsDoCampo = Pick<InputHTMLAttributes<HTMLInputElement>, "inputMode" | "onFocus" | "onClick" | "onPaste">;

function limite(campo: HTMLInputElement, config: TecladoConfig): number {
  return campo.maxLength > 0 ? campo.maxLength : maxPadrao(config);
}

// O que fica antes e depois da seleção: a inserção troca o trecho selecionado.
function dividirNaSelecao(campo: HTMLInputElement) {
  const inicio = campo.selectionStart ?? campo.value.length;
  const fim = campo.selectionEnd ?? campo.value.length;
  return { antes: campo.value.slice(0, inicio), depois: campo.value.slice(fim) };
}

// Liga um <input> ao teclado de toque e ao filtro de caracteres. Devolve as props a espalhar no input, depois das da tela:
// compõe, sem sobrescrever, os handlers que a tela já passou. Sem `teclado`, não muda nada.
export function useTecladoCampo(teclado: TecladoConfig | undefined, original: PropsDoCampo = {}) {
  const toque = useMediaQuery(MEDIA_TOQUE);
  const { abrir, registrar } = useTeclado();
  const configRef = useRef(teclado);

  useEffect(() => {
    configRef.current = teclado;
  }, [teclado]);

  // Teclado físico: só bloqueia o que a regra do campo não aceita. Minúscula passa (o campo normaliza o texto);
  // acento não, porque o teclado de toque também não tem.
  const aoInserir = useCallback((evento: Event) => {
    const config = configRef.current;
    const campo = evento.target;
    const dados = evento instanceof InputEvent ? evento.data : null;
    if (!config || !(campo instanceof HTMLInputElement) || !dados || (evento as InputEvent).inputType !== "insertText") {
      return;
    }
    const { antes, depois } = dividirNaSelecao(campo);
    const max = limite(campo, config) - depois.length;
    let base = antes;
    for (const ch of dados) {
      const normalizado = normalizarCaractere(config, ch);
      if (normalizado !== ch.toUpperCase() || !aceitaCaractere(config, base, normalizado, max)) {
        evento.preventDefault();
        return;
      }
      base += normalizado;
    }
  }, []);

  const ref = useCallback(
    (campo: HTMLInputElement | null) => {
      if (!campo) {
        return;
      }
      campo.addEventListener("beforeinput", aoInserir);
      const desregistrar = registrar(campo);
      return () => {
        campo.removeEventListener("beforeinput", aoInserir);
        desregistrar();
      };
    },
    [aoInserir, registrar],
  );

  if (!teclado) {
    return {};
  }
  const config = teclado;

  function aoColar(evento: ClipboardEvent<HTMLInputElement>) {
    original.onPaste?.(evento);
    if (evento.defaultPrevented) {
      return;
    }
    evento.preventDefault();
    const campo = evento.currentTarget;
    const { antes, depois } = dividirNaSelecao(campo);
    const colado = evento.clipboardData.getData("text");
    setNativeValue(campo, limparTexto(config, antes + colado + depois, limite(campo, config)));
  }

  const comum = { ref, onPaste: aoColar };
  if (!toque) {
    return comum;
  }

  function aoAbrir(evento: FocusEvent<HTMLInputElement> | MouseEvent<HTMLInputElement>) {
    abrir(evento.currentTarget, config);
  }

  return {
    ...comum,
    inputMode: "none" as const,
    "aria-controls": TECLADO_FOLHA_ID,
    [TECLADO_CAMPO_ATTR]: "",
    onFocus: (evento: FocusEvent<HTMLInputElement>) => {
      original.onFocus?.(evento);
      aoAbrir(evento);
    },
    onClick: (evento: MouseEvent<HTMLInputElement>) => {
      original.onClick?.(evento);
      aoAbrir(evento);
    },
  };
}
