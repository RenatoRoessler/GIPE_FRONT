"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { listModelos } from "@/lib/api/services/veiculo";

const MIN_CHARS = 2;
const DEBOUNCE_MS = 250;

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

// Sugestões de modelo a partir de 2 caracteres, com debounce para não consultar a cada tecla.
export function useModelos(texto: string) {
  const termo = useDebouncedValue(texto.trim(), DEBOUNCE_MS);

  return useQuery({
    queryKey: ["veiculo", "modelos", termo],
    queryFn: ({ signal }) => listModelos(termo, signal),
    enabled: termo.length >= MIN_CHARS,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });
}
