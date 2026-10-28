"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { PatioFiltros } from "@/types/patio";
import { gravarFiltros, lerFiltros } from "./patioUrl";

const DEBOUNCE_MS = 250;

// Busca e filtros vivem na URL: o botão de voltar do navegador e o "Voltar" do ticket devolvem o operador ao mesmo recorte.
// A busca tem estado local (a tecla aparece na hora) e só chega à URL depois de uma pausa; nada empilha histórico.
export function usePatioFiltros() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const daUrl = lerFiltros(searchParams);
  const [busca, setBusca] = useState(daUrl.busca);
  const termo = useDebouncedValue(busca.trim(), DEBOUNCE_MS);

  const queryAtual = searchParams.toString();

  const gravar = useCallback(
    (proximo: PatioFiltros) => {
      const query = gravarFiltros(proximo);
      if (query === queryAtual) return;
      router.replace(query === "" ? pathname : `${pathname}?${query}`, { scroll: false });
    },
    [pathname, queryAtual, router],
  );

  const tipo = daUrl.tipo;
  const categoria = daUrl.categoria;

  // O termo assentado chega à URL; os outros filtros já são lidos dela.
  useEffect(() => {
    gravar({ busca: termo, tipo, categoria });
  }, [termo, tipo, categoria, gravar]);

  const filtros: PatioFiltros = { busca: termo, tipo, categoria };

  return {
    busca,
    setBusca,
    tipo,
    setTipo: (valor: PatioFiltros["tipo"]) => gravar({ busca: termo, tipo: valor, categoria }),
    categoria,
    setCategoria: (valor: PatioFiltros["categoria"]) => gravar({ busca: termo, tipo, categoria: valor }),
    // Tipo e categoria: a busca tem o próprio "Limpar busca".
    limparFiltros: () => gravar({ busca: termo, tipo: "todos", categoria: "todas" }),
    limparBusca: () => {
      setBusca("");
      gravar({ busca: "", tipo, categoria });
    },
    termo,
    filtros,
  };
}
