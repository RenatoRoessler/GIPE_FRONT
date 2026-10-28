"use client";

import { useEffect } from "react";

// Mantém a tela acesa enquanto o cliente aponta a câmera para o QR Code. É um extra: sem suporte, sem permissão ou
// com qualquer erro, não faz nada e não avisa ninguém. O navegador solta o bloqueio sozinho quando a aba some;
// ao voltar a ficar visível, ele é pedido de novo.
export function useWakeLock() {
  useEffect(() => {
    let ativo = true;
    let bloqueio: WakeLockSentinel | null = null;

    async function pedir() {
      try {
        if (!("wakeLock" in navigator)) return;
        const novo = await navigator.wakeLock.request("screen");
        if (!ativo) {
          await novo.release().catch(() => {});
          return;
        }
        bloqueio = novo;
      } catch {
        // Sem permissão ou sem contexto seguro: a tela só apaga como de costume.
      }
    }

    function aoMudarVisibilidade() {
      if (document.visibilityState === "visible") void pedir();
    }

    void pedir();
    document.addEventListener("visibilitychange", aoMudarVisibilidade);
    return () => {
      ativo = false;
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
      void bloqueio?.release().catch(() => {});
    };
  }, []);
}
