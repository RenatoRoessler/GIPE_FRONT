"use client";

import { usePathname } from "next/navigation";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { aparar } from "@/lib/teclado/alfa";
import { aceitaCaractere, maxPadrao, normalizarCaractere } from "@/lib/teclado/regras";
import { placaCompletaValida } from "@/lib/teclado/placa";
import type { TecladoConfig } from "@/lib/teclado/tipos";
import { AlphaKeyboard } from "@/components/ui/AlphaKeyboard";
import { NumericKeyboard } from "@/components/ui/NumericKeyboard";
import { PlateKeyboard } from "@/components/ui/PlateKeyboard";
import { proximoCampo } from "./proximoCampo";
import { setNativeValue } from "./setNativeValue";

export const TECLADO_FOLHA_ID = "teclado-folha";
// Marca os campos que têm teclado próprio: tocar neles não conta como "tocar fora".
export const TECLADO_CAMPO_ATTR = "data-teclado-campo";

const FECHAR_PLACA_MS = 150;
const ROLAR_CAMPO_MS = 220;

export interface TecladoContexto {
  abrir: (campo: HTMLInputElement, config: TecladoConfig) => void;
  fechar: () => void;
  // Avisa que o campo existe; o cleanup fecha o teclado se ele ainda estiver apontado para o campo.
  registrar: (campo: HTMLInputElement) => () => void;
}

const SEM_PROVIDER: TecladoContexto = { abrir: () => {}, fechar: () => {}, registrar: () => () => {} };

const Contexto = createContext<TecladoContexto>(SEM_PROVIDER);

export function useTeclado(): TecladoContexto {
  return useContext(Contexto);
}

function mesmaConfig(a: TecladoConfig | null, b: TecladoConfig): boolean {
  if (!a || a.tipo !== b.tipo) {
    return false;
  }
  return a.tipo !== "numerico" || b.tipo !== "numerico" || a.modo === b.modo;
}

function cursorNoFim(campo: HTMLInputElement) {
  try {
    campo.setSelectionRange(campo.value.length, campo.value.length);
  } catch {
    // Tipos sem seleção (number, email) não têm cursor para posicionar.
  }
}

export function TecladoProvider({ children }: { children: ReactNode }) {
  const [alvo, setAlvo] = useState<HTMLInputElement | null>(null);
  const [config, setConfig] = useState<TecladoConfig | null>(null);
  const [valor, setValor] = useState("");
  // Espelho síncrono do alvo: `abrir` pode ser chamado por um foco programático antes de o estado renderizar.
  const alvoRef = useRef<HTMLInputElement | null>(null);
  const timerFechar = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();

  const cancelarFechamento = useCallback(() => {
    if (timerFechar.current !== null) {
      clearTimeout(timerFechar.current);
      timerFechar.current = null;
    }
  }, []);

  const fechar = useCallback(() => {
    cancelarFechamento();
    alvoRef.current = null;
    setAlvo(null);
    setConfig(null);
  }, [cancelarFechamento]);

  const abrir = useCallback(
    (campo: HTMLInputElement, nova: TecladoConfig) => {
      cancelarFechamento();
      cursorNoFim(campo);
      alvoRef.current = campo;
      setAlvo(campo);
      // Foco e clique chamam `abrir` em seguida: configuração igual mantém o estado e evita renderizar de novo.
      setConfig((anterior) => (mesmaConfig(anterior, nova) ? anterior : nova));
      setValor(campo.value);
    },
    [cancelarFechamento],
  );

  const registrar = useCallback(
    (campo: HTMLInputElement) => () => {
      if (alvoRef.current === campo) {
        fechar();
      }
    },
    [fechar],
  );

  // Troca de rota fecha o teclado.
  const [pathnameAnterior, setPathnameAnterior] = useState(pathname);
  if (pathname !== pathnameAnterior) {
    setPathnameAnterior(pathname);
    setAlvo(null);
    setConfig(null);
  }
  useEffect(() => {
    alvoRef.current = null;
    cancelarFechamento();
  }, [pathname, cancelarFechamento]);

  useEffect(() => cancelarFechamento, [cancelarFechamento]);

  useEffect(() => {
    if (!alvo) {
      return;
    }
    const atual = alvo;
    // O `input` chega antes de o React gravar o `format` do campo: lê o valor final depois.
    const aoDigitar = () => queueMicrotask(() => setValor(atual.value));
    const aoTocar = (evento: PointerEvent) => {
      const alvoDoToque = evento.target instanceof Element ? evento.target : null;
      if (!alvoDoToque || alvoDoToque.closest(`#${TECLADO_FOLHA_ID}, [${TECLADO_CAMPO_ATTR}]`)) {
        return;
      }
      fechar();
    };
    const aoApertar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") {
        evento.preventDefault();
        evento.stopPropagation();
        fechar();
      }
    };
    const aoMudarVisibilidade = () => {
      if (document.visibilityState === "hidden") {
        fechar();
      }
    };
    const dialog = atual.closest("dialog");

    atual.addEventListener("input", aoDigitar);
    document.addEventListener("pointerdown", aoTocar, true);
    document.addEventListener("keydown", aoApertar, true);
    document.addEventListener("visibilitychange", aoMudarVisibilidade);
    // O modal fechou com o campo ainda montado: a folha ficaria presa a um <dialog> fechado.
    dialog?.addEventListener("close", fechar);

    // Espera a folha entrar para o campo ficar visível acima dela.
    const rolar = setTimeout(() => atual.scrollIntoView?.({ block: "center", behavior: "smooth" }), ROLAR_CAMPO_MS);

    return () => {
      clearTimeout(rolar);
      atual.removeEventListener("input", aoDigitar);
      document.removeEventListener("pointerdown", aoTocar, true);
      document.removeEventListener("keydown", aoApertar, true);
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
      dialog?.removeEventListener("close", fechar);
    };
  }, [alvo, fechar]);

  const maxLength = alvo && config ? (alvo.maxLength > 0 ? alvo.maxLength : maxPadrao(config)) : 0;

  function gravar(texto: string) {
    if (!alvo) {
      return;
    }
    setNativeValue(alvo, texto);
    setValor(alvo.value);
    // O leitor de tela pode mover o foco ao tocar na tecla: o campo é sempre devolvido.
    alvo.focus({ preventScroll: true });
  }

  function inserir(ch: string) {
    if (!alvo || !config) {
      return;
    }
    const caractere = normalizarCaractere(config, ch);
    if (!aceitaCaractere(config, alvo.value, caractere, maxLength)) {
      return;
    }
    gravar(alvo.value + caractere);
    if (config.tipo === "placa" && placaCompletaValida(alvo.value)) {
      const campo = alvo;
      cancelarFechamento();
      timerFechar.current = setTimeout(() => {
        timerFechar.current = null;
        fechar();
        campo.blur();
      }, FECHAR_PLACA_MS);
    }
  }

  function apagar() {
    if (alvo) {
      cancelarFechamento();
      gravar(alvo.value.slice(0, -1));
    }
  }

  function avancar() {
    if (!alvo || !config) {
      return;
    }
    const atual = alvo;
    if (config.tipo === "alfa" && aparar(atual.value) !== atual.value) {
      setNativeValue(atual, aparar(atual.value));
    }
    const proximo = proximoCampo(atual);
    if (!proximo) {
      fechar();
      atual.blur();
      return;
    }
    // Se o próximo campo tem teclado próprio, o foco o abre e ele passa a ser o alvo; senão o do sistema assume.
    proximo.focus();
    if (alvoRef.current === atual) {
      fechar();
    }
  }

  const contexto = useMemo(() => ({ abrir, fechar, registrar }), [abrir, fechar, registrar]);
  const rotuloAcao = alvo && proximoCampo(alvo) ? "Próximo" : "OK";
  const destino = alvo ? (alvo.closest("dialog") ?? document.body) : null;

  return (
    <Contexto.Provider value={contexto}>
      {children}
      {alvo && config && destino
        ? createPortal(
            config.tipo === "placa" ? (
              <PlateKeyboard id={TECLADO_FOLHA_ID} valor={valor} onChar={inserir} onApagar={apagar} />
            ) : config.tipo === "numerico" ? (
              <NumericKeyboard
                id={TECLADO_FOLHA_ID}
                modo={config.modo}
                valor={valor}
                maxLength={maxLength}
                rotuloAcao={rotuloAcao}
                onChar={inserir}
                onApagar={apagar}
                onAcao={avancar}
              />
            ) : (
              <AlphaKeyboard
                id={TECLADO_FOLHA_ID}
                chave={alvo.id || alvo.name}
                valor={valor}
                maxLength={maxLength}
                rotuloAcao={rotuloAcao}
                onChar={inserir}
                onApagar={apagar}
                onAcao={avancar}
              />
            ),
            destino,
          )
        : null}
    </Contexto.Provider>
  );
}
