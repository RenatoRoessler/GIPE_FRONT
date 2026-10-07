"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchAddressByCep } from "@/lib/api/services/cep";
import type { CepAddress } from "@/types/cep";

export type CepLookupStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "found" }
  | { state: "not_found" }
  | { state: "error" };

export function useCepLookup() {
  const [status, setStatus] = useState<CepLookupStatus>({ state: "idle" });
  const controllerRef = useRef<AbortController | null>(null);

  const abortPending = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
  }, []);

  // Resolve com null quando não há endereço a aplicar (não encontrado, falha ou busca cancelada).
  const lookup = useCallback(
    async (cep: string): Promise<CepAddress | null> => {
      abortPending();
      const controller = new AbortController();
      controllerRef.current = controller;
      setStatus({ state: "loading" });

      try {
        const address = await fetchAddressByCep(cep, controller.signal);
        if (controller.signal.aborted) return null;
        setStatus({ state: address ? "found" : "not_found" });
        return address;
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
  }, [abortPending]);

  useEffect(() => abortPending, [abortPending]);

  return { status, lookup, reset };
}
