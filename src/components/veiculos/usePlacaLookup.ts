"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { consultarPlaca } from "@/lib/api/services/veiculo";
import type { PlacaConsulta } from "@/types/veiculo";

export type PlacaLookupStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "found" }
  | { state: "not_found" }
  | { state: "error" };

// Consulta cancelável: uma nova consulta (ou o desmonte) aborta a anterior.
export function usePlacaLookup() {
  const [status, setStatus] = useState<PlacaLookupStatus>({ state: "idle" });
  // Último cadastro encontrado; some com nova consulta ou reset, para nunca valer para outra placa.
  const [cadastro, setCadastro] = useState<PlacaConsulta | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const abortPending = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
  }, []);

  // Resolve com null quando não há cadastro a aplicar (não encontrado, falha ou consulta cancelada).
  const lookup = useCallback(
    async (placa: string): Promise<PlacaConsulta | null> => {
      abortPending();
      const controller = new AbortController();
      controllerRef.current = controller;
      setStatus({ state: "loading" });
      setCadastro(null);

      try {
        const result = await consultarPlaca(placa, controller.signal);
        if (controller.signal.aborted) return null;
        setStatus({ state: result.encontrado ? "found" : "not_found" });
        setCadastro(result.encontrado ? result : null);
        return result.encontrado ? result : null;
      } catch {
        if (controller.signal.aborted) return null;
        setStatus({ state: "error" });
        return null;
      }
    },
    [abortPending],
  );

  const reset = useCallback(() => {
    abortPending();
    setStatus({ state: "idle" });
    setCadastro(null);
  }, [abortPending]);

  useEffect(() => abortPending, [abortPending]);

  return { status, cadastro, lookup, reset };
}
